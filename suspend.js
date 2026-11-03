'use strict';

import { GROUP_COLORS } from './custom-groups.js';
import {
  backgroundTabCreator,
  closeTabs,
  normalizeSuspended,
  regroup,
  sameGroup,
  skipReason,
  suspendedKey,
  urlOf,
  withKeyLock,
} from './archive.js';

// The section for suspended tabs whose window and group are both gone, as
// after a browser restart.
export const SUSPENDED_WINDOW_ID = 'suspended';

// SuspendedTab: a Suspended entry (see archive.js) placed among open tabs
// { ...Suspended, suspended: true, windowId, groupId, reopenIndex? }
//   windowId     the open window it is shown in, or SUSPENDED_WINDOW_ID
//   groupId      an open group's id, a rebuilt group's id, or -1
//   reopenIndex  the tab index it reopens at in an open window

/**
 * Places suspended tabs among the open ones.
 *   windows  [{ id, tabs }]                     open windows, tabs in index order
 *   groups   [{ id, windowId, title, color }]   open tab groups
 * A tab goes to its own window if it is open, otherwise to a window with a
 * group of the same title and color, otherwise to the SUSPENDED_WINDOW_ID
 * section. In its window it joins the group with the same title and color, or
 * a group rebuilt from the saved title and color.
 * Returns { windows, groups, orphans }: the windows with the suspended tabs
 * merged in at their saved index, the groups plus the rebuilt ones, and the
 * tabs of the SUSPENDED_WINDOW_ID section.
 */
export function placeSuspended(windows, groups, entries) {
  const windowIds = new Set(windows.map((win) => win.id));
  const rebuilt = new Map();

  const windowFor = (entry) => {
    if (windowIds.has(entry.windowId)) return entry.windowId;
    const match = entry.group &&
      groups.find((group) => windowIds.has(group.windowId) && sameGroup(group, entry.group));
    return match ? match.windowId : SUSPENDED_WINDOW_ID;
  };

  const groupIn = (windowId, saved) => {
    if (!saved) return -1;
    const open = groups.find((group) => group.windowId === windowId && sameGroup(group, saved));
    if (open) return open.id;
    const id = `suspended:${windowId}:${saved.color}:${saved.title}`;
    if (!rebuilt.has(id)) rebuilt.set(id, { id, windowId, title: saved.title, color: saved.color });
    return id;
  };

  const byWindow = new Map();
  const ordered = [...entries].sort((a, b) => (a.windowId ?? -1) - (b.windowId ?? -1) || a.index - b.index);
  for (const entry of ordered) {
    const windowId = windowFor(entry);
    if (!byWindow.has(windowId)) byWindow.set(windowId, []);
    byWindow.get(windowId).push({ ...entry, suspended: true, windowId, groupId: groupIn(windowId, entry.group) });
  }

  const placed = windows.map((win) => {
    const tabs = [...win.tabs];
    for (const tab of byWindow.get(win.id) || []) tabs.splice(Math.min(tab.index, tabs.length), 0, tab);
    let open = 0;
    for (const tab of tabs) {
      if (tab.suspended) tab.reopenIndex = open;
      else open += 1;
    }
    return { ...win, tabs };
  });

  return {
    windows: placed,
    groups: [...groups, ...rebuilt.values()],
    orphans: byWindow.get(SUSPENDED_WINDOW_ID) || [],
  };
}

/**
 * Saves the tabs as suspended, reads them back, and only then closes them. If
 * the write fails no tab is closed. A tab that navigated since it was read
 * stays open and is not kept as suspended.
 * groups are the open tab groups, for the title and color to keep.
 * Resolves with the ids of the new suspended entries and how many stayed open.
 */
