import { describe, expect, it } from "vitest";
import { flushSync, mount, unmount, type Component } from "svelte";
import DeviceQuickControls from "$lib/components/device-quick-controls.svelte";
import IconCell from "$lib/components/table-cells/icon-cell.svelte";
import RowActionsCell from "$lib/components/table-cells/row-actions-cell.svelte";
import InlineEditName from "$lib/components/inline-edit-name.svelte";
import HiveChip from "$lib/components/hive-chip.svelte";
import TableRowCheckbox from "$lib/components/table-row-checkbox.svelte";
import { createTableSelection } from "$lib/utils/table-selection.svelte";
import { Lightbulb } from "@lucide/svelte";
import { Switch } from "$lib/components/ui/switch/index.js";
import type { Device } from "$lib/stores/devices";

class StubResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
(globalThis as { ResizeObserver?: unknown }).ResizeObserver ??= StubResizeObserver;

// The stub only needs to exist; nothing subscribes during a dormant mount.
const stubClient = {
  query: () => ({ toPromise: () => Promise.resolve({}) }),
  mutation: () => ({ toPromise: () => Promise.resolve({}) }),
  subscription: () => ({ subscribe: () => ({ unsubscribe: () => {} }) }),
};
const urqlContext = new Map([["$$_urql", stubClient]]);

function makeDevice(i: number): Device {
  return {
    id: `d${i}`,
    name: `Device ${i}`,
    icon: null,
    displayColor: null,
    displayBrightness: null,
    source: "zigbee2mqtt",
    type: "light",
    tags: [],
    capabilities: [
      {
        name: "on_off",
        type: "binary",
        values: null,
        valueMin: null,
        valueMax: null,
        unit: null,
        access: 7,
      },
      {
        name: "brightness",
        type: "numeric",
        values: null,
        valueMin: 0,
        valueMax: 254,
        unit: null,
        access: 7,
      },
      {
        name: "color_temp",
        type: "numeric",
        values: null,
        valueMin: 150,
        valueMax: 500,
        unit: "mired",
        access: 7,
      },
    ],
    available: true,
    disabled: false,
    friendlyName: `Device ${i}`,
    seen: true,
    lastSeen: "2026-01-01T00:00:00Z",
    state: { on: true, brightness: 200 },
  } as unknown as Device;
}

const N = 41;

function measure(
  name: string,
  makeProps: (i: number) => Record<string, unknown>,
  component: Component,
): number {
  const host = document.createElement("div");
  document.body.appendChild(host);
  const instances: ReturnType<typeof mount>[] = [];
  const start = performance.now();
  for (let i = 0; i < N; i++) {
    instances.push(
      mount(component, { target: host, props: makeProps(i) as never, context: urqlContext }),
    );
  }
  flushSync();
  const elapsed = performance.now() - start;
  for (const inst of instances) unmount(inst);
  host.remove();
  console.log(`  ${name}: ${elapsed.toFixed(1)}ms for ${N} (${(elapsed / N).toFixed(2)}ms each)`);
  return elapsed;
}

describe("device row component cost attribution (41 instances each)", () => {
  it("attributes mount cost per component", () => {
    // Warm-up pass so module evaluation and JIT warmup don't land on the first row.
    measure(
      "warmup DeviceQuickControls",
      (i) => ({ device: makeDevice(i), variant: "swatch" }),
      DeviceQuickControls as Component,
    );

    const selection = createTableSelection();
    const results: Record<string, number> = {};
    results.quickControls = measure(
      "DeviceQuickControls",
      (i) => ({ device: makeDevice(i), variant: "swatch" }),
      DeviceQuickControls as Component,
    );
    results.iconCell = measure(
      "IconCell",
      () => ({ value: null, onselect: () => {}, fallback: Lightbulb }),
      IconCell as Component,
    );
    results.rowActions = measure(
      "RowActionsCell",
      (i) => ({ editHref: `/devices/d${i}`, editLabel: "Edit" }),
      RowActionsCell as Component,
    );
    results.inlineEdit = measure(
      "InlineEditName",
      (i) => ({ value: `Device ${i}`, onrename: () => {} }),
      InlineEditName as Component,
    );
    results.chip = measure(
      "HiveChip",
      () => ({ type: "light", label: "Light" }),
      HiveChip as Component,
    );
    results.checkbox = measure(
      "TableRowCheckbox",
      (i) => ({ selection, id: `d${i}` }),
      TableRowCheckbox as Component,
    );
    results.lucide = measure("Lucide icon", () => ({}), Lightbulb as unknown as Component);
    results.switch = measure("Switch (bits-ui)", () => ({ checked: true }), Switch as Component);

    console.log("  --- attribution done ---");
    expect(Object.values(results).every((v) => v >= 0)).toBe(true);
  });
});
