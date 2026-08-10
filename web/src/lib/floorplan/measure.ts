import { flattenWall, polygonBounds, shoelaceArea } from "./geometry";
import type { Face, PlanVertex, PlanWall } from "./types";

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

/** Format a length for display: 3.238 -> "3.24 m". */
export function formatMeters(v: number): string {
  return `${v.toFixed(2)} m`;
}

/** Format an area for display: 12 -> "12.00 m²". */
export function formatArea(v: number): string {
  return `${v.toFixed(2)} m²`;
}
