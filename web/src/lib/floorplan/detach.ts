import { vertexMap } from "./geometry";
import type { Face, PlanGraph, PlanVertex, Point } from "./types";

/**
 * How far from parallel a wall may sit and still count as continuing the
 * dragged one. The value is |sin θ|, so this is a hair under 0.6°.
 */
const COLLINEAR_SIN = 0.01;

/**
 * Undirected endpoint-pair keys for a face's boundary edges. Two faces share
 * an edge exactly when their key sets intersect.
 */
export function facePairKeys(face: Face): Set<string> {
  const out = new Set<string>();
  const ids = face.vertexIds;
  for (let i = 0; i < ids.length; i++) {
    out.add(pairKey(ids[i], ids[(i + 1) % ids.length]));
  }
  return out;
}

/** Undirected endpoint-pair key for one wall. */
export function wallPairKey(wall: { a: string; b: string }): string {
  return pairKey(wall.a, wall.b);
}

function pairKey(a: string, b: string): string {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

/** Id factories, supplied by the caller so this module stays dependency-free. */
export interface IdMint {
  vertexId: () => string;
  wallId: () => string;
}

export interface WallDetachResult {
  graph: PlanGraph;
  /** Vertex ids the wall drag moves, at their positions before it. */
  moved: Map<string, Point>;
}

/**
 * Split a wall free of the neighbours that must not move with it, so sliding it
 * sideways carries only the walls that belong to the rooms it bounds.
 *
 * Two kinds of neighbour stay behind at a corner:
 *
 * - The straight run continuing past the end. Two walls sharing a vertex can
 *   only be parallel by being collinear, so a parallel neighbour is the next
 *   stretch of the same long wall; dragging its far-away end would swing it into
 *   a diagonal.
 * - A wall that also bounds a room the dragged wall does not. Moving its corner
 *   shortens it, and it can be shortened past the point where that room's own
 *   walls meet it, which pulls that room open.
 *
 * When a shared wall stays, a connector takes its place between the old corner
 * and the new one, so the rooms on both sides stay closed however far the drag
 * goes: it fills the gap when the wall would have shortened, and extends the run
 * when it would have lengthened.
 *
 * The result is deliberately not normalized: the copy starts out exactly on the
 * original, so a merge pass would undo the split.
 */
export function detachWallEnds(
  graph: PlanGraph,
  wallId: string,
  faces: Face[],
  mint: IdMint,
): WallDetachResult {
  const source = graph.walls.find((w) => w.id === wallId);
  const byId = vertexMap(graph.vertices);
  const a = source && byId.get(source.a);
  const b = source && byId.get(source.b);
  if (!source || !a || !b) return { graph, moved: new Map() };
  const length = Math.hypot(b.x - a.x, b.y - a.y);
  if (length === 0) return { graph, moved: new Map() };
  const along = { x: (b.x - a.x) / length, y: (b.y - a.y) / length };

  // Edges of the rooms this wall does not bound: those rooms are staying put.
  const draggedKey = wallPairKey(source);
  const foreign = new Set<string>();
  for (const face of faces) {
    const keys = facePairKeys(face);
    if (keys.has(draggedKey)) continue;
    for (const key of keys) foreign.add(key);
  }

  const vertices = graph.vertices.map((v) => ({ ...v }));
  const walls = graph.walls.map((w) => ({ ...w }));
  const dragged = walls.find((w) => w.id === wallId)!;
  const moved = new Map<string, Point>();

  for (const vertexId of [source.a, source.b]) {
    const vertex = byId.get(vertexId);
    if (!vertex) continue;
    const incident = walls.filter((w) => w.id !== wallId && (w.a === vertexId || w.b === vertexId));
    const shared = incident.filter((w) => foreign.has(wallPairKey(w)));
    const staying = incident.filter(
      (w) => shared.includes(w) || isCollinear(w, vertexId, along, byId),
    );
    if (staying.length === 0) {
      moved.set(vertexId, { x: vertex.x, y: vertex.y });
      continue;
    }
    const copyId = mint.vertexId();
    vertices.push({ id: copyId, x: vertex.x, y: vertex.y });
    for (const wall of [dragged, ...incident.filter((w) => !staying.includes(w))]) {
      if (wall.a === vertexId) wall.a = copyId;
      if (wall.b === vertexId) wall.b = copyId;
    }
    if (shared.length > 0) {
      walls.push({
        id: mint.wallId(),
        a: vertexId,
        b: copyId,
        thickness: shared[0].thickness,
      });
    }
    moved.set(copyId, { x: vertex.x, y: vertex.y });
  }

  return { graph: { vertices, walls }, moved };
}

/** Whether `wall` leaves `vertexId` along the same line as `along`. */
function isCollinear(
  wall: { a: string; b: string; curve?: Point },
  vertexId: string,
  along: Point,
  byId: Map<string, PlanVertex>,
): boolean {
  // A curved wall leaves its endpoint along the control point, and bending is
  // not the same as continuing a straight run — it always follows.
  if (wall.curve) return false;
  const otherId = wall.a === vertexId ? wall.b : wall.a;
  const from = byId.get(vertexId);
  const to = byId.get(otherId);
  if (!from || !to) return false;
  const length = Math.hypot(to.x - from.x, to.y - from.y);
  if (length === 0) return false;
  const dir = { x: (to.x - from.x) / length, y: (to.y - from.y) / length };
  return Math.abs(dir.x * along.y - dir.y * along.x) < COLLINEAR_SIN;
}

export interface DetachResult {
  graph: PlanGraph;
  /** Vertex ids the detached ring is made of, for the drag's origin map. */
  movedVertexIds: Set<string>;
  /** Shared vertices that were duplicated: original id → the ring's new id. */
  idMap: Map<string, string>;
}

/**
 * Split a face free of its neighbours so it can be moved on its own.
 *
 * A corner is duplicated whenever anything outside the ring needs it where it
 * is: a wall that is not part of the ring, or a neighbouring room's corner. The
 * second is what a wall alone misses — where a room meets a neighbour at a
 * corner they share both walls of, no outside wall touches that vertex, and
 * taking it along drags the neighbour's corner with it and bends its walls into
 * diagonals. Corners the room owns outright leave with it, keeping their ids, so
 * dragging a room that touches nothing changes nothing but its coordinates.
 *
 * Walls the face shares with a neighbour are duplicated too: the neighbour keeps
 * the original, the ring gets a copy, so both rooms stay closed. The rest of the
 * ring simply leaves with the room. Nothing outside it is touched.
 *
 * The result is deliberately not normalized: the duplicates sit exactly on
 * their originals, so a merge pass would undo the split.
 */
export function detachFace(
  graph: PlanGraph,
  face: Face,
  otherFaces: Face[],
  mint: IdMint,
): DetachResult {
  const mine = facePairKeys(face);
  const others = new Set<string>();
  for (const other of otherFaces) {
    for (const key of facePairKeys(other)) others.add(key);
  }

  const ringWalls = graph.walls.filter((w) => mine.has(wallPairKey(w)));
  const outsideWalls = graph.walls.filter((w) => !mine.has(wallPairKey(w)));

  const faceVertices = new Set(face.vertexIds);
  const sharedVertices = new Set<string>();
  for (const wall of outsideWalls) {
    if (faceVertices.has(wall.a)) sharedVertices.add(wall.a);
    if (faceVertices.has(wall.b)) sharedVertices.add(wall.b);
  }
  for (const other of otherFaces) {
    for (const id of other.vertexIds) {
      if (faceVertices.has(id)) sharedVertices.add(id);
    }
  }

  const idMap = new Map<string, string>();
  const vertices = graph.vertices.map((v) => ({ ...v }));
  for (const id of sharedVertices) {
    const source = vertices.find((v) => v.id === id);
    if (!source) continue;
    const clone = { id: mint.vertexId(), x: source.x, y: source.y };
    idMap.set(id, clone.id);
    vertices.push(clone);
  }

  const remap = (id: string) => idMap.get(id) ?? id;
  const walls = outsideWalls.map((w) => ({ ...w }));
  for (const wall of ringWalls) {
    const moved = { ...wall, a: remap(wall.a), b: remap(wall.b) };
    if (others.has(wallPairKey(wall))) {
      // Shared with a neighbour: the neighbour keeps the original, the ring
      // gets its own copy so both rooms stay closed. Doors and windows belong
      // to the wall that stays — the copy must not repeat their ids, and a
      // doorway makes no sense in the wall of a room dragged away from it.
      walls.push({ ...wall });
      walls.push({ ...moved, id: mint.wallId(), openings: undefined });
    } else {
      walls.push(moved);
    }
  }

  const movedVertexIds = new Set(face.vertexIds.map(remap));
  const referenced = new Set<string>();
  for (const wall of walls) {
    referenced.add(wall.a);
    referenced.add(wall.b);
  }

  return {
    graph: { vertices: vertices.filter((v) => referenced.has(v.id)), walls },
    movedVertexIds,
    idMap,
  };
}
