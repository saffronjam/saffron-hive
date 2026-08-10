import { CURVE_SEGMENTS, flattenWall, vertexMap } from "./geometry";
import { solidSpans } from "./openings";
import type { PlanVertex, PlanWall, Point } from "./types";

/** Miter length cap as a multiple of half-thickness, so acute joins don't spike. */
export const MITER_LIMIT = 4;

const SLICE_EPSILON = 1e-9;

interface Line {
  p: Point;
  d: Point;
}

/**
 * The two offset sides of a wall body, sampled at the same parameters:
 * `left[i]` and `right[i]` are the outline points at `t[i]`.
 *
 * `capA` / `capB` are the junction points the end cap detours through. Three or
 * more walls meeting at a vertex enclose a core around it that no single pair of
 * miter corners covers; routing each wall's cap through the vertex gives every
 * wall the wedge of that core between its own two corners, so the walls tile it
 * exactly. Two walls need no detour — their corners already meet.
 */
interface Ribbon {
  left: Point[];
  right: Point[];
  t: number[];
  /**
   * The centerline samples the sides were offset from, and half the wall's
   * thickness. A cut inside the wall is measured from these rather than by
   * interpolating the sides: a mitered corner sits further along the wall on one
   * side than the other, so interpolating both would lean the cut over.
   */
  center: Point[];
  half: number;
  capA: Point | null;
  capB: Point | null;
}

/**
 * Closed outline polygons for one wall: the centerline offset by half the
 * thickness to each side, with half-angle miter corners at vertices shared
 * with `neighbors` and butt caps at free ends. Miter length is clamped to
 * {@link MITER_LIMIT} x half-thickness. Curved walls offset their flattened
 * polyline with bisector joins and butt caps.
 *
 * One polygon per solid span, so a wall without openings yields a single
 * polygon and each opening splits the body it lands in.
 */
export function wallOutline(
  wall: PlanWall,
  verts: Map<string, PlanVertex> | PlanVertex[],
  neighbors: PlanWall[],
): Point[][] {
  const map = vertexMap(verts);
  const ribbon = wallRibbon(wall, map, neighbors);
  if (!ribbon) return [];
  const polygons: Point[][] = [];
  for (const [start, end] of solidSpans(wall, map)) {
    const polygon = sliceRibbon(ribbon, start, end);
    if (polygon.length >= 3) polygons.push(polygon);
  }
  return polygons;
}

function wallRibbon(
  wall: PlanWall,
  map: Map<string, PlanVertex>,
  neighbors: PlanWall[],
): Ribbon | null {
  const a = map.get(wall.a);
  const b = map.get(wall.b);
  if (!a || !b) return null;
  const h = wall.thickness / 2;

  if (wall.curve) return curvedRibbon(wall, map, h);

  const len = Math.hypot(b.x - a.x, b.y - a.y);
  if (len === 0) return null;
  const d = { x: (b.x - a.x) / len, y: (b.y - a.y) / len };
  const nL = rot90ccw(d);

  const [leftA, rightA, capA] = endCorners(wall, a, d, nL, h, map, neighbors, false);
  const [leftB, rightB, capB] = endCorners(wall, b, d, nL, h, map, neighbors, true);
  return {
    left: [leftA, leftB],
    right: [rightA, rightB],
    t: [0, 1],
    center: [
      { x: a.x, y: a.y },
      { x: b.x, y: b.y },
    ],
    half: h,
    capA,
    capB,
  };
}

/**
 * Close the ribbon over [start, end]: the left side forward, the right side
 * back, with both ends interpolated between the ribbon samples they fall
 * between. A full [0, 1] span reproduces the ribbon's own points exactly.
 *
 * A junction cap only belongs to a span that still reaches that end of the
 * wall — an opening cutting the end off leaves a straight edge there.
 */
function sliceRibbon(ribbon: Ribbon, start: number, end: number): Point[] {
  const from = ribbonEdge(ribbon, start);
  const to = ribbonEdge(ribbon, end);
  const left: Point[] = [from.left];
  const right: Point[] = [from.right];
  for (let i = 0; i < ribbon.t.length; i++) {
    if (ribbon.t[i] <= start + SLICE_EPSILON || ribbon.t[i] >= end - SLICE_EPSILON) continue;
    left.push(ribbon.left[i]);
    right.push(ribbon.right[i]);
  }
  left.push(to.left);
  right.push(to.right);
  right.reverse();
  const capB = end >= 1 - SLICE_EPSILON ? ribbon.capB : null;
  const capA = start <= SLICE_EPSILON ? ribbon.capA : null;
  return [...left, ...(capB ? [capB] : []), ...right, ...(capA ? [capA] : [])];
}

