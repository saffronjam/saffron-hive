import { EXACT_EPSILON, normalizeGraph } from "./graph";
import {
  controlForApex,
  flattenWall,
  pointInPolygon,
  pointSegmentDistance,
  projectOntoWall,
  segmentIntersection,
  vertexMap,
} from "./geometry";
import type { IdMint } from "./detach";
import { DEFAULT_OPENING_WIDTH_M, clampOpening } from "./openings";
import type { Face, OpeningKind, PlanGraph, PlanOpening, PlanWall, Point } from "./types";

/** A deep-enough copy to edit without touching the graph the caller still holds. */
export function cloneGraph(graph: PlanGraph): PlanGraph {
  return {
    vertices: graph.vertices.map((v) => ({ ...v })),
    walls: graph.walls.map((w) => ({
      ...w,
      ...(w.curve ? { curve: { ...w.curve } } : {}),
      ...(w.openings ? { openings: w.openings.map((o) => ({ ...o })) } : {}),
    })),
  };
}

/**
 * Rewrite one opening, clamped back inside its wall. `patch` receives the
 * opening and the wall it belongs to, and everything else is left alone.
 */
export function withOpening(
  graph: PlanGraph,
  wallId: string,
  openingId: string,
  patch: (opening: PlanOpening, wall: PlanWall) => PlanOpening,
): PlanGraph {
  const next = cloneGraph(graph);
  const wall = next.walls.find((w) => w.id === wallId);
  if (!wall?.openings) return next;
  wall.openings = wall.openings.map((o) =>
    o.id === openingId ? clampOpening(wall, next.vertices, patch(o, wall)) : o,
  );
  return next;
}

/** Drop openings by id, wherever they sit. */
export function removeOpenings(graph: PlanGraph, ids: Iterable<string>): PlanGraph {
  const drop = new Set(ids);
  return {
    ...graph,
    walls: graph.walls.map((wall) => {
      if (!wall.openings?.some((o) => drop.has(o.id))) return wall;
      const kept = wall.openings.filter((o) => !drop.has(o.id));
      const { openings: _removed, ...rest } = wall;
      return kept.length > 0 ? { ...rest, openings: kept } : rest;
    }),
  };
}

/** Turn one opening into a door, a window or a plain opening. */
export function setOpeningKind(graph: PlanGraph, id: string, kind: OpeningKind): PlanGraph {
  return {
    ...graph,
    walls: graph.walls.map((wall) =>
      wall.openings?.some((o) => o.id === id)
        ? { ...wall, openings: wall.openings.map((o) => (o.id === id ? { ...o, kind } : o)) }
        : wall,
    ),
  };
}

export function setWallThickness(graph: PlanGraph, id: string, thickness: number): PlanGraph {
  return {
    ...graph,
    walls: graph.walls.map((w) => (w.id === id ? { ...w, thickness } : w)),
  };
}

/**
 * Bend a wall so its midpoint passes through `apex`, or straighten it when the
 * apex comes back within `straightenWithin` of where a straight wall's midpoint
 * would be.
 */
export function bendWall(
  graph: PlanGraph,
  wallId: string,
  apex: Point,
  straightenWithin: number,
): PlanGraph {
  const next = cloneGraph(graph);
  const wall = next.walls.find((w) => w.id === wallId);
  const a = next.vertices.find((v) => v.id === wall?.a);
  const b = next.vertices.find((v) => v.id === wall?.b);
  if (!wall || !a || !b) return next;
  // Dropping the apex anywhere on the wall's line straightens it. Testing only
  // the midpoint would leave a wall that looks straight but still carries a
  // curve — and that hidden control point resurfaces bent on the next drag.
  if (pointSegmentDistance(apex, a, b) <= straightenWithin) {
    delete wall.curve;
    return next;
  }
  wall.curve = controlForApex(a, b, apex);
  // A curve is never split at crossings, so letting it pass through another
  // wall would leave the graph non-planar and quietly break face detection.
  // An illegal bend is refused whole: the drag sticks at its last legal shape.
  return curveCollidesAnotherWall(next, wall) ? graph : next;
}

/**
 * Bring curve control points along with a rigid drag and veto frames whose
 * curve would cross a wall. Controls are absolute coordinates, so a wall whose
 * both ends travel must move its control by the same delta — and a moved curve
 * obeys the same crossing rule a bend drag does, since curves are never split
 * at crossings and a crossing quietly breaks the rooms. Mutates `graph`, which
 * drag loops build fresh per frame; returns false when the frame must be
 * dropped.
 */
