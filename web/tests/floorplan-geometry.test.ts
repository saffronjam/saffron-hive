import { describe, it, expect } from "vitest";
import {
  CURVE_SEGMENTS,
  controlForApex,
  flattenWall,
  nearestPointInFace,
  wallApex,
  pointInPolygon,
  poleOfInaccessibility,
  pointSegmentDistance,
  pointSegmentProjection,
  polygonBounds,
  segmentIntersection,
  shoelaceArea,
} from "$lib/floorplan";
import type { Face, PlanVertex, PlanWall, Point } from "$lib/floorplan";

describe("pointSegmentDistance", () => {
  it("measures perpendicular distance to the segment interior", () => {
    expect(pointSegmentDistance({ x: 1, y: 1 }, { x: 0, y: 0 }, { x: 2, y: 0 })).toBeCloseTo(1);
  });

  it("measures to the nearest endpoint beyond the segment", () => {
    expect(pointSegmentDistance({ x: 3, y: 4 }, { x: 0, y: 0 }, { x: 0, y: 1 })).toBeCloseTo(
      Math.hypot(3, 3),
    );
  });

  it("handles a degenerate zero-length segment", () => {
    expect(pointSegmentDistance({ x: 3, y: 4 }, { x: 0, y: 0 }, { x: 0, y: 0 })).toBeCloseTo(5);
  });
});

describe("pointSegmentProjection", () => {
  it("returns the interior projection and its parameter", () => {
    const { point, t } = pointSegmentProjection({ x: 1, y: 1 }, { x: 0, y: 0 }, { x: 4, y: 0 });
    expect(point.x).toBeCloseTo(1);
    expect(point.y).toBeCloseTo(0);
    expect(t).toBeCloseTo(0.25);
  });

  it("clamps t to the segment", () => {
    expect(pointSegmentProjection({ x: -3, y: 0 }, { x: 0, y: 0 }, { x: 4, y: 0 }).t).toBe(0);
    expect(pointSegmentProjection({ x: 9, y: 2 }, { x: 0, y: 0 }, { x: 4, y: 0 }).t).toBe(1);
  });
});

describe("segmentIntersection", () => {
  it("finds a proper crossing", () => {
    const p = segmentIntersection({ x: 0, y: 0 }, { x: 2, y: 2 }, { x: 0, y: 2 }, { x: 2, y: 0 });
    expect(p).not.toBeNull();
    expect(p!.x).toBeCloseTo(1);
    expect(p!.y).toBeCloseTo(1);
  });

  it("returns null for parallel segments", () => {
    expect(
      segmentIntersection({ x: 0, y: 0 }, { x: 2, y: 0 }, { x: 0, y: 1 }, { x: 2, y: 1 }),
    ).toBeNull();
  });

  it("returns null for collinear overlapping segments", () => {
    expect(
      segmentIntersection({ x: 0, y: 0 }, { x: 2, y: 0 }, { x: 1, y: 0 }, { x: 3, y: 0 }),
    ).toBeNull();
  });

  it("returns null when the crossing lies outside a segment", () => {
    expect(
      segmentIntersection({ x: 0, y: 0 }, { x: 1, y: 1 }, { x: 0, y: 5 }, { x: 2, y: 5 }),
    ).toBeNull();
  });

  it("returns null for an endpoint touch", () => {
    expect(
      segmentIntersection({ x: 0, y: 0 }, { x: 2, y: 0 }, { x: 2, y: 0 }, { x: 2, y: 2 }),
    ).toBeNull();
  });
});

describe("pointInPolygon", () => {
  const square = [
    { x: 0, y: 0 },
    { x: 2, y: 0 },
    { x: 2, y: 2 },
    { x: 0, y: 2 },
  ];

  it("accepts interior points and rejects exterior ones", () => {
    expect(pointInPolygon({ x: 1, y: 1 }, square)).toBe(true);
    expect(pointInPolygon({ x: 3, y: 1 }, square)).toBe(false);
  });

  it("handles a concave polygon", () => {
    const lShape = [
      { x: 0, y: 0 },
      { x: 2, y: 0 },
      { x: 2, y: 1 },
      { x: 1, y: 1 },
      { x: 1, y: 2 },
      { x: 0, y: 2 },
    ];
    expect(pointInPolygon({ x: 0.5, y: 1.5 }, lShape)).toBe(true);
    expect(pointInPolygon({ x: 1.5, y: 1.5 }, lShape)).toBe(false);
  });
});

