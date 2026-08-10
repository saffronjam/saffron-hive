import type { Face, PlanRoomMeta } from "./types";

/**
 * Stable key tying a derived face to its reconciled room row: both sides carry
 * the same canonical-rotation vertex-id list after `reconcileRooms` runs.
 */
export function faceKey(of: { vertexIds: string[] }): string {
  return of.vertexIds.join("|");
}

/** A detected face paired with the room row it keeps, if any. */
export interface FaceAssignment {
  face: Face;
  room: PlanRoomMeta | null;
}

/** Result of matching detected faces against persisted room rows. */
export interface MatchResult {
  assignments: FaceAssignment[];
  detachedRoomIds: string[];
}

interface Candidate {
  faceIndex: number;
  roomIndex: number;
  jaccard: number;
  areaDelta: number;
}

/**
 * Match detected faces to persisted room rows so identity survives edits.
 * Greedy by vertex-id Jaccard overlap — the highest overlap wins and each
 * room is used at most once; equal overlaps prefer the candidate whose face
 * area is closest to the room's stored area. Unmatched rooms that carry a
 * name or a Hive-room link are reported detached; anonymous unmatched rooms
 * are dropped silently.
 */
export function matchFaces(faces: Face[], rooms: PlanRoomMeta[]): MatchResult {
  const candidates: Candidate[] = [];
  for (let f = 0; f < faces.length; f++) {
    const faceIds = new Set(faces[f].vertexIds);
    for (let r = 0; r < rooms.length; r++) {
      const jaccard = jaccardOverlap(faceIds, rooms[r].vertexIds);
      if (jaccard <= 0) continue;
      const areaDelta =
        rooms[r].area === undefined ? Infinity : Math.abs(faces[f].area - rooms[r].area!);
      candidates.push({ faceIndex: f, roomIndex: r, jaccard, areaDelta });
    }
  }

  candidates.sort((p, q) => {
    if (p.jaccard !== q.jaccard) return q.jaccard - p.jaccard;
    if (p.areaDelta !== q.areaDelta) return p.areaDelta - q.areaDelta;
    if (rooms[p.roomIndex].id !== rooms[q.roomIndex].id) {
      return rooms[p.roomIndex].id < rooms[q.roomIndex].id ? -1 : 1;
    }
    return p.faceIndex - q.faceIndex;
  });

  const roomByFace = new Map<number, PlanRoomMeta>();
  const usedRooms = new Set<number>();
  for (const c of candidates) {
    if (roomByFace.has(c.faceIndex) || usedRooms.has(c.roomIndex)) continue;
    roomByFace.set(c.faceIndex, rooms[c.roomIndex]);
    usedRooms.add(c.roomIndex);
  }

  const assignments = faces.map((face, i) => ({ face, room: roomByFace.get(i) ?? null }));
  const detachedRoomIds = rooms
    .filter((room, i) => !usedRooms.has(i) && (room.name !== null || room.roomId !== null))
    .map((room) => room.id);
  return { assignments, detachedRoomIds };
}

function jaccardOverlap(faceIds: Set<string>, roomIds: string[]): number {
  const roomSet = new Set(roomIds);
  if (faceIds.size === 0 || roomSet.size === 0) return 0;
  let intersection = 0;
  for (const id of roomSet) {
    if (faceIds.has(id)) intersection++;
  }
  const union = faceIds.size + roomSet.size - intersection;
  return union === 0 ? 0 : intersection / union;
}
