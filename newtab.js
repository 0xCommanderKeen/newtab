'use strict';

import { CATEGORY_INDEX, categorizeTab } from './categories.js';

const SELF_URL = globalThis.chrome?.runtime?.getURL
  ? chrome.runtime.getURL('newtab.html')
  : '';
const EXTENSION_ORIGIN = globalThis.chrome?.runtime?.getURL
  ? chrome.runtime.getURL('')
  : '';

const COLLAPSED_KEY = 'tabOverview.collapsedGroups';
const COLLAPSED_CATEGORIES_KEY = 'tabOverview.collapsedCategories';
const VIEW_KEY = 'tabOverview.view';
const OPENED_AT_PREFIX = 'tabOpenedAt:';
const VIEWS = new Set(['windows', 'sorted']);
const VALID_COLORS = new Set([
  'grey', 'blue', 'red', 'yellow', 'green', 'pink', 'purple', 'cyan', 'orange',
]);

const ICONS = {
  chevron:
    '<svg viewBox="0 0 16 16" fill="none" aria-hidden="true">' +
    '<path d="M4 6l4 4 4-4" stroke="currentColor" stroke-width="1.6" ' +
    'stroke-linecap="round" stroke-linejoin="round"/></svg>',
  close:
    '<svg viewBox="0 0 16 16" fill="none" aria-hidden="true">' +
    '<path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="1.6" ' +
    'stroke-linecap="round"/></svg>',
  pin:
    '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">' +
    '<path d="M12 17v5M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 ' +
    '15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 ' +
    '2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z" ' +
    'stroke="currentColor" stroke-width="1.8" stroke-linecap="round" ' +
    'stroke-linejoin="round"/></svg>',
  audio:
    '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">' +
    '<path d="M11 4.7a.7.7 0 0 0-1.2-.5L6.4 7.6A1.4 1.4 0 0 1 5.4 8H3a1 1 0 0 0-1 ' +
    '1v6a1 1 0 0 0 1 1h2.4a1.4 1.4 0 0 1 1 .4l3.4 3.4a.7.7 0 0 0 1.2-.5z" ' +
    'fill="currentColor"/><path d="M16 9a5 5 0 0 1 0 6M19.4 18.4a9 9 0 0 0 0-12.8" ' +
    'stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
  muted:
    '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">' +
    '<path d="M11 4.7a.7.7 0 0 0-1.2-.5L6.4 7.6A1.4 1.4 0 0 1 5.4 8H3a1 1 0 0 0-1 ' +
    '1v6a1 1 0 0 0 1 1h2.4a1.4 1.4 0 0 1 1 .4l3.4 3.4a.7.7 0 0 0 1.2-.5z" ' +
    'fill="currentColor"/><path d="M16 9l5 6M21 9l-5 6" stroke="currentColor" ' +
    'stroke-width="1.8" stroke-linecap="round"/></svg>',
  grid:
    '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">' +
    '<rect x="3" y="3" width="7" height="7" rx="2" stroke="currentColor" ' +
    'stroke-width="1.6"/><rect x="14" y="3" width="7" height="7" rx="2" ' +
    'stroke="currentColor" stroke-width="1.6"/><rect x="3" y="14" width="7" ' +
    'height="7" rx="2" stroke="currentColor" stroke-width="1.6"/><rect x="14" ' +
    'y="14" width="7" height="7" rx="2" stroke="currentColor" stroke-width="1.6"/>' +
    '</svg>',
  search:
    '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">' +
    '<circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="1.6"/>' +
    '<path d="m16.2 16.2 4.3 4.3" stroke="currentColor" stroke-width="1.6" ' +
    'stroke-linecap="round"/></svg>',
  alert:
    '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">' +
    '<path d="M12 3.5 21 20H3L12 3.5Z" stroke="currentColor" stroke-width="1.6" ' +
    'stroke-linejoin="round"/><path d="M12 9v5" stroke="currentColor" ' +
    'stroke-width="1.8" stroke-linecap="round"/><circle cx="12" cy="17" r="1" ' +
    'fill="currentColor"/></svg>',
};

