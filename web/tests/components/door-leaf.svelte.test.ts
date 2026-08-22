import { afterEach, describe, expect, it } from "vitest";
import { flushSync, mount, unmount } from "svelte";
import DoorLeaf from "$lib/components/floorplan/door-leaf.svelte";
import type { DoorBindingGeometry } from "$lib/floorplan";

let instance: ReturnType<typeof mount> | null = null;
let host: SVGSVGElement | null = null;

afterEach(() => {
  if (instance) unmount(instance);
  host?.remove();
  instance = null;
  host = null;
});

const geometry: DoorBindingGeometry = {
  center: { x: 2, y: 0 },
  start: { x: 1.5, y: 0 },
  end: { x: 2.5, y: 0 },
  hinge: { x: 1.5, y: 0 },
  latch: { x: 2.5, y: 0 },
  length: 1,
  closedAngle: 0,
  openAngle: Math.PI / 2,
};

function render(props: { open: boolean; showArc?: boolean; active?: boolean; muted?: boolean }) {
  host = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  document.body.appendChild(host);
  instance = mount(DoorLeaf, { target: host, props: { geometry, ...props } });
  flushSync();
  return host;
}

describe("DoorLeaf", () => {
  it("rotates from the closed span to the configured open side", () => {
    const closed = render({ open: false }).querySelector<SVGGElement>(".door-motion")!;
    expect(closed.getAttribute("style")).toContain("rotate(0rad)");

    if (instance) unmount(instance);
    host?.remove();
    instance = null;
    const open = render({ open: true }).querySelector<SVGGElement>(".door-motion")!;
    expect(open.getAttribute("style")).toContain(`rotate(${Math.PI / 2}rad)`);
  });

  it("shows the swing arc only when requested and mutes unknown posture", () => {
    const svg = render({ open: false, showArc: true, muted: true });
    expect(svg.querySelector("path")).not.toBeNull();
    expect(svg.querySelector("[data-door-leaf]")?.getAttribute("class")).toContain("opacity-50");
  });
});
