import { matchFaces } from "$lib/floorplan";
import type { Face, OpeningKind, PlanGraph, PlanOpening, PlanRoomMeta } from "$lib/floorplan";
import { FloorplanOpeningKind } from "$lib/gql/graphql";
import { placementKey } from "$lib/floorplan/placement-conflicts";
import type {
  Placement,
  PlacementMemberType,
  PlacementRef,
} from "$lib/floorplan/placement-conflicts";

export { placementKey };
export type { Placement, PlacementMemberType, PlacementRef };

export interface FloorplanVertexData {
  id: string;
  x: number;
  y: number;
}

export interface FloorplanWallData {
  id: string;
  vertexA: string;
  vertexB: string;
  thickness: number;
  curveX?: number | null;
  curveY?: number | null;
}

export interface FloorplanOpeningData {
  id: string;
  wallId: string;
  t: number;
  width: number;
  kind: FloorplanOpeningKind;
}

export interface FloorplanRoomData {
  id: string;
  name?: string | null;
  roomId?: string | null;
  vertexIds: string[];
}

/** A marker on the plan: a device or a group, at a point in world meters. */
export type FloorplanPlacementData = Placement;

/**
 * A piece standing on the plan. `x`/`y` is its centre and `width`/`height` its
 * unrotated footprint in meters, `rotation` degrees clockwise. `kind` names a
 * shape in the furniture catalogue; an occluder blocks light where it stands.
 */
export interface FloorplanFurnitureData {
  id: string;
  kind: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  occluder: boolean;
}

export interface FloorplanData {
  id: string;
  name: string;
  vertices: FloorplanVertexData[];
  walls: FloorplanWallData[];
  /** Persisted flat, keyed by wall; nested into their walls by `floorplanToGraph`. */
  openings: FloorplanOpeningData[];
  rooms: FloorplanRoomData[];
  /** `memberType` arrives from GraphQL as a plain string and is narrowed here. */
  placements: { memberType: string; memberId: string; x: number; y: number }[];
  furniture: FloorplanFurnitureData[];
}

/** Shape of the GraphQL `UpdateFloorplanInput`. */
export interface UpdateFloorplanInputData {
  id: string;
  name: string;
  vertices: FloorplanVertexData[];
  walls: Required<FloorplanWallData>[];
  openings: FloorplanOpeningData[];
  rooms: { id: string; name: string | null; roomId: string | null; vertexIds: string[] }[];
  placements: FloorplanPlacementData[];
  furniture: FloorplanFurnitureData[];
}

export function newPlanId(): string {
  return `fplan-${crypto.randomUUID()}`;
}

export function newVertexId(): string {
  return `vtx-${crypto.randomUUID()}`;
}

export function newWallId(): string {
  return `wall-${crypto.randomUUID()}`;
}

export function newRoomId(): string {
  return `froom-${crypto.randomUUID()}`;
}

export function newFurnitureId(): string {
  return `furn-${crypto.randomUUID()}`;
}

export function newOpeningId(): string {
  return `open-${crypto.randomUUID()}`;
}

/**
 * The GraphQL enum is upper-case on the wire; the geometry module speaks the
 * lower-case vocabulary. These two tables are the only place the spellings meet.
 */
const OPENING_KIND_FROM_API: Record<FloorplanOpeningKind, OpeningKind> = {
  [FloorplanOpeningKind.Door]: "door",
  [FloorplanOpeningKind.Window]: "window",
  [FloorplanOpeningKind.Opening]: "opening",
};

const OPENING_KIND_TO_API: Record<OpeningKind, FloorplanOpeningKind> = {
  door: FloorplanOpeningKind.Door,
  window: FloorplanOpeningKind.Window,
  opening: FloorplanOpeningKind.Opening,
};