const SOURCES = {
  open: {
    collapsedKey: COLLAPSED_KEY,
    tabNoun: 'tab',
    containerNoun: ['window', 'windows'],
    windows: () => state.windows,
    containerCount: () => state.windows.length,
    error: () => state.openError,
    errorTitle: 'Couldn’t read your tabs',
    renderWindows: renderWindowView,
    ageOf: openedAge,
    empty: {
      icon: ICONS.grid,
      title: 'No other tabs open',
      message: 'This is the only tab in your browser right now. Open a page and it will show up here.',
    },
    actions: {
      activate: activateTab,
      activateLabel: 'Switch to',
      dismiss: closeTab,
      dismissLabel: 'Close',
      middleClick: closeTab,
    },
  },
};

const state = {
  windows: [],
  openedAt: new Map(),
  openError: null,
  query: '',
  source: 'open',
  view: loadChoice(VIEW_KEY, VIEWS, 'windows'),
  collapsed: {
    open: loadSet(COLLAPSED_KEY, toNumberId),
  },
  collapsedCategories: loadSet(COLLAPSED_CATEGORIES_KEY, toStringId),
  loading: true,
};

const els = {};
const iconTemplates = new Map();
let refreshTimer = null;

/* ------------------------------------------------------------------ startup */

function init() {
  els.overview = document.getElementById('overview');
  els.summary = document.getElementById('summary');
  els.search = document.getElementById('search');
  els.viewButtons = document.querySelectorAll('.view-button[data-view]');

  if (!globalThis.chrome?.tabs?.query || !globalThis.chrome?.windows?.getAll) {
    renderUnsupported();
    return;
  }

  bindEvents();
  bindSearch();
  bindViewSwitch();
  applyViewButtons();

  requestTimeSync()
    .then(refresh)
    .catch(() => refresh());

  setInterval(updateAges, 30_000);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') updateAges();
  });
}

async function requestTimeSync() {
  if (!chrome.runtime?.sendMessage) return;
  try {
    await chrome.runtime.sendMessage({ type: 'syncTabTimes' });
  } catch {
    // Timestamps are optional; the overview still works without them.
  }
}

const LOADERS = { open: loadOpen };
const pendingParts = new Set();

async function refresh(parts = Object.keys(LOADERS)) {
  await Promise.all(parts.map((part) => LOADERS[part]()));
  state.loading = false;
  render();
}

function scheduleRefresh(part) {
  pendingParts.add(part);
  clearTimeout(refreshTimer);
  refreshTimer = setTimeout(() => {
    const parts = [...pendingParts];
    pendingParts.clear();
    refresh(parts);
  }, 80);
}

async function loadOpen() {
  try {
    const [windows, openedAt] = await Promise.all([readOpenWindows(), loadTabTimes()]);
    state.windows = windows;
    state.openedAt = openedAt;
    state.openError = null;
    pruneCollapsed('open', windows);
  } catch (error) {
    console.error('Tab Overview: failed to read tabs', error);
    state.openError = error;
  }
}

async function readOpenWindows() {
  const [windows, groups, selfTab] = await Promise.all([
    chrome.windows.getAll({ populate: true }),
    chrome.tabGroups?.query ? chrome.tabGroups.query({}) : Promise.resolve([]),
    chrome.tabs.getCurrent ? chrome.tabs.getCurrent().catch(() => null) : Promise.resolve(null),
  ]);

  const selfTabId = selfTab?.id ?? null;
  const groupsById = new Map(groups.map((group) => [group.id, group]));

  return windows
    .map((win) => ({
      ...win,
      tabs: (win.tabs || [])
        .filter((tab) => tab.id !== selfTabId && !isSelfTab(tab))
        .sort((a, b) => a.index - b.index),
    }))
    .filter((win) => win.tabs.length > 0)
    .sort((a, b) => Number(b.focused) - Number(a.focused) || a.id - b.id)
    .map((win, index) => {
      const title = win.focused ? 'Current window' : `Window ${index + 1}`;
      return {
        id: win.id,
        title,
        focused: win.focused,
        incognito: win.incognito,
        badge: { text: `W${index + 1}`, title },
        tabs: win.tabs,
        ...groupTabs(win.tabs, groupsById),
      };
    });
}

