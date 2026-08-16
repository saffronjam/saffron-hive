import { describe, expect, it } from "vitest";
import {
  detectFaces,
  hitFace,
  hitOpening,
  hitOpeningEnd,
  grabTarget,
  hitVertex,
  hitWall,
  openingViews,
  sweptSelection,
} from "$lib/floorplan";
import type { PlanGraph } from "$lib/floorplan";

/** A 4x3 room, with a window in the middle of the top wall. */
function room(): PlanGraph {
  return {
    vertices: [
      { id: "a", x: 0, y: 0 },
      { id: "b", x: 4, y: 0 },
      { id: "c", x: 4, y: 3 },
      { id: "d", x: 0, y: 3 },
    ],
    walls: [
      {
        id: "w-top",
        a: "a",
        b: "b",
        thickness: 0.1,
        openings: [{ id: "win", t: 0.5, width: 1, kind: "window" }],
      },
      { id: "w-right", a: "b", b: "c", thickness: 0.1 },
      { id: "w-bottom", a: "c", b: "d", thickness: 0.1 },
      { id: "w-left", a: "d", b: "a", thickness: 0.1 },
    ],
  };
}

describe("hitVertex", () => {
  it("takes the nearest vertex inside the reach", () => {
    expect(hitVertex(room(), { x: 0.05, y: 0.05 }, 0.2)?.id).toBe("a");
    expect(hitVertex(room(), { x: 3.9, y: 0.05 }, 0.2)?.id).toBe("b");
  });

  it("takes nothing beyond the reach", () => {
    expect(hitVertex(room(), { x: 2, y: 1.5 }, 0.2)).toBeNull();
  });
});

describe("hitWall", () => {
  it("takes the wall under the point", () => {
    expect(hitWall(room(), { x: 2, y: 0.02 }, 0.05)?.id).toBe("w-top");
    expect(hitWall(room(), { x: 3.99, y: 1.5 }, 0.05)?.id).toBe("w-right");
  });

  it("is grabbable across a thick wall's whole body", () => {
    const graph = room();
    graph.walls[0] = { ...graph.walls[0], thickness: 1 };
    // Well outside the 0.05 reach, but still inside the wall itself.
    expect(hitWall(graph, { x: 2, y: 0.4 }, 0.05)?.id).toBe("w-top");
  });

  it("takes nothing out in the open", () => {
    expect(hitWall(room(), { x: 2, y: 1.5 }, 0.05)).toBeNull();
  });
});

describe("hitFace", () => {
  it("takes the room the point is in", () => {
    expect(hitFace(detectFaces(room()), { x: 2, y: 1.5 })).toBe(0);
  });

  it("takes nothing outside", () => {
    expect(hitFace(detectFaces(room()), { x: 9, y: 9 })).toBeNull();
  });

  it("prefers the smaller of two rooms that both contain the point", () => {
    const faces = [
      {
        vertexIds: ["big"],
        area: 100,
        polygon: [
          { x: 0, y: 0 },
          { x: 10, y: 0 },
          { x: 10, y: 10 },
          { x: 0, y: 10 },
        ],
      },
      {
        vertexIds: ["small"],
        area: 4,
        polygon: [
          { x: 1, y: 1 },
          { x: 3, y: 1 },
          { x: 3, y: 3 },
          { x: 1, y: 3 },
        ],
      },
    ];
    expect(hitFace(faces, { x: 2, y: 2 })).toBe(1);
  });
});

describe("hitOpening", () => {
  const views = openingViews(room());

  it("finds every opening in the plan", () => {
    expect(views.map((v) => v.opening.id)).toEqual(["win"]);
  });

  it("takes the opening when the point is on its gap", () => {
    expect(hitOpening(views, { x: 2, y: 0 }, 0.05)?.opening.id).toBe("win");
  });

  it("takes nothing on the solid part of the same wall", () => {
    expect(hitOpening(views, { x: 0.5, y: 0 }, 0.05)).toBeNull();
  });
});

