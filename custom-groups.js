'use strict';

// Custom groups are user-defined Sorted view categories, stored in order as
// one storage.local array:
//
// CustomGroup { id, label, color, domains: [string], keywords: [string] }
//   domains   'example.com' (host and its subdomains) or
//             'github.com/blockanalitica' (host plus a path prefix)
//   keywords  lowercase words or phrases matched as whole words

export const GROUPS_KEY = 'customGroups';
export const GROUP_COLORS = new Set([
  'grey', 'blue', 'red', 'yellow', 'green', 'pink', 'purple', 'cyan', 'orange',
]);
const NEW_GROUP_COLORS = ['blue', 'green', 'purple', 'orange', 'pink', 'cyan', 'red', 'yellow', 'grey'];
const MAX_ID_LENGTH = 200;
const MAX_LABEL_LENGTH = 80;

/* ------------------------------------------------------------- validation */

export function normalizeDomain(value) {
  if (typeof value !== 'string') return null;
  const text = value.trim().toLowerCase()
    .replace(/^[a-z][a-z0-9+.-]*:\/\//, '')
    .replace(/^\*\./, '');
  if (!text || /\s/.test(text)) return null;
  let parsed;
  try {
    parsed = new URL(`https://${text}`);
  } catch {
    return null;
  }
  const host = parsed.hostname.replace(/^www\./, '').replace(/\.$/, '');
  if (!host || host.startsWith('.')) return null;
  // Lowercased after parsing, so percent-escapes match the lowercased tab path.
  const path = parsed.pathname.toLowerCase().replace(/\/+$/, '');
  return host + path;
}

function normalizeKeyword(value) {
  if (typeof value !== 'string') return null;
  const text = value.trim().toLowerCase().replace(/\s+/g, ' ');
  return text || null;
}

const unique = (values, normalize) => [...new Set((Array.isArray(values) ? values : []).map(normalize).filter(Boolean))];
const normalizeDomains = (values) => unique(values, normalizeDomain);
const normalizeKeywords = (values) => unique(values, normalizeKeyword);

const isObject = (value) => typeof value === 'object' && value !== null && !Array.isArray(value);
const validId = (value) => typeof value === 'string' && value.length > 0 && value.length <= MAX_ID_LENGTH;

function normalizeLabel(value) {
  const text = typeof value === 'string' ? value.trim().replace(/\s+/g, ' ').slice(0, MAX_LABEL_LENGTH) : '';
  return text || 'Untitled group';
}

// The one gate for stored groups and imported ones. A group without a usable
// id, or with an id already seen, is dropped.
function normalizeGroups(raw) {
  const seen = new Set();
  const groups = [];
  for (const group of Array.isArray(raw) ? raw : []) {
    if (!isObject(group) || !validId(group.id) || seen.has(group.id)) continue;
    seen.add(group.id);
    groups.push({
      id: group.id,
      label: normalizeLabel(group.label),
      color: GROUP_COLORS.has(group.color) ? group.color : 'grey',
      domains: normalizeDomains(group.domains),
      keywords: normalizeKeywords(group.keywords),
    });
  }
  return groups;
}

/* ---------------------------------------------------------------- storage */

export async function loadGroups() {
  const stored = await chrome.storage.local.get(GROUPS_KEY);
  return normalizeGroups(stored[GROUPS_KEY]);
}

// Every overview page writes the same array, so a Web Lock serializes the
// read-modify-write across pages.
function updateGroups(change) {
  const task = async () => {
    const groups = await loadGroups();
    const next = normalizeGroups(change(groups));
    await chrome.storage.local.set({ [GROUPS_KEY]: next });
    return next;
  };
  return globalThis.navigator?.locks ? navigator.locks.request(GROUPS_KEY, task) : task();
}

const withoutDomain = (group, domain) => ({ ...group, domains: group.domains.filter((entry) => entry !== domain) });

/** Appends a group, taking its domains out of any other group. */
export function createGroup({ label, domains = [], keywords = [] }) {
  const id = crypto.randomUUID();
  const domainSet = new Set(normalizeDomains(domains));
  return updateGroups((groups) => {
    const used = new Set(groups.map((group) => group.color));
    const color = NEW_GROUP_COLORS.find((name) => !used.has(name)) ??
      NEW_GROUP_COLORS[groups.length % NEW_GROUP_COLORS.length];
    return [
      ...groups.map((group) => ({ ...group, domains: group.domains.filter((entry) => !domainSet.has(entry)) })),
      { id, label, color, domains: [...domainSet], keywords },
    ];
  });
}

/** Applies a patch to one group. Domains it gains leave every other group. */
export function editGroup(id, patch) {
  const claimed = new Set(patch.domains ? normalizeDomains(patch.domains) : []);
  return updateGroups((groups) => groups.map((group) => {
    if (group.id === id) return { ...group, ...patch, id };
    return claimed.size === 0 ? group : { ...group, domains: group.domains.filter((entry) => !claimed.has(entry)) };
  }));
}

export function deleteGroup(id) {
  return updateGroups((groups) => groups.filter((group) => group.id !== id));
}

export function moveGroup(id, offset) {
  return updateGroups((groups) => {
    const from = groups.findIndex((group) => group.id === id);
    const to = from + offset;
    if (from === -1 || to < 0 || to >= groups.length) return groups;
    const next = groups.slice();
    [next[from], next[to]] = [next[to], next[from]];
    return next;
  });
}

/** Puts a domain in one group, taking it out of any other group first. */
export function assignDomain(domain, groupId) {
  return updateGroups((groups) => groups.map((group) => {
    const rest = withoutDomain(group, domain);
    return group.id === groupId ? { ...rest, domains: [...rest.domains, domain] } : rest;
  }));
}

export function unassignDomain(domain, groupId) {
  return updateGroups((groups) => groups.map((group) => (group.id === groupId ? withoutDomain(group, domain) : group)));
}

/**
 * Appends imported groups whose id is not taken yet; groups already present
 * are kept as they are.
 */
export async function mergeGroups(raw) {
  const incoming = normalizeGroups(raw);
  const invalid = (Array.isArray(raw) ? raw.length : 0) - incoming.length;
  let added = 0;
  if (incoming.length === 0) return { added, skipped: 0, invalid };
  await updateGroups((groups) => {
    const taken = new Set(groups.map((group) => group.id));
    const fresh = incoming.filter((group) => !taken.has(group.id));
    added = fresh.length;
    return [...groups, ...fresh];
  });
  return { added, skipped: incoming.length - added, invalid };
}
