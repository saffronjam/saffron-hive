/**
 * Multi-row selection state for table views. Supports click-to-toggle,
 * Shift-click range extend, and a header tri-state select-all.
 *
 * Semantics match the spec:
 *   click 2 -> selected {2}, anchor=2
 *   shift+click 4 -> selected {2,3,4}, anchor=4
 *   shift+click 6 -> selected {2,3,4,5,6}, anchor=6
 *
 * Shift-click is additive: it only turns selections ON, never off. Plain click
 * toggles, so clicking an already-selected row deselects it. Disabled ids
 * (e.g. the current user's row) are silently ignored by every mutation.
 */
export interface TableSelection {
  readonly count: number;
  readonly anchorId: string | null;
  isSelected(id: string): boolean;
  isDisabled(id: string): boolean;
  setDisabled(ids: Iterable<string>): void;
  toggle(id: string): void;
  extendTo(id: string, orderedIds: readonly string[]): void;
  handleRowClick(
    id: string,
    event: MouseEvent | KeyboardEvent,
    orderedIds: readonly string[],
  ): void;
  setAll(orderedIds: readonly string[]): void;
  clear(): void;
  headerState(orderedIds: readonly string[]): "none" | "some" | "all";
  pruneTo(orderedIds: readonly string[]): void;
  selectedIds(): string[];
}

export function createTableSelection(): TableSelection {
  let ids = $state(new Set<string>());
  let anchorId = $state<string | null>(null);
  let disabledIds = $state(new Set<string>());

  function isSelected(id: string): boolean {
    return ids.has(id);
  }

  function isDisabled(id: string): boolean {
    return disabledIds.has(id);
  }

  function setDisabled(next: Iterable<string>): void {
    const nextSet = new Set(next);
    disabledIds = nextSet;
    if (ids.size === 0) return;
    const kept = new Set<string>();
    for (const id of ids) {
      if (!nextSet.has(id)) kept.add(id);
    }
    if (kept.size !== ids.size) ids = kept;
  }

  function toggle(id: string): void {
    if (disabledIds.has(id)) return;
    const next = new Set(ids);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    ids = next;
    anchorId = id;
  }

  function extendTo(id: string, orderedIds: readonly string[]): void {
    if (disabledIds.has(id)) return;
    if (anchorId === null) {
      toggle(id);
      return;
    }
    const fromIdx = orderedIds.indexOf(anchorId);
    const toIdx = orderedIds.indexOf(id);
    if (fromIdx === -1 || toIdx === -1) {
      toggle(id);
      return;
    }
    const [lo, hi] = fromIdx <= toIdx ? [fromIdx, toIdx] : [toIdx, fromIdx];
    const next = new Set(ids);
    for (let i = lo; i <= hi; i++) {
      const rowId = orderedIds[i];
      if (!disabledIds.has(rowId)) next.add(rowId);
    }
    ids = next;
    anchorId = id;
  }

  function handleRowClick(
    id: string,
    event: MouseEvent | KeyboardEvent,
    orderedIds: readonly string[],
  ): void {
    if (disabledIds.has(id)) return;
    const shift = "shiftKey" in event && event.shiftKey;
    if (shift && anchorId !== null) {
      if (typeof event.preventDefault === "function") event.preventDefault();
      extendTo(id, orderedIds);
      return;
    }
    toggle(id);
  }

  function setAll(orderedIds: readonly string[]): void {
    const next = new Set<string>();
    for (const id of orderedIds) {
      if (!disabledIds.has(id)) next.add(id);
    }
    ids = next;
  }

  function clear(): void {
    if (ids.size > 0) ids = new Set();
    anchorId = null;
  }

  function headerState(orderedIds: readonly string[]): "none" | "some" | "all" {
    let enabled = 0;
    let selected = 0;
    for (const id of orderedIds) {
      if (disabledIds.has(id)) continue;
      enabled++;
      if (ids.has(id)) selected++;
    }
    if (selected === 0) return "none";
    if (selected === enabled) return "all";
    return "some";
  }

  function pruneTo(orderedIds: readonly string[]): void {
    if (ids.size === 0) return;
    const visible = new Set(orderedIds);
    const next = new Set<string>();
    for (const id of ids) {
      if (visible.has(id)) next.add(id);
    }
    if (next.size !== ids.size) ids = next;
    if (anchorId !== null && !visible.has(anchorId)) anchorId = null;
  }

  function selectedIds(): string[] {
    return Array.from(ids);
  }

  return {
    get count() {
      return ids.size;
    },
    get anchorId() {
      return anchorId;
    },
    isSelected,
    isDisabled,
    setDisabled,
    toggle,
    extendTo,
    handleRowClick,
    setAll,
    clear,
    headerState,
    pruneTo,
    selectedIds,
  };
}
