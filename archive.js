'use strict';

import { GROUP_COLORS, loadGroups, mergeGroups } from './custom-groups.js';

// Each archive batch lives under its own storage.local key, so two overview
// pages acting on different batches never overwrite each other.
//
// Stored batch  { id, archivedAt, label?, windows: [StoredWindow] }
//               label names the section a batch was archived from, such as
//               a tab group, window, or category; Archive all has none
// StoredWindow  { id, title, groups: [StoredGroup], ungrouped: [StoredTab] }
// StoredGroup   { id, title, color, tabs: [StoredTab] }
// StoredTab     { id, title, url, favIconUrl? }   favIconUrl only as data: URL
//
// Batch in memory (what the overview renders):
// ArchiveBatch  { id, archivedAt, label, tabCount, windows: [ArchiveWindow] }
// ArchiveWindow { id, title, groups: [ArchiveGroup], ungrouped, tabs }
//               tabs = every tab of the window, groups first, then ungrouped
// ArchiveGroup  { id, title, color, tabs }
// ArchivedTab   { id, batchId, title, url, favIconUrl, groupId, archivedAt }
//
// A suspended tab is closed in the browser but still listed with the open
// tabs. Each one has its own key, for the same reason as a batch:
// Suspended     { id, url, title, favIconUrl?, suspendedAt, windowId, index,
//                 group: { title, color } | null }
//               windowId, index, and group describe where the tab was open

const BATCH_PREFIX = 'archive:batch:';
const BACKUP_FORMAT = 'tab-overview-backup';
const BACKUP_VERSION = 1;
const MAX_ID_LENGTH = 200;
const MAX_LABEL_LENGTH = 120;

const SUSPENDED_PREFIX = 'suspended:';

export const isBatchKey = (key) => key.startsWith(BATCH_PREFIX);
export const isSuspendedKey = (key) => key.startsWith(SUSPENDED_PREFIX);
export const suspendedKey = (id) => SUSPENDED_PREFIX + id;
const keyOf = (batchId) => BATCH_PREFIX + batchId;
// While Chrome navigates, url is still the old page and pendingUrl the new one.
export const urlOf = (tab) => (isReopenable(tab.pendingUrl) ? tab.pendingUrl : tab.url || tab.pendingUrl || '');

// Every overview page shares the extension's origin, so a Web Lock per storage
// key serializes read-modify-write on that key across pages.
export function withKeyLock(key, task) {
  return globalThis.navigator?.locks ? navigator.locks.request(key, task) : task();
}

const withBatchLock = (batchId, task) => withKeyLock(keyOf(batchId), task);

/* -------------------------------------------------------------- planning */

export function skipReason(tab) {
  if (tab.pinned) return 'pinned';
  if (tab.incognito) return 'private';
  if (!isReopenable(urlOf(tab))) return 'unsupported';
  return null;
}

function isReopenable(url) {
  return typeof url === 'string' && /^https?:\/\//i.test(url);
}

export function planArchive(windows) {
  const skipped = { pinned: 0, private: 0, unsupported: 0 };
  const planned = [];
  let count = 0;

  for (const win of windows) {
    const groupsById = new Map(win.groups.map((group) => [group.id, group]));
    const groups = new Map();
    const ungrouped = [];

    for (const tab of win.tabs) {
      const reason = skipReason(tab);
      if (reason) {
        skipped[reason] += 1;
        continue;
      }
      const group = groupsById.get(tab.groupId);
      if (group) {
        if (!groups.has(group.id)) groups.set(group.id, { group, tabs: [] });
        groups.get(group.id).tabs.push(tab);
      } else {
        ungrouped.push(tab);
      }
      count += 1;
    }

    if (groups.size > 0 || ungrouped.length > 0) {
      planned.push({ groups: [...groups.values()], ungrouped });
    }
  }

  return { windows: planned, count, skipped };
}

/* -------------------------------------------------------------- archiving */

/**
 * Writes the whole batch, reads it back, and only then closes the tabs. If
 * the write fails no tab is closed. A tab that navigated since it was read is
 * left open, because the archive holds its old address. A suspended tab in
 * the plan has no browser tab; once the batch is saved it stops being
 * suspended.
 */
