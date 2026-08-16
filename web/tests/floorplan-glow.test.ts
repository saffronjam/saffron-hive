import { describe, expect, it } from "vitest";
import {
  markerGlow,
  GLOW_BASE_RADIUS_M,
  aggregateGlow,
  glowRadius,
  glowRgbForState,
  glowStops,
  groupGlowDeviceIds,
} from "$lib/floorplan/glow";
import { kelvinToRgb, miredToRgb } from "$lib/device-tint";

describe("kelvinToRgb / miredToRgb", () => {
  it("renders the cool end (150 mireds ≈ 6667 K) near white", () => {
    const c = miredToRgb(150);
    expect(c.r).toBe(255);
    expect(c.g).toBeGreaterThan(230);
    expect(c.b).toBeGreaterThan(230);
  });

  it("renders the warm end (500 mireds = 2000 K) as deep amber", () => {
    const c = miredToRgb(500);
    expect(c.r).toBe(255);
    expect(c.g).toBeGreaterThan(100);
    expect(c.g).toBeLessThan(180);
    expect(c.b).toBeLessThan(60);
  });

  it("clamps mireds outside the UI range", () => {
    expect(miredToRgb(50)).toEqual(miredToRgb(150));
    expect(miredToRgb(900)).toEqual(miredToRgb(500));
  });

  it("is warmer at higher mireds", () => {
    expect(miredToRgb(450).b).toBeLessThan(miredToRgb(200).b);
  });

  it("kelvinToRgb never leaves the 0..255 range", () => {
    for (const k of [1000, 2000, 4000, 6600, 10000, 40000]) {
      const c = kelvinToRgb(k);
      for (const ch of [c.r, c.g, c.b]) {
        expect(ch).toBeGreaterThanOrEqual(0);
        expect(ch).toBeLessThanOrEqual(255);
      }
    }
  });
});

describe("glowStops", () => {
  it("fades with a (1-t)^2 falloff and ends transparent", () => {
    const stops = glowStops({ r: 255, g: 0, b: 0 });
    const byOffset = new Map(stops.map((s) => [s.offset, s.opacity]));
    expect(byOffset.get(0.15)).toBeCloseTo(0.72, 1);
    expect(byOffset.get(0.3)).toBeCloseTo(0.49, 1);
    expect(byOffset.get(0.55)).toBeCloseTo(0.2, 1);
    expect(byOffset.get(1)).toBe(0);
  });

  it("pushes the core toward white while the body keeps the hue", () => {
    const stops = glowStops({ r: 255, g: 0, b: 0 });
    expect(stops[0].color).not.toBe(stops[1].color);
    expect(stops[1].color).toBe("rgb(255, 0, 0)");
  });
});

describe("glowRadius", () => {
  it("spans 75%..100% of the base radius over the brightness range", () => {
    expect(glowRadius(0)).toBeCloseTo(GLOW_BASE_RADIUS_M * 0.75, 5);
    expect(glowRadius(254)).toBeCloseTo(GLOW_BASE_RADIUS_M, 5);
    expect(glowRadius(null)).toBe(GLOW_BASE_RADIUS_M);
  });
});

describe("glowRgbForState", () => {
  it("is null only for absent state", () => {
    expect(glowRgbForState(null)).toBeNull();
    expect(glowRgbForState(undefined)).toBeNull();
  });

  it("keeps the hue for an off light (opacity encodes off, not color)", () => {
    const rgb = glowRgbForState({ color: { r: 10, g: 200, b: 30 } });
    expect(rgb).toEqual({ r: 10, g: 200, b: 30 });
  });

  it("resolves colorTemp through the shared mired ramp", () => {
    expect(glowRgbForState({ colorTemp: 500 })).toEqual(miredToRgb(500));
  });
});

describe("groupGlowDeviceIds", () => {
  it("drops members that carry a marker of their own", () => {
    expect(groupGlowDeviceIds(["a", "b", "c"], new Set(["b"]))).toEqual(["a", "c"]);
  });

  it("emits a repeated member once, so it cannot glow twice", () => {
    expect(groupGlowDeviceIds(["a", "a", "b"], new Set())).toEqual(["a", "b"]);
  });

  it("returns nothing when every member is placed directly", () => {
    expect(groupGlowDeviceIds(["a", "b"], new Set(["a", "b"]))).toEqual([]);
  });
});

describe("aggregateGlow", () => {
  it("returns null when no member reports state", () => {
    expect(aggregateGlow([])).toBeNull();
  });

  it("averages the members' hues", () => {
    const agg = aggregateGlow([
      { on: true, color: { r: 200, g: 0, b: 0 } },
      { on: true, color: { r: 0, g: 100, b: 0 } },
    ]);
    expect(agg?.rgb).toEqual({ r: 100, g: 50, b: 0 });
  });

  it("takes the brightest member's opacity, not the mean", () => {
    const bright = aggregateGlow([{ on: true, brightness: 254 }]);
    const mixed = aggregateGlow([
      { on: true, brightness: 254 },
      { on: false, brightness: 10 },
    ]);
    expect(mixed?.opacity).toBe(bright?.opacity);
  });

  it("keeps the hue but goes transparent when every member is off", () => {
    const agg = aggregateGlow([{ on: false, color: { r: 200, g: 0, b: 0 } }]);
    expect(agg?.opacity).toBe(0);
    expect(agg?.rgb.r).toBeGreaterThan(0);
  });
});

