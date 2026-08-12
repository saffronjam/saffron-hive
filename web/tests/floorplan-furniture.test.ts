import { describe, expect, it } from "vitest";
import {
  FURNITURE_KINDS,
  MIN_FURNITURE_M,
  defaultFurniture,
  furnitureContainsPoint,
  furnitureCorners,
  furnitureGroups,
  furnitureKind,
  furnitureShapes,
  moveFurniture,
  snapFurnitureToWalls,
  nearestPointOutside,
  placementsInsideFurniture,
  resizeFromHandle,
  resizeFurniture,
  rotateFurnitureTo,
  scaleHandlePoint,
  scaleHandles,
} from "$lib/floorplan/furniture";
import type { FloorplanFurnitureData } from "$lib/floorplan-editable";
import type { PlanGraph } from "$lib/floorplan";

function piece(over: Partial<FloorplanFurnitureData> = {}): FloorplanFurnitureData {
  return {
    id: "f1",
    kind: "box",
    x: 0,
    y: 0,
    width: 2,
    height: 1,
    rotation: 0,
    occluder: false,
    ...over,
  };
}

describe("the catalogue", () => {
  it("gives every kind a real size and something to draw", () => {
    for (const kind of FURNITURE_KINDS) {
      expect(kind.size.width, kind.id).toBeGreaterThan(0);
      expect(kind.size.height, kind.id).toBeGreaterThan(0);
      const shapes = kind.draw(kind.size.width, kind.size.height);
      expect(shapes.some((s) => s.role === "body"), `${kind.id} has a body`).toBe(true);
    }
  });

  it("keeps detail bands at their real depth however wide a piece is", () => {
    // The point of building symbols per size: a wide bed keeps a normal pillow.
    const narrow = furnitureShapes(piece({ kind: "bed-single", width: 1.1, height: 2 }));
    const wide = furnitureShapes(piece({ kind: "bed-double", width: 1.8, height: 2 }));
    const depth = (shapes: ReturnType<typeof furnitureShapes>) => {
      const pillow = shapes.find((s) => s.s === "rect" && s.role === "detail");
      return pillow && pillow.s === "rect" ? pillow.h : 0;
    };
    expect(depth(wide)).toBeCloseTo(depth(narrow), 6);
  });

  it("groups the kinds in catalogue order without repeating a group", () => {
    const groups = furnitureGroups().map((g) => g.group);
    expect(groups).toEqual([...new Set(groups)]);
    expect(furnitureGroups().flatMap((g) => g.kinds)).toHaveLength(FURNITURE_KINDS.length);
  });

  it("drops a piece at its true size", () => {
    const bed = defaultFurniture("bed-double", { x: 3, y: 4 }, "f9");
    expect(bed).toMatchObject({ id: "f9", kind: "bed-double", x: 3, y: 4, width: 1.8, height: 2 });
    expect(bed.occluder).toBe(false);
    expect(bed.rotation).toBe(0);
  });

  it("has no shape for an unknown kind", () => {
    expect(furnitureKind("hovercraft")).toBeNull();
  });
});

describe("resizeFurniture", () => {
  const free = furnitureKind("box")!;
  const uniform = furnitureKind("sink")!;

  it("moves only the dragged axis on a free kind", () => {
    expect(resizeFurniture(free, { width: 2, height: 1 }, 3, 5, "x")).toEqual({
      width: 3,
      height: 1,
    });
    expect(resizeFurniture(free, { width: 2, height: 1 }, 3, 5, "y")).toEqual({
      width: 2,
      height: 5,
    });
    expect(resizeFurniture(free, { width: 2, height: 1 }, 3, 5, "both")).toEqual({
      width: 3,
      height: 5,
    });
  });

  it("keeps the ratio on a uniform kind, whichever axis moved", () => {
    const from = { width: 2, height: 1 };
    const byWidth = resizeFurniture(uniform, from, 4, 1, "both");
    expect(byWidth.width / byWidth.height).toBeCloseTo(2, 6);
    const byHeight = resizeFurniture(uniform, from, 2, 3, "both");
    expect(byHeight.width / byHeight.height).toBeCloseTo(2, 6);
    expect(byHeight.width).toBeCloseTo(6, 6);
  });

  it("never scales below the floor", () => {
    const tiny = resizeFurniture(free, { width: 2, height: 1 }, 0.01, -4, "both");
    expect(tiny.width).toBe(MIN_FURNITURE_M);
    expect(tiny.height).toBe(MIN_FURNITURE_M);
  });
});

