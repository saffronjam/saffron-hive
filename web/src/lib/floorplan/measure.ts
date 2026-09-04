import { flattenWall, polygonBounds, shoelaceArea } from "./geometry";
import type { Face, PlanVertex, PlanWall } from "./types";
import { formatMeasurement } from "$lib/i18n/format";
import type { Language } from "$lib/i18n/messages";

/** Centerline length of a wall in meters; curved walls measure the flattened polyline. */
export function wallLength(wall: PlanWall, verts: Map<string, PlanVertex> | PlanVertex[]): number {
  const line = flattenWall(wall, verts);
  let length = 0;
  for (let i = 1; i < line.length; i++) {
    length += Math.hypot(line[i].x - line[i - 1].x, line[i].y - line[i - 1].y);
  }
  return length;
}

/** Enclosed area of a face in square meters, always positive. */
export function faceAreaM2(face: Face): number {
  return Math.abs(shoelaceArea(face.polygon));
}

/** Bounding-box dimensions of a face in meters. */
export function faceBounds(face: Face): { width: number; height: number } {
  const { width, height } = polygonBounds(face.polygon);
  return { width, height };
}

/** Format a localized length with two fraction digits. */
export function formatMeters(v: number, language?: Language): string {
  return formatMeasurement(
    v,
    "m",
    { minimumFractionDigits: 2, maximumFractionDigits: 2 },
    language,
  );
}

/** Format a localized area with two fraction digits. */
export function formatArea(v: number, language?: Language): string {
  return formatMeasurement(
    v,
    "m²",
    { minimumFractionDigits: 2, maximumFractionDigits: 2 },
    language,
  );
}