export function carryWallCurves(
  graph: PlanGraph,
  moved: (vertexId: string) => boolean,
  by: Point,
): boolean {
  const touchesMoved = (w: PlanWall) => moved(w.a) || moved(w.b);
  for (const wall of graph.walls) {
    if (wall.curve && moved(wall.a) && moved(wall.b)) {
      wall.curve = { x: wall.curve.x + by.x, y: wall.curve.y + by.y };
    }
  }
  for (const wall of graph.walls) {
    if (!wall.curve) continue;
    if (touchesMoved(wall)) {
      if (curveCollidesAnotherWall(graph, wall)) return false;
    } else if (curveCollidesAnotherWall(graph, wall, touchesMoved)) {
      // A stationary curve is just as broken when a dragged wall sweeps into
      // it. Checking only against moved walls keeps a plan that already holds
      // an illegal curve draggable everywhere else.
      return false;
    }
  }
  return true;
}

/**
 * Whether `wall`'s curve body collides with another wall's body — closer than
 * their summed half-thicknesses — checked against all walls, or just those
 * matching `against`.
 *
 * A distance rule rather than a crossing test: apex and walls both snap to the
 * grid, so a curve can sit exactly tangent on a wall or cross it precisely at
 * a flattened sample point, and an intersection parity test waves both
 * through. Segments hugging a vertex the two walls share are exempt — bodies
 * legitimately meet at their junction.
 */
export function curveCollidesAnotherWall(
  graph: PlanGraph,
  wall: PlanWall,
  against?: (other: PlanWall) => boolean,
): boolean {
  const verts = vertexMap(graph.vertices);
  const curve = flattenWall(wall, verts);
  for (const other of graph.walls) {
    if (other.id === wall.id) continue;
    if (against && !against(other)) continue;
    const clearance = (wall.thickness + other.thickness) / 2;
    const shared: Point[] = [];
    for (const mine of [wall.a, wall.b]) {
      if (mine === other.a || mine === other.b) {
        const v = verts.get(mine);
        if (v) shared.push(v);
      }
    }
    const exempt = clearance * 3;
    const line = flattenWall(other, verts);
    for (let i = 1; i < curve.length; i++) {
      const p0 = curve[i - 1];
      const p1 = curve[i];
      if (
        shared.some(
          (v) =>
            Math.hypot(p0.x - v.x, p0.y - v.y) <= exempt ||
            Math.hypot(p1.x - v.x, p1.y - v.y) <= exempt,
        )
      ) {
        continue;
      }
      for (let j = 1; j < line.length; j++) {
        if (segmentDistance(p0, p1, line[j - 1], line[j]) < clearance) return true;
      }
    }
  }
  return false;
}

/** The closest distance between two segments; zero when they intersect. */
function segmentDistance(a0: Point, a1: Point, b0: Point, b1: Point): number {
  if (segmentIntersection(a0, a1, b0, b1)) return 0;
  return Math.min(
    pointSegmentDistance(a0, b0, b1),
    pointSegmentDistance(a1, b0, b1),
    pointSegmentDistance(b0, a0, a1),
    pointSegmentDistance(b1, a0, a1),
  );
}

/** Reuse the vertex sitting on `p` — after a normalize those match exactly — or mint one. */
function vertexAt(graph: PlanGraph, p: Point, mint: IdMint): string {
  for (const v of graph.vertices) {
    if (Math.hypot(v.x - p.x, v.y - p.y) < EXACT_EPSILON) return v.id;
  }
  const id = mint.vertexId();
  graph.vertices.push({ id, x: p.x, y: p.y });
  return id;
}

/**
 * Draw a wall between two points, reusing whatever vertices are already there.
 * A zero-length segment is no wall at all and changes nothing.
 */
export function connectPoints(
  graph: PlanGraph,
  from: Point,
  to: Point,
  thickness: number,
  mint: IdMint,
): PlanGraph {
  if (Math.hypot(to.x - from.x, to.y - from.y) < EXACT_EPSILON) return graph;
  const next = cloneGraph(graph);
  const a = vertexAt(next, from, mint);
  const b = vertexAt(next, to, mint);
  if (a === b) return graph;
  next.walls.push({ id: mint.wallId(), a, b, thickness });
  return next;
}

/** Stamp the four walls of an axis-aligned room between two opposite corners. */
export function stampRoom(
  graph: PlanGraph,
  a: Point,
  b: Point,
  thickness: number,
  mint: IdMint,
): PlanGraph {
  const next = cloneGraph(graph);
  const corners = [
    vertexAt(next, { x: a.x, y: a.y }, mint),
    vertexAt(next, { x: b.x, y: a.y }, mint),
    vertexAt(next, { x: b.x, y: b.y }, mint),
    vertexAt(next, { x: a.x, y: b.y }, mint),
  ];
  for (let i = 0; i < corners.length; i++) {
    const from = corners[i];
    const to = corners[(i + 1) % corners.length];
    if (from !== to) next.walls.push({ id: mint.wallId(), a: from, b: to, thickness });
  }
  return next;
}

