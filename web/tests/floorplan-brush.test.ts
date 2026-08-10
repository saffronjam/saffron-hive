import { describe, expect, it } from "vitest";
import {
  BRUSH_RADIUS_PX,
  BRUSH_RADIUS_STEP_PX,
  MAX_BRUSH_RADIUS_PX,
  MIN_BRUSH_RADIUS_PX,
  brushHits,
  createStrokeAccumulator,
  screenRadiusToWorld,
  stepBrushRadius,
} from "$lib/floorplan/brush";

describe("screenRadiusToWorld", () => {
  it("divides the pixel radius by the zoom scale", () => {
    expect(screenRadiusToWorld(48, 50)).toBeCloseTo(0.96, 5);
    expect(screenRadiusToWorld(48, 400)).toBeCloseTo(0.12, 5);
  });

  it("has a sane default radius", () => {
    expect(BRUSH_RADIUS_PX).toBeGreaterThan(0);
  });
});

describe("brushHits", () => {
  const placements = [
    { id: "device:a", x: 0, y: 0 },
    { id: "device:b", x: 1, y: 0 },
    { id: "group:g", x: 3, y: 4 },
  ];

  it("includes placements inside and exactly on the radius", () => {
    expect(brushHits(placements, { x: 0, y: 0 }, 1)).toEqual(["device:a", "device:b"]);
  });

  it("excludes placements just outside", () => {
    expect(brushHits(placements, { x: 0, y: 0 }, 0.99)).toEqual(["device:a"]);
  });

  it("hits the distant placement when centered on it", () => {
    expect(brushHits(placements, { x: 3, y: 4 }, 0.5)).toEqual(["group:g"]);
  });

  it("returns a group and a device caught together as two keys", () => {
    expect(brushHits([placements[0], { id: "group:g", x: 0.2, y: 0 }], { x: 0, y: 0 }, 1)).toEqual([
      "device:a",
      "group:g",
    ]);
  });
});

describe("createStrokeAccumulator", () => {
  it("hands each device out exactly once per stroke", () => {
    const acc = createStrokeAccumulator();
    acc.add(["a", "b"]);
    expect(acc.drainPending()).toEqual(["a", "b"]);
    acc.add(["b", "c"]);
    expect(acc.drainPending()).toEqual(["c"]);
    acc.add(["a", "c"]);
    expect(acc.drainPending()).toEqual([]);
  });

  it("counts pending until drained", () => {
    const acc = createStrokeAccumulator();
    acc.add(["a", "b"]);
    expect(acc.pendingCount).toBe(2);
    acc.drainPending();
    expect(acc.pendingCount).toBe(0);
  });

  it("reset starts the next stroke clean", () => {
    const acc = createStrokeAccumulator();
    acc.add(["a"]);
    acc.drainPending();
    acc.reset();
    acc.add(["a"]);
    expect(acc.drainPending()).toEqual(["a"]);
  });
});

describe("stepBrushRadius", () => {
  it("moves one notch per step in either direction", () => {
    expect(stepBrushRadius(48, 1)).toBe(48 + BRUSH_RADIUS_STEP_PX);
    expect(stepBrushRadius(48, -1)).toBe(48 - BRUSH_RADIUS_STEP_PX);
    expect(stepBrushRadius(48, 3)).toBe(48 + 3 * BRUSH_RADIUS_STEP_PX);
  });

  it("stops at the bounds instead of running past them", () => {
    expect(stepBrushRadius(MIN_BRUSH_RADIUS_PX, -5)).toBe(MIN_BRUSH_RADIUS_PX);
    expect(stepBrushRadius(MAX_BRUSH_RADIUS_PX, 5)).toBe(MAX_BRUSH_RADIUS_PX);
    expect(stepBrushRadius(MAX_BRUSH_RADIUS_PX - 1, 1)).toBe(MAX_BRUSH_RADIUS_PX);
  });

  it("keeps the default inside the bounds", () => {
    expect(BRUSH_RADIUS_PX).toBeGreaterThanOrEqual(MIN_BRUSH_RADIUS_PX);
    expect(BRUSH_RADIUS_PX).toBeLessThanOrEqual(MAX_BRUSH_RADIUS_PX);
  });
});