function groupTabs(tabs, groupsById) {
  const byGroup = new Map();
  const ungrouped = [];

  for (const tab of tabs) {
    if (tab.groupId === -1 || tab.groupId === undefined) {
      ungrouped.push(tab);
    } else {
      if (!byGroup.has(tab.groupId)) byGroup.set(tab.groupId, []);
      byGroup.get(tab.groupId).push(tab);
    }
  }

  const groups = [...byGroup.entries()]
    .map(([id, groupTabs]) => {
      const meta = groupsById.get(id);
      return {
        id,
        title: meta?.title || '',
        color: meta?.color || 'grey',
        tabs: groupTabs,
        firstIndex: Math.min(...groupTabs.map((tab) => tab.index)),
      };
    })
    .sort((a, b) => a.firstIndex - b.firstIndex);

  return { groups, ungrouped };
}

function pruneCollapsed(source, windows) {
  const live = new Set(windows.flatMap((win) => win.groups.map((group) => group.id)));
  const collapsed = state.collapsed[source];
  const stale = [...collapsed].filter((id) => !live.has(id));
  if (stale.length === 0) return;
  for (const id of stale) collapsed.delete(id);
  saveSet(SOURCES[source].collapsedKey, collapsed);
}

async function loadTabTimes() {
  if (!chrome.storage?.session?.get) return new Map();

  try {
    const stored = await chrome.storage.session.get(null);
    const times = new Map();

    for (const [key, value] of Object.entries(stored)) {
      if (!key.startsWith(OPENED_AT_PREFIX)) continue;
      const id = Number(key.slice(OPENED_AT_PREFIX.length));
      if (!Number.isFinite(id)) continue;
      if (!value || typeof value.openedAt !== 'number') continue;
      times.set(id, {
        openedAt: value.openedAt,
        approximate: value.approximate === true,
      });
    }

    return times;
  } catch {
    return new Map();
  }
}

/* ------------------------------------------------------------------ events */

function bindEvents() {
  const reload = () => scheduleRefresh('open');

  for (const name of ['onCreated', 'onRemoved', 'onMoved', 'onAttached', 'onDetached', 'onActivated']) {
    chrome.tabs[name]?.addListener(reload);
  }

  chrome.tabs.onUpdated?.addListener((tabId, changeInfo) => {
    const relevant = [
      'title', 'url', 'favIconUrl', 'status', 'pinned',
      'audible', 'mutedInfo', 'discarded', 'groupId',
    ];
    if (relevant.some((key) => key in changeInfo)) reload();
  });

  for (const name of ['onCreated', 'onUpdated', 'onRemoved', 'onMoved']) {
    chrome.tabGroups?.[name]?.addListener(reload);
  }

  for (const name of ['onCreated', 'onRemoved', 'onFocusChanged']) {
    chrome.windows?.[name]?.addListener(reload);
  }

  chrome.storage?.onChanged?.addListener((changes, areaName) => {
    if (areaName !== 'session') return;
    if (Object.keys(changes).some((key) => key.startsWith(OPENED_AT_PREFIX))) {
      reload();
    }
  });
}

function bindSearch() {
  els.search.addEventListener('input', () => {
    state.query = els.search.value;
    render();
  });

  els.search.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      clearSearch();
      return;
    }

    if (event.key === 'Enter') {
      const first = els.overview.querySelector('.tab');
      if (first) {
        event.preventDefault();
        first.click();
      }
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && state.query) {
      event.preventDefault();
      clearSearch();
      return;
    }

    if (event.key !== '/' || event.metaKey || event.ctrlKey || event.altKey) return;
    const target = event.target;
    const typing = target instanceof HTMLElement &&
      (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName));
    if (typing) return;
    event.preventDefault();
    els.search.focus();
    els.search.select();
  });
}

function clearSearch() {
  state.query = '';
  if (els.search) {
    els.search.value = '';
    els.search.focus();
  }
  render();
}

function bindViewSwitch() {
  for (const button of els.viewButtons) {
    button.addEventListener('click', () => {
      const view = button.dataset.view;
      if (!VIEWS.has(view) || view === state.view) return;
      state.view = view;
      saveValue(VIEW_KEY, view);
      applyViewButtons();
      render();
    });
  }
}

function applyViewButtons() {
  for (const button of els.viewButtons) {
    const active = button.dataset.view === state.view;
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-pressed', String(active));
  }
}

/* ------------------------------------------------------------------ render */

