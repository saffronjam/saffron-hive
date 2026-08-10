import { describe, it, expect } from "vitest";
import { MITER_LIMIT, wallOutline } from "$lib/floorplan";
import type { PlanVertex, PlanWall } from "$lib/floorplan";

function wall(id: string, a: string, b: string, thickness = 0.1): PlanWall {
  return { id, a, b, thickness };
}

function containsPoint(outline: { x: number; y: number }[], x: number, y: number): boolean {
  return outline.some((p) => Math.abs(p.x - x) < 1e-9 && Math.abs(p.y - y) < 1e-9);
}

describe("wallOutline", () => {
  it("outlines a straight run with butt caps at free ends", () => {
    const verts: PlanVertex[] = [
      { id: "v-a", x: 0, y: 0 },
      { id: "v-b", x: 2, y: 0 },
    ];
    const outline = wallOutline(wall("w-1", "v-a", "v-b"), verts, [])[0];
    expect(outline).toHaveLength(4);
    expect(containsPoint(outline, 0, 0.05)).toBe(true);
    expect(containsPoint(outline, 2, 0.05)).toBe(true);
    expect(containsPoint(outline, 2, -0.05)).toBe(true);
    expect(containsPoint(outline, 0, -0.05)).toBe(true);
  });

  it("miters a right-angle corner at the 45-degree positions", () => {
    const verts: PlanVertex[] = [
      { id: "v-a", x: 0, y: 0 },
      { id: "v-b", x: 1, y: 0 },
      { id: "v-c", x: 1, y: 1 },
    ];
    const w1 = wall("w-1", "v-a", "v-b");
    const w2 = wall("w-2", "v-b", "v-c");
    const outline = wallOutline(w1, verts, [w2])[0];
    expect(containsPoint(outline, 0.95, 0.05)).toBe(true);
    expect(containsPoint(outline, 1.05, -0.05)).toBe(true);
    expect(containsPoint(outline, 0, 0.05)).toBe(true);
    expect(containsPoint(outline, 0, -0.05)).toBe(true);
  });

  it("shares the miter corners with the neighbor's outline", () => {
    const verts: PlanVertex[] = [
      { id: "v-a", x: 0, y: 0 },
      { id: "v-b", x: 1, y: 0 },
      { id: "v-c", x: 1, y: 1 },
    ];
    const w1 = wall("w-1", "v-a", "v-b");
    const w2 = wall("w-2", "v-b", "v-c");
    const outline = wallOutline(w2, verts, [w1])[0];
    expect(containsPoint(outline, 0.95, 0.05)).toBe(true);
    expect(containsPoint(outline, 1.05, -0.05)).toBe(true);
  });

  it("clamps the miter at acute angles so corners cannot spike", () => {
    const verts: PlanVertex[] = [
      { id: "v-a", x: 0, y: 0 },
      { id: "v-b", x: 2, y: 0 },
      { id: "v-c", x: 2, y: 0.2 },
    ];
    const w1 = wall("w-1", "v-a", "v-b");
    const w2 = wall("w-2", "v-a", "v-c");
    const outline = wallOutline(w1, verts, [w2])[0];
    const maxMiter = (MITER_LIMIT * 0.1) / 2;
    for (const corner of [outline[0], outline[3]]) {
      expect(Math.hypot(corner.x, corner.y)).toBeLessThanOrEqual(maxMiter + 1e-9);
    }
  });

  it("keeps collinear continuations flush", () => {
    const verts: PlanVertex[] = [
      { id: "v-a", x: 0, y: 0 },
      { id: "v-b", x: 1, y: 0 },
      { id: "v-c", x: 2, y: 0 },
    ];
    const outline = wallOutline(wall("w-1", "v-a", "v-b"), verts, [wall("w-2", "v-b", "v-c")])[0];
    expect(containsPoint(outline, 1, 0.05)).toBe(true);
    expect(containsPoint(outline, 1, -0.05)).toBe(true);
  });

  it("offsets a curved wall along its flattened polyline", () => {
    const verts: PlanVertex[] = [
      { id: "v-a", x: 0, y: 0 },
      { id: "v-b", x: 2, y: 0 },
    ];
    const curved: PlanWall = { ...wall("w-1", "v-a", "v-b"), curve: { x: 1, y: 1 } };
    const outline = wallOutline(curved, verts, [])[0];
    expect(outline).toHaveLength(34);
    const apexTop = outline.reduce((best, p) => (p.y > best.y ? p : best), outline[0]);
    expect(apexTop.y).toBeCloseTo(0.55, 2);
  });

  it("yields exactly one polygon for a wall with no openings", () => {
    const verts: PlanVertex[] = [
      { id: "v-a", x: 0, y: 0 },
      { id: "v-b", x: 4, y: 0 },
    ];
    expect(wallOutline(wall("w-1", "v-a", "v-b"), verts, [])).toHaveLength(1);
    expect(wallOutline({ ...wall("w-1", "v-a", "v-b"), openings: [] }, verts, [])).toHaveLength(1);
  });
});

