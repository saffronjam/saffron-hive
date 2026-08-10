import type { Face, PlanVertex, PlanWall, Point } from "./types";

/** Number of segments a curved wall is flattened into. */
export const CURVE_SEGMENTS = 16;

/** Index vertices by id. Accepts a prebuilt map and returns it unchanged. */
export function vertexMap(verts: Map<string, PlanVertex> | PlanVertex[]): Map<string, PlanVertex> {
  if (verts instanceof Map) return verts;
  const map = new Map<string, PlanVertex>();
  for (const v of verts) map.set(v.id, v);
  return map;
}

/** Shortest distance from a point to the segment a–b. */
export function pointSegmentDistance(p: Point, a: Point, b: Point): number {
  const { point } = pointSegmentProjection(p, a, b);
  return Math.hypot(p.x - point.x, p.y - point.y);
}

/**
 * Project a point onto the segment a–b. Returns the closest point on the
 * segment and its parameter t in [0, 1] (0 at a, 1 at b).
 */
export function pointSegmentProjection(p: Point, a: Point, b: Point): { point: Point; t: number } {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return { point: { x: a.x, y: a.y }, t: 0 };
  let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  return { point: { x: a.x + t * dx, y: a.y + t * dy }, t };
}

/**
 * Intersection point of segments a1–a2 and b1–b2. Only proper crossings
 * count: null for parallel or collinear segments, for intersections outside
 * either segment, and for segments that merely touch at an endpoint.
 */
export function segmentIntersection(a1: Point, a2: Point, b1: Point, b2: Point): Point | null {
  const rX = a2.x - a1.x;
  const rY = a2.y - a1.y;
  const sX = b2.x - b1.x;
  const sY = b2.y - b1.y;
  const denom = rX * sY - rY * sX;
  if (Math.abs(denom) < 1e-12) return null;
  const qpX = b1.x - a1.x;
  const qpY = b1.y - a1.y;
  const t = (qpX * sY - qpY * sX) / denom;
  const u = (qpX * rY - qpY * rX) / denom;
  const eps = 1e-9;
  if (t <= eps || t >= 1 - eps || u <= eps || u >= 1 - eps) return null;
  return { x: a1.x + t * rX, y: a1.y + t * rY };
}

/** Even-odd ray-casting test. Points exactly on an edge may land either way. */
export function pointInPolygon(p: Point, polygon: Point[]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[i];
    const b = polygon[j];
    const crosses = a.y > p.y !== b.y > p.y;
    if (crosses && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x) inside = !inside;
  }
  return inside;
}

/**
 * Signed polygon area via the shoelace formula. Positive for
 * counter-clockwise winding in y-up coordinates.
 */
export function shoelaceArea(polygon: Point[]): number {
  let sum = 0;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    sum += polygon[j].x * polygon[i].y - polygon[i].x * polygon[j].y;
  }
  return sum / 2;
}

/** Axis-aligned bounding box of a polygon. */
export function polygonBounds(polygon: Point[]): {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
} {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const p of polygon) {
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
  }
  if (polygon.length === 0) return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 };
  return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY };
}

/**
 * Nearest point of a face's interior to p, keeping an optional clearance
 * from the boundary. A point already inside the polygon — and at least
 * `inset` away from every edge when `inset` > 0 — is returned unchanged.
 * Otherwise the nearest edge projection is pushed inward by `inset` along
 * that edge's inward normal, with a few relaxation passes so corners keep
 * the clearance wherever the polygon is wide enough to allow it.
 */
/** A square of the search grid, scored by how deep inside the polygon it is. */
interface LabelCell {
  x: number;
  y: number;
  h: number;
  /** Distance from the polygon's edge; negative outside it. */
  d: number;
  /** The best any point in this cell could score. */
  max: number;
}

function signedDistanceToRing(x: number, y: number, ring: Point[]): number {
  const p = { x, y };
  let min = Infinity;
  for (let i = 0; i < ring.length; i++) {
    min = Math.min(min, pointSegmentDistance(p, ring[i], ring[(i + 1) % ring.length]));
  }
  return pointInPolygon(p, ring) ? min : -min;
}

function labelCell(x: number, y: number, h: number, ring: Point[]): LabelCell {
  const d = signedDistanceToRing(x, y, ring);
  return { x, y, h, d, max: d + h * Math.SQRT2 };
}

function pushCell(heap: LabelCell[], cell: LabelCell): void {
  heap.push(cell);
  let i = heap.length - 1;
  while (i > 0) {
    const parent = (i - 1) >> 1;
    if (heap[parent].max >= heap[i].max) break;
    [heap[parent], heap[i]] = [heap[i], heap[parent]];
    i = parent;
  }
}

function popCell(heap: LabelCell[]): LabelCell | undefined {
  const top = heap[0];
  const last = heap.pop();
  if (heap.length > 0 && last) {
    heap[0] = last;
    let i = 0;
    for (;;) {
      const left = 2 * i + 1;
      const right = left + 1;
      let biggest = i;
      if (left < heap.length && heap[left].max > heap[biggest].max) biggest = left;
      if (right < heap.length && heap[right].max > heap[biggest].max) biggest = right;
      if (biggest === i) break;
      [heap[biggest], heap[i]] = [heap[i], heap[biggest]];
      i = biggest;
    }
  }
  return top;
}

