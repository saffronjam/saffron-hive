import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mount, unmount } from "svelte";
import HiveChip from "$lib/components/hive-chip.svelte";

let component: ReturnType<typeof mount> | null = null;
let host: HTMLDivElement;

beforeEach(() => {
  host = document.createElement("div");
  document.body.appendChild(host);
});

afterEach(() => {
  if (component) void unmount(component);
  component = null;
  host.remove();
});

describe("HiveChip maintenance kinds", () => {
  const cases = [
    {
      type: "sensor",
      label: "Sensor",
      colorClass: "text-cyan-700",
      iconClass: "lucide-gauge",
    },
    {
      type: "battery",
      label: "Battery",
      colorClass: "text-green-700",
      iconClass: "lucide-battery",
    },
    {
      type: "firmware",
      label: "Firmware",
      colorClass: "text-amber-700",
      iconClass: "lucide-refresh-cw",
    },
    {
      type: "posture",
      label: "Posture",
      colorClass: "text-purple-700",
      iconClass: "lucide-move-3d",
    },
    {
      type: "storage",
      label: "Storage",
      colorClass: "text-slate-700",
      iconClass: "lucide-hard-drive",
    },
    {
      type: "color",
      label: "Color",
      colorClass: "text-purple-700",
      iconClass: "lucide-palette",
    },
  ];

  for (const testCase of cases) {
    it(`renders an icon and dedicated treatment for ${testCase.type}`, () => {
      component = mount(HiveChip, {
        target: host,
        props: { type: testCase.type },
      });

      expect(host.textContent).toContain(testCase.label);
      expect(host.querySelector("svg")?.classList).toContain(testCase.iconClass);
      expect(host.firstElementChild?.classList).toContain(testCase.colorClass);
    });
  }
});
