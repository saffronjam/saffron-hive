import { describe, expect, it } from "vitest";
import {
  buildUpdateFloorplanInput,
  floorplanToGraph,
  reconcileRooms,
  type FloorplanData,
} from "$lib/floorplan-editable";
import type { Face, PlanRoomMeta } from "$lib/floorplan";
import {
  FloorplanDoorHingeSide,
  FloorplanDoorSwingSide,
  FloorplanOpeningKind,
} from "$lib/gql/graphql";

function makeFace(vertexIds: string[], area = 1): Face {
  return {
    vertexIds,
    polygon: [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 1, y: 1 },
      { x: 0, y: 1 },
    ],
    area,
  };
}

const sample: FloorplanData = {
  id: "fplan-1",
  name: "Home",
  vertices: [
    { id: "vtx-a", x: 0, y: 0 },
    { id: "vtx-b", x: 4, y: 0 },
    { id: "vtx-c", x: 4, y: 3 },
  ],
  walls: [
    {
      id: "wall-1",
      vertexA: "vtx-a",
      vertexB: "vtx-b",
      thickness: 0.1,
      curveX: null,
      curveY: null,
    },
    { id: "wall-2", vertexA: "vtx-b", vertexB: "vtx-c", thickness: 0.2, curveX: 2, curveY: 1.5 },
  ],
  openings: [
    { id: "open-1", wallId: "wall-1", t: 0.25, width: 0.9, kind: FloorplanOpeningKind.Door },
    { id: "open-2", wallId: "wall-1", t: 0.75, width: 1.2, kind: FloorplanOpeningKind.Window },
  ],
  doorBindings: [
    {
      openingId: "open-1",
      deviceId: "door-1",
      hingeSide: FloorplanDoorHingeSide.End,
      swingSide: FloorplanDoorSwingSide.Right,
    },
  ],
  rooms: [
    { id: "froom-1", name: "Kitchen", roomId: "room-9", vertexIds: ["vtx-a", "vtx-b", "vtx-c"] },
  ],
  placements: [
    { memberType: "device", memberId: "dev-1", x: 1, y: 2 },
    { memberType: "group", memberId: "grp-1", x: 3, y: 4 },
  ],
  furniture: [
    {
      id: "furn-1",
      kind: "bed-double",
      x: 2,
      y: 1,
      width: 1.8,
      height: 2,
      rotation: 90,
      occluder: false,
    },
  ],
};

describe("floorplanToGraph", () => {
  it("maps walls to a/b endpoints and lifts curve points", () => {
    const { graph, rooms } = floorplanToGraph(sample);
    expect(graph.vertices).toHaveLength(3);
    expect(graph.walls[0].id).toBe("wall-1");
    expect(graph.walls[0].a).toBe("vtx-a");
    expect(graph.walls[0].b).toBe("vtx-b");
    expect(graph.walls[0].thickness).toBe(0.1);
    expect(graph.walls[1].curve).toEqual({ x: 2, y: 1.5 });
    expect(rooms[0]).toEqual({
      id: "froom-1",
      name: "Kitchen",
      roomId: "room-9",
      vertexIds: ["vtx-a", "vtx-b", "vtx-c"],
    });
  });

  it("nests openings into the wall they belong to, lower-casing the kind", () => {
    const { graph } = floorplanToGraph(sample);
    expect(graph.walls[0].openings).toEqual([
      { id: "open-1", t: 0.25, width: 0.9, kind: "door" },
      { id: "open-2", t: 0.75, width: 1.2, kind: "window" },
    ]);
    expect(graph.walls[1].openings).toBeUndefined();
  });

  it("narrows the placement member type and keeps the coordinates", () => {
    const { placements } = floorplanToGraph(sample);
    expect(placements).toEqual([
      { memberType: "device", memberId: "dev-1", x: 1, y: 2 },
      { memberType: "group", memberId: "grp-1", x: 3, y: 4 },
    ]);
  });

  it("normalizes absent name/link to null", () => {
    const { rooms } = floorplanToGraph({
      ...sample,
      rooms: [{ id: "froom-2", vertexIds: ["vtx-a"] }],
    });
    expect(rooms[0].name).toBeNull();
    expect(rooms[0].roomId).toBeNull();
  });
});