describe("wallOutline with openings", () => {
  const verts: PlanVertex[] = [
    { id: "v-a", x: 0, y: 0 },
    { id: "v-b", x: 4, y: 0 },
  ];

  function withDoor(t: number, width: number): PlanWall {
    return {
      ...wall("w-1", "v-a", "v-b"),
      openings: [{ id: "o-1", t, width, kind: "door" }],
    };
  }

  it("splits a straight wall into two bodies with the gap edges at half the width", () => {
    const polygons = wallOutline(withDoor(0.5, 1), verts, []);
    expect(polygons).toHaveLength(2);
    for (const polygon of polygons) expect(polygon).toHaveLength(4);

    const maxX = Math.max(...polygons[0].map((p) => p.x));
    const minX = Math.min(...polygons[1].map((p) => p.x));
    expect(maxX).toBeCloseTo(1.5, 9);
    expect(minX).toBeCloseTo(2.5, 9);

    expect(Math.min(...polygons[0].map((p) => p.x))).toBeCloseTo(0, 9);
    expect(Math.max(...polygons[1].map((p) => p.x))).toBeCloseTo(4, 9);
    for (const polygon of polygons) {
      for (const p of polygon) expect(Math.abs(p.y)).toBeCloseTo(0.05, 9);
    }
  });

  it("splits a curved wall into two bodies", () => {
    const curved: PlanWall = { ...withDoor(0.5, 1), curve: { x: 2, y: 2 } };
    const polygons = wallOutline(curved, verts, []);
    expect(polygons).toHaveLength(2);
    for (const polygon of polygons) expect(polygon.length).toBeGreaterThanOrEqual(4);
  });

  it("returns no polygons when an opening covers the whole wall", () => {
    expect(wallOutline(withDoor(0.5, 9), verts, [])).toEqual([]);
  });

  it("leaves a mixed-thickness miter untouched when the neighbour has an opening", () => {
    const corner: PlanVertex[] = [
      { id: "v-a", x: 0, y: 0 },
      { id: "v-b", x: 4, y: 0 },
      { id: "v-c", x: 4, y: 4 },
    ];
    const thin = wall("w-1", "v-a", "v-b", 0.1);
    const thick = wall("w-2", "v-b", "v-c", 0.3);
    const plain = wallOutline(thin, corner, [thick]);
    const withOpening = wallOutline(thin, corner, [
      { ...thick, openings: [{ id: "o-1", t: 0.5, width: 1, kind: "window" }] },
    ]);
    expect(withOpening).toEqual(plain);
  });
});

/** Winding-agnostic area, for asking whether a set of polygons tiles a region. */
function area(poly: { x: number; y: number }[]): number {
  let sum = 0;
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    sum += a.x * b.y - b.x * a.y;
  }
  return Math.abs(sum) / 2;
}

function pointInPoly(poly: { x: number; y: number }[], x: number, y: number): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const hit =
      poly[i].y > y !== poly[j].y > y &&
      x < ((poly[j].x - poly[i].x) * (y - poly[i].y)) / (poly[j].y - poly[i].y) + poly[i].x;
    if (hit) inside = !inside;
  }
  return inside;
}

