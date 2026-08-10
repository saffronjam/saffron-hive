import { detectFaces } from "./faces";
import { faceKey } from "./identity";
import { pointInPolygon } from "./geometry";
import type { Face, PlanGraph, PlanRoomMeta, Point } from "./types";

/** How close a translated corner must land to count the move as rigid. */
const RIGID_EPSILON = 1e-6;

export interface CarryInput<T extends Point> {
  /** The plan as it was when the gesture began. */
  before: { graph: PlanGraph; rooms: PlanRoomMeta[] };
  /** The plan after the commit. */
  after: { faces: Face[]; rooms: PlanRoomMeta[] };
  placements: T[];
}

export interface CarryResult<T extends Point> {
  placements: T[];
  changed: boolean;
}

interface RoomChange {
  oldPolygon: Point[];
  oldArea: number;
  newPolygon: Point[] | null;
  /** Set when the room moved as a rigid body: every corner shifted by this. */
  translation: Point | null;
}

/**
 * Keep placements attached to the rooms they were placed in as a geometry
 * commit lands.
 *
 * A room that moved as a rigid body takes everything inside it along. A room
 * that was deformed — a wall or corner dragged — keeps the placements still
 * inside it, and a placement it leaves behind is removed from the map rather
 * than silently joining whichever room now covers that spot: a stranded light
 * lighting the wrong room is a lie, and the unplaced list is the honest state.
 * The one exception is a placement that lands in a room born from this very
 * commit — splitting a room in two must not sweep half its lights off the map.
 *
 * Pure; callers apply the result before taking the gesture's undo snapshot so
 * that undo restores walls and lights as one step.
 */
export function carryPlacements<T extends Point>(input: CarryInput<T>): CarryResult<T> {
  const oldFaces = detectFaces(input.before.graph);
  const oldFaceByKey = new Map(oldFaces.map((f) => [faceKey(f), f]));
  const newFaceByKey = new Map(input.after.faces.map((f) => [faceKey(f), f]));
  const oldRoomIds = new Set(input.before.rooms.map((r) => r.id));
  const newRoomsById = new Map(input.after.rooms.map((r) => [r.id, r]));

  const changes: RoomChange[] = [];
  for (const room of input.before.rooms) {
    const oldFace = oldFaceByKey.get(faceKey(room));
    if (!oldFace) continue;
    const successor = newRoomsById.get(room.id);
    const newFace = successor ? newFaceByKey.get(faceKey(successor)) : undefined;
    if (!newFace) continue;
    changes.push({
      oldPolygon: oldFace.polygon,
      oldArea: oldFace.area,
      newPolygon: newFace.polygon,
      translation: rigidTranslation(oldFace.polygon, newFace.polygon),
    });
  }
  // Nested rooms resolve like faceContainingPoint: the smallest one wins.
  changes.sort((a, b) => a.oldArea - b.oldArea);

  const roomsBornNow = new Set(
    input.after.rooms.filter((r) => !oldRoomIds.has(r.id)).map((r) => r.id),
  );
  const newRoomByFaceKey = new Map(input.after.rooms.map((r) => [faceKey(r), r]));

  let changed = false;
  const out: T[] = [];
  for (const placement of input.placements) {
    const home = changes.find((c) => pointInPolygon(placement, c.oldPolygon));
    if (!home) {
      out.push(placement);
      continue;
    }
    if (home.translation) {
      const { x, y } = home.translation;
      if (x !== 0 || y !== 0) {
        out.push({ ...placement, x: placement.x + x, y: placement.y + y });
        changed = true;
      } else {
        out.push(placement);
      }
      continue;
    }
    if (home.newPolygon && pointInPolygon(placement, home.newPolygon)) {
      out.push(placement);
      continue;
    }
    const landedIn = smallestContaining(input.after.faces, placement);
    const landedRoom = landedIn ? newRoomByFaceKey.get(faceKey(landedIn)) : undefined;
    if (landedRoom && roomsBornNow.has(landedRoom.id)) {
      out.push(placement);
      continue;
    }
    changed = true;
  }
  return { placements: changed ? out : input.placements, changed };
}

/** The translation carrying `from` onto `to`, or null when the shape changed. */
function rigidTranslation(from: Point[], to: Point[]): Point | null {
  if (from.length !== to.length || from.length === 0) return null;
  let fx = 0;
  let fy = 0;
  let tx = 0;
  let ty = 0;
  for (const p of from) {
    fx += p.x;
    fy += p.y;
  }
  for (const p of to) {
    tx += p.x;
    ty += p.y;
  }
  const shift = { x: (tx - fx) / to.length, y: (ty - fy) / from.length };
  for (const p of from) {
    const target = { x: p.x + shift.x, y: p.y + shift.y };
    const hit = to.some(
      (q) => Math.abs(q.x - target.x) < RIGID_EPSILON && Math.abs(q.y - target.y) < RIGID_EPSILON,
    );
    if (!hit) return null;
  }
  return shift;
}

function smallestContaining(faces: Face[], p: Point): Face | null {
  let best: Face | null = null;
  for (const face of faces) {
    if (!pointInPolygon(p, face.polygon)) continue;
    if (!best || face.area < best.area) best = face;
  }
  return best;
}