describe("buildUpdateFloorplanInput", () => {
  it("round-trips a loaded plan unchanged", () => {
    const { graph, rooms, placements, furniture, doorBindings } = floorplanToGraph(sample);
    const input = buildUpdateFloorplanInput(
      "fplan-1",
      "Home",
      graph,
      rooms,
      placements,
      furniture,
      doorBindings,
    );
    expect(input.id).toBe("fplan-1");
    expect(input.vertices).toEqual(sample.vertices);
    expect(input.walls).toEqual(sample.walls);
    expect(input.rooms).toEqual([
      { id: "froom-1", name: "Kitchen", roomId: "room-9", vertexIds: ["vtx-a", "vtx-b", "vtx-c"] },
    ]);
    expect(input.placements).toEqual(sample.placements);
    expect(input.openings).toEqual(sample.openings);
    expect(input.doorBindings).toEqual(sample.doorBindings);
    expect(input.furniture).toEqual(sample.furniture);
  });

  it("flattens openings back onto their wall id", () => {
    const input = buildUpdateFloorplanInput(
      "fplan-1",
      "Home",
      {
        vertices: [],
        walls: [
          {
            id: "wall-1",
            a: "x",
            b: "y",
            thickness: 0.1,
            openings: [{ id: "open-1", t: 0.5, width: 1.2, kind: "window" }],
          },
          { id: "wall-2", a: "y", b: "z", thickness: 0.1 },
        ],
      },
      [],
      [],
      [],
      [],
    );
    expect(input.openings).toEqual([
      {
        id: "open-1",
        wallId: "wall-1",
        t: 0.5,
        width: 1.2,
        kind: FloorplanOpeningKind.Window,
      },
    ]);
  });

  it("writes null curve fields for straight walls", () => {
    const input = buildUpdateFloorplanInput(
      "fplan-1",
      "Home",
      { vertices: [], walls: [{ id: "wall-1", a: "x", b: "y", thickness: 0.1 }] },
      [],
      [],
      [],
      [],
    );
    expect(input.walls[0].curveX).toBeNull();
    expect(input.walls[0].curveY).toBeNull();
  });
});

describe("reconcileRooms", () => {
  it("keeps the matched room's identity and refreshes its vertex set", () => {
    const prev: PlanRoomMeta[] = [
      { id: "froom-1", name: "Kitchen", roomId: "room-9", vertexIds: ["v1", "v2", "v3", "v4"] },
    ];
    const next = reconcileRooms(prev, [makeFace(["v1", "v2", "v3", "v5"])]);
    expect(next).toHaveLength(1);
    expect(next[0].id).toBe("froom-1");
    expect(next[0].name).toBe("Kitchen");
    expect(next[0].roomId).toBe("room-9");
    expect(next[0].vertexIds).toEqual(["v1", "v2", "v3", "v5"]);
  });

  it("mints anonymous rows for brand-new faces", () => {
    const next = reconcileRooms([], [makeFace(["v1", "v2", "v3"])]);
    expect(next).toHaveLength(1);
    expect(next[0].id).toMatch(/^froom-/);
    expect(next[0].name).toBeNull();
    expect(next[0].roomId).toBeNull();
  });

  it("keeps unmatched named or linked rooms and drops unmatched anonymous ones", () => {
    const prev: PlanRoomMeta[] = [
      { id: "froom-named", name: "Bedroom", roomId: null, vertexIds: ["a", "b", "c"] },
      { id: "froom-anon", name: null, roomId: null, vertexIds: ["d", "e", "f"] },
    ];
    const next = reconcileRooms(prev, [makeFace(["x", "y", "z"])]);
    const ids = next.map((r) => r.id);
    expect(ids).toContain("froom-named");
    expect(ids).not.toContain("froom-anon");
    expect(next.find((r) => r.id === "froom-named")?.vertexIds).toEqual(["a", "b", "c"]);
  });
});
