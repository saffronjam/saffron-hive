export const SESSION_CACHE_KEY_PREFIX = "hive:session-cache:";

interface SessionSnapshot<T> {
  v: number;
  value: T;
}

export function sessionSnapshotKey(name: string): string {
  return SESSION_CACHE_KEY_PREFIX + name;
}

export function sessionSnapshotByteLength<T>(version: number, value: T): number {
  const serialized = JSON.stringify({ v: version, value } satisfies SessionSnapshot<T>);
  return new TextEncoder().encode(serialized).byteLength;
}

export function boundSessionSnapshotList<T>(
  version: number,
  items: readonly T[],
  maxItems: number,
  maxBytes: number,
): T[] {
  const capped = items.slice(0, maxItems);
  if (sessionSnapshotByteLength(version, capped) <= maxBytes) return capped;

  let low = 0;
  let high = capped.length;
  while (low < high) {
    const middle = Math.ceil((low + high) / 2);
    if (sessionSnapshotByteLength(version, capped.slice(0, middle)) <= maxBytes) {
      low = middle;
    } else {
      high = middle - 1;
    }
  }
  return capped.slice(0, low);
}

export function loadSessionSnapshot<T>(
  storage: Storage | null | undefined,
  name: string,
  version: number,
): T | null {
  if (!storage) return null;
  try {
    const raw = storage.getItem(sessionSnapshotKey(name));
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
    const snapshot = parsed as Partial<SessionSnapshot<T>>;
    if (snapshot.v !== version || !("value" in snapshot)) return null;
    return snapshot.value as T;
  } catch {
    return null;
  }
}

export function saveSessionSnapshot<T>(
  storage: Storage | null | undefined,
  name: string,
  version: number,
  value: T,
  maxBytes?: number,
): boolean {
  if (!storage) return false;
  try {
    const serialized = JSON.stringify({ v: version, value } satisfies SessionSnapshot<T>);
    if (maxBytes !== undefined && new TextEncoder().encode(serialized).byteLength > maxBytes) {
      return false;
    }
    storage.setItem(sessionSnapshotKey(name), serialized);
    return true;
  } catch {
    return false;
  }
}

export function clearSessionSnapshot(storage: Storage | null | undefined, name: string): void {
  if (!storage) return;
  try {
    storage.removeItem(sessionSnapshotKey(name));
  } catch {
    // Storage access is optional for tab snapshots.
  }
}

export function clearAllSessionSnapshots(storage: Storage | null | undefined): void {
  if (!storage) return;
  try {
    const keys: string[] = [];
    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i);
      if (key?.startsWith(SESSION_CACHE_KEY_PREFIX)) keys.push(key);
    }
    for (const key of keys) storage.removeItem(key);
  } catch {
    // Storage access is optional for tab snapshots.
  }
}
