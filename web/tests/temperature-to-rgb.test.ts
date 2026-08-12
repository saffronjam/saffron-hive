import { describe, expect, it } from "vitest";
import { temperatureToRgb } from "$lib/device-tint";

describe("temperatureToRgb", () => {
  it("clamps at the cold and hot ends", () => {
    expect(temperatureToRgb(-5)).toEqual(temperatureToRgb(16));
    expect(temperatureToRgb(40)).toEqual(temperatureToRgb(27));
  });

  it("is blue-dominant when cold and red-dominant when hot", () => {
    const cold = temperatureToRgb(16);
    expect(cold.b).toBeGreaterThan(cold.r);
    const hot = temperatureToRgb(27);
    expect(hot.r).toBeGreaterThan(hot.b);
  });

  it("warms monotonically across the ramp", () => {
    // Red-minus-blue, not red alone: the cold end runs blue through cyan,
    // where red dips on its way up, exactly as a heat ramp should.
    const warmth = (c: number) => {
      const { r, b } = temperatureToRgb(c);
      return r - b;
    };
    let prev = warmth(16);
    for (let c = 16.5; c <= 27; c += 0.5) {
      const next = warmth(c);
      expect(next, `warmth at ${c}`).toBeGreaterThanOrEqual(prev);
      prev = next;
    }
  });

  it("stays saturated across the ramp, never washing out to white", () => {
    // A heat map reads as heat because no stop is near-grey; a whitish middle
    // is what made this look like a lamp.
    for (let c = 16; c <= 27; c += 0.5) {
      const { r, g, b } = temperatureToRgb(c);
      const spread = Math.max(r, g, b) - Math.min(r, g, b);
      expect(spread, `saturation at ${c}`).toBeGreaterThan(90);
    }
  });

  it("reads green through the comfortable middle", () => {
    const mid = temperatureToRgb(20);
    expect(mid.g).toBeGreaterThan(mid.r);
    expect(mid.g).toBeGreaterThan(mid.b);
  });
});
