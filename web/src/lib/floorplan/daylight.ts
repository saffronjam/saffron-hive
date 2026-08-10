import { miredToRgb, type RGB } from "$lib/device-tint";

const DEG = Math.PI / 180;

/** Where daylight stops entirely — the bottom of civil twilight. */
const TWILIGHT_FLOOR_DEG = -6;

/** How much light the sky still gives at the horizon, before the sun is up. */
const HORIZON_FACTOR = 0.08;

/** Mireds daylight is rendered at: warm at the horizon, cold overhead. */
const HORIZON_MIREDS = 500;
const OVERHEAD_MIREDS = 160;

/** Elevation by which daylight has reached its coldest, in degrees. */
const COLD_AT_DEG = 60;

/**
 * How strongly the sun lights a room, from 0 with the sun well down to 1 with it
 * overhead. Rises through twilight rather than switching on at sunrise, so dusk
 * fades instead of snapping.
 */
export function daylightFactor(elevationDeg: number): number {
  if (elevationDeg <= TWILIGHT_FLOOR_DEG) return 0;
  if (elevationDeg < 0) {
    return (HORIZON_FACTOR * (elevationDeg - TWILIGHT_FLOOR_DEG)) / -TWILIGHT_FLOOR_DEG;
  }
  return HORIZON_FACTOR + (1 - HORIZON_FACTOR) * Math.sin(elevationDeg * DEG);
}

/** Daylight's colour at a given sun elevation, in the same CT vocabulary as the lamps. */
export function daylightRgb(elevationDeg: number): RGB {
  const t = Math.min(1, Math.max(0, elevationDeg / COLD_AT_DEG));
  return miredToRgb(HORIZON_MIREDS + (OVERHEAD_MIREDS - HORIZON_MIREDS) * t);
}