function render() {
  if (!els.overview) return;

  const focus = focusKey();
  const ctx = sourceContext(state.source);

  if (state.loading) {
    els.summary.textContent = 'Reading your tabs…';
    els.overview.replaceChildren();
    return;
  }

  els.overview.replaceChildren();
  renderSource(ctx);
  restoreFocus(focus);
}

function sourceContext(source) {
  return {
    ...SOURCES[source],
    source,
    query: state.query.trim().toLowerCase(),
    collapsed: state.collapsed[source],
  };
}

function renderSource(ctx) {
  const error = ctx.error();
  if (error) {
    renderError(error, ctx.errorTitle);
    return;
  }

  const windows = ctx.windows();
  const totalTabs = windows.reduce((sum, win) => sum + win.tabs.length, 0);

  if (totalTabs === 0) {
    els.overview.append(createEmptyState(ctx.empty));
    els.summary.textContent = plural(0, ctx.tabNoun);
    return;
  }

  const { matched, detail } = state.view === 'sorted'
    ? renderSortedView(windows, ctx)
    : ctx.renderWindows(ctx);

  if (matched === 0) {
    renderEmptySearch(totalTabs, ctx);
    return;
  }

  const [one, many] = ctx.containerNoun;
  els.summary.textContent = ctx.query
    ? matchSummary(matched, totalTabs, ctx.tabNoun)
    : `${plural(totalTabs, ctx.tabNoun)} · ${detail} · ${plural(ctx.containerCount(), one, many)}`;
}

function renderWindowView(ctx) {
  const { sections, matched } = filterWindows(state.windows, ctx.query);
  for (const section of sections) {
    els.overview.append(renderWindow(section, ctx));
  }
  return { matched, detail: plural(countGroups(state.windows), 'group') };
}

function filterWindows(windows, query) {
  const sections = [];
  let matched = 0;

  for (const win of windows) {
    const filtered = filterWindow(win, query);
    const count = countVisible(filtered);
    if (count === 0) continue;
    matched += count;
    sections.push({ win, ...filtered, count });
  }

  return { sections, matched };
}

function renderSortedView(windows, ctx) {
  const categories = buildCategories(windows, ctx.query);
  for (const bucket of categories) {
    els.overview.append(renderCategory(bucket, ctx));
  }
  return {
    matched: categories.reduce((sum, bucket) => sum + bucket.tabs.length, 0),
    detail: plural(categories.length, 'category', 'categories'),
  };
}

function renderEmptySearch(totalTabs, ctx) {
  els.overview.append(createEmptyState({
    icon: ICONS.search,
    title: `No ${ctx.tabNoun}s match “${state.query.trim()}”`,
    message: 'Try a shorter search, or search by site address.',
    actionLabel: 'Clear search',
    onAction: clearSearch,
  }));
  els.summary.textContent = matchSummary(0, totalTabs, ctx.tabNoun);
}

const FOCUS_SCOPES = ['data-tab-id', 'data-group-id', 'data-category-id', 'data-batch-id'];

// Every render rebuilds the overview, so focus is remembered as a selector and
// put back on the equivalent new element.
function focusKey() {
  const active = document.activeElement;
  if (!(active instanceof HTMLElement) || active === document.body) return null;
  if (active.id) return `#${CSS.escape(active.id)}`;

  for (const attr of FOCUS_SCOPES) {
    const scope = active.closest(`[${attr}]`);
    if (!scope) continue;
    const base = `[${attr}="${CSS.escape(scope.getAttribute(attr))}"]`;
    if (scope === active) return base;
    return active.classList[0] ? `${base} .${CSS.escape(active.classList[0])}` : null;
  }
  return null;
}

function restoreFocus(key) {
  if (!key) return;
  const target = document.querySelector(key);
  if (target && target !== document.activeElement) target.focus({ preventScroll: true });
}

