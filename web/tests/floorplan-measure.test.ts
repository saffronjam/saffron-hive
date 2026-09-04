import { describe, it, expect } from "vitest";
import { faceAreaM2, faceBounds, formatArea, formatMeters, wallLength } from "$lib/floorplan";
import type { Face, PlanVertex, PlanWall } from "$lib/floorplan";

const verts: PlanVertex[] = [
  { id: "v-a", x: 0, y: 0 },
  { id: "v-b", x: 3, y: 4 },
];

describe("wallLength", () => {
  it("measures a straight wall", () => {
    const wall: PlanWall = { id: "w-1", a: "v-a", b: "v-b", thickness: 0.1 };
    expect(wallLength(wall, verts)).toBeCloseTo(5);
  });

  it("measures a curved wall along its polyline, longer than the chord", () => {
    const flat: PlanVertex[] = [
      { id: "v-a", x: 0, y: 0 },
      { id: "v-b", x: 2, y: 0 },
    ];
    const wall: PlanWall = { id: "w-1", a: "v-a", b: "v-b", thickness: 0.1, curve: { x: 1, y: 1 } };
    const length = wallLength(wall, flat);
    expect(length).toBeGreaterThan(2);
    expect(length).toBeLessThan(2 * Math.SQRT2);
  });
});

describe("faceAreaM2", () => {
  it("returns a positive area regardless of polygon winding", () => {
    const cw: Face = {
      vertexIds: ["v-1", "v-4", "v-3", "v-2"],
      polygon: [
        { x: 0, y: 0 },
        { x: 0, y: 3 },
        { x: 4, y: 3 },
        { x: 4, y: 0 },
      ],
      area: 12,
    };
    expect(faceAreaM2(cw)).toBeCloseTo(12);
  });
});

describe("faceBounds", () => {
  it("returns the bounding width and height", () => {
    const face: Face = {
      vertexIds: ["v-1", "v-2", "v-3"],
      polygon: [
        { x: 1, y: 1 },
        { x: 4, y: 1 },
        { x: 4, y: 3 },
      ],
      area: 3,
    };
    expect(faceBounds(face)).toEqual({ width: 3, height: 2 });
  });
});

describe("formatMeters", () => {
  it("formats to 0.01 m precision with the unit", () => {
    expect(formatMeters(3.238, "en")).toBe("3.24\u00a0m");
    expect(formatMeters(2, "en")).toBe("2.00\u00a0m");
    expect(formatMeters(0.05, "en")).toBe("0.05\u00a0m");
    expect(formatMeters(3.238, "ru")).toBe("3,24\u00a0m");
  });
});

describe("formatArea", () => {
  it("formats to 0.01 m² precision with the unit", () => {
    expect(formatArea(12, "en")).toBe("12.00\u00a0m²");
    expect(formatArea(11.996, "en")).toBe("12.00\u00a0m²");
    expect(formatArea(3.456, "en")).toBe("3.46\u00a0m²");
    expect(formatArea(3.456, "ru")).toBe("3,46\u00a0m²");
  });
});