describe("shoelaceArea", () => {
  it("is positive for counter-clockwise winding", () => {
    const ccw = [
      { x: 0, y: 0 },
      { x: 2, y: 0 },
      { x: 2, y: 3 },
      { x: 0, y: 3 },
    ];
    expect(shoelaceArea(ccw)).toBeCloseTo(6);
  });

  it("is negative for clockwise winding", () => {
    const cw = [
      { x: 0, y: 0 },
      { x: 0, y: 3 },
      { x: 2, y: 3 },
      { x: 2, y: 0 },
    ];
    expect(shoelaceArea(cw)).toBeCloseTo(-6);
  });
});

describe("polygonBounds", () => {
  it("computes the axis-aligned box", () => {
    const bounds = polygonBounds([
      { x: -1, y: 2 },
      { x: 3, y: 0 },
      { x: 1, y: 5 },
    ]);
    expect(bounds).toEqual({ minX: -1, minY: 0, maxX: 3, maxY: 5, width: 4, height: 5 });
  });

  it("returns zeros for an empty polygon", () => {
    expect(polygonBounds([]).width).toBe(0);
  });
});

describe("nearestPointInFace", () => {
  function faceOf(polygon: Point[]): Face {
    return { vertexIds: [], polygon, area: Math.abs(shoelaceArea(polygon)) };
  }

  const unitSquare = faceOf([
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 1, y: 1 },
    { x: 0, y: 1 },
  ]);

  it("returns an interior point unchanged", () => {
    const p = { x: 0.4, y: 0.6 };
    expect(nearestPointInFace(p, unitSquare)).toBe(p);
  });

  it("returns an interior point unchanged when it clears the inset", () => {
    const p = { x: 0.5, y: 0.5 };
    expect(nearestPointInFace(p, unitSquare, 0.2)).toBe(p);
  });

  it("projects an outside point onto the boundary", () => {
    const q = nearestPointInFace({ x: 2, y: 0.5 }, unitSquare);
    expect(q.x).toBeCloseTo(1);
    expect(q.y).toBeCloseTo(0.5);
  });

  it("projects an outside corner point onto the corner", () => {
    const q = nearestPointInFace({ x: 3, y: 3 }, unitSquare);
    expect(q.x).toBeCloseTo(1);
    expect(q.y).toBeCloseTo(1);
  });

  it("pushes an outside point inward by the inset", () => {
    const q = nearestPointInFace({ x: 2, y: 0.5 }, unitSquare, 0.2);
    expect(q.x).toBeCloseTo(0.8);
    expect(q.y).toBeCloseTo(0.5);
  });

  it("pushes an interior point off an edge it sits closer to than the inset", () => {
    const q = nearestPointInFace({ x: 0.95, y: 0.5 }, unitSquare, 0.2);
    expect(q.x).toBeCloseTo(0.8);
    expect(q.y).toBeCloseTo(0.5);
  });

  it("keeps the inset from both edges of a corner", () => {
    const q = nearestPointInFace({ x: 2, y: -1 }, unitSquare, 0.2);
    expect(q.x).toBeCloseTo(0.8);
    expect(q.y).toBeCloseTo(0.2);
  });

  const lShape = faceOf([
    { x: 0, y: 0 },
    { x: 2, y: 0 },
    { x: 2, y: 1 },
    { x: 1, y: 1 },
    { x: 1, y: 2 },
    { x: 0, y: 2 },
  ]);

  it("pulls a point in the concave notch onto the nearest arm", () => {
    const q = nearestPointInFace({ x: 1.7, y: 1.4 }, lShape);
    expect(q.x).toBeCloseTo(1.7);
    expect(q.y).toBeCloseTo(1);
  });

  it("pushes inward from a concave edge into the polygon", () => {
    const q = nearestPointInFace({ x: 1.2, y: 1.8 }, lShape, 0.15);
    expect(q.x).toBeCloseTo(0.85);
    expect(q.y).toBeCloseTo(1.8);
    expect(pointInPolygon(q, lShape.polygon)).toBe(true);
  });
});