function buildCategories(windows, query) {
  const buckets = new Map();

  for (const win of windows) {
    const groupTitles = new Map(win.groups.map((group) => [group.id, group.title]));

    for (const tab of win.tabs) {
      const category = categorizeTab(tab);
      const categoryMatches = category.label.toLowerCase().includes(query);

      if (query && !categoryMatches && !tabMatchesQuery(tab, groupTitles.get(tab.groupId), query)) continue;

      if (!buckets.has(category.id)) {
        buckets.set(category.id, {
          meta: category,
          tabs: [],
          windows: new Set(),
        });
      }

      const bucket = buckets.get(category.id);
      bucket.tabs.push({ tab, win });
      bucket.windows.add(win.id);
    }
  }

  return [...buckets.values()].sort(
    (a, b) => (CATEGORY_INDEX.get(a.meta.id) ?? 99) - (CATEGORY_INDEX.get(b.meta.id) ?? 99),
  );
}

function tabMatchesQuery(tab, groupTitle, query) {
  return (tab.title || '').toLowerCase().includes(query) ||
    (tab.url || '').toLowerCase().includes(query) ||
    (groupTitle || '').toLowerCase().includes(query);
}

function renderCategory({ meta, tabs }, ctx) {
  const section = el('section', 'category');
  section.dataset.category = meta.id;

  const isCollapsed = ctx.query === '' && state.collapsedCategories.has(meta.id);
  if (isCollapsed) section.classList.add('is-collapsed');

  const header = document.createElement('button');
  header.type = 'button';
  header.className = 'group-header category-header';
  header.dataset.categoryId = meta.id;
  header.setAttribute('aria-expanded', String(!isCollapsed));
  header.setAttribute('aria-label', `${meta.label}, ${plural(tabs.length, 'tab')}`);

  const chevron = el('span', 'group-chevron');
  chevron.append(createIcon(ICONS.chevron));

  const dot = el('span', 'group-dot');
  const name = el('span', 'group-name');
  name.textContent = meta.label;
  const count = el('span', 'group-count');
  count.textContent = String(tabs.length);

  header.append(chevron, dot, name, count);
  header.addEventListener('click', () => toggleCategory(meta.id));
  section.append(header);

  if (!isCollapsed) {
    const grid = el('div', 'group-tabs');
    for (const { tab, win } of tabs) {
      grid.append(renderTab(tab, ctx, { windowBadge: win.badge }));
    }
    section.append(grid);
  }

  return section;
}

function toggleCategory(categoryId) {
  if (state.collapsedCategories.has(categoryId)) {
    state.collapsedCategories.delete(categoryId);
  } else {
    state.collapsedCategories.add(categoryId);
  }
  saveSet(COLLAPSED_CATEGORIES_KEY, state.collapsedCategories);
  render();
}

function filterWindow(win, query) {
  const { groups, ungrouped } = win;
  if (!query) return { groups, ungrouped };

  return {
    groups: groups
      .map((group) => ({
        ...group,
        tabs: group.tabs.filter((tab) => tabMatchesQuery(tab, group.title, query)),
      }))
      .filter((group) => group.tabs.length > 0),
    ungrouped: ungrouped.filter((tab) => tabMatchesQuery(tab, '', query)),
  };
}

function renderWindow({ win, groups, ungrouped, count }, ctx) {
  const section = el('section', 'window');
  if (win.focused) section.classList.add('is-focused');

  const head = el('div', 'window-head');
  const titleWrap = el('div', 'window-title');
  titleWrap.append(el('span', 'window-dot'));

  const heading = document.createElement('h2');
  heading.textContent = win.title;
  titleWrap.append(heading);

  if (win.incognito) {
    const pill = el('span', 'pill');
    pill.textContent = 'Incognito';
    titleWrap.append(pill);
  }

  const meta = el('div', 'window-meta');
  const tabCount = el('span', 'window-count');
  tabCount.textContent = count === win.tabs.length
    ? plural(count, 'tab')
    : `${count} of ${plural(win.tabs.length, 'tab')}`;
  meta.append(tabCount);

  if (groups.length > 0) {
    const groupCount = el('span', 'window-count');
    groupCount.textContent = plural(groups.length, 'group');
    meta.append(groupCount);
  }

  head.append(titleWrap, meta);
  section.append(head);

  const body = el('div', 'window-body');
  for (const group of groups) body.append(renderGroup(group, ctx));
  if (ungrouped.length > 0) body.append(renderUngrouped(ungrouped, groups.length > 0, ctx));
  section.append(body);

  return section;
}

