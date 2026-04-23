/**
 * Per-table view state: column order, column visibility, and current sort.
 *
 * Persists to localStorage under `hive:table:{storageKey}` and reconciles
 * stored state against the current ColumnDef set on construction so that
 * adding or removing columns in code doesn't strand the user on a bad layout.
 */

import type { Snippet } from "svelte";

export type SortDir = "asc" | "desc";

export interface ColumnDef<Row> {
  /** Stable identifier used for persistence and lookups. */
  key: string;
  /** Human label shown in headers and the column visibility menu. */
  label: string;
  /**
   * Provide to make the column sortable. Sort direction cycles
   * `asc` -> `desc` -> off on repeated clicks.
   */
  sortValue?: (row: Row) => string | number | boolean | null | undefined;
  /** Defaults to `true`. Set `false` for pinned columns (select / actions). */
  hideable?: boolean;
  /** Start hidden until the user opts in via the visibility menu. */
  defaultHidden?: boolean;
  /** Head content. When omitted, HiveDataTable renders {label} with sort affordance. */
  head?: Snippet;
  /** Body cell content. Required when rendered via HiveDataTable. */
  cell?: Snippet<[row: Row]>;
  /** Extra class applied to the head <th>. */
  headClass?: string;
  /** Extra class applied to each body <td>. */
  cellClass?: string;
  /**
   * Grid-template-columns fragment used by HiveNavigationTable
   * (e.g. `"1.5rem"`, `"minmax(12rem, 1.6fr)"`). Ignored by HiveDataTable.
   * Defaults to `"1fr"` when absent.
   */
  width?: string;
}

export interface TableState<Row> {
  readonly sort: { key: string; dir: SortDir } | null;
  readonly order: readonly string[];
  isVisible(key: string): boolean;
  isHidden(key: string): boolean;
  isHideable(key: string): boolean;
  isSortable(key: string): boolean;
  sortDir(key: string): SortDir | null;
  toggleSort(key: string): void;
  setSort(key: string | null, dir?: SortDir): void;
  toggleHidden(key: string): void;
  /**
   * Move `fromKey` so that it sits immediately before `beforeKey`, or to the end
   * of the order when `beforeKey` is null.
   */
  moveColumnBefore(fromKey: string, beforeKey: string | null): void;
  orderedKeys(): string[];
  visibleOrderedKeys(): string[];
  applySort(rows: Row[]): Row[];
  /** Restore order, visibility, and sort to the column defaults. */
  resetDefaults(): void;
}

interface Options<Row> {
  storageKey: string;
  columns: ColumnDef<Row>[];
}

interface Persisted {
  order: string[];
  hidden: string[];
  sort: { key: string; dir: SortDir } | null;
}

const STORAGE_PREFIX = "hive:table:";

