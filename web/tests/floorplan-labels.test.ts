import { describe, expect, it } from "vitest";
import { planLabels } from "$lib/floorplan";
import type { Face, PlanGraph, PlanLabelInput } from "$lib/floorplan";

function square(id: string, size = 2): Face {
  return {
    vertexIds: [`${id}-1`, `${id}-2`, `${id}-3`, `${id}-4`],
    polygon: [
      { x: 0, y: 0 },
      { x: size, y: 0 },
      { x: size, y: size },
      { x: 0, y: size },
    ],
    area: size * size,
  };
}

const graph: PlanGraph = {
  vertices: [
    { id: "a", x: 0, y: 0 },
    { id: "b", x: 3, y: 0 },
  ],
  walls: [{ id: "w", a: "a", b: "b", thickness: 0.1 }],
};

function input(overrides: Partial<PlanLabelInput> = {}): PlanLabelInput {
  return {
    faces: [],
    faceNames: [],
    live: false,
    draft: null,
    graph,
    measuredWallIds: new Set(),
    rubber: null,
    stamp: null,
    ...overrides,
  };
}

describe("planLabels", () => {
  it("labels a room with its name and its area, one above the other", () => {
    const labels = planLabels(input({ faces: [square("f")], faceNames: ["Kitchen"] }));
    expect(labels.map((l) => l.text)).toEqual(["Kitchen", "4.00 m²"]);
    expect(labels[0].dy).toBeLessThan(0);
    expect(labels[1].dy).toBeGreaterThan(0);
    // Both sit at the middle of the room.
    for (const l of labels) {
      expect(l.x).toBeCloseTo(1, 9);
      expect(l.y).toBeCloseTo(1, 9);
    }
  });

  it("centres the area on the room when it has no name", () => {
    const labels = planLabels(input({ faces: [square("f")], faceNames: [null] }));
    expect(labels).toHaveLength(1);
    expect(labels[0].dy).toBe(0);
  });

  it("drops the areas in live mode, where they are not an editing aid", () => {
    const labels = planLabels(
      input({ faces: [square("f")], faceNames: ["Kitchen"], live: true }),
    );
    expect(labels.map((l) => l.text)).toEqual(["Kitchen"]);
    expect(labels[0].dy).toBe(0);
  });

  it("measures only the walls a gesture is changing", () => {
    expect(planLabels(input())).toHaveLength(0);
    const labels = planLabels(input({ measuredWallIds: new Set(["w"]) }));
    expect(labels).toHaveLength(1);
    expect(labels[0].text).toBe("3.00 m");
    expect(labels[0].x).toBeCloseTo(1.5, 9);
  });

  it("measures the wall being drawn, but not a stationary pointer", () => {
    const from = { x: 0, y: 0 };
    expect(planLabels(input({ rubber: { from, to: from, length: 0 } }))).toHaveLength(0);
    const labels = planLabels(input({ rubber: { from, to: { x: 2, y: 0 }, length: 2 } }));
    expect(labels[0].text).toBe("2.00 m");
  });

  it("measures both sides of a rectangle stamp", () => {
    const labels = planLabels(input({ stamp: { x: 0, y: 0, w: 3, h: 2 } }));
    expect(labels.map((l) => l.text)).toEqual(["3.00 m", "2.00 m"]);
    // The height label hangs off the left edge, so it is right-aligned.
    expect(labels[1].anchor).toBe("end");
  });

  it("says nothing about a stamp too small to read", () => {
    expect(planLabels(input({ stamp: { x: 0, y: 0, w: 0.01, h: 0.01 } }))).toHaveLength(0);
  });

  it("carries the label following the pointer", () => {
    const labels = planLabels(input({ draft: { point: { x: 5, y: 6 }, text: "Hallway" } }));
    expect(labels).toEqual([
      { id: "draft", x: 5, y: 6, text: "Hallway", tone: "draft", dy: 0, anchor: "middle" },
    ]);
  });

  it("gives every label an id of its own, so a list keyed by it is stable", () => {
    const labels = planLabels(
      input({
        faces: [square("f"), square("g")],
        faceNames: ["Kitchen", "Hall"],
        measuredWallIds: new Set(["w"]),
        stamp: { x: 0, y: 0, w: 3, h: 2 },
      }),
    );
    expect(new Set(labels.map((l) => l.id)).size).toBe(labels.length);
  });
});