/** How close to the true pole the search has to get, in meters. */
const POLE_PRECISION_M = 0.1;

/**
 * The interior point farthest from any edge — where there is the most room
 * around a label. An L-shaped room has neither its centre of mass nor its
 * bounding-box centre inside it, so a label placed either way lands in a
 * neighbouring room; this one is always inside, and in the widest part.
 *
 * The search covers the polygon in square cells and always splits the one whose
 * best conceivable score is highest, stopping once no unexplored cell could beat
 * the best found by more than {@link POLE_PRECISION_M}. A cell cannot hold a
 * point more than half its diagonal deeper than its own centre, which is what
 * makes that bound safe.
 */
export function poleOfInaccessibility(polygon: Point[]): Point {
  const bounds = polygonBounds(polygon);
  const middle = {
    x: bounds.minX + bounds.width / 2,
    y: bounds.minY + bounds.height / 2,
  };
  const size = Math.min(bounds.width, bounds.height);
  if (polygon.length < 3 || size <= 0) return middle;

  const h = size / 2;
  const heap: LabelCell[] = [];
  for (let x = bounds.minX; x < bounds.maxX; x += size) {
    for (let y = bounds.minY; y < bounds.maxY; y += size) {
      pushCell(heap, labelCell(x + h, y + h, h, polygon));
    }
  }

  let best = labelCell(middle.x, middle.y, 0, polygon);
  while (heap.length > 0) {
    const cell = popCell(heap);
    if (!cell) break;
    if (cell.d > best.d) best = cell;
    if (cell.max - best.d <= POLE_PRECISION_M) continue;
    const quarter = cell.h / 2;
    for (const [dx, dy] of [
      [-quarter, -quarter],
      [quarter, -quarter],
      [-quarter, quarter],
      [quarter, quarter],
    ]) {
      pushCell(heap, labelCell(cell.x + dx, cell.y + dy, quarter, polygon));
    }
  }
  return { x: best.x, y: best.y };
}

export function nearestPointInFace(p: Point, face: Face, inset = 0): Point {
  const polygon = face.polygon;
  if (polygon.length < 3) return p;
  const clearance = Math.max(0, inset);
  if (pointInPolygon(p, polygon) && minBoundaryDistance(p, polygon) >= clearance) return p;
  const inwardSign = shoelaceArea(polygon) >= 0 ? 1 : -1;
  let q = pushFromEdge(p, polygon, nearestEdgeIndex(p, polygon), clearance, inwardSign);
  for (let pass = 0; pass < 8 && clearance > 0; pass++) {
    const violated = mostViolatedEdge(q, polygon, clearance);
    if (violated < 0) break;
    q = pushFromEdge(q, polygon, violated, clearance, inwardSign);
  }
  return q;
}

function edgeAt(polygon: Point[], i: number): [Point, Point] {
  return [polygon[i], polygon[(i + 1) % polygon.length]];
}

function minBoundaryDistance(p: Point, polygon: Point[]): number {
  let min = Infinity;
  for (let i = 0; i < polygon.length; i++) {
    const [a, b] = edgeAt(polygon, i);
    const d = pointSegmentDistance(p, a, b);
    if (d < min) min = d;
  }
  return min;
}

function nearestEdgeIndex(p: Point, polygon: Point[]): number {
  let best = 0;
  let bestDistance = Infinity;
  for (let i = 0; i < polygon.length; i++) {
    const [a, b] = edgeAt(polygon, i);
    if (a.x === b.x && a.y === b.y) continue;
    const d = pointSegmentDistance(p, a, b);
    if (d < bestDistance) {
      bestDistance = d;
      best = i;
    }
  }
  return best;
}

function mostViolatedEdge(p: Point, polygon: Point[], clearance: number): number {
  const index = nearestEdgeIndex(p, polygon);
  const [a, b] = edgeAt(polygon, index);
  return pointSegmentDistance(p, a, b) < clearance - 1e-9 ? index : -1;
}

function pushFromEdge(
  p: Point,
  polygon: Point[],
  edgeIndex: number,
  clearance: number,
  inwardSign: number,
): Point {
  const [a, b] = edgeAt(polygon, edgeIndex);
  const { point } = pointSegmentProjection(p, a, b);
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const length = Math.hypot(dx, dy);
  if (length === 0 || clearance === 0) return point;
  return {
    x: point.x + (-dy / length) * inwardSign * clearance,
    y: point.y + (dx / length) * inwardSign * clearance,
  };
}

/**
 * Flatten a wall to a polyline from vertex a to vertex b. Straight walls
 * yield [A, B]; curved walls yield a {@link CURVE_SEGMENTS}-segment quadratic
 * bezier polyline (endpoints exact).
 */
/** Thickness in meters a freshly drawn wall takes. */
export const DEFAULT_WALL_THICKNESS = 0.1;

/** Thinnest wall the editor will produce, in meters. */
export const MIN_WALL_THICKNESS = 0.02;

