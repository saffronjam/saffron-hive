import { describe, expect, it } from "vitest";
import { carryPlacements } from "$lib/floorplan/placement-carry";
import { detectFaces, normalizeGraph } from "$lib/floorplan";
import type { PlanGraph, PlanRoomMeta } from "$lib/floorplan";

/** A rectangle room graph from corner (x, y), w × h. */
function rect(id: string, x: number, y: number, w: number, h: number): PlanGraph {
  const v = (n: string, px: number, py: number) => ({ id: `${id}-${n}`, x: px, y: py });
  const wall = (n: string, a: string, b: string) => ({
    id: `${id}-${n}`,
    a: `${id}-${a}`,
    b: `${id}-${b}`,
    thickness: 0.1,
  });
  return {
    vertices: [v("nw", x, y), v("ne", x + w, y), v("se", x + w, y + h), v("sw", x, y + h)],
    walls: [
      wall("t", "nw", "ne"),
      wall("r", "ne", "se"),
      wall("b", "se", "sw"),
      wall("l", "sw", "nw"),
    ],
  };
}

function merge(...graphs: PlanGraph[]): PlanGraph {
  return {
    vertices: graphs.flatMap((g) => g.vertices),
    walls: graphs.flatMap((g) => g.walls),
  };
}

function roomsFor(graph: PlanGraph, names: string[]): PlanRoomMeta[] {
  return detectFaces(graph).map((face, i) => ({
    id: `room-${names[i] ?? i}`,
    name: names[i] ?? null,
    roomId: null,
    vertexIds: [...face.vertexIds],
  }));
}

/** Rooms carried across an edit keep their ids; vertexIds refresh to the new faces. */
function reconciledLike(prev: PlanRoomMeta[], graph: PlanGraph): PlanRoomMeta[] {
  const faces = detectFaces(graph);
  return faces.map((face, i) => {
    const keep = prev[i];
    return keep
      ? { ...keep, vertexIds: [...face.vertexIds] }
      : { id: `room-new-${i}`, name: null, roomId: null, vertexIds: [...face.vertexIds] };
  });
}

const lamp = (x: number, y: number) => ({ x, y });