export async function suspendTabs(tabs, groups) {
  const groupsById = new Map(groups.map((group) => [group.id, group]));
  const suspendedAt = Date.now();
  const entries = new Map();

  for (const tab of tabs) {
    if (tab.suspended || skipReason(tab)) continue;
    const url = urlOf(tab);
    const group = groupsById.get(tab.groupId);
    const entry = {
      id: crypto.randomUUID(),
      url,
      title: tab.title || url,
      suspendedAt,
      windowId: tab.windowId,
      index: tab.index,
      group: group ? { title: group.title || '', color: GROUP_COLORS.has(group.color) ? group.color : 'grey' } : null,
    };
    if (/^data:/i.test(tab.favIconUrl || '')) entry.favIconUrl = tab.favIconUrl;
    entries.set(tab.id, entry);
  }
  if (entries.size === 0) return { suspended: [], leftOpen: 0 };

  const keyFor = (tabId) => suspendedKey(entries.get(tabId).id);
  const keys = [...entries.keys()].map(keyFor);
  await chrome.storage.local.set(Object.fromEntries([...entries.values()].map((entry) => [suspendedKey(entry.id), entry])));
  const written = await chrome.storage.local.get(keys);
  const complete = [...entries.values()]
    .every((entry) => normalizeSuspended(written[suspendedKey(entry.id)], entry.id)?.url === entry.url);
  if (!complete) {
    await chrome.storage.local.remove(keys);
    throw new Error('The suspended tabs could not be saved, so no tab was closed.');
  }

  const unchanged = (await chrome.tabs.query({}))
    .filter((tab) => entries.get(tab.id)?.url === urlOf(tab))
    .map((tab) => tab.id);
  const stillOpen = new Set(await closeTabs(unchanged));
  const closed = unchanged.filter((id) => !stillOpen.has(id));
  const leftOpen = [...entries.keys()].filter((id) => !closed.includes(id));
  if (leftOpen.length > 0) await chrome.storage.local.remove(leftOpen.map(keyFor));
  return { suspended: closed.map((id) => entries.get(id).id), leftOpen: leftOpen.length };
}

/**
 * Reopens suspended tabs in the window they are shown in, each in its tab
 * group. The SUSPENDED_WINDOW_ID section reopens into the current window. With
 * activate, the tab opens in front at its place; otherwise tabs open in the
 * background, unloaded where the browser allows it. A tab stops being
 * suspended only once it is open.
 */
export async function reopenSuspended(tabs, { activate = false } = {}) {
  const createBackgroundTab = backgroundTabCreator();
  const created = new Map();
  const groupsByWindow = new Map();
  let focusWindowId = null;
  let failed = 0;

  for (const tab of tabs) {
    const key = suspendedKey(tab.id);
    const windowId = typeof tab.windowId === 'number' ? tab.windowId : null;
    try {
      // Another page may have reopened or forgotten it while this one waited.
      const opened = await withKeyLock(key, async () => {
        if (!(key in await chrome.storage.local.get(key))) return null;
        const place = windowId === null ? {} : { windowId, index: tab.reopenIndex };
        const tabOpened = activate
          ? await chrome.tabs.create({ ...place, url: tab.url, active: true })
          : await createBackgroundTab(windowId, tab);
        await chrome.storage.local.remove(key);
        return tabOpened;
      });
      if (!opened) continue;
      created.set(tab.id, opened.id);
      focusWindowId = opened.windowId;
      if (!tab.group) continue;
      if (!groupsByWindow.has(opened.windowId)) groupsByWindow.set(opened.windowId, new Map());
      const groups = groupsByWindow.get(opened.windowId);
      const groupKey = `${tab.group.color}:${tab.group.title}`;
      if (!groups.has(groupKey)) groups.set(groupKey, { ...tab.group, tabs: [] });
      groups.get(groupKey).tabs.push(tab);
    } catch (error) {
      console.warn('Tab Overview: could not reopen suspended tab', tab.url, error);
      failed += 1;
    }
  }

  for (const [windowId, groups] of groupsByWindow) {
    await regroup({ groups: [...groups.values()] }, created, windowId);
  }
  if (activate && focusWindowId !== null) await chrome.windows.update(focusWindowId, { focused: true });
  return { reopened: created.size, failed };
}
