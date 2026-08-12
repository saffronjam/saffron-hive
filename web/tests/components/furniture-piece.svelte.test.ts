import { describe, expect, it, afterEach } from "vitest";
import { flushSync, mount, unmount } from "svelte";
import FurniturePiece from "$lib/components/floorplan/furniture-piece.svelte";
import type { FloorplanFurnitureData } from "$lib/floorplan-editable";

let instance: ReturnType<typeof mount> | null = null;
let host: SVGSVGElement | null = null;

afterEach(() => {
  if (instance) unmount(instance);
  host?.remove();
  instance = null;
  host = null;
});

function piece(over: Partial<FloorplanFurnitureData> = {}): FloorplanFurnitureData {
  return {
    id: "f1",
    kind: "bed-double",
    x: 3,
    y: 4,
    width: 1.8,
    height: 2,
    rotation: 90,
    occluder: false,
    ...over,
  };
}

function render(props: { piece: FloorplanFurnitureData; live?: boolean; selected?: boolean }) {
  host = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  document.body.appendChild(host);
  instance = mount(FurniturePiece, { target: host, props });
  flushSync();
  return host;
}

describe("FurniturePiece", () => {
  it("places and turns the piece in world meters", () => {
    const svg = render({ piece: piece() });
    const g = svg.querySelector("g")!;
    expect(g.getAttribute("transform")).toBe("translate(3 4) rotate(90)");
  });

  it("marks an occluder more solid than a piece light passes through", () => {
    const open = render({ piece: piece() }).querySelector("rect")!.getAttribute("fill-opacity");
    host?.remove();
    if (instance) unmount(instance);
    const blocking = render({ piece: piece({ occluder: true }) })
      .querySelector("rect")!
      .getAttribute("fill-opacity");
    expect(Number(blocking)).toBeGreaterThan(Number(open));
  });

  it("takes the pointer in edit mode and never in live mode", () => {
    // A piece that stayed hittable in live mode would swallow the drag that
    // pans the map.
    expect(render({ piece: piece() }).querySelector("g")!.getAttribute("data-plan-hit")).toBe(
      "furniture",
    );
    host?.remove();
    if (instance) unmount(instance);
    const live = render({ piece: piece(), live: true }).querySelector("g")!;
    expect(live.getAttribute("data-plan-hit")).toBeNull();
    expect(live.getAttribute("class")).toContain("pointer-events-none");
  });
});