export async function archivePlan(plan, label = '') {
  if (plan.count === 0) return { archived: 0, closeFailed: 0, batchId: null };

  const toStoredTab = (tab) => {
    const url = urlOf(tab);
    const stored = { id: crypto.randomUUID(), title: tab.title || url, url };
    if (/^data:/i.test(tab.favIconUrl || '')) stored.favIconUrl = tab.favIconUrl;
    return stored;
  };

  const batch = {
    id: crypto.randomUUID(),
    archivedAt: Date.now(),
    ...(label.trim() ? { label: label.trim().slice(0, MAX_LABEL_LENGTH) } : {}),
    windows: plan.windows.map((win, index) => ({
      id: crypto.randomUUID(),
      title: `Window ${index + 1}`,
      groups: win.groups.map(({ group, tabs }) => ({
        id: crypto.randomUUID(),
        title: group.title || '',
        color: GROUP_COLORS.has(group.color) ? group.color : 'grey',
        tabs: tabs.map(toStoredTab),
      })),
      ungrouped: win.ungrouped.map(toStoredTab),
    })),
  };

  const key = keyOf(batch.id);
  await chrome.storage.local.set({ [key]: batch });
  const written = normalizeBatch((await chrome.storage.local.get(key))[key], batch.id, 0);
  if (countTabs(written) !== plan.count) {
    throw new Error('The archive could not be saved completely, so no tab was closed.');
  }

  const planned = plan.windows.flatMap((win) => [...win.groups.flatMap(({ tabs }) => tabs), ...win.ungrouped]);
  await forgetSuspended(planned.filter((tab) => tab.suspended).map((tab) => tab.id));

  const savedUrls = new Map(planned.filter((tab) => !tab.suspended).map((tab) => [tab.id, urlOf(tab)]));
  const unchanged = (await chrome.tabs.query({}))
    .filter((tab) => savedUrls.get(tab.id) === urlOf(tab))
    .map((tab) => tab.id);

  const closeFailed = savedUrls.size - unchanged.length + (await closeTabs(unchanged)).length;
  return { archived: plan.count, closeFailed, batchId: batch.id };
}

// Resolves with the ids that are still open.
export async function closeTabs(ids) {
  if (ids.length === 0) return [];
  try {
    await chrome.tabs.remove(ids);
    return [];
  } catch {
    // One stale id fails the whole call, so retry one by one and keep what
    // is genuinely still open.
    await Promise.allSettled(ids.map((id) => chrome.tabs.remove(id)));
    const open = new Set((await chrome.tabs.query({})).map((tab) => tab.id));
    return ids.filter((id) => open.has(id));
  }
}

/* ---------------------------------------------------------------- reading */

export async function loadArchive() {
  const stored = await chrome.storage.local.get(null);
  return Object.entries(stored)
    .filter(([key]) => isBatchKey(key))
    .map(([key, raw]) => normalizeBatch(raw, key.slice(BATCH_PREFIX.length), 0))
    .filter(Boolean)
    .map(toModel)
    .sort((a, b) => b.archivedAt - a.archivedAt);
}

function toModel(batch) {
  const toTab = (tab, groupId) => ({
    id: tab.id,
    batchId: batch.id,
    title: tab.title,
    url: tab.url,
    favIconUrl: tab.favIconUrl,
    groupId,
    archivedAt: batch.archivedAt,
  });

  const windows = batch.windows.map((win) => {
    const groups = win.groups.map((group) => ({
      id: group.id,
      title: group.title,
      color: group.color,
      tabs: group.tabs.map((tab) => toTab(tab, group.id)),
    }));
    const ungrouped = win.ungrouped.map((tab) => toTab(tab, -1));
    return {
      id: win.id,
      title: win.title,
      groups,
      ungrouped,
      tabs: [...groups.flatMap((group) => group.tabs), ...ungrouped],
    };
  });

  return {
    id: batch.id,
    archivedAt: batch.archivedAt,
    label: batch.label ?? '',
    tabCount: countTabs(batch),
    windows,
  };
}

/* ------------------------------------------------------------- validation */