/**
 * Cut an opening into `wallId`, centred where the point projects onto it and
 * clamped to fit. Returns the graph unchanged when the wall is not there.
 */
export function addOpening(
  graph: PlanGraph,
  wallId: string,
  at: Point,
  kind: OpeningKind,
  id: string,
): PlanGraph {
  const next = cloneGraph(graph);
  const wall = next.walls.find((w) => w.id === wallId);
  if (!wall) return graph;
  const opening = clampOpening(wall, next.vertices, {
    id,
    t: projectOntoWall(at, wall, next.vertices).t,
    width: DEFAULT_OPENING_WIDTH_M[kind],
    kind,
  });
  wall.openings = [...(wall.openings ?? []), opening];
  return next;
}

/**
 * Move a corner and carry the wall lines it sits on with it, so an axis-aligned
 * room changes size instead of shape.
 *
 * The shift travels along the walls rather than stopping at the corner's
 * neighbours: a wall standing vertical hands its sideways shift to its far end,
 * which hands it to whatever continues past that, and so on down the line. That
 * is what keeps a run straight when something is joined partway along it —
 * stopping at the first neighbour bends the run at that joint. Walls crossing a
 * shifted line simply grow or shrink, since only the end on the line moves.
 *
 * A wall already lying at an angle constrains nothing and is left alone.
 */
export function resizeAtCorner(graph: PlanGraph, vertexId: string, to: Point): PlanGraph {
  const from = graph.vertices.find((v) => v.id === vertexId);
  if (!from) return graph;
  const by = { x: to.x - from.x, y: to.y - from.y };

  const at = new Map(graph.vertices.map((v) => [v.id, v]));
  const shift = new Map<string, Point>([[vertexId, { ...by }]]);

  // Settle by repetition: every pass can only add a shift, and there are no more
  // shifts to add than there are corners.
  for (let pass = 0; pass < graph.vertices.length; pass++) {
    let changed = false;
    for (const wall of graph.walls) {
      if (wall.curve) continue;
      for (const [id, otherId] of [
        [wall.a, wall.b],
        [wall.b, wall.a],
      ]) {
        // The dragged corner is where the shift comes from and never takes one.
        if (otherId === vertexId) continue;
        const moving = shift.get(id);
        const p = at.get(id);
        const q = at.get(otherId);
        if (!moving || !p || !q) continue;
        const carried = shift.get(otherId) ?? { x: 0, y: 0 };
        const next = { ...carried };
        // Only a real shift travels. Standing still is the default rather than
        // something to pass on, or a wall going nowhere would cancel the drag on
        // its way back round the room.
        if (moving.x !== 0 && Math.abs(p.x - q.x) < EXACT_EPSILON) next.x = moving.x;
        if (moving.y !== 0 && Math.abs(p.y - q.y) < EXACT_EPSILON) next.y = moving.y;
        if (next.x === carried.x && next.y === carried.y) continue;
        shift.set(otherId, next);
        changed = true;
      }
    }
    if (!changed) break;
  }

  return {
    ...graph,
    vertices: graph.vertices.map((v) => {
      const moved = shift.get(v.id);
      return moved ? { ...v, x: v.x + moved.x, y: v.y + moved.y } : v;
    }),
  };
}

/** The wall an id came from, before normalizing split it into segments. */
/**
 * The shortest a wall may be left by a drag, in meters. A wall that reaches zero
 * folds its room into a line, and there is nothing left to grab to get it back.
 */
export const MIN_WALL_LENGTH_M = 0.1;

/**
 * Shorten a wall drag so it cannot collapse the walls at its ends.
 *
 * Sliding a wall across its room shortens the walls running to it, and on the
 * grid it lands exactly on the far side, so the room's width becomes zero rather
 * than merely small. Each shortening wall gives the range of distances that
 * would take it under {@link MIN_WALL_LENGTH_M}; the drag stops at the nearest
 * edge of the first such range it would enter, so the wall slides right up to
 * its limit instead of jumping or sticking.
 *
 * A wall already at or under that length is left out of the reckoning. The point
 * is to stop a drag entering that state, not to hold it there once it is — a
 * short joint between two corners is exactly the thing a drag needs to be able
 * to close.
 *
 * `origin` holds the moving endpoints where they were before the drag, and the
 * wall travels along `normal`, so an endpoint at `o` sits at `o + normal * d`.
 */