describe("hitOpeningEnd", () => {
  const views = openingViews(room());

  it("takes a handle only on a selected opening", () => {
    const at = { x: 1.5, y: 0 };
    expect(hitOpeningEnd(views, new Set(), at, 0.1)).toBeNull();
    expect(hitOpeningEnd(views, new Set(["win"]), at, 0.1)?.opening.id).toBe("win");
  });

  it("reports the far end as the anchor the drag pivots on", () => {
    const hit = hitOpeningEnd(views, new Set(["win"]), { x: 1.5, y: 0 }, 0.1);
    expect(hit?.anchor.x).toBeCloseTo(2.5, 6);
  });
});

describe("sweptSelection", () => {
  it("takes the vertices inside the rectangle", () => {
    const swept = sweptSelection(room(), { x: -1, y: -1 }, { x: 5, y: 4 });
    expect(swept.vertexIds.sort()).toEqual(["a", "b", "c", "d"]);
    expect(swept.wallIds).toHaveLength(4);
  });

  it("leaves a wall with only one end inside alone", () => {
    const swept = sweptSelection(room(), { x: -1, y: -1 }, { x: 1, y: 4 });
    expect(swept.vertexIds.sort()).toEqual(["a", "d"]);
    expect(swept.wallIds).toEqual(["w-left"]);
  });

  it("reads a rectangle dragged in any direction the same way", () => {
    const forward = sweptSelection(room(), { x: -1, y: -1 }, { x: 5, y: 4 });
    const backward = sweptSelection(room(), { x: 5, y: 4 }, { x: -1, y: -1 });
    expect(backward).toEqual(forward);
  });
});

describe("grabTarget", () => {
  const graph = room();
  const faces = detectFaces(graph);
  const views = openingViews(graph);

  function input(overrides: Partial<Parameters<typeof grabTarget>[0]> = {}) {
    return {
      graph,
      faces,
      openings: views,
      selectedOpeningIds: new Set<string>(),
      markers: [] as { x: number; y: number }[],
      markerReach: 0.3,
      bend: null,
      reach: 0.05,
      ...overrides,
    };
  }

  it("puts a marker above everything else", () => {
    // Right on top of a wall, but the marker is drawn over it.
    const at = { x: 2, y: 0 };
    expect(grabTarget(input(), at)?.kind).toBe("opening");
    expect(grabTarget(input({ markers: [at] }), at)).toEqual({ kind: "marker", index: 0 });
  });

  it("takes the topmost of stacked markers", () => {
    const at = { x: 2, y: 1.5 };
    expect(grabTarget(input({ markers: [at, at, at] }), at)).toEqual({ kind: "marker", index: 2 });
  });

  it("puts a bend handle above the wall it belongs to", () => {
    const at = { x: 0.5, y: 0 };
    expect(grabTarget(input(), at)?.kind).toBe("wall");
    expect(grabTarget(input({ bend: { wallId: "w-top", point: at } }), at)).toEqual({
      kind: "bend",
      wallId: "w-top",
    });
  });

  it("puts a width handle above the opening it belongs to", () => {
    const at = { x: 1.5, y: 0 };
    expect(grabTarget(input(), at)?.kind).toBe("opening");
    const grab = grabTarget(input({ selectedOpeningIds: new Set(["win"]) }), at);
    expect(grab?.kind).toBe("openingEdge");
  });

  it("hands handles back to what is under them for a click or a hover", () => {
    const at = { x: 0.5, y: 0 };
    const withBend = input({ bend: { wallId: "w-top", point: at } });
    expect(grabTarget(withBend, at, false)).toEqual({ kind: "wall", wallId: "w-top" });
    const selected = input({ selectedOpeningIds: new Set(["win"]) });
    expect(grabTarget(selected, { x: 1.5, y: 0 }, false)?.kind).toBe("opening");
  });

  it("falls through wall, then face, then nothing", () => {
    expect(grabTarget(input(), { x: 0.5, y: 0 })).toEqual({ kind: "wall", wallId: "w-top" });
    expect(grabTarget(input(), { x: 2, y: 1.5 })).toEqual({ kind: "face", index: 0 });
    expect(grabTarget(input(), { x: 50, y: 50 })).toBeNull();
  });

  it("puts a vertex above the walls meeting on it", () => {
    expect(grabTarget(input(), { x: 0, y: 0 })).toEqual({ kind: "vertex", vertexId: "a" });
  });
});