// The one gate for both stored batches and imported files. Missing or
// duplicate ids are derived from the parent id and position, so the same
// input always normalizes to the same ids.
function normalizeBatch(raw, id, fallbackArchivedAt) {
  if (!isObject(raw) || !Array.isArray(raw.windows)) return null;
  const seen = new Set();
  const idFor = (value, fallback) => {
    let chosen = validId(value) && !seen.has(value) ? value : fallback;
    for (let n = 1; seen.has(chosen); n += 1) chosen = `${fallback}~${n}`;
    seen.add(chosen);
    return chosen;
  };

  const windows = raw.windows
    .map((win, w) => normalizeWindow(win, idFor(win?.id, `${id}:w${w}`), w, idFor))
    .filter(Boolean);
  if (windows.length === 0) return null;

  const label = stringOr(raw.label, '').trim().slice(0, MAX_LABEL_LENGTH);
  return {
    id,
    archivedAt: Number.isFinite(raw.archivedAt) ? raw.archivedAt : fallbackArchivedAt,
    ...(label ? { label } : {}),
    windows,
  };
}

function normalizeWindow(raw, id, index, idFor) {
  if (!isObject(raw)) return null;
  const groups = arrayOf(raw.groups)
    .map((group, g) => normalizeGroup(group, idFor(group?.id, `${id}:g${g}`), idFor))
    .filter(Boolean);
  const ungrouped = normalizeTabs(raw.ungrouped, `${id}:u`, idFor);
  if (groups.length === 0 && ungrouped.length === 0) return null;
  return { id, title: stringOr(raw.title, '') || `Window ${index + 1}`, groups, ungrouped };
}

function normalizeGroup(raw, id, idFor) {
  if (!isObject(raw)) return null;
  const tabs = normalizeTabs(raw.tabs, `${id}:t`, idFor);
  if (tabs.length === 0) return null;
  return {
    id,
    title: stringOr(raw.title, ''),
    color: GROUP_COLORS.has(raw.color) ? raw.color : 'grey',
    tabs,
  };
}

function normalizeTabs(raw, idBase, idFor) {
  return arrayOf(raw)
    .map((tab, t) => {
      if (!isObject(tab) || !isReopenable(tab.url)) return null;
      const stored = {
        id: idFor(tab.id, `${idBase}${t}`),
        title: stringOr(tab.title, '') || tab.url,
        url: tab.url,
      };
      if (typeof tab.favIconUrl === 'string' && /^data:/i.test(tab.favIconUrl)) {
        stored.favIconUrl = tab.favIconUrl;
      }
      return stored;
    })
    .filter(Boolean);
}

export function normalizeSuspended(raw, id, fallbackSuspendedAt = 0) {
  if (!isObject(raw) || !isReopenable(raw.url)) return null;
  const entry = {
    id,
    url: raw.url,
    title: stringOr(raw.title, '') || raw.url,
    suspendedAt: Number.isFinite(raw.suspendedAt) ? raw.suspendedAt : fallbackSuspendedAt,
    windowId: Number.isInteger(raw.windowId) ? raw.windowId : null,
    index: Number.isInteger(raw.index) && raw.index >= 0 ? raw.index : 0,
    group: isObject(raw.group)
      ? { title: stringOr(raw.group.title, ''), color: GROUP_COLORS.has(raw.group.color) ? raw.group.color : 'grey' }
      : null,
  };
  if (typeof raw.favIconUrl === 'string' && /^data:/i.test(raw.favIconUrl)) entry.favIconUrl = raw.favIconUrl;
  return entry;
}

function contentId(value) {
  const text = JSON.stringify(value) ?? '';
  let a = 0x811c9dc5;
  let b = 0;
  for (let index = 0; index < text.length; index += 1) {
    const code = text.charCodeAt(index);
    a = Math.imul(a ^ code, 16777619);
    b = (Math.imul(b, 31) + code) | 0;
  }
  return `import-${(a >>> 0).toString(36)}${(b >>> 0).toString(36)}`;
}

const isObject = (value) => typeof value === 'object' && value !== null && !Array.isArray(value);
const arrayOf = (value) => (Array.isArray(value) ? value : []);
const stringOr = (value, fallback) => (typeof value === 'string' ? value : fallback);
const validId = (value) => typeof value === 'string' && value.length > 0 && value.length <= MAX_ID_LENGTH;

function countTabs(batch) {
  if (!batch) return 0;
  return batch.windows.reduce((sum, win) =>
    sum + win.ungrouped.length + win.groups.reduce((n, group) => n + group.tabs.length, 0), 0);
}

/* -------------------------------------------------------------- mutations */

