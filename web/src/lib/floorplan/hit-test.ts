import { flattenWall, pointInPolygon, pointSegmentDistance } from "./geometry";
import { openingSpan } from "./openings";
import type { Face, PlanGraph, PlanOpening, PlanVertex, PlanWall, Point } from "./types";

/** An opening together with the wall it sits on and its span on the centerline. */
export interface OpeningView {
  wall: PlanWall;
  opening: PlanOpening;
  span: Point[];
}

/** Every opening in the plan, ready to hit-test and draw. */
export function openingViews(graph: PlanGraph): OpeningView[] {
  return graph.walls.flatMap((wall) =>
    (wall.openings ?? []).map((opening) => ({
      wall,
      opening,
      span: openingSpan(wall, graph.vertices, opening),
    })),
  );
}

/** The vertex nearest `p` within `reach`, or null. */
export function hitVertex(graph: PlanGraph, p: Point, reach: number): PlanVertex | null {
  let best: PlanVertex | null = null;
  let bestDistance = reach;
  for (const v of graph.vertices) {
    const d = Math.hypot(v.x - p.x, v.y - p.y);
    if (d <= bestDistance) {
      best = v;
      bestDistance = d;
    }
  }
  return best;
}

/**
 * The wall under `p`, or null. A thick wall is grabbable across its whole body,
 * so the reach widens to its half-thickness where that is more than `reach`.
 */
export function hitWall(graph: PlanGraph, p: Point, reach: number): PlanWall | null {
  let best: PlanWall | null = null;
  let bestDistance = Infinity;
  for (const wall of graph.walls) {
    const points = flattenWall(wall, graph.vertices);
    const wallReach = Math.max(reach, wall.thickness / 2);
    for (let i = 0; i < points.length - 1; i++) {
      const d = pointSegmentDistance(p, points[i], points[i + 1]);
      if (d <= wallReach && d < bestDistance) {
        best = wall;
        bestDistance = d;
      }
    }
  }
  return best;
}

/** The index of the smallest face containing `p`, so a room inside a room wins. */
export function hitFace(faces: Face[], p: Point): number | null {
  let best: number | null = null;
  let bestArea = Infinity;
  for (let i = 0; i < faces.length; i++) {
    if (pointInPolygon(p, faces[i].polygon) && faces[i].area < bestArea) {
      best = i;
      bestArea = faces[i].area;
    }
  }
  return best;
}

/** The opening under `p`, tested against the gap it cuts rather than the wall. */
export function hitOpening(views: OpeningView[], p: Point, reach: number): OpeningView | null {
  let best: OpeningView | null = null;
  let bestDistance = Infinity;
  for (const view of views) {
    const openingReach = Math.max(reach, view.wall.thickness / 2);
    for (let i = 0; i < view.span.length - 1; i++) {
      const d = pointSegmentDistance(p, view.span[i], view.span[i + 1]);
      if (d <= openingReach && d < bestDistance) {
        best = view;
        bestDistance = d;
      }
    }
  }
  return best;
}

/** An opening's width handle under `p`, with the end that stays put while it drags. */
export interface OpeningEndHit extends OpeningView {
  anchor: Point;
}

/**
 * The end handle under `p` of an opening in `ids`. Only those carry handles, so
 * only they can be resized.
 */
export function hitOpeningEnd(
  views: OpeningView[],
  ids: Set<string>,
  p: Point,
  reach: number,
): OpeningEndHit | null {
  for (const view of views) {
    if (!ids.has(view.opening.id)) continue;
    const ends = [view.span[0], view.span[view.span.length - 1]];
    for (let i = 0; i < 2; i++) {
      if (Math.hypot(ends[i].x - p.x, ends[i].y - p.y) <= reach) {
        return { ...view, anchor: ends[1 - i] };
      }
    }
  }
  return null;
}

/** What a rectangle sweep takes: the vertices inside it and the walls wholly inside. */
export function sweptSelection(
  graph: PlanGraph,
  a: Point,
  b: Point,
): { vertexIds: string[]; wallIds: string[] } {
  const minX = Math.min(a.x, b.x);
  const maxX = Math.max(a.x, b.x);
  const minY = Math.min(a.y, b.y);
  const maxY = Math.max(a.y, b.y);
  const vertexIds = graph.vertices
    .filter((v) => v.x >= minX && v.x <= maxX && v.y >= minY && v.y <= maxY)
    .map((v) => v.id);
  const swept = new Set(vertexIds);
  // Both ends inside, so a wall only half-covered by the sweep is left alone.
  const wallIds = graph.walls.filter((w) => swept.has(w.a) && swept.has(w.b)).map((w) => w.id);
  return { vertexIds, wallIds };
}

/** What a press or a hover found under the pointer. */
export type PlanGrab =
  | { kind: "marker"; index: number }
  | { kind: "bend"; wallId: string }
  | { kind: "openingEdge"; wallId: string; openingId: string; anchor: Point }
  | { kind: "opening"; wallId: string; openingId: string }
  | { kind: "vertex"; vertexId: string }
  | { kind: "wall"; wallId: string }
  | { kind: "face"; index: number }
  | null;

export interface GrabInput {
  graph: PlanGraph;
  faces: Face[];
  openings: OpeningView[];
  /** Openings currently selected, the only ones carrying width handles. */
  selectedOpeningIds: Set<string>;
  /** Marker positions, in draw order; the last one drawn is on top. */
  markers: Point[];
  markerReach: number;
  /** The selected wall's bend handle, when there is exactly one. */
  bend: { wallId: string; point: Point } | null;
  reach: number;
}

/**
 * What the pointer is over at `at`, resolved once so a press, a click and a
 * hover can never disagree about what is on top. The order is the drawing order
 * read back to front: markers sit above the plan, a handle sits above the thing
 * it edits, and a face is the last resort under everything.
 *
 * `handles` is off for a click and a hover, because a bend or width handle is
 * something to drag — releasing on one without moving should select what lies
 * beneath it instead.
 */
export function grabTarget(input: GrabInput, at: Point, handles = true): PlanGrab {
  for (let i = input.markers.length - 1; i >= 0; i--) {
    const m = input.markers[i];
    if (Math.hypot(m.x - at.x, m.y - at.y) <= input.markerReach)
      return { kind: "marker", index: i };
  }

  if (handles) {
    if (
      input.bend &&
      Math.hypot(input.bend.point.x - at.x, input.bend.point.y - at.y) <= input.reach
    ) {
      return { kind: "bend", wallId: input.bend.wallId };
    }
    const edge = hitOpeningEnd(input.openings, input.selectedOpeningIds, at, input.reach);
    if (edge) {
      return {
        kind: "openingEdge",
        wallId: edge.wall.id,
        openingId: edge.opening.id,
        anchor: edge.anchor,
      };
    }
  }

  const opening = hitOpening(input.openings, at, input.reach);
  if (opening) {
    return { kind: "opening", wallId: opening.wall.id, openingId: opening.opening.id };
  }
  const vertex = hitVertex(input.graph, at, input.reach);
  if (vertex) return { kind: "vertex", vertexId: vertex.id };
  const wall = hitWall(input.graph, at, input.reach);
  if (wall) return { kind: "wall", wallId: wall.id };
  const face = hitFace(input.faces, at);
  return face === null ? null : { kind: "face", index: face };
}