describe("carryPlacements", () => {
  it("takes lights along when their room moves as a whole", () => {
    const before = rect("a", 0, 0, 4, 3);
    const rooms = roomsFor(before, ["hall"]);
    const after = rect("a", 0, 5, 4, 3);
    const afterRooms = reconciledLike(rooms, after);
    const { placements, changed } = carryPlacements({
      before: { graph: before, rooms },
      after: { faces: detectFaces(after), rooms: afterRooms },
      placements: [lamp(1, 1), lamp(3, 2)],
    });
    expect(changed).toBe(true);
    expect(placements).toEqual([lamp(1, 6), lamp(3, 7)]);
  });

  it("stashes a light stranded in a pre-existing neighbour when a wall moves", () => {
    // Hallway above the kitchen; its bottom wall then moves up, leaving the
    // lamp's spot inside nothing of hers.
    const hallway = rect("h", 0, 0, 4, 3);
    const kitchen = rect("k", 0, 3, 4, 3);
    const before = merge(hallway, kitchen);
    const rooms = roomsFor(before, ["hall", "kitchen"]);
    const after = merge(rect("h", 0, 0, 4, 1.5), kitchen);
    const afterRooms = reconciledLike(rooms, after);
    const { placements, changed } = carryPlacements({
      before: { graph: before, rooms },
      after: { faces: detectFaces(after), rooms: afterRooms },
      placements: [lamp(2, 2.5), lamp(2, 1)],
    });
    expect(changed).toBe(true);
    // The lamp at y=2.5 is outside the shrunk hallway; the one at y=1 stays.
    expect(placements).toEqual([lamp(2, 1)]);
  });

  it("keeps a light that stays inside its deformed room", () => {
    const before = rect("a", 0, 0, 4, 3);
    const rooms = roomsFor(before, ["hall"]);
    const after = rect("a", 0, 0, 4, 2);
    const afterRooms = reconciledLike(rooms, after);
    const { placements, changed } = carryPlacements({
      before: { graph: before, rooms },
      after: { faces: detectFaces(after), rooms: afterRooms },
      placements: [lamp(2, 1)],
    });
    expect(changed).toBe(false);
    expect(placements).toEqual([lamp(2, 1)]);
  });

  it("keeps a light that ends up in a room born from this commit", () => {
    // The room splits in two; the lamp sits in the half that becomes a new row.
    const before = rect("a", 0, 0, 6, 3);
    const rooms = roomsFor(before, ["hall"]);
    const divider: PlanGraph = {
      vertices: [
        { id: "d-top", x: 3, y: 0 },
        { id: "d-bottom", x: 3, y: 3 },
      ],
      walls: [{ id: "d-wall", a: "d-top", b: "d-bottom", thickness: 0.1 }],
    };
    const after = normalizeGraph(merge(rect("a", 0, 0, 6, 3), divider));
    const afterFaces = detectFaces(after);
    expect(afterFaces).toHaveLength(2);
    // Identity: the left half keeps the old row, the right half is new.
    const left = afterFaces.find((f) => f.polygon.every((p) => p.x <= 3.001))!;
    const right = afterFaces.find((f) => f !== left)!;
    const afterRooms: PlanRoomMeta[] = [
      { ...rooms[0], vertexIds: [...left.vertexIds] },
      { id: "room-split", name: null, roomId: null, vertexIds: [...right.vertexIds] },
    ];
    const { placements, changed } = carryPlacements({
      before: { graph: before, rooms },
      after: { faces: afterFaces, rooms: afterRooms },
      placements: [lamp(5, 1.5)],
    });
    expect(changed).toBe(false);
    expect(placements).toEqual([lamp(5, 1.5)]);
  });

  it("leaves placements outside every room alone", () => {
    const before = rect("a", 0, 0, 4, 3);
    const rooms = roomsFor(before, ["hall"]);
    const after = rect("a", 0, 5, 4, 3);
    const afterRooms = reconciledLike(rooms, after);
    const { placements } = carryPlacements({
      before: { graph: before, rooms },
      after: { faces: detectFaces(after), rooms: afterRooms },
      placements: [lamp(10, 10)],
    });
    expect(placements).toEqual([lamp(10, 10)]);
  });

  it("does nothing across a commit that changes no geometry", () => {
    const graph = rect("a", 0, 0, 4, 3);
    const rooms = roomsFor(graph, ["hall"]);
    const { placements, changed } = carryPlacements({
      before: { graph, rooms },
      after: { faces: detectFaces(graph), rooms },
      placements: [lamp(1, 1)],
    });
    expect(changed).toBe(false);
    expect(placements).toEqual([lamp(1, 1)]);
  });

  it("resolves nested rooms to the innermost, like the map does", () => {
    const outer = rect("o", 0, 0, 8, 6);
    const inner = rect("i", 2, 2, 2, 2);
    const before = merge(outer, inner);
    const faces = detectFaces(before);
    const rooms = faces.map((face, i) => ({
      id: `room-${i}`,
      name: null,
      roomId: null,
      vertexIds: [...face.vertexIds],
    }));
    // Move only the inner room's graph; the outer stays.
    const after = merge(rect("o", 0, 0, 8, 6), rect("i", 5, 2, 2, 2));
    const afterFaces = detectFaces(after);
    const afterRooms = faces.map((face, i) => {
      const match = afterFaces.find((f) => Math.abs(f.area - face.area) < 1e-6)!;
      return { id: `room-${i}`, name: null, roomId: null, vertexIds: [...match.vertexIds] };
    });
    const { placements } = carryPlacements({
      before: { graph: before, rooms },
      after: { faces: afterFaces, rooms: afterRooms },
      placements: [lamp(3, 3)],
    });
    // The lamp was in the inner room, so it travels with it.
    expect(placements).toEqual([lamp(6, 3)]);
  });
});