export function removeArchivedTabs(batchId, tabIds) {
  return withBatchLock(batchId, () => dropTabs(batchId, tabIds));
}

async function dropTabs(batchId, tabIds) {
  const key = keyOf(batchId);
  const batch = normalizeBatch((await chrome.storage.local.get(key))[key], batchId, 0);
  if (!batch) return;

  const drop = new Set(tabIds);
  const keep = (tabs) => tabs.filter((tab) => !drop.has(tab.id));
  const windows = batch.windows
    .map((win) => ({
      ...win,
      groups: win.groups
        .map((group) => ({ ...group, tabs: keep(group.tabs) }))
        .filter((group) => group.tabs.length > 0),
      ungrouped: keep(win.ungrouped),
    }))
    .filter((win) => win.groups.length > 0 || win.ungrouped.length > 0);

  if (windows.length === 0) {
    await chrome.storage.local.remove(key);
  } else {
    await chrome.storage.local.set({ [key]: { ...batch, windows } });
  }
}

export function reopenArchivedTab(tab) {
  return withBatchLock(tab.batchId, async () => {
    // Another page may have reopened or removed it while this one waited.
    const key = keyOf(tab.batchId);
    const batch = normalizeBatch((await chrome.storage.local.get(key))[key], tab.batchId, 0);
    if (!batch || !toModel(batch).windows.some((win) => win.tabs.some((t) => t.id === tab.id))) return;
    await chrome.tabs.create({ url: tab.url, active: true });
    await dropTabs(tab.batchId, [tab.id]);
  });
}

/**
 * Reopens a batch, one browser window per archived window. Only tabs that
 * were created leave the archive; a tab that fails to open stays in it.
 */
export function restoreBatch(batchId) {
  return withBatchLock(batchId, () => restoreLocked(batchId));
}

async function restoreLocked(batchId) {
  const key = keyOf(batchId);
  const stored = normalizeBatch((await chrome.storage.local.get(key))[key], batchId, 0);
  if (!stored) return { restored: 0, failed: 0, windows: 0 };
  const batch = toModel(stored);

  const restored = [];
  let failed = 0;
  let windows = 0;
  const createBackgroundTab = backgroundTabCreator();

  for (const win of batch.windows) {
    let windowId = null;
    const created = new Map();

    for (const tab of win.tabs) {
      try {
        if (windowId === null) {
          const opened = await chrome.windows.create({ url: tab.url });
          windowId = opened.id;
          windows += 1;
          created.set(tab.id, opened.tabs?.[0]?.id);
        } else {
          created.set(tab.id, (await createBackgroundTab(windowId, tab)).id);
        }
        restored.push(tab.id);
      } catch (error) {
        console.warn('Tab Overview: could not reopen archived tab', tab.url, error);
        failed += 1;
      }
    }

    if (windowId !== null) await regroup(win, created, windowId);
  }

  await dropTabs(batchId, restored);
  return { restored: restored.length, failed, windows };
}

/**
 * Returns a function that opens a tab in the background, unloaded where the
 * browser allows it. windowId null opens it in the current window.
 */
export function backgroundTabCreator() {
  let discardedSupported = true;

  // Firefox can create tabs unloaded; Chrome rejects the property. Only when
  // the plain create then succeeds is the property known to be the problem.
  return async (windowId, tab) => {
    const plain = { ...(windowId === null ? {} : { windowId }), url: tab.url, active: false };
    if (!discardedSupported) return chrome.tabs.create(plain);
    try {
      return await chrome.tabs.create({ ...plain, discarded: true, title: tab.title });
    } catch {
      const created = await chrome.tabs.create(plain);
      discardedSupported = false;
      return created;
    }
  };
}

/**
 * Puts the created tabs of each group into a tab group in windowId: the open
 * group with the same title and color if there is one, otherwise a new one.
 * created maps a stored tab id to the id of the tab opened for it.
 */
export async function regroup(win, created, windowId) {
  if (!chrome.tabs.group) return;
  const open = await chrome.tabGroups?.query?.({ windowId }).catch(() => []) ?? [];

  for (const group of win.groups) {
    const tabIds = group.tabs.map((tab) => created.get(tab.id)).filter((id) => typeof id === 'number');
    if (tabIds.length === 0) continue;
    try {
      const existing = open.find((candidate) => sameGroup(candidate, group));
      if (existing) {
        await chrome.tabs.group({ tabIds, groupId: existing.id });
        continue;
      }
      const groupId = await chrome.tabs.group({ tabIds, createProperties: { windowId } });
      await chrome.tabGroups?.update?.(groupId, { title: group.title, color: group.color });
    } catch (error) {
      console.warn('Tab Overview: could not recreate tab group', group.title, error);
    }
  }
}

