import { describe, it, expect } from "vitest";
import { matchFaces } from "$lib/floorplan";
import type { Face, PlanRoomMeta } from "$lib/floorplan";

function face(vertexIds: string[], area: number): Face {
  return { vertexIds, polygon: [], area };
}

function room(id: string, vertexIds: string[], extra: Partial<PlanRoomMeta> = {}): PlanRoomMeta {
  return { id, name: null, roomId: null, vertexIds, ...extra };
}

describe("matchFaces", () => {
  it("keeps the match when a vertex drag changes geometry but not identity", () => {
    const dragged = face(["v-1", "v-2", "v-3", "v-4"], 14.7);
    const rooms = [room("fr-1", ["v-1", "v-2", "v-3", "v-4"], { name: "Kitchen", area: 12 })];
    const { assignments, detachedRoomIds } = matchFaces([dragged], rooms);
    expect(assignments).toHaveLength(1);
    expect(assignments[0].room?.id).toBe("fr-1");
    expect(detachedRoomIds).toEqual([]);
  });

  it("keeps the larger-overlap room when a teardown merges two rooms", () => {
    const merged = face(["v-1", "v-2", "v-3", "v-4", "v-5", "v-6", "v-7", "v-8"], 20);
    const rooms = [
      room("fr-small", ["v-1", "v-2", "v-3", "v-4"], { name: "Pantry" }),
      room("fr-large", ["v-3", "v-4", "v-5", "v-6", "v-7", "v-8"], { name: "Living room" }),
    ];
    const { assignments, detachedRoomIds } = matchFaces([merged], rooms);
    expect(assignments[0].room?.id).toBe("fr-large");
    expect(detachedRoomIds).toEqual(["fr-small"]);
  });

  it("uses each room at most once, best overlap first", () => {
    const faces = [face(["v-1", "v-2", "v-3", "v-4"], 10), face(["v-3", "v-4", "v-5", "v-6"], 10)];
    const rooms = [room("fr-1", ["v-1", "v-2", "v-3", "v-4"])];
    const { assignments } = matchFaces(faces, rooms);
    expect(assignments[0].room?.id).toBe("fr-1");
    expect(assignments[1].room).toBeNull();
  });

  it("breaks equal overlaps by closest stored area", () => {
    const faces = [face(["v-1", "v-2"], 4), face(["v-1", "v-2"], 10)];
    const rooms = [room("fr-1", ["v-1", "v-2"], { area: 9.5 })];
    const { assignments } = matchFaces(faces, rooms);
    expect(assignments[0].room).toBeNull();
    expect(assignments[1].room?.id).toBe("fr-1");
  });

  it("flags unmatched rooms carrying a name or link as detached", () => {
    const faces = [face(["v-1", "v-2", "v-3"], 5)];
    const rooms = [
      room("fr-named", ["v-8", "v-9"], { name: "Office" }),
      room("fr-linked", ["v-10", "v-11"], { roomId: "room-7" }),
    ];
    const { assignments, detachedRoomIds } = matchFaces(faces, rooms);
    expect(assignments[0].room).toBeNull();
    expect(detachedRoomIds.sort()).toEqual(["fr-linked", "fr-named"]);
  });

  it("drops unmatched anonymous rooms silently", () => {
    const faces = [face(["v-1", "v-2", "v-3"], 5)];
    const rooms = [room("fr-anon", ["v-8", "v-9"])];
    const { assignments, detachedRoomIds } = matchFaces(faces, rooms);
    expect(assignments[0].room).toBeNull();
    expect(detachedRoomIds).toEqual([]);
  });

  it("assigns null to faces with no overlapping room", () => {
    const { assignments } = matchFaces([face(["v-1"], 2)], []);
    expect(assignments).toEqual([{ face: face(["v-1"], 2), room: null }]);
  });

  it("keeps a linked row on its face when a vertex moves", () => {
    const dragged = face(["v-1", "v-2", "v-3", "v-4"], 16.2);
    const rooms = [room("fr-1", ["v-1", "v-2", "v-3", "v-4"], { roomId: "room-3", area: 14 })];
    const { assignments, detachedRoomIds } = matchFaces([dragged], rooms);
    expect(assignments[0].room?.roomId).toBe("room-3");
    expect(detachedRoomIds).toEqual([]);
  });

  it("keeps the linked row on the larger-overlap side when a wall splits its face", () => {
    const left = face(["v-1", "v-2", "v-3", "v-6", "n-1", "n-2"], 9);
    const right = face(["v-3", "v-4", "v-5", "n-1"], 5);
    const rooms = [
      room("fr-1", ["v-1", "v-2", "v-3", "v-4", "v-5", "v-6"], { roomId: "room-1", area: 14 }),
    ];
    const { assignments, detachedRoomIds } = matchFaces([left, right], rooms);
    expect(assignments[0].room?.id).toBe("fr-1");
    expect(assignments[1].room).toBeNull();
    expect(detachedRoomIds).toEqual([]);
  });

  it("detaches the smaller-overlap link when a wall between two linked rooms is torn down", () => {
    const merged = face(["v-1", "v-2", "v-3", "v-4", "v-5", "v-6", "v-7", "v-8"], 22);
    const rooms = [
      room("fr-small", ["v-1", "v-2", "v-3", "v-4"], { roomId: "room-a" }),
      room("fr-large", ["v-3", "v-4", "v-5", "v-6", "v-7", "v-8"], { roomId: "room-b" }),
    ];
    const { assignments, detachedRoomIds } = matchFaces([merged], rooms);
    expect(assignments[0].room?.roomId).toBe("room-b");
    expect(detachedRoomIds).toEqual(["fr-small"]);
  });

  it("detaches a named room when all of its vertices are gone", () => {
    const rooms = [room("fr-gone", ["v-1", "v-2", "v-3"], { name: "Closet" })];
    const { assignments, detachedRoomIds } = matchFaces([], rooms);
    expect(assignments).toEqual([]);
    expect(detachedRoomIds).toEqual(["fr-gone"]);
  });

  // A room the drag had to duplicate entirely (every corner shared) comes out
  // of the split with an all-new ring. This is the contract the map page's
  // detach handler relies on: it remaps the row's ids before reconciling.
  it("loses a fully re-identified room unless its ids are remapped", () => {
    const detached = face(["n-1", "n-2", "n-3", "n-4"], 12);
    const linked = room("fr-linked", ["v-1", "v-2", "v-3", "v-4"], {
      name: "Bedroom",
      roomId: "room-9",
    });

    const without = matchFaces([detached], [linked]);
    expect(without.assignments[0].room).toBeNull();
    expect(without.detachedRoomIds).toEqual(["fr-linked"]);

    const idMap = new Map([
      ["v-1", "n-1"],
      ["v-2", "n-2"],
      ["v-3", "n-3"],
      ["v-4", "n-4"],
    ]);
    const remapped = { ...linked, vertexIds: linked.vertexIds.map((id) => idMap.get(id) ?? id) };
    const withRemap = matchFaces([detached], [remapped]);
    expect(withRemap.assignments[0].room?.id).toBe("fr-linked");
    expect(withRemap.assignments[0].room?.roomId).toBe("room-9");
    expect(withRemap.detachedRoomIds).toEqual([]);
  });

  it("keeps a partly re-identified room, which is the common detach case", () => {
    // Two corners were shared with a neighbour and got new ids; two were not.
    const detached = face(["n-1", "n-2", "v-3", "v-4"], 12);
    const linked = room("fr-linked", ["v-1", "v-2", "v-3", "v-4"], { roomId: "room-9" });
    const { assignments, detachedRoomIds } = matchFaces([detached], [linked]);
    expect(assignments[0].room?.id).toBe("fr-linked");
    expect(detachedRoomIds).toEqual([]);
  });

  it("keeps a loose label on its face through an edit", () => {
    const edited = face(["v-1", "v-2", "v-3", "n-1"], 8);
    const other = face(["v-7", "v-8", "v-9"], 8);
    const rooms = [room("fr-loose", ["v-1", "v-2", "v-3", "v-4"], { name: "Reading nook" })];
    const { assignments, detachedRoomIds } = matchFaces([edited, other], rooms);
    expect(assignments[0].room?.name).toBe("Reading nook");
    expect(assignments[0].room?.roomId).toBeNull();
    expect(assignments[1].room).toBeNull();
    expect(detachedRoomIds).toEqual([]);
  });
});