/**
 * The two side points at parameter `t`. The wall's own ends keep the corners the
 * miter put there; anywhere inside, the edge is cut square across the
 * centerline, which is what makes an opening's jamb face straight down the wall.
 */
function ribbonEdge(ribbon: Ribbon, t: number): { left: Point; right: Point } {
  const last = ribbon.t.length - 1;
  if (t <= ribbon.t[0] + SLICE_EPSILON) return { left: ribbon.left[0], right: ribbon.right[0] };
  if (t >= ribbon.t[last] - SLICE_EPSILON) {
    return { left: ribbon.left[last], right: ribbon.right[last] };
  }
  const centre = pointAtT(ribbon.center, ribbon.t, t);
  const n = centerNormal(ribbon, t);
  return {
    left: { x: centre.x + n.x * ribbon.half, y: centre.y + n.y * ribbon.half },
    right: { x: centre.x - n.x * ribbon.half, y: centre.y - n.y * ribbon.half },
  };
}

/** The centerline's left-hand unit normal at `t`. */
function centerNormal(ribbon: Ribbon, t: number): Point {
  const last = ribbon.t.length - 1;
  let i = 0;
  while (i < last - 1 && ribbon.t[i + 1] < t) i++;
  const a = ribbon.center[i];
  const b = ribbon.center[i + 1];
  const len = Math.hypot(b.x - a.x, b.y - a.y);
  if (len === 0) return { x: 0, y: 0 };
  return rot90ccw({ x: (b.x - a.x) / len, y: (b.y - a.y) / len });
}

function pointAtT(points: Point[], ts: number[], t: number): Point {
  const last = ts.length - 1;
  if (last < 0) return { x: 0, y: 0 };
  if (t <= ts[0]) return points[0];
  if (t >= ts[last]) return points[last];
  let i = 0;
  while (i < last - 1 && ts[i + 1] < t) i++;
  const span = ts[i + 1] - ts[i];
  const f = span <= 0 ? 0 : (t - ts[i]) / span;
  return {
    x: points[i].x + (points[i + 1].x - points[i].x) * f,
    y: points[i].y + (points[i + 1].y - points[i].y) * f,
  };
}

function endCorners(
  wall: PlanWall,
  v: PlanVertex,
  d: Point,
  nL: Point,
  h: number,
  map: Map<string, PlanVertex>,
  neighbors: PlanWall[],
  atB: boolean,
): [Point, Point, Point | null] {
  const buttLeft = { x: v.x + nL.x * h, y: v.y + nL.y * h };
  const buttRight = { x: v.x - nL.x * h, y: v.y - nL.y * h };

  const away = atB ? { x: -d.x, y: -d.y } : d;
  const edges = neighborEdges(wall, v, map, neighbors);
  if (edges.length === 0) return [buttLeft, buttRight, null];

  const a0 = Math.atan2(away.y, away.x);
  let ccw: { dir: Point; h: number } | null = null;
  let ccwDelta = Infinity;
  let cw: { dir: Point; h: number } | null = null;
  let cwDelta = Infinity;
  for (const edge of edges) {
    const angle = Math.atan2(edge.dir.y, edge.dir.x);
    const up = positiveMod(angle - a0);
    const down = positiveMod(a0 - angle);
    if (up < ccwDelta) {
      ccwDelta = up;
      ccw = edge;
    }
    if (down < cwDelta) {
      cwDelta = down;
      cw = edge;
    }
  }

  const leftLine: Line = { p: buttLeft, d };
  const rightLine: Line = { p: buttRight, d };
  const left = miterCorner(v, leftLine, mateLine(v, atB ? cw! : ccw!, !atB), buttLeft, h);
  const right = miterCorner(v, rightLine, mateLine(v, atB ? ccw! : cw!, atB), buttRight, h);
  // Two walls share both corners, so their end edges already abut. Three or
  // more each share one corner with a different neighbor, leaving a core around
  // the vertex that only a detour through it covers.
  const cap = edges.length >= 2 ? { x: v.x, y: v.y } : null;
  return [left, right, cap];
}

