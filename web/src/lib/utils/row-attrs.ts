import type { TableSelection } from "$lib/utils/table-selection.svelte";

export function rowAttrsForSelection(selection: TableSelection, id: string) {
  return selection.isSelected(id) ? { "data-state": "selected" } : {};
}
