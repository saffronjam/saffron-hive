import { describe, it, expect } from "vitest";
import { resolveSnap, snapGuides, snapRectOffset } from "$lib/floorplan";
import type { PlanGraph, SnapContext } from "$lib/floorplan";

const emptyGraph: PlanGraph = { vertices: [], walls: [] };

const wallGraph: PlanGraph = {
  vertices: [
    { id: "v-1", x: 0, y: 0 },
    { id: "v-2", x: 2, y: 0 },
  ],
  walls: [{ id: "w-1", a: "v-1", b: "v-2", thickness: 0.1 }],
};

function ctx(overrides: Partial<SnapContext> = {}): SnapContext {
  return { graph: wallGraph, zoom: 10, alt: false, ...overrides };
}

describe("resolveSnap", () => {
  it("prefers a vertex over the wall interior when both are in radius", () => {
    const result = resolveSnap({ x: 0.05, y: 0.05 }, ctx());
    expect(result.indicator).toEqual({ kind: "vertex", vertexId: "v-1" });
    expect(result.point).toEqual({ x: 0, y: 0 });
  });

  it("snaps to the wall interior and carries the wall id and split parameter", () => {
    const result = resolveSnap({ x: 1, y: 0.1 }, ctx());
    expect(result.indicator).toEqual({ kind: "segment", wallId: "w-1", t: 0.5 });
    expect(result.point.x).toBeCloseTo(1);
    expect(result.point.y).toBeCloseTo(0);
  });

  it("prefers the wall interior over an angle lock", () => {
    const result = resolveSnap({ x: 1, y: 0.1 }, ctx({ prevPoint: { x: 1, y: 3 } }));
    expect(result.indicator?.kind).toBe("segment");
  });

  it("scales the threshold with zoom", () => {
    const cursor = { x: 0, y: 0.5 };
    expect(resolveSnap(cursor, ctx({ zoom: 10 })).indicator?.kind).toBe("vertex");
    expect(resolveSnap(cursor, ctx({ zoom: 100 })).indicator?.kind).toBe("grid");
  });

  it("returns the raw cursor with no indicator while alt is held", () => {
    const cursor = { x: 0.001, y: 0.002 };
    const result = resolveSnap(cursor, ctx({ alt: true }));
    expect(result.point).toEqual(cursor);
    expect(result.indicator).toBeNull();
  });

  it("locks to a 15-degree multiple and projects the cursor onto the ray", () => {
    const result = resolveSnap(
      { x: 1, y: 0.05 },
      ctx({ graph: emptyGraph, zoom: 1, prevPoint: { x: 0, y: 0 } }),
    );
    expect(result.indicator).toEqual({ kind: "angle", from: { x: 0, y: 0 }, angleDeg: 0 });
    expect(result.point.x).toBeCloseTo(1);
    expect(result.point.y).toBeCloseTo(0);
  });

  it("projects onto a diagonal locked ray, landing on the grid", () => {
    const result = resolveSnap(
      { x: 1, y: 0.9 },
      ctx({ graph: emptyGraph, zoom: 1, prevPoint: { x: 0, y: 0 } }),
    );
    expect(result.indicator).toEqual({ kind: "angle", from: { x: 0, y: 0 }, angleDeg: 45 });
    // The ray puts it at 0.95; the grid is what decides where on the ray it sits.
    expect(result.point.x).toBeCloseTo(1);
    expect(result.point.y).toBeCloseTo(1);
  });

  it("falls back to the grid, rounding to the default 0.1 m", () => {
    const result = resolveSnap({ x: 0.234, y: 5.06 }, ctx({ graph: emptyGraph }));
    expect(result.indicator).toEqual({ kind: "grid" });
    expect(result.point.x).toBeCloseTo(0.2);
    expect(result.point.y).toBeCloseTo(5.1);
  });

  it("honours a custom grid size", () => {
    const result = resolveSnap({ x: 0.6, y: 0.7 }, ctx({ graph: emptyGraph, gridSize: 0.5 }));
    expect(result.point.x).toBeCloseTo(0.5);
    expect(result.point.y).toBeCloseTo(0.5);
  });

  it("ignores excluded vertices and walls so a dragged vertex cannot snap to itself", () => {
    const cursor = { x: 0.01, y: 0.01 };
    const vertexExcluded = resolveSnap(cursor, ctx({ excludeVertexIds: ["v-1"] }));
    expect(vertexExcluded.indicator?.kind).toBe("segment");
    const bothExcluded = resolveSnap(
      cursor,
      ctx({ excludeVertexIds: ["v-1"], excludeWallIds: ["w-1"] }),
    );
    expect(bothExcluded.indicator).toEqual({ kind: "grid" });
    expect(bothExcluded.point).toEqual({ x: 0, y: 0 });
  });
});

