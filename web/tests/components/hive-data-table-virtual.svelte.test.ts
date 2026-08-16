import { describe, expect, it, afterEach } from "vitest";
import { flushSync, mount, unmount } from "svelte";
import HiveDataTable from "$lib/components/hive-data-table.svelte";
import { createTableState, type ColumnDef } from "$lib/utils/table-state.svelte";

// jsdom ships no ResizeObserver; the component only uses it to remeasure the
// table's page offset, which never changes here.
class StubResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
(globalThis as { ResizeObserver?: unknown }).ResizeObserver ??= StubResizeObserver;

interface Row {
  id: string;
  name: string;
}

let instance: ReturnType<typeof mount> | null = null;
let host: HTMLDivElement | null = null;

afterEach(() => {
  if (instance) unmount(instance);
  host?.remove();
  instance = null;
  host = null;
  localStorage.clear();
});

function renderTable(count: number) {
  const rows: Row[] = Array.from({ length: count }, (_, i) => ({
    id: `r${i}`,
    name: `Row ${i}`,
  }));
  const columns: ColumnDef<Row>[] = [{ key: "name", label: "Name" }];
  const tableState = createTableState({ storageKey: `test-${count}`, columns });

  host = document.createElement("div");
  document.body.appendChild(host);
  instance = mount(HiveDataTable, {
    target: host,
    // Generic component; mount() cannot carry the Row type parameter through.
    props: { tableState, columns, rows, rowId: (r: Row) => r.id } as never,
  });
  flushSync();
  return host;
}

function countRows(el: HTMLElement): number {
  return el.querySelectorAll("tr[data-virtual-row]").length;
}

describe("HiveDataTable windowing", () => {
  it("renders every row of a short list", () => {
    const el = renderTable(20);
    expect(countRows(el)).toBe(20);
  });

  // jsdom reports a 768px window; at the 48px estimate that is ~16 visible
  // rows + overscan. If all 200 render, the windowing is not engaging.
  it("renders only the visible window of a long list", () => {
    const el = renderTable(200);
    const rendered = countRows(el);
    expect(rendered).toBeGreaterThan(0);
    expect(rendered).toBeLessThan(60);
  });
});