describe("footprint geometry", () => {
  it("rotates the corners about the centre", () => {
    const turned = furnitureCorners(piece({ rotation: 90 }));
    const xs = turned.map((c) => c.x);
    const ys = turned.map((c) => c.y);
    expect(Math.max(...xs) - Math.min(...xs)).toBeCloseTo(1, 6);
    expect(Math.max(...ys) - Math.min(...ys)).toBeCloseTo(2, 6);
  });

  it("hit-tests a rotated piece by its real cover, not its bounding box", () => {
    const turned = piece({ rotation: 45, width: 2, height: 0.4 });
    expect(furnitureContainsPoint(turned, { x: 0.5, y: 0.5 })).toBe(true);
    // Inside the bounding box of the turned piece, outside the piece itself.
    expect(furnitureContainsPoint(turned, { x: 0.7, y: -0.7 })).toBe(false);
  });

  it("treats an ellipse kind as an ellipse", () => {
    const round = piece({ kind: "ellipse", width: 2, height: 2 });
    expect(furnitureContainsPoint(round, { x: 0.9, y: 0 })).toBe(true);
    // A corner of the box, well outside the circle inscribed in it.
    expect(furnitureContainsPoint(round, { x: 0.9, y: 0.9 })).toBe(false);
  });

  it("contains its own centre", () => {
    for (const kind of FURNITURE_KINDS) {
      const p = defaultFurniture(kind.id, { x: 5, y: -2 }, "f");
      expect(furnitureContainsPoint(p, { x: 5, y: -2 }), kind.id).toBe(true);
    }
  });
});

describe("transforms", () => {
  it("moves a piece to where the pointer put it", () => {
    expect(moveFurniture(piece(), { x: 4, y: -2 })).toMatchObject({ x: 4, y: -2 });
  });

  it("snaps rotation to 15° and wraps it into 0..360", () => {
    // Pointer straight up from the centre reads as no rotation.
    expect(rotateFurnitureTo(piece(), { x: 0, y: -3 }).rotation).toBe(0);
    expect(rotateFurnitureTo(piece(), { x: 3, y: 0 }).rotation).toBe(90);
    expect(rotateFurnitureTo(piece(), { x: -3, y: 0 }).rotation).toBe(270);
    // Just off a step still lands on it.
    expect(rotateFurnitureTo(piece(), { x: 3, y: -0.2 }).rotation).toBe(90);
  });

  it("leaves rotation free when the snap is off", () => {
    const free = rotateFurnitureTo(piece(), { x: 3, y: -0.6 }, 0).rotation;
    expect(free).toBeGreaterThan(78);
    expect(free).toBeLessThan(90);
  });

  it("offers corner handles only for a ratio-locked kind", () => {
    expect(scaleHandles(furnitureKind("sink")!)).toEqual(["nw", "ne", "se", "sw"]);
    expect(scaleHandles(furnitureKind("box")!)).toHaveLength(8);
  });

  it("holds the opposite corner still while a corner is dragged", () => {
    const before = piece({ width: 2, height: 1 });
    const anchor = scaleHandlePoint(before, "nw");
    const after = resizeFromHandle(before, "se", { x: 3, y: 2 });
    const moved = scaleHandlePoint(after, "nw");
    expect(moved.x).toBeCloseTo(anchor.x, 6);
    expect(moved.y).toBeCloseTo(anchor.y, 6);
    expect(after.width).toBeGreaterThan(before.width);
  });

  it("holds the opposite edge still while an edge is dragged", () => {
    const before = piece({ width: 2, height: 1 });
    const after = resizeFromHandle(before, "e", { x: 4, y: 0 });
    expect(scaleHandlePoint(after, "w").x).toBeCloseTo(scaleHandlePoint(before, "w").x, 6);
    expect(after.height).toBe(before.height);
  });

  it("keeps the anchor still on a rotated piece too", () => {
    const before = piece({ width: 2, height: 1, rotation: 45 });
    const anchor = scaleHandlePoint(before, "nw");
    const after = resizeFromHandle(before, "se", { x: 2, y: 2 });
    expect(scaleHandlePoint(after, "nw").x).toBeCloseTo(anchor.x, 6);
    expect(scaleHandlePoint(after, "nw").y).toBeCloseTo(anchor.y, 6);
  });
});