describe("wallOutline junctions", () => {
  // A T: a run through the origin along x, with a stem going down from it.
  const tVerts: PlanVertex[] = [
    { id: "v-l", x: -1, y: 0 },
    { id: "v-m", x: 0, y: 0 },
    { id: "v-r", x: 1, y: 0 },
    { id: "v-s", x: 0, y: 1 },
  ];
  const tWalls = [wall("w-l", "v-l", "v-m"), wall("w-r", "v-m", "v-r"), wall("w-s", "v-m", "v-s")];

  function outlinesAt(walls: PlanWall[], verts: PlanVertex[]) {
    return walls.map(
      (w) =>
        wallOutline(
          w,
          verts,
          walls.filter((o) => o.id !== w.id && (o.a === w.a || o.a === w.b || o.b === w.a || o.b === w.b)),
        )[0],
    );
  }

  it("leaves no gap in the middle of a T-junction", () => {
    const outlines = outlinesAt(tWalls, tVerts);
    // The core of a T is the triangle between the run's far edge and the stem's
    // two sides; every point just inside it must belong to some wall.
    for (const [x, y] of [
      [0, -0.04],
      [0, 0],
      [0, 0.04],
      [-0.04, 0.04],
      [0.04, 0.04],
    ]) {
      expect(outlines.some((o) => pointInPoly(o, x, y))).toBe(true);
    }
  });

  it("leaves no gap in the middle of a crossing", () => {
    const verts: PlanVertex[] = [...tVerts, { id: "v-n", x: 0, y: -1 }];
    const walls = [...tWalls, wall("w-n", "v-m", "v-n")];
    const outlines = outlinesAt(walls, verts);
    for (const [x, y] of [
      [0, 0],
      [0.04, 0.04],
      [-0.04, 0.04],
      [0.04, -0.04],
      [-0.04, -0.04],
    ]) {
      expect(outlines.some((o) => pointInPoly(o, x, y))).toBe(true);
    }
  });

  it("splits the junction core between the walls without overlapping", () => {
    const outlines = outlinesAt(tWalls, tVerts);
    // The three bodies tile the T exactly: the 2 x 0.1 run through the origin,
    // plus the stem from where the run's edge ends down to its far end. Summing
    // the areas equals that union only if nothing is double-covered.
    const run = 2 * 0.1;
    const stem = (1 - 0.05) * 0.1;
    const total = outlines.reduce((sum, o) => sum + area(o), 0);
    expect(total).toBeCloseTo(run + stem, 6);
  });
});

describe("wallOutline openings", () => {
  // A run that turns a corner at its left end, so the miter displaces that
  // end's two side points along the wall.
  const verts: PlanVertex[] = [
    { id: "up", x: 0, y: -1 },
    { id: "a", x: 0, y: 0 },
    { id: "b", x: 4, y: 0 },
  ];
  const corner = wall("w-up", "up", "a");

  function bodies(openings: { id: string; t: number; width: number; kind: "window" }[]) {
    const run = { ...wall("w-ab", "a", "b"), openings };
    return wallOutline(run, verts, [corner]);
  }

  it("cuts a jamb square across the wall, not leaning with the miter", () => {
    const [before, after] = bodies([{ id: "win", t: 0.5, width: 1, kind: "window" }]);
    // The jamb is the edge between the two points nearest the gap; square means
    // both sit at the same distance along the wall.
    const leftJamb = before.filter((p) => Math.abs(p.x - 1.5) < 0.2);
    const rightJamb = after.filter((p) => Math.abs(p.x - 2.5) < 0.2);
    expect(leftJamb).toHaveLength(2);
    expect(rightJamb).toHaveLength(2);
    expect(leftJamb[0].x).toBeCloseTo(leftJamb[1].x, 9);
    expect(rightJamb[0].x).toBeCloseTo(rightJamb[1].x, 9);
  });

  it("keeps the gap exactly as wide as the opening asked for", () => {
    const [before, after] = bodies([{ id: "win", t: 0.5, width: 1, kind: "window" }]);
    const gapStart = Math.max(...before.map((p) => p.x));
    const gapEnd = Math.min(...after.map((p) => p.x));
    expect(gapEnd - gapStart).toBeCloseTo(1, 9);
  });

  it("still keeps the mitered corner on the end that has one", () => {
    const [before] = bodies([{ id: "win", t: 0.5, width: 1, kind: "window" }]);
    // The corner pulls one side of the left end back by half the thickness.
    expect(Math.min(...before.map((p) => p.x))).toBeCloseTo(-0.05, 9);
  });
});