/** Convert a loaded GraphQL floorplan into the editor's working state. */
export function floorplanToGraph(data: FloorplanData): {
  graph: PlanGraph;
  rooms: PlanRoomMeta[];
  placements: FloorplanPlacementData[];
  furniture: FloorplanFurnitureData[];
} {
  const byWall = new Map<string, PlanOpening[]>();
  for (const o of data.openings) {
    const opening: PlanOpening = {
      id: o.id,
      t: o.t,
      width: o.width,
      kind: OPENING_KIND_FROM_API[o.kind] ?? "door",
    };
    const list = byWall.get(o.wallId);
    if (list) list.push(opening);
    else byWall.set(o.wallId, [opening]);
  }
  const graph: PlanGraph = {
    vertices: data.vertices.map((v) => ({ id: v.id, x: v.x, y: v.y })),
    walls: data.walls.map((w) => {
      const openings = byWall.get(w.id);
      return {
        id: w.id,
        a: w.vertexA,
        b: w.vertexB,
        thickness: w.thickness,
        ...(w.curveX != null && w.curveY != null ? { curve: { x: w.curveX, y: w.curveY } } : {}),
        ...(openings ? { openings } : {}),
      };
    }),
  };
  const rooms: PlanRoomMeta[] = data.rooms.map((r) => ({
    id: r.id,
    name: r.name ?? null,
    roomId: r.roomId ?? null,
    vertexIds: [...r.vertexIds],
  }));
  const placements: FloorplanPlacementData[] = data.placements.map((p) => ({
    memberType: p.memberType === "group" ? "group" : "device",
    memberId: p.memberId,
    x: p.x,
    y: p.y,
  }));
  const furniture: FloorplanFurnitureData[] = data.furniture.map((f) => ({ ...f }));
  return { graph, rooms, placements, furniture };
}

/** Build the `updateFloorplan` mutation input from the editor's working state. */
export function buildUpdateFloorplanInput(
  planId: string,
  planName: string,
  graph: PlanGraph,
  rooms: PlanRoomMeta[],
  placements: FloorplanPlacementData[],
  furniture: FloorplanFurnitureData[],
): UpdateFloorplanInputData {
  return {
    id: planId,
    name: planName,
    vertices: graph.vertices.map((v) => ({ id: v.id, x: v.x, y: v.y })),
    walls: graph.walls.map((w) => ({
      id: w.id,
      vertexA: w.a,
      vertexB: w.b,
      thickness: w.thickness,
      curveX: w.curve?.x ?? null,
      curveY: w.curve?.y ?? null,
    })),
    openings: graph.walls.flatMap((w) =>
      (w.openings ?? []).map((o) => ({
        id: o.id,
        wallId: w.id,
        t: o.t,
        width: o.width,
        kind: OPENING_KIND_TO_API[o.kind],
      })),
    ),
    rooms: rooms.map((r) => ({
      id: r.id,
      name: r.name,
      roomId: r.roomId,
      vertexIds: [...r.vertexIds],
    })),
    placements: placements.map((p) => ({
      memberType: p.memberType,
      memberId: p.memberId,
      x: p.x,
      y: p.y,
    })),
    furniture: furniture.map((f) => ({ ...f })),
  };
}

/**
 * Carry room identity across a face recompute. Matched faces keep their
 * existing room row (id, name, link) with the vertex set refreshed; new faces
 * mint anonymous rows; rooms that no longer match any face survive only when
 * they carry a name or a Hive-room link (the detached state phase 2 surfaces).
 */
export function reconcileRooms(prevRooms: PlanRoomMeta[], faces: Face[]): PlanRoomMeta[] {
  const { assignments, detachedRoomIds } = matchFaces(faces, prevRooms);
  const next: PlanRoomMeta[] = assignments.map(({ face, room }) =>
    room
      ? { ...room, vertexIds: [...face.vertexIds] }
      : { id: newRoomId(), name: null, roomId: null, vertexIds: [...face.vertexIds] },
  );
  const detached = new Set(detachedRoomIds);
  for (const room of prevRooms) {
    if (detached.has(room.id)) next.push(room);
  }
  return next;
}
