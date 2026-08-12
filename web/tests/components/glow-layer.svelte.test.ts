import { describe, expect, it, afterEach } from "vitest";
import { flushSync, mount, unmount } from "svelte";
import GlowLayer, { blendBytes, needsSnap } from "$lib/components/floorplan/glow-layer.svelte";
import type { GlowGroup, LightmapFrame } from "$lib/components/floorplan/glow-layer.svelte";

let instance: ReturnType<typeof mount> | null = null;
let host: SVGSVGElement | null = null;

afterEach(() => {
  if (instance) unmount(instance);
  host?.remove();
  instance = null;
  host = null;
});

function render(groups: GlowGroup[], lightmap: LightmapFrame | null = null) {
  const props = $state({ groups, outside: [], lightmap });
  host = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  document.body.appendChild(host);
  instance = mount(GlowLayer, { target: host, props });
  flushSync();
  return { svg: host, props };
}

/** Matches the component's cell-to-display scale. */
const SCALE = 6;

const square = [
  { x: 0, y: 0 },
  { x: 2, y: 0 },
  { x: 2, y: 2 },
  { x: 0, y: 2 },
];

function group(overrides: Partial<GlowGroup> = {}): GlowGroup {
  return { key: "face-0", polygon: square, ...overrides };
}

function frame(overrides: Partial<LightmapFrame> = {}): LightmapFrame {
  const shape = { cols: 2, rows: 3, ...overrides };
  return {
    rgba: new Uint8ClampedArray(4 * shape.cols * shape.rows),
    x: -0.45,
    y: -0.45,
    width: 2.9,
    height: 2.9,
    ...shape,
  };
}

describe("GlowLayer", () => {
  it("places the light-map image in world meters", () => {
    const { svg } = render([group()], frame());
    const image = svg.querySelector("image") as SVGImageElement | null;
    expect(image).not.toBeNull();
    expect(image!.getAttribute("x")).toBe("-0.45");
    expect(image!.getAttribute("width")).toBe("2.9");
    expect(image!.getAttribute("preserveAspectRatio")).toBe("none");
    expect(image!.style.mixBlendMode).toBe("plus-lighter");
  });

  it("draws no light map without a frame", () => {
    const { svg } = render([group()]);
    expect(svg.querySelector("image")).toBeNull();
  });

  it("darkens no room by itself", () => {
    // How dark a room reads is the light map's business, cell by cell. A
    // per-room overlay would step at every shared wall, however much light
    // actually crosses it.
    const { svg } = render([group()], frame());
    expect(svg.querySelector("polygon")).toBeNull();
  });

  it("snaps rather than fades when the grid grows downward", () => {
    // A room dragged toward the bottom grows the grid's rows while cols and
    // origin stay put; fading across that would stretch the old frame.
    const canvas = { width: 2 * SCALE, height: 3 * SCALE };
    expect(needsSnap(frame({ cols: 2, rows: 3 }), frame({ cols: 2, rows: 5, height: 3.9 }), canvas, SCALE)).toBe(true);
  });

  it("snaps when the grid moves without changing shape", () => {
    const shown = frame();
    const canvas = { width: shown.cols * SCALE, height: shown.rows * SCALE };
    expect(needsSnap(shown, frame({ x: 4 }), canvas, SCALE)).toBe(true);
  });

  it("fades between frames of identical geometry", () => {
    const shown = frame();
    const canvas = { width: shown.cols * SCALE, height: shown.rows * SCALE };
    expect(needsSnap(shown, frame(), canvas, SCALE)).toBe(false);
  });

  it("swaps frames without throwing", () => {
    const { props } = render([group()], frame());
    props.lightmap = frame();
    flushSync();
    props.lightmap = frame({ cols: 4, rows: 4 });
    flushSync();
    props.lightmap = null;
    flushSync();
  });

  it("holds an untouched pixel steady through a fade", () => {
    // The dim field sits a level or two above black, where rounding each
    // frame separately would swing a pixel by a whole level mid-fade.
    const from = new Uint8ClampedArray([3, 200, 11, 255]);
    const to = new Uint8ClampedArray([3, 0, 11, 255]);
    const out = new Uint8ClampedArray(4);
    for (let step = 0; step <= 20; step++) {
      blendBytes(from, to, step / 20, out);
      expect(out[0], `untouched dim pixel at t=${step / 20}`).toBe(3);
      expect(out[2], `untouched mid pixel at t=${step / 20}`).toBe(11);
    }
  });

  it("moves a changed pixel across the fade", () => {
    const from = new Uint8ClampedArray([0]);
    const to = new Uint8ClampedArray([200]);
    const out = new Uint8ClampedArray(1);
    blendBytes(from, to, 0, out);
    expect(out[0]).toBe(0);
    blendBytes(from, to, 0.5, out);
    expect(out[0]).toBe(100);
    blendBytes(from, to, 1, out);
    expect(out[0]).toBe(200);
  });

});