export function createTableState<Row>({ storageKey, columns }: Options<Row>): TableState<Row> {
  const metaByKey = new Map(columns.map((c) => [c.key, c]));
  const defaultOrder = columns.map((c) => c.key);
  const defaultHidden = columns
    .filter((c) => c.defaultHidden && c.hideable !== false)
    .map((c) => c.key);

  const stored = loadPersisted(storageKey);

  let order = $state(reconcileOrder(stored?.order ?? defaultOrder, defaultOrder));
  let hidden = $state(reconcileHidden(stored?.hidden ?? defaultHidden, metaByKey));
  let sort = $state(reconcileSort(stored?.sort ?? null, metaByKey));

  function save() {
    savePersisted(storageKey, {
      order,
      hidden: Array.from(hidden),
      sort,
    });
  }

  function isVisible(key: string) {
    return metaByKey.has(key) && !hidden.has(key);
  }
  function isHidden(key: string) {
    return hidden.has(key);
  }
  function isHideable(key: string) {
    return metaByKey.get(key)?.hideable !== false;
  }
  function isSortable(key: string) {
    return typeof metaByKey.get(key)?.sortValue === "function";
  }
  function sortDir(key: string): SortDir | null {
    return sort?.key === key ? sort.dir : null;
  }

  function toggleSort(key: string) {
    if (!isSortable(key)) return;
    if (sort?.key !== key) sort = { key, dir: "asc" };
    else if (sort.dir === "asc") sort = { key, dir: "desc" };
    else sort = null;
    save();
  }

  function setSort(key: string | null, dir: SortDir = "asc") {
    if (key === null) {
      sort = null;
    } else {
      if (!isSortable(key)) return;
      sort = { key, dir };
    }
    save();
  }

  function toggleHidden(key: string) {
    if (!isHideable(key)) return;
    const next = new Set(hidden);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    hidden = next;
    save();
  }

  function moveColumnBefore(fromKey: string, beforeKey: string | null) {
    if (fromKey === beforeKey) return;
    const from = order.indexOf(fromKey);
    if (from === -1) return;
    let insertAt: number;
    if (beforeKey === null) {
      insertAt = order.length;
    } else {
      const idx = order.indexOf(beforeKey);
      if (idx === -1) return;
      insertAt = idx;
    }
    const next = order.slice();
    const [moved] = next.splice(from, 1);
    if (from < insertAt) insertAt -= 1;
    if (insertAt < 0 || insertAt > next.length) return;
    next.splice(insertAt, 0, moved);
    if (arrayEquals(next, order)) return;
    order = next;
    save();
  }

  function orderedKeys() {
    return order.slice();
  }

  function visibleOrderedKeys() {
    return order.filter((k) => !hidden.has(k));
  }

  function resetDefaults() {
    order = defaultOrder.slice();
    hidden = new Set(defaultHidden);
    sort = null;
    save();
  }

  function applySort(rows: Row[]): Row[] {
    if (!sort) return rows;
    const col = metaByKey.get(sort.key);
    const getVal = col?.sortValue;
    if (!getVal) return rows;
    const sign = sort.dir === "asc" ? 1 : -1;
    return rows.slice().sort((a, b) => compare(getVal(a), getVal(b)) * sign);
  }

  return {
    get sort() {
      return sort;
    },
    get order() {
      return order;
    },
    isVisible,
    isHidden,
    isHideable,
    isSortable,
    sortDir,
    toggleSort,
    setSort,
    toggleHidden,
    moveColumnBefore,
    orderedKeys,
    visibleOrderedKeys,
    applySort,
    resetDefaults,
  };
}

function arrayEquals(a: readonly string[], b: readonly string[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

function compare(
  a: string | number | boolean | null | undefined,
  b: string | number | boolean | null | undefined,
): number {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  if (typeof a === "number" && typeof b === "number") {
    return a < b ? -1 : a > b ? 1 : 0;
  }
  if (typeof a === "boolean" && typeof b === "boolean") {
    return a === b ? 0 : a ? -1 : 1;
  }
  return String(a).localeCompare(String(b), undefined, { sensitivity: "base" });
}

function reconcileOrder(stored: string[], defaultOrder: string[]): string[] {
  const valid = new Set(defaultOrder);
  const seen = new Set<string>();
  const result: string[] = [];
  for (const k of stored) {
    if (valid.has(k) && !seen.has(k)) {
      result.push(k);
      seen.add(k);
    }
  }
  for (const k of defaultOrder) {
    if (!seen.has(k)) result.push(k);
  }
  return result;
}

function reconcileHidden<Row>(stored: string[], meta: Map<string, ColumnDef<Row>>): Set<string> {
  const result = new Set<string>();
  for (const k of stored) {
    const c = meta.get(k);
    if (c && c.hideable !== false) result.add(k);
  }
  return result;
}

function reconcileSort<Row>(
  stored: { key: string; dir: SortDir } | null,
  meta: Map<string, ColumnDef<Row>>,
): { key: string; dir: SortDir } | null {
  if (!stored) return null;
  const c = meta.get(stored.key);
  if (!c || typeof c.sortValue !== "function") return null;
  if (stored.dir !== "asc" && stored.dir !== "desc") return null;
  return { key: stored.key, dir: stored.dir };
}

function loadPersisted(key: string): Persisted | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return null;
    const p = parsed as Record<string, unknown>;
    const order = Array.isArray(p.order)
      ? (p.order.filter((x) => typeof x === "string") as string[])
      : [];
    const hidden = Array.isArray(p.hidden)
      ? (p.hidden.filter((x) => typeof x === "string") as string[])
      : [];
    const sortRaw = p.sort as { key?: unknown; dir?: unknown } | null | undefined;
    let sort: { key: string; dir: SortDir } | null = null;
    if (
      sortRaw &&
      typeof sortRaw === "object" &&
      typeof sortRaw.key === "string" &&
      (sortRaw.dir === "asc" || sortRaw.dir === "desc")
    ) {
      sort = { key: sortRaw.key, dir: sortRaw.dir };
    }
    return { order, hidden, sort };
  } catch {
    return null;
  }
}

function savePersisted(key: string, value: Persisted) {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
  } catch {
    // quota exceeded, private mode, etc. — intentionally silent.
  }
}