function renderGroup(group, ctx) {
  const section = el('section', 'group');
  const color = VALID_COLORS.has(group.color) ? group.color : 'grey';
  section.dataset.color = color;

  const isCollapsed = ctx.query === '' && ctx.collapsed.has(group.id);
  if (isCollapsed) section.classList.add('is-collapsed');

  const header = document.createElement('button');
  header.type = 'button';
  header.className = 'group-header';
  header.dataset.groupId = String(group.id);
  header.setAttribute('aria-expanded', String(!isCollapsed));
  header.setAttribute(
    'aria-label',
    `${group.title || 'Untitled group'}, ${plural(group.tabs.length, 'tab')}`,
  );

  const chevron = el('span', 'group-chevron');
  chevron.append(createIcon(ICONS.chevron));

  const dot = el('span', 'group-dot');
  const name = el('span', 'group-name');
  name.textContent = group.title || 'Untitled group';
  const count = el('span', 'group-count');
  count.textContent = String(group.tabs.length);

  header.append(chevron, dot, name, count);
  header.addEventListener('click', () => toggleGroup(ctx, group.id));
  section.append(header);

  if (!isCollapsed) {
    const tabs = el('div', 'group-tabs');
    for (const tab of group.tabs) tabs.append(renderTab(tab, ctx));
    section.append(tabs);
  }

  return section;
}

function renderUngrouped(tabs, showLabel, ctx) {
  const section = el('section', 'group group-ungrouped');
  if (showLabel) section.classList.add('has-label');

  if (showLabel) {
    const label = el('div', 'ungrouped-label');
    const name = el('span');
    name.textContent = 'Ungrouped';
    const count = el('span', 'ungrouped-count');
    count.textContent = String(tabs.length);
    label.append(name, count);
    section.append(label);
  }

  const grid = el('div', 'group-tabs');
  for (const tab of tabs) grid.append(renderTab(tab, ctx));
  section.append(grid);

  return section;
}

function renderTab(tab, ctx, options = {}) {
  const { actions } = ctx;
  const card = el('div', 'tab');
  card.dataset.tabId = String(tab.id);
  if (tab.bookmarkId) card.dataset.bookmarkId = tab.bookmarkId;

  const titleText = tab.title?.trim() || displayUrl(tab.url) || 'Untitled tab';
  card.title = [tab.title?.trim(), tab.url].filter(Boolean).join('\n');

  if (tab.active) card.classList.add('is-active');
  if (tab.discarded) card.classList.add('is-discarded');

  const main = el('div', 'tab-main');
  main.tabIndex = 0;
  main.setAttribute('role', 'button');
  main.setAttribute('aria-label', `${actions.activateLabel} ${titleText}`);

  main.append(createFavicon(tab));

  const text = el('div', 'tab-text');
  const titleRow = el('div', 'tab-title-row');
  const title = el('span', 'tab-title');
  title.textContent = titleText;
  titleRow.append(title);

  const flags = el('span', 'tab-flags');
  if (tab.pinned) flags.append(createFlag(ICONS.pin, 'Pinned'));
  if (tab.audible) {
    const muted = tab.mutedInfo?.muted;
    flags.append(createFlag(muted ? ICONS.muted : ICONS.audio, muted ? 'Muted' : 'Playing audio'));
  }
  if (flags.childElementCount > 0) titleRow.append(flags);

  const urlText = displayUrl(tab.url);
  const age = ctx.ageOf(tab);

  text.append(titleRow);

  const meta = el('div', 'tab-url');
  if (urlText && urlText !== titleText) {
    const url = el('span', 'tab-url-text');
    url.textContent = urlText;
    meta.append(url);
  }

  if (age) {
    const ageEl = el('span', 'tab-age');
    ageEl.title = age.title;
    if (typeof age.since === 'number') {
      ageEl.textContent = age.prefix + formatAge(age.since);
      ageEl.dataset.since = String(age.since);
      ageEl.dataset.prefix = age.prefix;
    } else {
      ageEl.textContent = age.text;
    }
    meta.append(ageEl);
  }

  if (options.windowBadge) {
    const badge = el('span', 'tab-window');
    badge.textContent = options.windowBadge.text;
    badge.title = options.windowBadge.title;
    meta.append(badge);
  }

  if (meta.childElementCount > 0) text.append(meta);

  main.append(text);
  main.addEventListener('click', () => actions.activate(tab));
  main.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      actions.activate(tab);
    }
  });

  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'tab-close';
  close.title = actions.dismissLabel;
  close.setAttribute('aria-label', `${actions.dismissLabel} ${titleText}`);
  close.append(createIcon(ICONS.close));
  close.addEventListener('click', () => actions.dismiss(tab));

  card.append(main, close);
  if (actions.middleClick) {
    card.addEventListener('auxclick', (event) => {
      if (event.button === 1) {
        event.preventDefault();
        actions.middleClick(tab);
      }
    });
  }

  return card;
}

