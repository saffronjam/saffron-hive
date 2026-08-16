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
    measures: [],
    furniture: null,
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
    const labels = planLabels(input({ faces: [square("f")], faceNames: ["Kitchen"], live: true }));
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

describe("furniture measurements", () => {
  const piece = { id: "f1", x: 4, y: 2, width: 1.8, height: 2, rotation: 0 };

  it("labels both sides of a piece being resized", () => {
    const labels = planLabels(input({ furniture: piece }));
    const texts = labels.filter((l) => l.id.startsWith("furniture-")).map((l) => l.text);
    expect(texts).toEqual(["1.80 m", "2.00 m"]);
  });

  it("stands the labels off the sides they measure", () => {
    const [w, h] = planLabels(input({ furniture: piece })).filter((l) =>
      l.id.startsWith("furniture-"),
    );
    // Width above the top edge, height left of the left edge.
    expect(w.x).toBeCloseTo(4, 6);
    expect(w.y).toBeLessThan(2 - piece.height / 2);
    expect(h.y).toBeCloseTo(2, 6);
    expect(h.x).toBeLessThan(4 - piece.width / 2);
  });

  it("turns the labels with the piece", () => {
    const [w] = planLabels(input({ furniture: { ...piece, rotation: 90 } })).filter((l) =>
      l.id.startsWith("furniture-"),
    );
    // Quarter turn: the top edge now faces right, and its label follows.
    expect(w.x).toBeGreaterThan(4 + piece.height / 2);
    expect(w.y).toBeCloseTo(2, 6);
  });

  it("says nothing when no piece is being resized", () => {
    expect(planLabels(input()).some((l) => l.id.startsWith("furniture-"))).toBe(false);
  });
});

describe("scratch measurements", () => {
  const line = { id: "m1", kind: "line" as const, a: { x: 0, y: 0 }, b: { x: 3, y: 4 } };
  const box = { id: "m2", kind: "rect" as const, a: { x: 1, y: 1 }, b: { x: 4, y: 3 } };

  it("says how long a line is, at its middle", () => {
    const [label] = planLabels(input({ measures: [line] })).filter((l) =>
      l.id.startsWith("measure-"),
    );
    expect(label.text).toBe("5.00 m");
    expect(label.x).toBeCloseTo(1.5, 6);
    expect(label.y).toBeCloseTo(2, 6);
  });

  it("says a box's area and both of its sides", () => {
    const labels = planLabels(input({ measures: [box] })).filter((l) =>
      l.id.startsWith("measure-"),
    );
    expect(labels.map((l) => l.text)).toEqual(["6.00 m²", "3.00 m", "2.00 m"]);
  });

  it("stays quiet about a measurement with no length", () => {
    const none = { ...line, b: { x: 0, y: 0 } };
    expect(planLabels(input({ measures: [none] })).some((l) => l.id.startsWith("measure-"))).toBe(
      false,
    );
  });

  it("labels every measurement on the plan", () => {
    const labels = planLabels(input({ measures: [line, box] })).filter((l) =>
      l.id.startsWith("measure-"),
    );
    expect(labels).toHaveLength(4);
  });
});