describe("markerGlow", () => {
  const lit = { on: true, brightness: 254, colorTemp: 250 };

  function source(overrides: Partial<Parameters<typeof markerGlow>[0]> = {}) {
    return {
      key: "device:d-1",
      x: 2,
      y: 3,
      lights: [{ id: "d-1", state: lit }],
      pooled: false,
      ...overrides,
    };
  }

  it("puts a device's glow where its marker is, keyed by it", () => {
    const glow = markerGlow(source(), new Set())!;
    expect(glow.id).toBe("device:d-1");
    expect(glow.x).toBe(2);
    expect(glow.y).toBe(3);
    expect(glow.opacity).toBeGreaterThan(0);
  });

  it("keeps a switched-off light's colour so it can fade rather than vanish", () => {
    const glow = markerGlow(
      source({ lights: [{ id: "d-1", state: { ...lit, on: false } }] }),
      new Set(),
    )!;
    expect(glow.rgb).toBeTruthy();
    expect(glow.opacity).toBe(0);
  });

  it("has nothing to draw for a marker with no lights on it", () => {
    expect(markerGlow(source({ lights: [] }), new Set())).toBeNull();
  });

  it("pools a group's members", () => {
    const glow = markerGlow(
      source({
        key: "group:g-1",
        pooled: true,
        lights: [
          { id: "d-1", state: lit },
          { id: "d-2", state: lit },
        ],
      }),
      new Set(),
    )!;
    expect(glow.id).toBe("group:g-1");
    expect(glow.opacity).toBeGreaterThan(0);
  });

  it("leaves out group members that carry a marker of their own", () => {
    // The pool takes the widest member, so dropping the bright one shows up.
    const members = [
      { id: "d-1", state: { ...lit, brightness: 254 } },
      { id: "d-2", state: { ...lit, brightness: 20 } },
    ];
    const both = markerGlow(source({ pooled: true, lights: members }), new Set())!;
    const withoutBright = markerGlow(source({ pooled: true, lights: members }), new Set(["d-1"]))!;
    expect(withoutBright.radius).toBeLessThan(both.radius);
  });

  it("has nothing to draw when every member is placed on its own", () => {
    const glow = markerGlow(
      source({ pooled: true, lights: [{ id: "d-1", state: lit }] }),
      new Set(["d-1"]),
    );
    expect(glow).toBeNull();
  });
});

describe("display colour", () => {
  it("stands in for a device that reports no colour of its own", () => {
    const view = markerGlow(
      {
        key: "m",
        x: 0,
        y: 0,
        lights: [{ id: "a", state: { on: true }, displayColor: "#3366ff" }],
        pooled: false,
      },
      new Set(),
    );
    expect(view?.rgb).toEqual({ r: 0x33, g: 0x66, b: 0xff });
  });

  it("never overrides a colour the device does report", () => {
    const view = markerGlow(
      {
        key: "m",
        x: 0,
        y: 0,
        lights: [
          { id: "a", state: { on: true, color: { r: 10, g: 20, b: 30 } }, displayColor: "#3366ff" },
        ],
        pooled: false,
      },
      new Set(),
    );
    expect(view?.rgb).toEqual({ r: 10, g: 20, b: 30 });
  });

  it("ignores a malformed colour rather than drawing nothing", () => {
    const view = markerGlow(
      {
        key: "m",
        x: 0,
        y: 0,
        lights: [{ id: "a", state: { on: true }, displayColor: "not-a-colour" }],
        pooled: false,
      },
      new Set(),
    );
    expect(view?.rgb).toBeDefined();
  });
});

describe("display brightness", () => {
  const source = (displayBrightness: number | null) => ({
    key: "m",
    x: 0,
    y: 0,
    lights: [{ id: "a", state: { on: true }, displayBrightness }],
    pooled: false,
  });

  it("dims a device that reports no brightness of its own", () => {
    const dim = markerGlow(source(40), new Set())!;
    const full = markerGlow(source(null), new Set())!;
    expect(dim.opacity).toBeLessThan(full.opacity);
    expect(dim.opacity).toBeGreaterThan(0);
  });

  it("never overrides a brightness the device does report", () => {
    const view = markerGlow(
      {
        key: "m",
        x: 0,
        y: 0,
        lights: [{ id: "a", state: { on: true, brightness: 254 }, displayBrightness: 20 }],
        pooled: false,
      },
      new Set(),
    )!;
    expect(view.opacity).toBe(1);
  });
});
