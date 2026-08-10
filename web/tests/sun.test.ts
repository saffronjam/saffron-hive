import { describe, expect, it } from "vitest";
import { sunPosition } from "$lib/sun";

/**
 * The checks below are the ones geometry pins down exactly, rather than numbers
 * copied from a table: at an equinox the sun stands overhead at the equator and
 * at (90 - latitude) degrees elsewhere, and inside the polar circles it stays
 * up or down for the whole day.
 */
describe("sunPosition", () => {
  // Around noon UTC on the March equinox, at longitude 0.
  const equinoxNoon = new Date("2026-03-20T12:07:00Z");

  it("puts the sun overhead at the equator at equinox noon", () => {
    const { elevation } = sunPosition(equinoxNoon, 0, 0);
    expect(elevation).toBeGreaterThan(88);
    expect(elevation).toBeLessThanOrEqual(90);
  });

  it("drops the elevation by one degree per degree of latitude", () => {
    for (const lat of [15, 30, 45, 60]) {
      const { elevation } = sunPosition(equinoxNoon, lat, 0);
      expect(elevation).toBeCloseTo(90 - lat, 0);
    }
  });

  it("puts the midday sun due south from the northern hemisphere", () => {
    const { azimuth } = sunPosition(equinoxNoon, 59.3, 0);
    expect(Math.abs(azimuth - 180)).toBeLessThan(2);
  });

  it("puts the midday sun due north from the southern hemisphere", () => {
    const { azimuth } = sunPosition(equinoxNoon, -35, 0);
    const fromNorth = Math.min(azimuth, 360 - azimuth);
    expect(fromNorth).toBeLessThan(2);
  });

  it("keeps the sun up all day inside the arctic circle in June", () => {
    for (let hour = 0; hour < 24; hour += 2) {
      const at = new Date(Date.UTC(2026, 5, 21, hour));
      expect(sunPosition(at, 78, 15).elevation).toBeGreaterThan(0);
    }
  });

  it("keeps the sun down all day inside the arctic circle in December", () => {
    for (let hour = 0; hour < 24; hour += 2) {
      const at = new Date(Date.UTC(2026, 11, 21, hour));
      expect(sunPosition(at, 78, 15).elevation).toBeLessThan(0);
    }
  });

  it("reads the same instant the same way whatever the local clock says", () => {
    const a = sunPosition(new Date("2026-08-07T10:00:00Z"), 59.3, 18.1);
    const b = sunPosition(new Date("2026-08-07T12:00:00+02:00"), 59.3, 18.1);
    expect(a.elevation).toBeCloseTo(b.elevation, 9);
    expect(a.azimuth).toBeCloseTo(b.azimuth, 9);
  });

  it("tracks the sun westward through the day", () => {
    const morning = sunPosition(new Date("2026-06-21T08:00:00Z"), 59.3, 0);
    const noon = sunPosition(new Date("2026-06-21T12:00:00Z"), 59.3, 0);
    const evening = sunPosition(new Date("2026-06-21T16:00:00Z"), 59.3, 0);
    expect(morning.azimuth).toBeLessThan(noon.azimuth);
    expect(noon.azimuth).toBeLessThan(evening.azimuth);
    expect(noon.elevation).toBeGreaterThan(morning.elevation);
    expect(noon.elevation).toBeGreaterThan(evening.elevation);
  });
});
