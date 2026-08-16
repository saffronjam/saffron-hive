/**
 * Disk snapshots for the shared entity stores.
 *
 * Pure read/write helpers over a `Storage`, kept separate from the stores so
 * they can be unit-tested directly. Reads are synchronous by design: a store
 * hydrates at module evaluation so the first painted frame already carries real
 * data, which an async store (IndexedDB) could not deliver.
 */

export const CACHE_KEY_PREFIX = "hive:cache:";

interface Snapshot<T> {
  v: number;
  items: T[];
}

/** Storage key for a named entity snapshot. */
export function cacheKey(name: string): string {
  return CACHE_KEY_PREFIX + name;
}

/**
 * Read a stored snapshot. Returns `null` when there is nothing usable —
 * no storage, no entry, malformed JSON, wrong shape, or a `version` that does
 * not match the caller's. Null is distinct from an empty array: an empty array
 * is a cached "this list really is empty" and counts as hydrated.
 *
 * Bumping `version` at the call site is how a changed selection set discards
 * snapshots written against the old shape.
 */
export function loadSnapshot<T>(
  storage: Storage | null | undefined,
  name: string,
  version: number,
): T[] | null {
  if (!storage) return null;
  let raw: string | null;
  try {
    raw = storage.getItem(cacheKey(name));
  } catch {
    return null;
  }
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
    const snapshot = parsed as Partial<Snapshot<T>>;
    if (snapshot.v !== version) return null;
    if (!Array.isArray(snapshot.items)) return null;
    return snapshot.items;
  } catch {
    return null;
  }
}

/**
 * Write a snapshot. Silent on failure — a full quota or a locked-down storage
 * must degrade to "no disk cache", never throw into a store mutation.
 */
export function saveSnapshot<T>(
  storage: Storage | null | undefined,
  name: string,
  version: number,
  items: T[],
): void {
  if (!storage) return;
  const snapshot: Snapshot<T> = { v: version, items };
  try {
    storage.setItem(cacheKey(name), JSON.stringify(snapshot));
  } catch {
    // quota exceeded, private mode, etc. — intentionally silent.
  }
}

/** Drop a single entity snapshot. */
export function clearSnapshot(storage: Storage | null | undefined, name: string): void {
  if (!storage) return;
  try {
    storage.removeItem(cacheKey(name));
  } catch {
    // storage unavailable — nothing to clear.
  }
}

/**
 * Drop every entity snapshot. Called on logout so one session's data cannot
 * be read by the next.
 */
export function clearAllSnapshots(storage: Storage | null | undefined): void {
  if (!storage) return;
  try {
    const keys: string[] = [];
    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i);
      if (key?.startsWith(CACHE_KEY_PREFIX)) keys.push(key);
    }
    for (const key of keys) storage.removeItem(key);
  } catch {
    // storage unavailable — nothing to clear.
  }
}