describe("flattenWall", () => {
  const verts: PlanVertex[] = [
    { id: "v-a", x: 0, y: 0 },
    { id: "v-b", x: 2, y: 0 },
  ];

  it("returns the two endpoints for a straight wall", () => {
    const wall: PlanWall = { id: "w-1", a: "v-a", b: "v-b", thickness: 0.1 };
    expect(flattenWall(wall, verts)).toEqual([
      { x: 0, y: 0 },
      { x: 2, y: 0 },
    ]);
  });

  it("flattens a curved wall into a fixed-segment bezier polyline", () => {
    const wall: PlanWall = { id: "w-1", a: "v-a", b: "v-b", thickness: 0.1, curve: { x: 1, y: 1 } };
    const line = flattenWall(wall, verts);
    expect(line).toHaveLength(CURVE_SEGMENTS + 1);
    expect(line[0]).toEqual({ x: 0, y: 0 });
    expect(line[CURVE_SEGMENTS]).toEqual({ x: 2, y: 0 });
    const mid = line[CURVE_SEGMENTS / 2];
    expect(mid.x).toBeCloseTo(1);
    expect(mid.y).toBeCloseTo(0.5);
  });
});

describe("wallApex / controlForApex", () => {
  const verts = [
    { id: "a", x: 0, y: 0 },
    { id: "b", x: 4, y: 0 },
  ];

  it("puts a straight wall's apex at its midpoint", () => {
    expect(wallApex({ id: "w", a: "a", b: "b", thickness: 0.1 }, verts)).toEqual({ x: 2, y: 0 });
  });

  it("reports the point a curved wall actually passes through", () => {
    const wall = { id: "w", a: "a", b: "b", thickness: 0.1, curve: { x: 2, y: 2 } };
    const apex = wallApex(wall, verts);
    const mid = flattenWall(wall, verts)[CURVE_SEGMENTS / 2];
    expect(apex.x).toBeCloseTo(mid.x, 9);
    expect(apex.y).toBeCloseTo(mid.y, 9);
  });

  it("round-trips: bending through a point puts the apex on that point", () => {
    const target = { x: 2.5, y: 1.4 };
    const curve = controlForApex(verts[0], verts[1], target);
    const apex = wallApex({ id: "w", a: "a", b: "b", thickness: 0.1, curve }, verts);
    expect(apex.x).toBeCloseTo(target.x, 9);
    expect(apex.y).toBeCloseTo(target.y, 9);
  });

  it("asks for no bend when the apex is the midpoint", () => {
    const curve = controlForApex(verts[0], verts[1], { x: 2, y: 0 });
    expect(curve).toEqual({ x: 2, y: 0 });
  });
});

describe("poleOfInaccessibility", () => {
  const rect = (x0: number, y0: number, x1: number, y1: number) => [
    { x: x0, y: y0 },
    { x: x1, y: y0 },
    { x: x1, y: y1 },
    { x: x0, y: y1 },
  ];

  /** A thin bar across the top with a thin leg down the right side. */
  const ell = [
    { x: 0, y: 0 },
    { x: 10, y: 0 },
    { x: 10, y: 10 },
    { x: 8, y: 10 },
    { x: 8, y: 2 },
    { x: 0, y: 2 },
  ];

  it("sits at the middle of a rectangle", () => {
    const p = poleOfInaccessibility(rect(0, 0, 8, 4));
    expect(p.x).toBeCloseTo(4, 1);
    expect(p.y).toBeCloseTo(2, 1);
  });

  it("stays inside a room whose bounding-box centre is not", () => {
    expect(pointInPolygon({ x: 5, y: 5 }, ell)).toBe(false);
    expect(pointInPolygon(poleOfInaccessibility(ell), ell)).toBe(true);
  });

  it("picks the wider arm", () => {
    // The top bar is 10 x 2, the leg 2 x 10 — same shape, so the deepest point
    // is whichever arm is thicker. Widen the bar and the label follows it.
    const wideTop = [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 10 },
      { x: 8, y: 10 },
      { x: 8, y: 4 },
      { x: 0, y: 4 },
    ];
    const p = poleOfInaccessibility(wideTop);
    expect(p.y).toBeLessThan(4);
    expect(pointInPolygon(p, wideTop)).toBe(true);
  });

  it("keeps its distance from every wall", () => {
    const p = poleOfInaccessibility(ell);
    for (let i = 0; i < ell.length; i++) {
      const d = pointSegmentDistance(p, ell[i], ell[(i + 1) % ell.length]);
      expect(d, `too close to edge ${i}`).toBeGreaterThan(0.8);
    }
  });

  it("falls back to the middle for a degenerate outline", () => {
    expect(poleOfInaccessibility([{ x: 1, y: 1 }, { x: 3, y: 1 }])).toEqual({ x: 2, y: 1 });
  });
});
