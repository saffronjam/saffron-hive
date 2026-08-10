import { describe, it, expect } from "vitest";
import { detectFaces, normalizeGraph, shoelaceArea } from "$lib/floorplan";
import type { PlanGraph, PlanVertex, PlanWall } from "$lib/floorplan";

function vertex(id: string, x: number, y: number): PlanVertex {
  return { id, x, y };
}

function wall(id: string, a: string, b: string): PlanWall {
  return { id, a, b, thickness: 0.1 };
}

function unitSquare(): PlanGraph {
  return {
    vertices: [vertex("v-1", 0, 0), vertex("v-2", 1, 0), vertex("v-3", 1, 1), vertex("v-4", 0, 1)],
    walls: [
      wall("w-1", "v-1", "v-2"),
      wall("w-2", "v-2", "v-3"),
      wall("w-3", "v-3", "v-4"),
      wall("w-4", "v-4", "v-1"),
    ],
  };
}

function twoRooms(): PlanGraph {
  return {
    vertices: [
      vertex("v-a", 0, 0),
      vertex("v-b", 2, 0),
      vertex("v-c", 2, 2),
      vertex("v-d", 0, 2),
      vertex("v-e", 4, 0),
      vertex("v-f", 4, 2),
    ],
    walls: [
      wall("w-ab", "v-a", "v-b"),
      wall("w-bc", "v-b", "v-c"),
      wall("w-cd", "v-c", "v-d"),
      wall("w-da", "v-d", "v-a"),
      wall("w-be", "v-b", "v-e"),
      wall("w-ef", "v-e", "v-f"),
      wall("w-fc", "v-f", "v-c"),
    ],
  };
}

describe("detectFaces", () => {
  it("finds one face for a unit square and discards the outer face", () => {
    const faces = detectFaces(unitSquare());
    expect(faces).toHaveLength(1);
    expect(faces[0].area).toBeCloseTo(1);
    expect(faces[0].vertexIds).toEqual(["v-1", "v-2", "v-3", "v-4"]);
  });

  it("returns counter-clockwise polygons in canonical rotation", () => {
    const face = detectFaces(unitSquare())[0];
    expect(shoelaceArea(face.polygon)).toBeGreaterThan(0);
    expect(face.polygon[0]).toEqual({ x: 0, y: 0 });
    expect(face.vertexIds[0]).toBe("v-1");
  });

  it("finds two faces for adjacent rooms, the shared wall bounding both", () => {
    const faces = detectFaces(twoRooms());
    expect(faces).toHaveLength(2);
    for (const face of faces) {
      expect(face.area).toBeCloseTo(4);
      expect(face.vertexIds).toContain("v-b");
      expect(face.vertexIds).toContain("v-c");
    }
    const idSets = faces.map((f) => [...f.vertexIds].sort());
    expect(idSets).toContainEqual(["v-a", "v-b", "v-c", "v-d"]);
    expect(idSets).toContainEqual(["v-b", "v-c", "v-e", "v-f"]);
  });

  it("splits a rectangle into two rooms via a T-junction divider", () => {
    const graph: PlanGraph = {
      vertices: [
        vertex("v-a", 0, 0),
        vertex("v-b", 4, 0),
        vertex("v-c", 4, 2),
        vertex("v-d", 0, 2),
        vertex("v-m1", 2, 0),
        vertex("v-m2", 2, 2),
      ],
      walls: [
        wall("w-ab", "v-a", "v-b"),
        wall("w-bc", "v-b", "v-c"),
        wall("w-cd", "v-c", "v-d"),
        wall("w-da", "v-d", "v-a"),
        wall("w-mid", "v-m1", "v-m2"),
      ],
    };
    const faces = detectFaces(normalizeGraph(graph));
    expect(faces).toHaveLength(2);
    expect(faces[0].area).toBeCloseTo(4);
    expect(faces[1].area).toBeCloseTo(4);
  });

  it("handles an L-shaped outline", () => {
    const graph: PlanGraph = {
      vertices: [
        vertex("v-1", 0, 0),
        vertex("v-2", 2, 0),
        vertex("v-3", 2, 1),
        vertex("v-4", 1, 1),
        vertex("v-5", 1, 2),
        vertex("v-6", 0, 2),
      ],
      walls: [
        wall("w-1", "v-1", "v-2"),
        wall("w-2", "v-2", "v-3"),
        wall("w-3", "v-3", "v-4"),
        wall("w-4", "v-4", "v-5"),
        wall("w-5", "v-5", "v-6"),
        wall("w-6", "v-6", "v-1"),
      ],
    };
    const faces = detectFaces(graph);
    expect(faces).toHaveLength(1);
    expect(faces[0].area).toBeCloseTo(3);
  });

  it("flattens a curved wall into the face polygon", () => {
    const graph = unitSquare();
    graph.walls[3] = { ...graph.walls[3], curve: { x: -0.5, y: 0.5 } };
    const faces = detectFaces(graph);
    expect(faces).toHaveLength(1);
    expect(faces[0].vertexIds).toEqual(["v-1", "v-2", "v-3", "v-4"]);
    expect(faces[0].polygon).toHaveLength(19);
    expect(faces[0].area).toBeCloseTo(1 + 1 / 6, 2);
  });

  it("merges two rooms into one face when the shared wall is deleted", () => {
    const graph = twoRooms();
    graph.walls = graph.walls.filter((w) => w.id !== "w-bc");
    const faces = detectFaces(normalizeGraph(graph));
    expect(faces).toHaveLength(1);
    expect(faces[0].area).toBeCloseTo(8);
    // The old party-wall corners held nothing once it went, so each pair of
    // walls that met there is one straight run again: the room has 4 corners.
    expect([...faces[0].vertexIds].sort()).toEqual(["v-a", "v-d", "v-e", "v-f"]);
  });
});

describe("openings and face topology", () => {
  it("leaves the faces identical when a door is cut into the shared wall", () => {
    const plain = detectFaces(normalizeGraph(twoRooms()));
    const doored = twoRooms();
    const shared = doored.walls.find((w) => w.id === "w-bc")!;
    shared.openings = [{ id: "o-1", t: 0.5, width: 0.9, kind: "door" }];

    expect(detectFaces(normalizeGraph(doored))).toEqual(plain);
  });

  it("does not merge two rooms even when the opening spans the whole wall", () => {
    const doored = twoRooms();
    const shared = doored.walls.find((w) => w.id === "w-bc")!;
    shared.openings = [{ id: "o-1", t: 0.5, width: 99, kind: "opening" }];

    const faces = detectFaces(normalizeGraph(doored));
    expect(faces).toHaveLength(2);
  });
});
