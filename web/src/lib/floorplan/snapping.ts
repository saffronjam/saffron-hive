import { projectOntoWall } from "./geometry";
import type { PlanGraph, Point } from "./types";

/** Screen-space snap radius in pixels; divided by zoom for world units. */
export const SNAP_THRESHOLD_PX = 8;

/** Angle-lock step in degrees from the previous drawing point. */
export const ANGLE_STEP_DEG = 15;

/** Default grid spacing in meters. */
export const DEFAULT_GRID_SIZE = 0.1;

/** Everything resolveSnap needs to evaluate the snap ladder. */
export interface SnapContext {
  graph: PlanGraph;
  zoom: number;
  alt: boolean;
  prevPoint?: Point;
  gridSize?: number;
  excludeVertexIds?: string[];
  excludeWallIds?: string[];
}

/** What the active snap latched onto, for the renderer's indicator. */
export type SnapIndicator =
  | { kind: "vertex"; vertexId: string }
  | { kind: "segment"; wallId: string; t: number }
  | { kind: "angle"; from: Point; angleDeg: number }
  | { kind: "grid" };

/** The snapped point plus the indicator to draw, null when snapping is off. */
export interface SnapResult {
  point: Point;
  indicator: SnapIndicator | null;
}

/**
 * Round a distance travelled along `dir` so the coordinate that direction
 * favours lands on the grid. A run along an axis therefore always lands on the
 * grid, and a diagonal lands on it in the axis it covers fastest — as close as a
 * lock at an arbitrary angle can come to sharing one grid with everything else.
 */
function gridAlong(along: number, dir: Point, grid: number): number {
  const dominant = Math.max(Math.abs(dir.x), Math.abs(dir.y));
  if (dominant < 1e-9) return along;
  const step = grid / dominant;
  return Math.round(along / step) * step;
}

/**
 * How far to slide something that starts at `from` along `dir` so it lands on
 * the grid. One distance for the whole thing, so a wall keeps its length and
 * angle — rounding each end on its own would bend it.
 */
export function gridSlide(
  distance: number,
  dir: Point,
  from: Point,
  grid: number = DEFAULT_GRID_SIZE,
): number {
  const alongX = Math.abs(dir.x) >= Math.abs(dir.y);
  const component = alongX ? dir.x : dir.y;
  if (Math.abs(component) < 1e-9) return distance;
  const start = alongX ? from.x : from.y;
  const landed = Math.round((start + component * distance) / grid) * grid;
  return (landed - start) / component;
}

/**
 * Resolve the cursor through the snap ladder: existing vertex, then wall
 * interior (the result carries the wall id and parameter for a commit-time
 * split), then {@link ANGLE_STEP_DEG}-multiple angle lock from `prevPoint`
 * (cursor projected onto the locked ray), then grid.
 *
 * Every rung but the vertex one lands on the shared grid: an angle lock and a
 * point on a wall are both measured from somewhere, and left unrounded they put
 * corners a hair off the grid everything else sits on, which is how two walls
 * end up crossing a few millimetres apart instead of meeting. The threshold is
 * {@link SNAP_THRESHOLD_PX} / zoom world units so the radius feels constant
 * on screen. `alt` suppresses snapping entirely. Exclusion lists keep a
 * dragged vertex and its walls from snapping to themselves.
 */
export function resolveSnap(cursor: Point, ctx: SnapContext): SnapResult {
  if (ctx.alt) return { point: { x: cursor.x, y: cursor.y }, indicator: null };
  const threshold = SNAP_THRESHOLD_PX / ctx.zoom;

  const grid = ctx.gridSize ?? DEFAULT_GRID_SIZE;

  const vertex = snapVertex(cursor, ctx, threshold);
  if (vertex) return vertex;

  const segment = snapSegment(cursor, ctx, threshold, grid);
  if (segment) return segment;

  const angle = snapAngle(cursor, ctx, threshold, grid);
  if (angle) return angle;

  return {
    point: { x: Math.round(cursor.x / grid) * grid, y: Math.round(cursor.y / grid) * grid },
    indicator: { kind: "grid" },
  };
}

function snapVertex(cursor: Point, ctx: SnapContext, threshold: number): SnapResult | null {
  const excluded = new Set(ctx.excludeVertexIds ?? []);
  let best: SnapResult | null = null;
  let bestDist = threshold;
  for (const v of ctx.graph.vertices) {
    if (excluded.has(v.id)) continue;
    const dist = Math.hypot(cursor.x - v.x, cursor.y - v.y);
    if (dist <= bestDist) {
      bestDist = dist;
      best = { point: { x: v.x, y: v.y }, indicator: { kind: "vertex", vertexId: v.id } };
    }
  }
  return best;
}

function snapSegment(
  cursor: Point,
  ctx: SnapContext,
  threshold: number,
  grid: number,
): SnapResult | null {
  const excluded = new Set(ctx.excludeWallIds ?? []);
  let best: SnapResult | null = null;
  let bestDist = threshold;
  for (const wall of ctx.graph.walls) {
    if (excluded.has(wall.id)) continue;
    const { point, t, distance } = projectOntoWall(cursor, wall, ctx.graph.vertices);
    if (t <= 0 || t >= 1) continue;
    if (distance > bestDist) continue;
    bestDist = distance;
    best = { point, indicator: { kind: "segment", wallId: wall.id, t } };

    // Slide the hit along the wall onto the grid. A curved wall's parameter is
    // not a distance, so it keeps the exact projection.
    const a = ctx.graph.vertices.find((v) => v.id === wall.a);
    const b = ctx.graph.vertices.find((v) => v.id === wall.b);
    if (wall.curve || !a || !b) continue;
    const length = Math.hypot(b.x - a.x, b.y - a.y);
    if (length === 0) continue;
    const dir = { x: (b.x - a.x) / length, y: (b.y - a.y) / length };
    const along = gridAlong(t * length, dir, grid);
    if (along <= 0 || along >= length) continue;
    best = {
      point: { x: a.x + dir.x * along, y: a.y + dir.y * along },
      indicator: { kind: "segment", wallId: wall.id, t: along / length },
    };
  }
  return best;
}