describe("lights and occluders", () => {
  const box = piece({ kind: "box", width: 2, height: 1, occluder: true });

  it("finds a placement standing inside an occluder", () => {
    expect(placementsInsideFurniture(box, [{ x: 0, y: 0 }])).toHaveLength(1);
    expect(placementsInsideFurniture(box, [{ x: 3, y: 0 }])).toHaveLength(0);
  });

  it("ignores a piece that lets light through", () => {
    const open = { ...box, occluder: false };
    expect(placementsInsideFurniture(open, [{ x: 0, y: 0 }])).toHaveLength(0);
  });

  it("slides a point out by its nearest edge", () => {
    // Nearer the top edge than the sides, so it leaves upward.
    const out = nearestPointOutside(box, { x: 0, y: -0.4 });
    expect(out.y).toBeLessThan(-0.5);
    expect(out.x).toBeCloseTo(0, 6);
    expect(furnitureContainsPoint(box, out)).toBe(false);
  });

  it("leaves a point that was never inside alone", () => {
    const at = { x: 5, y: 5 };
    expect(nearestPointOutside(box, at)).toEqual(at);
  });
});

describe("the sofa run", () => {
  it("offers a straight, a corner, a center and a side at one depth", () => {
    const run = FURNITURE_KINDS.filter((k) => k.id.startsWith("sofa-"));
    expect(run.map((k) => k.id)).toEqual([
      "sofa-straight",
      "sofa-corner",
      "sofa-center",
      "sofa-side",
    ]);
    // A shared depth is what lets the modules line up side by side, and the
    // corner and side pieces are square so a run can turn either way.
    const depths = new Set(run.map((k) => k.size.height));
    expect(depths.size).toBe(1);
    for (const id of ["sofa-corner", "sofa-side"]) {
      const kind = furnitureKind(id)!;
      expect(kind.size.width, id).toBe(kind.size.height);
    }
  });

  it("gives the center module no arms to butt against its neighbours", () => {
    const center = furnitureKind("sofa-center")!.draw(1, 0.9);
    const straight = furnitureKind("sofa-straight")!.draw(2.1, 0.9);
    expect(center.filter((s) => s.role === "detail")).toHaveLength(1);
    expect(straight.filter((s) => s.role === "detail").length).toBeGreaterThan(1);
  });
});