/** Thickest wall the editor will produce, in meters. */
export const MAX_WALL_THICKNESS = 1;

/**
 * The point halfway along a wall: the midpoint of a straight one, and for a
 * curved one the point its curve actually passes through. This is what the
 * editor's bend handle sits on, so that dragging it moves the wall under the
 * pointer instead of half as far, which is what a raw control point would do.
 */
export function wallApex(wall: PlanWall, verts: Map<string, PlanVertex> | PlanVertex[]): Point {
  const map = vertexMap(verts);
  const a = map.get(wall.a);
  const b = map.get(wall.b);
  if (!a || !b) return { x: 0, y: 0 };
  if (!wall.curve) return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  return {
    x: (a.x + 2 * wall.curve.x + b.x) / 4,
    y: (a.y + 2 * wall.curve.y + b.y) / 4,
  };
}

/** The quadratic control point that bends `a`–`b` through `apex`. */
export function controlForApex(a: Point, b: Point, apex: Point): Point {
  return { x: 2 * apex.x - (a.x + b.x) / 2, y: 2 * apex.y - (a.y + b.y) / 2 };
}

export function flattenWall(
  wall: PlanWall,
  verts: Map<string, PlanVertex> | PlanVertex[],
): Point[] {
  const map = vertexMap(verts);
  const a = map.get(wall.a);
  const b = map.get(wall.b);
  if (!a || !b) return [];
  if (!wall.curve) {
    return [
      { x: a.x, y: a.y },
      { x: b.x, y: b.y },
    ];
  }
  const c = wall.curve;
  const points: Point[] = [];
  for (let i = 0; i <= CURVE_SEGMENTS; i++) {
    const t = i / CURVE_SEGMENTS;
    const mt = 1 - t;
    points.push({
      x: mt * mt * a.x + 2 * mt * t * c.x + t * t * b.x,
      y: mt * mt * a.y + 2 * mt * t * c.y + t * t * b.y,
    });
  }
  return points;
}

/**
 * A wall's flattened polyline with the arc length reached at each point.
 * `cumulative[i]` is the distance from the start to `points[i]`; `total` is the
 * whole polyline length in meters.
 */
export interface WallMetrics {
  points: Point[];
  cumulative: number[];
  total: number;
}

/**
 * Measure a wall for arc-length work. A wall's parameter `t` is uniform in
 * polyline index, which on a curved wall is not uniform in distance, so
 * anything expressed in meters has to travel through these metrics rather than
 * dividing by the chord length.
 */
export function wallMetrics(
  wall: PlanWall,
  verts: Map<string, PlanVertex> | PlanVertex[],
): WallMetrics {
  const points = flattenWall(wall, verts);
  const cumulative: number[] = [];
  let total = 0;
  for (let i = 0; i < points.length; i++) {
    if (i > 0) total += Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);
    cumulative.push(total);
  }
  return { points, cumulative, total };
}

/** Arc length in meters from the wall's start to parameter `t`, clamped to the wall. */
export function arcLengthAtT(m: WallMetrics, t: number): number {
  const last = m.points.length - 1;
  if (last < 1) return 0;
  const scaled = Math.min(Math.max(t, 0), 1) * last;
  const i = Math.min(last - 1, Math.floor(scaled));
  const frac = scaled - i;
  return m.cumulative[i] + (m.cumulative[i + 1] - m.cumulative[i]) * frac;
}

/** Parameter `t` at arc length `s` meters along the wall, clamped to the wall. */
export function tAtArcLength(m: WallMetrics, s: number): number {
  const last = m.points.length - 1;
  if (last < 1 || m.total <= 0) return 0;
  const target = Math.min(Math.max(s, 0), m.total);
  let i = 0;
  while (i < last - 1 && m.cumulative[i + 1] < target) i++;
  const span = m.cumulative[i + 1] - m.cumulative[i];
  const frac = span <= 0 ? 0 : (target - m.cumulative[i]) / span;
  return Math.min(1, Math.max(0, (i + frac) / last));
}

/**
 * Nearest point on a wall to `p`, walking the flattened polyline. `t` is in the
 * wall's own parameterisation, `point` the closest point on it, and `distance`
 * the gap between the two in meters.
 */
export function projectOntoWall(
  p: Point,
  wall: PlanWall,
  verts: Map<string, PlanVertex> | PlanVertex[],
): { t: number; point: Point; distance: number } {
  const line = flattenWall(wall, verts);
  if (line.length < 2) {
    const only = line[0] ?? { x: p.x, y: p.y };
    return { t: 0, point: { ...only }, distance: Math.hypot(p.x - only.x, p.y - only.y) };
  }
  const spans = line.length - 1;
  let best = { t: 0, point: { ...line[0] }, distance: Infinity };
  for (let i = 0; i < spans; i++) {
    const { point, t } = pointSegmentProjection(p, line[i], line[i + 1]);
    const distance = Math.hypot(p.x - point.x, p.y - point.y);
    if (distance <= best.distance) best = { t: (i + t) / spans, point, distance };
  }
  return best;
}
