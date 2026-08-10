import { describe, it, expect } from "vitest";
import {
  DEFAULT_OPENING_WIDTH_M,
  MIN_OPENING_WIDTH_M,
  arcLengthAtT,
  clampOpening,
  openingAnchor,
  openingSpan,
  openingTRange,
  solidSpans,
  wallMetrics,
} from "$lib/floorplan";
import type { PlanOpening, PlanVertex, PlanWall } from "$lib/floorplan";

/** A 4 m horizontal wall from the origin. */
const verts: PlanVertex[] = [
  { id: "v-a", x: 0, y: 0 },
  { id: "v-b", x: 4, y: 0 },
];

function wall(openings?: PlanOpening[]): PlanWall {
  return { id: "w-1", a: "v-a", b: "v-b", thickness: 0.1, ...(openings ? { openings } : {}) };
}

function opening(t: number, width: number, id = "o-1"): PlanOpening {
  return { id, t, width, kind: "door" };
}

describe("solidSpans", () => {
  it("returns the whole wall when there are no openings", () => {
    expect(solidSpans(wall(), verts)).toEqual([[0, 1]]);
    expect(solidSpans(wall([]), verts)).toEqual([[0, 1]]);
  });

  it("cuts a centred 1 m door out of a 4 m wall", () => {
    const spans = solidSpans(wall([opening(0.5, 1)]), verts);
    expect(spans).toHaveLength(2);
    expect(spans[0][0]).toBeCloseTo(0, 9);
    expect(spans[0][1]).toBeCloseTo(0.375, 9);
    expect(spans[1][0]).toBeCloseTo(0.625, 9);
    expect(spans[1][1]).toBeCloseTo(1, 9);
  });

  it("merges two overlapping openings into a single gap", () => {
    const spans = solidSpans(wall([opening(0.4, 1, "o-1"), opening(0.55, 1, "o-2")]), verts);
    expect(spans).toHaveLength(2);
    expect(spans[0][1]).toBeCloseTo(0.275, 9);
    expect(spans[1][0]).toBeCloseTo(0.675, 9);
  });

  it("keeps two separated openings as two gaps", () => {
    const spans = solidSpans(wall([opening(0.2, 0.4, "o-1"), opening(0.8, 0.4, "o-2")]), verts);
    expect(spans).toHaveLength(3);
  });

  it("leaves nothing solid when an opening is wider than the wall", () => {
    expect(solidSpans(wall([opening(0.5, 9)]), verts)).toEqual([]);
  });

  it("drops the leading span when an opening sits on the start vertex", () => {
    const spans = solidSpans(wall([opening(0, 1)]), verts);
    expect(spans).toHaveLength(1);
    expect(spans[0][0]).toBeCloseTo(0.125, 9);
    expect(spans[0][1]).toBeCloseTo(1, 9);
  });
});

describe("openingTRange", () => {
  it("converts a metric width into a t range on a straight wall", () => {
    const [start, end] = openingTRange(wall(), verts, opening(0.5, 1));
    expect(start).toBeCloseTo(0.375, 9);
    expect(end).toBeCloseTo(0.625, 9);
  });

  it("clamps to the wall when the opening runs past an end", () => {
    expect(openingTRange(wall(), verts, opening(0.02, 1))).toEqual([0, expect.any(Number)]);
    expect(openingTRange(wall(), verts, opening(0.98, 1))[1]).toBe(1);
  });

  it("spans one meter of arc, not one meter of chord, on a curved wall", () => {
    const curved: PlanWall = { ...wall(), curve: { x: 2, y: 4 } };
    const metrics = wallMetrics(curved, verts);
    expect(metrics.total).toBeGreaterThan(5);

    const [start, end] = openingTRange(curved, verts, opening(0.25, 1));
    expect(arcLengthAtT(metrics, end) - arcLengthAtT(metrics, start)).toBeCloseTo(1, 6);

    // Dividing the width by the 4 m chord would have given a 0.25 span.
    expect(end - start).toBeLessThan(0.2);
  });
});

describe("openingAnchor", () => {
  it("gives the midpoint, the left normal and the wall heading", () => {
    const anchor = openingAnchor(wall(), verts, opening(0.5, 1));
    expect(anchor.point.x).toBeCloseTo(2, 9);
    expect(anchor.point.y).toBeCloseTo(0, 9);
    expect(anchor.normal.x).toBeCloseTo(0, 9);
    expect(anchor.normal.y).toBeCloseTo(1, 9);
    expect(anchor.angleRad).toBeCloseTo(0, 9);
  });
});

describe("clampOpening", () => {
  it("pushes an opening on the start vertex fully inside the wall", () => {
    const clamped = clampOpening(wall(), verts, opening(0, 1));
    expect(clamped.width).toBe(1);
    expect(clamped.t).toBeCloseTo(0.125, 9);
    const [start, end] = openingTRange(wall(), verts, clamped);
    expect(start).toBeCloseTo(0, 9);
    expect(end).toBeCloseTo(0.25, 9);
  });

  it("pushes an opening on the end vertex fully inside the wall", () => {
    expect(clampOpening(wall(), verts, opening(1, 1)).t).toBeCloseTo(0.875, 9);
  });

  it("raises a sliver to the minimum width", () => {
    expect(clampOpening(wall(), verts, opening(0.5, 0.01)).width).toBe(MIN_OPENING_WIDTH_M);
  });

  it("caps the width at the wall length", () => {
    const clamped = clampOpening(wall(), verts, opening(0.5, 9));
    expect(clamped.width).toBeCloseTo(4, 9);
    expect(clamped.t).toBeCloseTo(0.5, 9);
  });

  it("leaves an opening that already fits alone", () => {
    const o = opening(0.5, DEFAULT_OPENING_WIDTH_M.door);
    const clamped = clampOpening(wall(), verts, o);
    expect(clamped.t).toBeCloseTo(o.t, 9);
    expect(clamped.width).toBe(o.width);
  });
});

describe("openingSpan", () => {
  it("runs between the gap's two ends on a straight wall", () => {
    const span = openingSpan(wall([opening(0.5, 1)]), verts, opening(0.5, 1));
    expect(span).toHaveLength(2);
    expect(span[0].x).toBeCloseTo(1.5, 9);
    expect(span[1].x).toBeCloseTo(2.5, 9);
    expect(span[0].y).toBeCloseTo(0, 9);
    expect(span[1].y).toBeCloseTo(0, 9);
  });

  it("measures the gap in meters, not in parameter units", () => {
    const o = opening(0.5, 1.4);
    const span = openingSpan(wall([o]), verts, o);
    expect(Math.hypot(span[1].x - span[0].x, span[1].y - span[0].y)).toBeCloseTo(1.4, 9);
  });

  it("keeps a curved wall's interpolation points inside the gap", () => {
    const curved: PlanWall = { ...wall(), curve: { x: 2, y: 2 } };
    const o = opening(0.5, 1);
    const span = openingSpan(curved, verts, o);
    expect(span.length).toBeGreaterThan(2);
    // Every point sits on the wall's own flattening, so the span bends with it.
    for (const p of span) expect(p.y).toBeGreaterThan(0);
  });

  it("spans the whole wall when the opening is wider than it", () => {
    const o = opening(0.5, 10);
    const span = openingSpan(wall([o]), verts, o);
    expect(span[0].x).toBeCloseTo(0, 9);
    expect(span[span.length - 1].x).toBeCloseTo(4, 9);
  });
});