describe("real-world sizes", () => {
  // Defaults are the sizes these things actually come in, so a piece dropped
  // on the plan needs no resizing to be honest about the room it fills.
  const EXPECTED: Record<string, [number, number]> = {
    sink: [0.8, 0.51],
    toilet: [0.35, 0.65],
    bathtub: [1.7, 0.74],
    armchair: [0.85, 0.85],
    "bed-single": [1.1, 2],
    "bed-medium": [1.4, 2],
    "bed-double": [1.8, 2],
    "sofa-straight": [2.1, 0.9],
    "sofa-corner": [0.9, 0.9],
    "sofa-center": [1, 0.9],
    "sofa-side": [0.9, 0.9],
    box: [1, 0.6],
    ellipse: [0.9, 0.9],
  };

  it("drops every kind at its real size", () => {
    for (const kind of FURNITURE_KINDS) {
      const want = EXPECTED[kind.id];
      expect(want, `${kind.id} has an expected size`).toBeDefined();
      expect([kind.size.width, kind.size.height], kind.id).toEqual(want);
    }
    expect(Object.keys(EXPECTED)).toHaveLength(FURNITURE_KINDS.length);
  });

  it("draws every detail inside the piece it belongs to", () => {
    for (const kind of FURNITURE_KINDS) {
      const { width: w, height: h } = kind.size;
      for (const shape of kind.draw(w, h)) {
        const [left, right, top, bottom] =
          shape.s === "ellipse"
            ? [shape.x - shape.rx, shape.x + shape.rx, shape.y - shape.ry, shape.y + shape.ry]
            : shape.s === "rect"
              ? [shape.x, shape.x + shape.w, shape.y, shape.y + shape.h]
              : [
                  Math.min(shape.x1, shape.x2),
                  Math.max(shape.x1, shape.x2),
                  Math.min(shape.y1, shape.y2),
                  Math.max(shape.y1, shape.y2),
                ];
        expect(left, `${kind.id} left`).toBeGreaterThanOrEqual(-w / 2 - 1e-9);
        expect(right, `${kind.id} right`).toBeLessThanOrEqual(w / 2 + 1e-9);
        expect(top, `${kind.id} top`).toBeGreaterThanOrEqual(-h / 2 - 1e-9);
        expect(bottom, `${kind.id} bottom`).toBeLessThanOrEqual(h / 2 + 1e-9);
      }
    }
  });
});

describe("stretching a sofa", () => {
  const armWidth = (id: string, w: number, h: number) => {
    // The arm is the narrow band running the full depth at one end.
    const arm = furnitureKind(id)!
      .draw(w, h)
      .find((sh) => sh.s === "rect" && sh.role === "detail" && sh.h === h);
    return arm && arm.s === "rect" ? arm.w : null;
  };

  it("scales each axis on its own", () => {
    for (const id of ["sofa-straight", "sofa-corner", "sofa-center", "sofa-side"]) {
      expect(furnitureKind(id)!.scale, id).toBe("free");
    }
    const kind = furnitureKind("sofa-straight")!;
    expect(resizeFurniture(kind, { width: 2.1, height: 0.9 }, 3, 0.9, "x")).toEqual({
      width: 3,
      height: 0.9,
    });
  });

  it("holds the arm rests at their real width however wide it is stretched", () => {
    expect(armWidth("sofa-straight", 3.6, 0.9)).toBeCloseTo(armWidth("sofa-straight", 2.1, 0.9)!, 6);
    expect(armWidth("sofa-side", 2.4, 0.9)).toBeCloseTo(armWidth("sofa-side", 0.9, 0.9)!, 6);
  });

  it("holds the back at its real depth however deep it is stretched", () => {
    const back = (h: number) => {
      const shapes = furnitureKind("sofa-straight")!.draw(2.1, h);
      const b = shapes.find((sh) => sh.s === "rect" && sh.role === "detail" && sh.w === 2.1);
      return b && b.s === "rect" ? b.h : null;
    };
    expect(back(1.6)).toBeCloseTo(back(0.9)!, 6);
  });
});

