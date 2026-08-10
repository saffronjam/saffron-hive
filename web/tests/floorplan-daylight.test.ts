import { describe, expect, it } from "vitest";
import { daylightFactor, daylightRgb } from "$lib/floorplan/daylight";

describe("daylightFactor", () => {
  it("is dark below civil twilight and rises without ever dipping", () => {
    expect(daylightFactor(-90)).toBe(0);
    expect(daylightFactor(-6)).toBe(0);
    let previous = -1;
    for (let e = -6; e <= 90; e += 1) {
      const f = daylightFactor(e);
      expect(f).toBeGreaterThanOrEqual(previous);
      previous = f;
    }
  });

  it("reaches full strength with the sun overhead", () => {
    expect(daylightFactor(90)).toBeCloseTo(1, 9);
  });

  it("still gives a little light at the horizon, so dusk fades", () => {
    expect(daylightFactor(0)).toBeGreaterThan(0);
    expect(daylightFactor(0)).toBeLessThan(0.2);
  });
});

describe("daylightRgb", () => {
  it("warms towards the horizon and cools overhead", () => {
    const low = daylightRgb(0);
    const high = daylightRgb(90);
    expect(low.r / Math.max(low.b, 1)).toBeGreaterThan(high.r / Math.max(high.b, 1));
  });
});
