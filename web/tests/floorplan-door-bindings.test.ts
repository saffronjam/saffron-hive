import { describe, expect, it } from "vitest";
import {
  doorBindingGeometry,
  doorSnapTarget,
  pruneDoorBindings,
  type PlanDoorBinding,
  type PlanGraph,
} from "$lib/floorplan";

const straight: PlanGraph = {
  vertices: [
    { id: "a", x: 0, y: 0 },
    { id: "b", x: 4, y: 0 },
  ],
  walls: [
    {
      id: "wall",
      a: "a",
      b: "b",
      thickness: 0.1,
      openings: [{ id: "door", kind: "door", t: 0.5, width: 1 }],
    },
  ],
};

describe("door binding geometry", () => {
  it.each([
    ["start", "left", 1.5, 2.5, Math.PI / 2],
    ["start", "right", 1.5, 2.5, -Math.PI / 2],
    ["end", "left", 2.5, 1.5, Math.PI / 2],
    ["end", "right", 2.5, 1.5, -Math.PI / 2],
  ] as const)("orients a %s hinge swinging %s", (hingeSide, swingSide, hingeX, latchX, openAngle) => {
    const wall = straight.walls[0];
    const opening = wall.openings![0];
    const geometry = doorBindingGeometry(straight, wall, opening, { hingeSide, swingSide });
    expect(geometry.hinge.x).toBeCloseTo(hingeX);
    expect(geometry.latch.x).toBeCloseTo(latchX);
    expect(geometry.openAngle).toBeCloseTo(openAngle);
    expect(geometry.length).toBeCloseTo(1);
  });

  it("uses the local opening span on a curved wall", () => {
    const graph: PlanGraph = {
      vertices: straight.vertices,
      walls: [{ ...straight.walls[0], curve: { x: 2, y: 1 } }],
    };
    const geometry = doorBindingGeometry(graph, graph.walls[0], graph.walls[0].openings![0], {
      hingeSide: "start",
      swingSide: "left",
    });
    expect(geometry.center.y).toBeGreaterThan(0);
    expect(geometry.length).toBeGreaterThan(0.9);
  });
});

describe("door attachment snapping", () => {
  it("infers the nearest hinge endpoint and pointer side", () => {
    const startLeft = doorSnapTarget(straight, { x: 1.55, y: 0.1 }, 0.3);
    expect(startLeft?.binding).toEqual({
      openingId: "door",
      hingeSide: "start",
      swingSide: "left",
    });

    const endRight = doorSnapTarget(straight, { x: 2.45, y: -0.1 }, 0.3);
    expect(endRight?.binding).toEqual({
      openingId: "door",
      hingeSide: "end",
      swingSide: "right",
    });
  });

  it("uses start and left for exact ties and ignores distant doors", () => {
    expect(doorSnapTarget(straight, { x: 2, y: 0 }, 0.2)?.binding).toEqual({
      openingId: "door",
      hingeSide: "start",
      swingSide: "left",
    });
    expect(doorSnapTarget(straight, { x: 2, y: 1 }, 0.2)).toBeNull();
  });
});

describe("door binding pruning", () => {
  it("keeps only valid one-to-one door bindings", () => {
    const bindings: PlanDoorBinding[] = [
      { openingId: "door", deviceId: "one", hingeSide: "start", swingSide: "left" },
      { openingId: "door", deviceId: "two", hingeSide: "end", swingSide: "right" },
      { openingId: "missing", deviceId: "three", hingeSide: "start", swingSide: "left" },
    ];
    expect(pruneDoorBindings(straight, bindings)).toEqual([bindings[0]]);
  });
});