describe("snapGuides", () => {
  const graph: PlanGraph = {
    vertices: [
      { id: "a", x: 0, y: 0 },
      { id: "b", x: 4, y: 0 },
    ],
    walls: [{ id: "w", a: "a", b: "b", thickness: 0.1 }],
  };

  it("draws nothing when the cursor snapped to nothing", () => {
    expect(snapGuides(null, graph, null)).toEqual({ segment: null, ray: null, vertex: null });
    expect(snapGuides({ point: { x: 0, y: 0 }, indicator: null }, graph, null)).toEqual({
      segment: null,
      ray: null,
      vertex: null,
    });
  });

  it("draws the whole wall the cursor landed on", () => {
    const guides = snapGuides(
      { point: { x: 2, y: 0 }, indicator: { kind: "segment", wallId: "w", t: 0.5 } },
      graph,
      null,
    );
    expect(guides.segment).toEqual({ a: { x: 0, y: 0 }, b: { x: 4, y: 0 } });
  });

  it("says nothing about a wall that is not in the plan", () => {
    const guides = snapGuides(
      { point: { x: 2, y: 0 }, indicator: { kind: "segment", wallId: "gone", t: 0.5 } },
      graph,
      null,
    );
    expect(guides.segment).toBeNull();
  });

  it("runs the locked ray through the cursor and out both ends", () => {
    const guides = snapGuides(
      { point: { x: 1, y: 0 }, indicator: { kind: "angle", from: { x: 0, y: 0 }, angleDeg: 0 } },
      graph,
      { x: 1, y: 0 },
    );
    // Behind the start and well past the cursor, so the lock reads as a line.
    expect(guides.ray).toEqual({ from: { x: -2, y: 0 }, to: { x: 3, y: 0 } });
  });

  it("has no ray to draw before the gesture points anywhere", () => {
    const guides = snapGuides(
      { point: { x: 1, y: 0 }, indicator: { kind: "angle", from: { x: 0, y: 0 }, angleDeg: 0 } },
      graph,
      null,
    );
    expect(guides.ray).toBeNull();
  });

  it("rings the vertex the cursor caught", () => {
    const guides = snapGuides(
      { point: { x: 0, y: 0 }, indicator: { kind: "vertex", vertexId: "b" } },
      graph,
      null,
    );
    expect(guides.vertex).toEqual({ x: 4, y: 0 });
  });

  it("draws nothing for a grid snap, which needs no explaining", () => {
    const guides = snapGuides(
      { point: { x: 1, y: 1 }, indicator: { kind: "grid" } },
      graph,
      { x: 1, y: 1 },
    );
    expect(guides).toEqual({ segment: null, ray: null, vertex: null });
  });
});

describe("snapRectOffset", () => {
  /** One 3 m room whose right edge is at x = 3, top at y = 0. */
  const drawn: PlanGraph = {
    vertices: [
      { id: "a", x: 0, y: 0 },
      { id: "b", x: 3, y: 0 },
      { id: "c", x: 3, y: 3 },
      { id: "d", x: 0, y: 3 },
    ],
    walls: [
      { id: "w-1", a: "a", b: "b", thickness: 0.1 },
      { id: "w-2", a: "b", b: "c", thickness: 0.1 },
      { id: "w-3", a: "c", b: "d", thickness: 0.1 },
      { id: "w-4", a: "d", b: "a", thickness: 0.1 },
    ],
  };

  function rect(x: number, y: number, size = 3) {
    return [
      { x, y },
      { x: x + size, y },
      { x: x + size, y: y + size },
      { x, y: y + size },
    ];
  }

  it("pulls a room dropped just short of a wall flush against it", () => {
    // Left edge at 3.2, a fifth of a metre past the drawn room's right edge.
    const shift = snapRectOffset(rect(3.2, 0), drawn);
    expect(shift.x).toBeCloseTo(-0.2, 9);
    expect(shift.y).toBeCloseTo(0, 9);
  });

  it("pushes one dropped just inside back out", () => {
    expect(snapRectOffset(rect(2.8, 0), drawn).x).toBeCloseTo(0.2, 9);
  });

  it("leaves a room dropped well clear of everything where it fell", () => {
    expect(snapRectOffset(rect(20, 20), drawn)).toEqual({ x: 0, y: 0 });
  });

  it("decides each axis on its own, so one edge catching cannot drag the other", () => {
    // Lines up in x, but sits far away in y.
    const shift = snapRectOffset(rect(3.2, 40), drawn);
    expect(shift.x).toBeCloseTo(-0.2, 9);
    expect(shift.y).toBe(0);
  });

  it("takes the nearest of several candidates", () => {
    // 3.05 is nearer the drawn edge at 3 than dropping back to 0.
    expect(snapRectOffset(rect(3.05, 0), drawn).x).toBeCloseTo(-0.05, 9);
  });

  it("has nothing to snap to on an empty plan", () => {
    expect(snapRectOffset(rect(1, 1), { vertices: [], walls: [] })).toEqual({ x: 0, y: 0 });
  });

  it("keeps the rectangle the size and shape it was", () => {
    const dropped = rect(3.2, 0.15);
    const shift = snapRectOffset(dropped, drawn);
    const moved = dropped.map((p) => ({ x: p.x + shift.x, y: p.y + shift.y }));
    const width = Math.max(...moved.map((p) => p.x)) - Math.min(...moved.map((p) => p.x));
    const height = Math.max(...moved.map((p) => p.y)) - Math.min(...moved.map((p) => p.y));
    expect(width).toBeCloseTo(3, 9);
    expect(height).toBeCloseTo(3, 9);
  });
});