function snapAngle(
  cursor: Point,
  ctx: SnapContext,
  threshold: number,
  grid: number,
): SnapResult | null {
  if (!ctx.prevPoint) return null;
  const from = ctx.prevPoint;
  const dx = cursor.x - from.x;
  const dy = cursor.y - from.y;
  if (dx === 0 && dy === 0) return null;
  const step = (ANGLE_STEP_DEG * Math.PI) / 180;
  const stepIndex = Math.round(Math.atan2(dy, dx) / step);
  const locked = stepIndex * step;
  const dir = { x: Math.cos(locked), y: Math.sin(locked) };
  const along = Math.max(0, dx * dir.x + dy * dir.y);
  // Whether the cursor is on the ray is judged before rounding, so landing on
  // the grid cannot cost the lock its reach.
  const onRay = { x: from.x + along * dir.x, y: from.y + along * dir.y };
  if (Math.hypot(cursor.x - onRay.x, cursor.y - onRay.y) > threshold) return null;
  const stepped = gridAlong(along, dir, grid);
  const point = { x: from.x + stepped * dir.x, y: from.y + stepped * dir.y };
  const angleDeg = (((stepIndex * ANGLE_STEP_DEG) % 360) + 360) % 360;
  return { point, indicator: { kind: "angle", from: { x: from.x, y: from.y }, angleDeg } };
}

/** How far past each end the angle-lock ray is drawn, as a multiple of its length. */
const RAY_BEHIND = 2;
const RAY_AHEAD = 3;

/**
 * The shapes that show what the cursor has snapped to: the wall it landed on,
 * the locked-angle ray it is running along, and the vertex it caught. Resolving
 * these here keeps the drawing dumb — it has no ids to look up.
 *
 * `toward` is where the gesture currently points, which the ray needs in order
 * to know which way to run; without one there is no ray to draw.
 */
export function snapGuides(
  snap: SnapResult | null,
  graph: PlanGraph,
  toward: Point | null,
): {
  segment: { a: Point; b: Point } | null;
  ray: { from: Point; to: Point } | null;
  vertex: Point | null;
} {
  const guides = { segment: null, ray: null, vertex: null } as {
    segment: { a: Point; b: Point } | null;
    ray: { from: Point; to: Point } | null;
    vertex: Point | null;
  };
  const indicator = snap?.indicator;
  if (!indicator) return guides;

  if (indicator.kind === "segment") {
    const wall = graph.walls.find((w) => w.id === indicator.wallId);
    const a = wall && graph.vertices.find((v) => v.id === wall.a);
    const b = wall && graph.vertices.find((v) => v.id === wall.b);
    if (a && b) guides.segment = { a: { x: a.x, y: a.y }, b: { x: b.x, y: b.y } };
    return guides;
  }

  if (indicator.kind === "angle" && toward) {
    const { from } = indicator;
    const dx = toward.x - from.x;
    const dy = toward.y - from.y;
    guides.ray = {
      from: { x: from.x - dx * RAY_BEHIND, y: from.y - dy * RAY_BEHIND },
      to: { x: from.x + dx * RAY_AHEAD, y: from.y + dy * RAY_AHEAD },
    };
    return guides;
  }

  if (indicator.kind === "vertex") {
    const v = graph.vertices.find((x) => x.id === indicator.vertexId);
    if (v) guides.vertex = { x: v.x, y: v.y };
  }
  return guides;
}

/**
 * How far a dropped room reaches for the plan, in meters. More generous than
 * the cursor's ladder because a room is placed by aiming a whole shape rather
 * than a point, so the hand is less precise about it.
 */
export const ROOM_SNAP_REACH_M = 0.5;

/**
 * How far to nudge a rectangle so it lands flush against what is already drawn:
 * an edge onto the line of a wall already there, or a corner onto an existing
 * corner. The rectangle moves as one, so it keeps its size and stays square —
 * snapping each corner on its own would pull it out of shape.
 *
 * Each axis is decided on its own, so a room can catch a wall on one side
 * without being dragged sideways by something on the other.
 */
export function snapRectOffset(
  corners: Point[],
  graph: PlanGraph,
  reach: number = ROOM_SNAP_REACH_M,
): Point {
  if (corners.length === 0 || graph.vertices.length === 0) return { x: 0, y: 0 };
  const xs = corners.map((c) => c.x);
  const ys = corners.map((c) => c.y);
  return {
    x: nearestShift(
      [Math.min(...xs), Math.max(...xs)],
      graph.vertices.map((v) => v.x),
      reach,
    ),
    y: nearestShift(
      [Math.min(...ys), Math.max(...ys)],
      graph.vertices.map((v) => v.y),
      reach,
    ),
  };
}

/** The smallest shift bringing one of `edges` onto one of `targets`, or 0. */
function nearestShift(edges: number[], targets: number[], reach: number): number {
  let best = 0;
  let bestDistance = reach;
  for (const edge of edges) {
    for (const target of targets) {
      const delta = target - edge;
      if (Math.abs(delta) <= bestDistance) {
        best = delta;
        bestDistance = Math.abs(delta);
      }
    }
  }
  return best;
}