describe("snapped resizing", () => {
  const free = furnitureKind("box")!;

  it("lands the size on the grid step while snapping is on", () => {
    expect(resizeFurniture(free, { width: 1, height: 0.6 }, 1.63, 0.94, "both", 0.1)).toEqual({
      width: 1.6,
      height: 0.9,
    });
  });

  it("leaves the size alone when snapping is off", () => {
    const free_ = resizeFurniture(free, { width: 1, height: 0.6 }, 1.63, 0.94, "both", 0);
    expect(free_.width).toBeCloseTo(1.63, 6);
    expect(free_.height).toBeCloseTo(0.94, 6);
  });

  it("still refuses to snap a piece away to nothing", () => {
    expect(resizeFurniture(free, { width: 1, height: 0.6 }, 0.02, 0.02, "both", 0.1).width).toBe(
      MIN_FURNITURE_M,
    );
  });

  it("snaps through the handle path too", () => {
    const before = piece({ kind: "box", width: 1, height: 0.6 });
    const after = resizeFromHandle(before, "e", { x: 1.13, y: 0 }, 0.1);
    expect(after.width).toBeCloseTo(1.6, 6);
  });
});

describe("sitting flush against a wall", () => {
  /** A room from (0,0) to (6,4), walls 0.2 thick on the centerline. */
  const room = (): PlanGraph => ({
    vertices: [
      { id: "a", x: 0, y: 0 },
      { id: "b", x: 6, y: 0 },
      { id: "c", x: 6, y: 4 },
      { id: "d", x: 0, y: 4 },
    ],
    walls: [
      { id: "top", a: "a", b: "b", thickness: 0.2 },
      { id: "right", a: "b", b: "c", thickness: 0.2 },
      { id: "bottom", a: "c", b: "d", thickness: 0.2 },
      { id: "left", a: "d", b: "a", thickness: 0.2 },
    ],
  });

  it("puts a piece flush against a vertical wall, whatever its size", () => {
    // The grid could never reach this: flush wants 5.9 - 0.5 = 5.4 for a 1.0 m
    // box, and 5.9 - 0.35 = 5.55 for a 0.7 m one.
    for (const width of [1, 0.7, 1.8]) {
      const piece = { ...box(), width, x: 6 - 0.1 - width / 2 + 0.06, y: 2 };
      const at = snapFurnitureToWalls(piece, room(), 0.15);
      expect(at.x, `width ${width}`).toBeCloseTo(5.9 - width / 2, 6);
    }
  });

  it("puts a piece flush against a horizontal wall too", () => {
    const piece = { ...box(), height: 0.6, x: 3, y: 0.1 + 0.3 + 0.05 };
    expect(snapFurnitureToWalls(piece, room(), 0.15).y).toBeCloseTo(0.1 + 0.3, 6);
  });

  it("seats a rotated piece on the side it actually presents", () => {
    // Turned 90°, a 1.8 x 0.7 piece is 0.7 wide, so flush is 5.9 - 0.35.
    const piece = { ...box(), width: 1.8, height: 0.7, rotation: 90, x: 5.5, y: 2 };
    expect(snapFurnitureToWalls(piece, room(), 0.15).x).toBeCloseTo(5.9 - 0.35, 6);
  });

  it("takes both walls at once in a corner", () => {
    const piece = { ...box(), width: 1, height: 0.6, x: 0.65, y: 0.45 };
    const at = snapFurnitureToWalls(piece, room(), 0.15);
    expect(at.x).toBeCloseTo(0.1 + 0.5, 6);
    expect(at.y).toBeCloseTo(0.1 + 0.3, 6);
  });

  it("leaves a piece alone when no wall is near", () => {
    const piece = { ...box(), x: 3, y: 2 };
    expect(snapFurnitureToWalls(piece, room(), 0.15)).toEqual({ x: 3, y: 2 });
  });

  it("does nothing when snapping is off", () => {
    const piece = { ...box(), x: 5.42, y: 2 };
    expect(snapFurnitureToWalls(piece, room(), 0)).toEqual({ x: 5.42, y: 2 });
  });
});

function box(): FloorplanFurnitureData {
  return { id: "f", kind: "box", x: 0, y: 0, width: 1, height: 0.6, rotation: 0, occluder: false };
}