describe("resolveSnap lands on the shared grid", () => {
  const onGrid = (v: number) => Math.abs(v / 0.1 - Math.round(v / 0.1)) < 1e-9;

  const wall: PlanGraph = {
    vertices: [
      { id: "a", x: 0, y: 0 },
      { id: "b", x: 4, y: 0 },
    ],
    walls: [{ id: "w", a: "a", b: "b", thickness: 0.1 }],
  };

  it("puts an angle-locked point on the grid rather than where the ray happened to reach", () => {
    const r = resolveSnap(
      { x: 2.137, y: 0.004 },
      ctx({ graph: emptyGraph, zoom: 50, prevPoint: { x: 0, y: 0 } }),
    );
    expect(r.indicator?.kind).toBe("angle");
    expect(onGrid(r.point.x), `x = ${r.point.x}`).toBe(true);
    expect(onGrid(r.point.y), `y = ${r.point.y}`).toBe(true);
  });

  it("keeps a diagonal lock on the grid too", () => {
    const r = resolveSnap(
      { x: 1.767, y: 1.771 },
      ctx({ graph: emptyGraph, zoom: 50, prevPoint: { x: 0, y: 0 } }),
    );
    expect(r.indicator?.kind).toBe("angle");
    expect(onGrid(r.point.x), `x = ${r.point.x}`).toBe(true);
    expect(onGrid(r.point.y), `y = ${r.point.y}`).toBe(true);
  });

  it("slides a point landing on a wall onto the grid", () => {
    const r = resolveSnap({ x: 2.137, y: 0.01 }, ctx({ graph: wall, zoom: 50 }));
    expect(r.indicator?.kind).toBe("segment");
    expect(onGrid(r.point.x), `x = ${r.point.x}`).toBe(true);
    // Still on the wall, which is the point of catching it.
    expect(r.point.y).toBeCloseTo(0, 9);
  });

  it("still hits an existing corner exactly, grid or not", () => {
    const offGrid: PlanGraph = { vertices: [{ id: "v", x: 1.234, y: 5.678 }], walls: [] };
    const r = resolveSnap({ x: 1.24, y: 5.68 }, ctx({ graph: offGrid, zoom: 50 }));
    expect(r.indicator).toEqual({ kind: "vertex", vertexId: "v" });
    expect(r.point).toEqual({ x: 1.234, y: 5.678 });
  });

  it("keeps the angle lock's reach: rounding must not cost it the rung", () => {
    // Just inside the threshold off the ray, at a spot that rounds away.
    const r = resolveSnap(
      { x: 2.137, y: 0.1 },
      ctx({ graph: emptyGraph, zoom: 50, prevPoint: { x: 0, y: 0 } }),
    );
    expect(r.indicator?.kind).toBe("angle");
  });

  it("leaves everything alone when snapping is suppressed", () => {
    const r = resolveSnap(
      { x: 2.137, y: 0.004 },
      ctx({ graph: wall, zoom: 50, alt: true, prevPoint: { x: 0, y: 0 } }),
    );
    expect(r.point).toEqual({ x: 2.137, y: 0.004 });
    expect(r.indicator).toBeNull();
  });
});
