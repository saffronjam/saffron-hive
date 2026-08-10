import { describe, expect, it, afterEach, vi } from "vitest";
import { flushSync, mount, unmount } from "svelte";
import GlowLayer from "$lib/components/floorplan/glow-layer.svelte";
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

const square = [
  { x: 0, y: 0 },
  { x: 2, y: 0 },
  { x: 2, y: 2 },
  { x: 0, y: 2 },
];

function group(overrides: Partial<GlowGroup> = {}): GlowGroup {
  return { key: "face-0", polygon: square, dim: 0.35, ...overrides };
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

  it("darkens a room by exactly its dim amount", () => {
    const { svg } = render([group({ dim: 0.2 })]);
    const overlay = [...svg.querySelectorAll("polygon")].at(-1)!;
    expect(overlay.getAttribute("opacity")).toBe("0.2");
    expect(overlay.getAttribute("fill")).toBe("var(--background)");
  });

  it("keeps a fully lit room's overlay invisible", () => {
    const { svg } = render([group({ dim: 0 })]);
    const overlay = [...svg.querySelectorAll("polygon")].at(-1)!;
    expect(overlay.getAttribute("opacity")).toBe("0");
  });

  it("snaps instead of fading when the grid grows downward", () => {
    // A room dragged toward the bottom grows the grid's rows while cols and
    // origin stay put. Fading across that would stretch the old frame onto a
    // different-sized canvas — a snap draws once and schedules no animation.
    const raf = vi.fn(() => 1);
    vi.stubGlobal("requestAnimationFrame", raf);
    vi.stubGlobal("cancelAnimationFrame", vi.fn());
    try {
      const { props } = render([group()], frame({ cols: 2, rows: 3 }));
      props.lightmap = frame({ cols: 2, rows: 5, height: 3.9 });
      flushSync();
      expect(raf).not.toHaveBeenCalled();
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("crossfades between frames of identical geometry", () => {
    const raf = vi.fn(() => 1);
    vi.stubGlobal("requestAnimationFrame", raf);
    vi.stubGlobal("cancelAnimationFrame", vi.fn());
    try {
      const { props } = render([group()], frame());
      props.lightmap = frame();
      flushSync();
      expect(raf).toHaveBeenCalledOnce();
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