// Group ids change when a group is recreated or the browser restarts, so a
// group is recognized by what the user sees.
export const sameGroup = (a, b) => (a.title || '') === (b.title || '') && a.color === b.color;

export async function loadSuspended() {
  const stored = await chrome.storage.local.get(null);
  return Object.entries(stored)
    .filter(([key]) => isSuspendedKey(key))
    .map(([key, raw]) => normalizeSuspended(raw, key.slice(SUSPENDED_PREFIX.length)))
    .filter(Boolean)
    .sort((a, b) => a.suspendedAt - b.suspendedAt);
}

export function forgetSuspended(ids) {
  return Promise.all(ids.map((id) => withKeyLock(suspendedKey(id), () => chrome.storage.local.remove(suspendedKey(id)))));
}

export function deleteBatch(batchId) {
  return withBatchLock(batchId, () => chrome.storage.local.remove(keyOf(batchId)));
}

/* ------------------------------------------------------- export and import */

export async function exportArchive() {
  const stored = await chrome.storage.local.get(null);
  const archive = Object.entries(stored)
    .filter(([key]) => isBatchKey(key))
    .map(([key, raw]) => normalizeBatch(raw, key.slice(BATCH_PREFIX.length), 0))
    .filter(Boolean)
    .sort((a, b) => b.archivedAt - a.archivedAt);
  const customGroups = await loadGroups();
  const suspended = await loadSuspended();
  return { format: BACKUP_FORMAT, version: BACKUP_VERSION, exportedAt: Date.now(), archive, customGroups, suspended };
}

/**
 * Adds the batches, custom groups, and suspended tabs from a backup file. One
 * whose id is already present is skipped, and a batch or suspended tab without
 * an id gets one derived from its content, so importing the same file twice
 * changes nothing. customGroups and suspended are optional, because backups
 * written before those existed have no such field.
 */
export async function importArchive(text) {
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('That file is not valid JSON.');
  }
  if (!isObject(data) || data.format !== BACKUP_FORMAT || !Array.isArray(data.archive)) {
    throw new Error('That file is not a Tab Overview backup.');
  }
  if (data.version !== BACKUP_VERSION) {
    throw new Error(`Backup version ${data.version} is not supported.`);
  }

  const stored = await chrome.storage.local.get(null);
  const taken = new Set(Object.keys(stored).filter((key) => isBatchKey(key) || isSuspendedKey(key)));
  const fallbackArchivedAt = Number.isFinite(data.exportedAt) ? data.exportedAt : Date.now();
  const additions = {};
  const result = { batches: 0, tabs: 0, skipped: 0, invalid: 0, groups: 0, groupsSkipped: 0, suspended: 0 };

  for (const raw of data.archive) {
    const id = validId(raw?.id) ? raw.id : contentId(raw);
    if (taken.has(keyOf(id))) {
      result.skipped += 1;
      continue;
    }
    const batch = normalizeBatch(raw, id, fallbackArchivedAt);
    if (!batch) {
      result.invalid += 1;
      continue;
    }
    taken.add(keyOf(id));
    additions[keyOf(id)] = batch;
    result.batches += 1;
    result.tabs += countTabs(batch);
  }

  for (const raw of arrayOf(data.suspended)) {
    const id = validId(raw?.id) ? raw.id : contentId(raw);
    if (taken.has(suspendedKey(id))) continue;
    const entry = normalizeSuspended(raw, id, fallbackArchivedAt);
    if (!entry) continue;
    taken.add(suspendedKey(id));
    // A window id from another browser session names no window here.
    additions[suspendedKey(id)] = { ...entry, windowId: null };
    result.suspended += 1;
  }

  if (Object.keys(additions).length > 0) await chrome.storage.local.set(additions);
  const { added, skipped, invalid } = await mergeGroups(data.customGroups);
  result.groups = added;
  result.groupsSkipped = skipped;
  result.groupsInvalid = invalid;
  return result;
}
