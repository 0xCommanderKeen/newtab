'use strict';

const PREFIX = 'tabOpenedAt:';
let startupGraceUntil = 0;

/**
 * Give every tab that does not have a timestamp one, marked as approximate.
 * This covers tabs that were already open when the extension was installed,
 * reloaded, or when the browser started with a restored session.
 */
async function syncAllTabs({ forceApproximate = false } = {}) {
  const [tabs, stored] = await Promise.all([
    chrome.tabs.query({}),
    chrome.storage.session.get(null),
  ]);

  const now = Date.now();
  const updates = {};
  const liveIds = new Set();

  for (const tab of tabs) {
    if (typeof tab.id !== 'number') continue;
    liveIds.add(tab.id);
    const key = PREFIX + tab.id;
    if (forceApproximate || !stored[key]) {
      updates[key] = { openedAt: now, approximate: true };
    }
  }

  const staleKeys = Object.keys(stored).filter((key) => {
    if (!key.startsWith(PREFIX)) return false;
    const id = Number(key.slice(PREFIX.length));
    return !liveIds.has(id);
  });

  if (staleKeys.length > 0) {
    await chrome.storage.session.remove(staleKeys);
  }

  if (Object.keys(updates).length > 0) {
    await chrome.storage.session.set(updates);
  }
}

async function recordTab(tabId, approximate = false) {
  const key = PREFIX + tabId;
  const stored = await chrome.storage.session.get(key);
  if (stored[key] && stored[key].approximate === false) return;

  await chrome.storage.session.set({
    [key]: { openedAt: Date.now(), approximate },
  });
}

chrome.runtime.onInstalled.addListener(() => {
  syncAllTabs().catch(() => {});
});

chrome.runtime.onStartup.addListener(() => {
  // Tabs restored with the session appear shortly after startup. Marking
  // everything seen during this window as approximate avoids claiming they
  // were opened just now.
  startupGraceUntil = Date.now() + 10_000;
  syncAllTabs({ forceApproximate: true }).catch(() => {});
});

chrome.tabs.onCreated.addListener((tab) => {
  if (typeof tab.id === 'number') {
    recordTab(tab.id, Date.now() < startupGraceUntil).catch(() => {});
  }
});

chrome.tabs.onRemoved.addListener((tabId) => {
  chrome.storage.session.remove(PREFIX + tabId).catch(() => {});
});

chrome.tabs.onReplaced.addListener(async (addedTabId, removedTabId) => {
  try {
    await chrome.storage.session.remove(PREFIX + removedTabId);
    await recordTab(addedTabId);
  } catch {
    // A tab that disappears during replacement needs no timestamp.
  }
});

// The overview page asks for this once when it opens. It makes sure tabs that
// existed before the worker started still get a timestamp.
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type !== 'syncTabTimes') return false;

  syncAllTabs()
    .then(() => sendResponse({ ok: true }))
    .catch((error) => sendResponse({ ok: false, error: String(error) }));

  return true;
});