export function clampWallDrag(
  graph: PlanGraph,
  origin: Map<string, Point>,
  normal: Point,
  distance: number,
): number {
  if (distance === 0) return distance;
  const at = new Map(graph.vertices.map((v) => [v.id, v]));
  let limited = distance;

  for (const wall of graph.walls) {
    const movingId = origin.has(wall.a) ? wall.a : origin.has(wall.b) ? wall.b : null;
    // A wall moving at both ends keeps its length, and one moving at neither is
    // no business of this drag.
    if (movingId === null) continue;
    const fixedId = movingId === wall.a ? wall.b : wall.a;
    if (origin.has(fixedId)) continue;
    const from = origin.get(movingId);
    const to = at.get(fixedId);
    if (!from || !to) continue;

    const away = { x: from.x - to.x, y: from.y - to.y };
    const spanSquared = away.x * away.x + away.y * away.y;
    const floor = MIN_WALL_LENGTH_M * MIN_WALL_LENGTH_M;
    if (spanSquared <= floor + EXACT_EPSILON) continue;

    // |(from - to) + normal * d| < MIN over an interval of d between the roots.
    const along = away.x * normal.x + away.y * normal.y;
    const discriminant = along * along - (spanSquared - floor);
    if (discriminant <= 0) continue;
    const root = Math.sqrt(discriminant);
    const enters = -along - root;
    const leaves = -along + root;
    if (distance > 0 && enters > 0) limited = Math.min(limited, enters);
    if (distance < 0 && leaves < 0) limited = Math.max(limited, leaves);
  }
  return limited;
}

/**
 * Whether `id` is one of `wallIds` or a piece cut from one. Splitting appends a
 * `~n` to the id it came from, and a wall that has been split before is split
 * again with another suffix, so every prefix ending at a `~` is an ancestor and
 * any of them may be the one that was asked for.
 */
function tracesTo(id: string, wallIds: Set<string>): boolean {
  if (wallIds.has(id)) return true;
  for (let cut = id.indexOf("~"); cut !== -1; cut = id.indexOf("~", cut + 1)) {
    if (wallIds.has(id.slice(0, cut))) return true;
  }
  return false;
}

/** Whether `p` is inside the face and not sitting on its outline. */
function strictlyInside(p: Point, face: Face): boolean {
  if (!pointInPolygon(p, face.polygon)) return false;
  const ring = face.polygon;
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i];
    const b = ring[(i + 1) % ring.length];
    if (pointSegmentDistance(p, a, b) < EXACT_EPSILON) return false;
  }
  return true;
}

/**
 * Add a room's walls and drop the stretches that land inside rooms already
 * there, so a room placed over another stops at its edge instead of running
 * through it. Overlapping rooms are not a thing a plan can mean.
 *
 * Normalizing first is what makes this simple: it splits the new walls at every
 * crossing, so trimming is a matter of dropping whole segments rather than
 * cutting them. `faces` are the rooms as they were before the placement.
 */
export function addRoomClipped(
  graph: PlanGraph,
  a: Point,
  b: Point,
  thickness: number,
  mint: IdMint,
  faces: Face[],
): PlanGraph {
  const stamped = stampRoom(graph, a, b, thickness, mint);
  const added = new Set(
    stamped.walls.filter((w) => !graph.walls.some((old) => old.id === w.id)).map((w) => w.id),
  );
  return trimWallsInsideFaces(stamped, added, faces);
}

/**
 * Drop the stretches of `wallIds` that lie inside `faces`, so a room put over
 * another stops at its edge. Overlapping rooms are not something a plan can
 * mean, whether the room arrived by being placed or by being dragged there.
 *
 * Normalizing first is what makes this simple: it splits the walls at every
 * crossing, so trimming is a matter of dropping whole segments rather than
 * cutting them. `faces` are the rooms that are staying put.
 */
export function trimWallsInsideFaces(
  graph: PlanGraph,
  wallIds: Set<string>,
  faces: Face[],
): PlanGraph {
  if (wallIds.size === 0 || faces.length === 0) return graph;

  const split = normalizeGraph(graph);
  const kept = split.walls.filter((wall) => {
    if (!tracesTo(wall.id, wallIds)) return true;
    const from = split.vertices.find((v) => v.id === wall.a);
    const to = split.vertices.find((v) => v.id === wall.b);
    if (!from || !to) return true;
    const middle = { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 };
    return !faces.some((face) => strictlyInside(middle, face));
  });
  return kept.length === split.walls.length ? split : { vertices: split.vertices, walls: kept };
}