function openedAge(tab) {
  const opened = state.openedAt.get(tab.id);
  if (!opened) return null;
  if (opened.approximate) {
    return {
      text: 'Before tracking',
      title: 'This tab was already open when Tab Overview started tracking.',
    };
  }
  return {
    since: opened.openedAt,
    prefix: '',
    title: `Opened ${new Date(opened.openedAt).toLocaleString()}`,
  };
}

function createFavicon(tab) {
  const wrap = el('span', 'tab-favicon');
  const url = tab.url || '';

  let src = '';
  if (tab.favIconUrl && /^data:/i.test(tab.favIconUrl)) {
    src = tab.favIconUrl;
  } else if (/^(https?|file):/i.test(url)) {
    src = `${chrome.runtime.getURL('_favicon/')}?pageUrl=${encodeURIComponent(url)}&size=32`;
  }

  if (!src) {
    wrap.append(fallbackFavicon(tab));
    return wrap;
  }

  const img = document.createElement('img');
  img.src = src;
  img.alt = '';
  img.width = 20;
  img.height = 20;
  img.loading = 'lazy';
  img.decoding = 'async';
  img.addEventListener('error', () => {
    img.remove();
    wrap.append(fallbackFavicon(tab));
  }, { once: true });
  wrap.append(img);

  return wrap;
}

function fallbackFavicon(tab) {
  const span = el('span', 'favicon-fallback');
  const source = hostnameOf(tab.url) || tab.title || '?';
  span.textContent = (Array.from(source.trim())[0] || '?').toUpperCase();
  span.style.setProperty('--hue', String(hashString(source) % 360));
  span.setAttribute('aria-hidden', 'true');
  return span;
}

function createFlag(svg, label) {
  const span = el('span', 'tab-flag');
  span.append(createIcon(svg));
  span.setAttribute('role', 'img');
  span.setAttribute('aria-label', label);
  span.title = label;
  return span;
}

function createEmptyState({ icon, title, message, actionLabel, onAction }) {
  const wrap = el('div', 'empty');

  const iconEl = el('div', 'empty-icon');
  iconEl.append(createIcon(icon));

  const heading = document.createElement('h2');
  heading.textContent = title;

  const text = document.createElement('p');
  text.textContent = message;

  wrap.append(iconEl, heading, text);

  if (actionLabel && onAction) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = actionLabel;
    button.addEventListener('click', onAction);
    wrap.append(button);
  }

  return wrap;
}

function renderUnsupported() {
  els.summary.textContent = 'Preview mode';
  els.overview.replaceChildren(createEmptyState({
    icon: ICONS.grid,
    title: 'This page is not running as an extension',
    message: 'Load this folder as an unpacked extension in Chrome or Brave, then open a new tab.',
  }));
}

function renderError(error, title) {
  els.summary.textContent = 'Something went wrong';
  els.overview.replaceChildren(createEmptyState({
    icon: ICONS.alert,
    title,
    message: error?.message || 'Chrome blocked access to the tabs API.',
    actionLabel: 'Try again',
    onAction: () => {
      state.loading = true;
      render();
      refresh();
    },
  }));
}

/* ----------------------------------------------------------------- actions */

async function activateTab(tab) {
  try {
    await chrome.tabs.update(tab.id, { active: true });
    await chrome.windows.update(tab.windowId, { focused: true });
  } catch (error) {
    console.warn('Tab Overview: could not switch to tab', error);
    scheduleRefresh('open');
  }
}

async function closeTab(tab) {
  try {
    await chrome.tabs.remove(tab.id);
  } catch (error) {
    console.warn('Tab Overview: could not close tab', error);
    scheduleRefresh('open');
  }
}