function mateLine(v: PlanVertex, mate: { dir: Point; h: number }, isCcw: boolean): Line {
  const n = isCcw ? rot90cw(mate.dir) : rot90ccw(mate.dir);
  return { p: { x: v.x + n.x * mate.h, y: v.y + n.y * mate.h }, d: mate.dir };
}

function miterCorner(v: PlanVertex, line: Line, mate: Line, butt: Point, h: number): Point {
  const denom = line.d.x * mate.d.y - line.d.y * mate.d.x;
  if (Math.abs(denom) < 1e-12) return butt;
  const t = ((mate.p.x - line.p.x) * mate.d.y - (mate.p.y - line.p.y) * mate.d.x) / denom;
  const corner = { x: line.p.x + t * line.d.x, y: line.p.y + t * line.d.y };
  const offX = corner.x - v.x;
  const offY = corner.y - v.y;
  const dist = Math.hypot(offX, offY);
  const max = MITER_LIMIT * h;
  if (dist <= max) return corner;
  const scale = max / dist;
  return { x: v.x + offX * scale, y: v.y + offY * scale };
}

function neighborEdges(
  wall: PlanWall,
  v: PlanVertex,
  map: Map<string, PlanVertex>,
  neighbors: PlanWall[],
): Array<{ dir: Point; h: number }> {
  const edges: Array<{ dir: Point; h: number }> = [];
  for (const n of neighbors) {
    if (n.id === wall.id) continue;
    const otherId = n.a === v.id ? n.b : n.b === v.id ? n.a : null;
    if (otherId === null) continue;
    const toward = n.curve ?? map.get(otherId);
    if (!toward) continue;
    const len = Math.hypot(toward.x - v.x, toward.y - v.y);
    if (len === 0) continue;
    edges.push({
      dir: { x: (toward.x - v.x) / len, y: (toward.y - v.y) / len },
      h: n.thickness / 2,
    });
  }
  return edges;
}

function curvedRibbon(wall: PlanWall, map: Map<string, PlanVertex>, h: number): Ribbon | null {
  const line = flattenWall(wall, map);
  if (line.length < 2) return null;
  const normals: Point[] = [];
  for (let i = 0; i < line.length - 1; i++) {
    const len = Math.hypot(line[i + 1].x - line[i].x, line[i + 1].y - line[i].y);
    if (len === 0) {
      normals.push(normals[normals.length - 1] ?? { x: 0, y: 0 });
      continue;
    }
    normals.push(
      rot90ccw({ x: (line[i + 1].x - line[i].x) / len, y: (line[i + 1].y - line[i].y) / len }),
    );
  }
  const left: Point[] = [];
  const right: Point[] = [];
  const t: number[] = [];
  for (let i = 0; i < line.length; i++) {
    t.push(i / CURVE_SEGMENTS);
    const nPrev = normals[Math.max(0, i - 1)];
    const nNext = normals[Math.min(normals.length - 1, i)];
    let mx = nPrev.x + nNext.x;
    let my = nPrev.y + nNext.y;
    const mLen = Math.hypot(mx, my);
    if (mLen < 1e-12) {
      mx = nNext.x;
      my = nNext.y;
    } else {
      mx /= mLen;
      my /= mLen;
    }
    const cos = mx * nNext.x + my * nNext.y;
    const reach = Math.min(h / Math.max(cos, 1e-6), MITER_LIMIT * h);
    left.push({ x: line[i].x + mx * reach, y: line[i].y + my * reach });
    right.push({ x: line[i].x - mx * reach, y: line[i].y - my * reach });
  }
  return { left, right, t, center: line.map((p) => ({ ...p })), half: h, capA: null, capB: null };
}

function positiveMod(angle: number): number {
  const tau = 2 * Math.PI;
  return ((angle % tau) + tau) % tau;
}

function rot90ccw(p: Point): Point {
  return { x: -p.y, y: p.x };
}

function rot90cw(p: Point): Point {
  return { x: p.y, y: -p.x };
}
