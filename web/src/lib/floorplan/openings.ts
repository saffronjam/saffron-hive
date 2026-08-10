import { arcLengthAtT, tAtArcLength, wallMetrics, type WallMetrics } from "./geometry";
import type { OpeningKind, PlanOpening, PlanVertex, PlanWall, Point } from "./types";

/** Width in meters a freshly placed opening takes, per kind. */
export const DEFAULT_OPENING_WIDTH_M: Record<OpeningKind, number> = {
  door: 0.9,
  window: 1.2,
  opening: 1.1,
};

/** Narrowest opening the editor will produce, in meters. */
export const MIN_OPENING_WIDTH_M = 0.2;

const SPAN_EPSILON = 1e-9;

/**
 * The `t` range an opening covers on its wall. The metric width is converted
 * through arc length — on a curved wall `t` is uniform in polyline index, not
 * in distance — and clamped to [0, 1], so an opening wider than the wall spans
 * the whole of it.
 */
export function openingTRange(
  wall: PlanWall,
  verts: Map<string, PlanVertex> | PlanVertex[],
  o: PlanOpening,
): [number, number] {
  const m = wallMetrics(wall, verts);
  return rangeFromMetrics(m, o);
}

/**
 * The opening's midpoint on the wall centerline, the wall's left-hand unit
 * normal there, and the wall's heading in radians — what a window line or a
 * daylight cone is drawn from.
 */
export function openingAnchor(
  wall: PlanWall,
  verts: Map<string, PlanVertex> | PlanVertex[],
  o: PlanOpening,
): { point: Point; normal: Point; angleRad: number } {
  const m = wallMetrics(wall, verts);
  const last = m.points.length - 1;
  if (last < 1) {
    const only = m.points[0] ?? { x: 0, y: 0 };
    return { point: { ...only }, normal: { x: 0, y: 0 }, angleRad: 0 };
  }
  const { i, frac } = segmentAtT(m, o.t);
  const a = m.points[i];
  const b = m.points[i + 1];
  const point = { x: a.x + (b.x - a.x) * frac, y: a.y + (b.y - a.y) * frac };
  const len = Math.hypot(b.x - a.x, b.y - a.y);
  if (len === 0) return { point, normal: { x: 0, y: 0 }, angleRad: 0 };
  const d = { x: (b.x - a.x) / len, y: (b.y - a.y) / len };
  return { point, normal: { x: -d.y, y: d.x }, angleRad: Math.atan2(d.y, d.x) };
}

/**
 * The gap's footprint on the wall centerline: the polyline from one end of the
 * opening to the other, keeping a curved wall's interpolation points so the
 * span bends with the wall. The first and last points are the gap's ends, which
 * is what the editor's width handles sit on.
 */
export function openingSpan(
  wall: PlanWall,
  verts: Map<string, PlanVertex> | PlanVertex[],
  o: PlanOpening,
): Point[] {
  const m = wallMetrics(wall, verts);
  if (m.points.length < 2) return m.points.map((p) => ({ ...p }));
  const [start, end] = rangeFromMetrics(m, o);
  const from = segmentAtT(m, start);
  const to = segmentAtT(m, end);
  const span: Point[] = [pointAt(m, from)];
  for (let i = from.i + 1; i <= to.i; i++) span.push({ ...m.points[i] });
  span.push(pointAt(m, to));
  return span;
}

function segmentAtT(m: WallMetrics, t: number): { i: number; frac: number } {
  const last = m.points.length - 1;
  const scaled = Math.min(Math.max(t, 0), 1) * last;
  const i = Math.min(last - 1, Math.floor(scaled));
  return { i, frac: scaled - i };
}

function pointAt(m: WallMetrics, at: { i: number; frac: number }): Point {
  const a = m.points[at.i];
  const b = m.points[at.i + 1];
  return { x: a.x + (b.x - a.x) * at.frac, y: a.y + (b.y - a.y) * at.frac };
}

/**
 * The wall's solid `t` ranges: [0, 1] minus every opening, with overlapping
 * openings merged first. A wall with no openings yields `[[0, 1]]`; a wall
 * fully covered by openings yields `[]`.
 */
export function solidSpans(
  wall: PlanWall,
  verts: Map<string, PlanVertex> | PlanVertex[],
): Array<[number, number]> {
  const openings = wall.openings ?? [];
  if (openings.length === 0) return [[0, 1]];
  const m = wallMetrics(wall, verts);
  const gaps: Array<[number, number]> = [];
  for (const o of openings) {
    const [start, end] = rangeFromMetrics(m, o);
    if (end - start > SPAN_EPSILON) gaps.push([start, end]);
  }
  if (gaps.length === 0) return [[0, 1]];
  gaps.sort((p, q) => p[0] - q[0]);

  const merged: Array<[number, number]> = [gaps[0]];
  for (let i = 1; i < gaps.length; i++) {
    const tail = merged[merged.length - 1];
    if (gaps[i][0] <= tail[1] + SPAN_EPSILON) tail[1] = Math.max(tail[1], gaps[i][1]);
    else merged.push(gaps[i]);
  }

  const solid: Array<[number, number]> = [];
  let cursor = 0;
  for (const [start, end] of merged) {
    if (start - cursor > SPAN_EPSILON) solid.push([cursor, start]);
    cursor = Math.max(cursor, end);
  }
  if (1 - cursor > SPAN_EPSILON) solid.push([cursor, 1]);
  return solid;
}

/**
 * Pull an opening back inside its wall: at least {@link MIN_OPENING_WIDTH_M}
 * wide (or the whole wall, when the wall is shorter than that), and centred far
 * enough from either end that its full width fits.
 */
export function clampOpening(
  wall: PlanWall,
  verts: Map<string, PlanVertex> | PlanVertex[],
  o: PlanOpening,
): PlanOpening {
  const m = wallMetrics(wall, verts);
  const width = Math.min(Math.max(o.width, MIN_OPENING_WIDTH_M), m.total);
  if (m.total <= 0) return { ...o, t: 0, width: Math.max(o.width, MIN_OPENING_WIDTH_M) };
  const half = width / 2;
  const centre = Math.min(Math.max(arcLengthAtT(m, o.t), half), m.total - half);
  return { ...o, t: tAtArcLength(m, centre), width };
}

function rangeFromMetrics(m: WallMetrics, o: PlanOpening): [number, number] {
  const centre = arcLengthAtT(m, o.t);
  const half = Math.max(o.width, 0) / 2;
  return [tAtArcLength(m, centre - half), tAtArcLength(m, centre + half)];
}