function toggleGroup(ctx, groupId) {
  if (ctx.collapsed.has(groupId)) {
    ctx.collapsed.delete(groupId);
  } else {
    ctx.collapsed.add(groupId);
  }
  saveSet(ctx.collapsedKey, ctx.collapsed);
  render();
}

/* --------------------------------------------------------------- utilities */

function isSelfTab(tab) {
  const url = tab.url || tab.pendingUrl || '';
  if (!url) return false;
  return url === SELF_URL ||
    url.startsWith(EXTENSION_ORIGIN) ||
    /^(?:chrome|brave|edge|opera|vivaldi):\/\/new-?tab/.test(url);
}

function loadSet(key, normalize) {
  try {
    const raw = localStorage.getItem(key);
    const ids = raw ? JSON.parse(raw) : [];
    return new Set(
      Array.isArray(ids) ? ids.map(normalize).filter((id) => id !== null) : [],
    );
  } catch {
    return new Set();
  }
}

function saveSet(key, set) {
  saveValue(key, JSON.stringify([...set]));
}

function toNumberId(value) {
  const id = Number(value);
  return Number.isFinite(id) ? id : null;
}

function toStringId(value) {
  return typeof value === 'string' ? value : null;
}

function loadChoice(key, allowed, fallback) {
  try {
    const value = localStorage.getItem(key);
    return allowed.has(value) ? value : fallback;
  } catch {
    return fallback;
  }
}

function saveValue(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Storage can be unavailable in private or restricted contexts.
  }
}

function countGroups(windows) {
  return windows.reduce((sum, win) => sum + win.groups.length, 0);
}

function countVisible({ groups, ungrouped }) {
  return groups.reduce((sum, group) => sum + group.tabs.length, 0) + ungrouped.length;
}

function plural(count, word, pluralWord = `${word}s`) {
  return `${count} ${count === 1 ? word : pluralWord}`;
}

function formatAge(openedAt) {
  const seconds = Math.max(0, Math.floor((Date.now() - openedAt) / 1000));
  if (seconds < 60) return 'just now';

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;

  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;

  return `${Math.floor(months / 12)}y ago`;
}

function updateAges() {
  if (document.visibilityState !== 'visible') return;

  for (const node of document.querySelectorAll('.tab-age[data-since]')) {
    const since = Number(node.dataset.since);
    if (Number.isFinite(since)) node.textContent = (node.dataset.prefix || '') + formatAge(since);
  }
}

function matchSummary(matched, total, noun) {
  return `${matched} of ${plural(total, noun)} ${matched === 1 ? 'matches' : 'match'}`;
}

function displayUrl(url) {
  if (!url) return '';
  try {
    const parsed = new URL(url);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      const path = parsed.pathname === '/' ? '' : parsed.pathname.replace(/\/$/, '');
      return `${parsed.host.replace(/^www\./, '')}${path}`;
    }
    if (parsed.protocol === 'file:') {
      return parsed.pathname.split('/').filter(Boolean).pop() || 'file';
    }
    if (parsed.protocol === 'chrome:' || parsed.protocol === 'chrome-extension:' || parsed.protocol === 'moz-extension:' || parsed.protocol === 'about:') {
      return url.replace(/\/$/, '');
    }
    return parsed.hostname || url;
  } catch {
    return url;
  }
}

function hostnameOf(url) {
  if (!url) return '';
  try {
    const parsed = new URL(url);
    if (parsed.hostname) return parsed.hostname.replace(/^www\./, '');
    if (parsed.protocol === 'file:') {
      return parsed.pathname.split('/').filter(Boolean).pop() || 'file';
    }
    return parsed.protocol.replace(':', '');
  } catch {
    return '';
  }
}

function hashString(value) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) | 0;
  }
  return Math.abs(hash);
}

function el(tag, className) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  return node;
}

function createIcon(markup) {
  let template = iconTemplates.get(markup);
  if (!template) {
    // text/html, not image/svg+xml: the HTML parser namespaces <svg> without an xmlns attribute.
    template = new DOMParser().parseFromString(markup, 'text/html').body.firstElementChild;
    iconTemplates.set(markup, template);
  }
  return template.cloneNode(true);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init, { once: true });
} else {
  init();
}
