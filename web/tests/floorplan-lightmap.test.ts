import { describe, expect, it } from "vitest";
import {
  CELL_INDOOR,
  CELL_OUTDOOR,
  CELL_PORTAL,
  CELL_SOLID,
  CELL_KIND_MASK,
  CELL_OCCLUDER,
  combineLight,
  computeDaylight,
  lampField,
  rasterisePlan,
  worldToCell,
  type LightmapGrid,
} from "$lib/floorplan/lightmap";
import { detectFaces } from "$lib/floorplan";
import type { PlanGraph, PlanOpening, PlanWall, Point } from "$lib/floorplan";
import { temperatureToRgb } from "$lib/device-tint";
import type { SunPosition } from "$lib/sun";
import type { FloorplanFurnitureData } from "$lib/floorplan-editable";

function sun(elevation: number, azimuth: number): SunPosition {
  return { elevation, azimuth };
}

/** Plan drawn with north up, so a compass bearing reads straight off the screen. */
const NORTH_UP = 0;

interface RoomSpec {
  x: number;
  y: number;
  w: number;
  h: number;
  /** Openings per side, keyed by which wall they sit on. */
  openings?: Partial<Record<"top" | "right" | "bottom" | "left", PlanOpening[]>>;
  thickness?: number;
}

let mintCounter = 0;

/**
 * Rectangular rooms from specs, sharing vertices where corners coincide so
 * adjacent rooms genuinely share a wall.
 */
function plan(...rooms: RoomSpec[]): PlanGraph {
  const vertices = new Map<string, Point>();
  const walls: PlanWall[] = [];
  const wallByPair = new Map<string, PlanWall>();

  const vertexId = (p: Point): string => {
    const id = `v${p.x},${p.y}`;
    vertices.set(id, p);
    return id;
  };

  for (const room of rooms) {
    const { x, y, w, h } = room;
    const corners = {
      nw: vertexId({ x, y }),
      ne: vertexId({ x: x + w, y }),
      se: vertexId({ x: x + w, y: y + h }),
      sw: vertexId({ x, y: y + h }),
    };
    const sides: [keyof NonNullable<RoomSpec["openings"]>, string, string][] = [
      ["top", corners.nw, corners.ne],
      ["right", corners.ne, corners.se],
      ["bottom", corners.se, corners.sw],
      ["left", corners.sw, corners.nw],
    ];
    for (const [side, a, b] of sides) {
      const pair = a < b ? `${a}|${b}` : `${b}|${a}`;
      let wall = wallByPair.get(pair);
      if (!wall) {
        wall = { id: `w${++mintCounter}`, a, b, thickness: room.thickness ?? 0.1 };
        wallByPair.set(pair, wall);
        walls.push(wall);
      }
      const added = room.openings?.[side];
      if (added) wall.openings = [...(wall.openings ?? []), ...added];
    }
  }

  return {
    vertices: [...vertices.entries()].map(([id, p]) => ({ id, x: p.x, y: p.y })),
    walls,
  };
}

function opening(kind: PlanOpening["kind"], t: number, width: number): PlanOpening {
  return { id: `o${++mintCounter}`, kind, t, width };
}

function build(graph: PlanGraph): LightmapGrid {
  const grid = rasterisePlan(graph, detectFaces(graph));
  expect(grid).not.toBeNull();
  return grid!;
}

function kindAt(grid: LightmapGrid, x: number, y: number): number {
  const cell = worldToCell(grid, { x, y });
  expect(cell, `(${x},${y}) is outside the grid`).not.toBeNull();
  return grid.cells[cell!.cy * grid.width + cell!.cx] & CELL_KIND_MASK;
}

function lightAt(grid: LightmapGrid, field: Float32Array, x: number, y: number): number {
  const cell = worldToCell(grid, { x, y });
  expect(cell, `(${x},${y}) is outside the grid`).not.toBeNull();
  return field[cell!.cy * grid.width + cell!.cx];
}

describe("rasterisePlan classification", () => {
  it("marks room interiors, wall lines and the outside", () => {
    const grid = build(plan({ x: 0, y: 0, w: 4, h: 3 }));
    expect(kindAt(grid, 2, 1.5)).toBe(CELL_INDOOR);
    expect(kindAt(grid, 2, 0)).toBe(CELL_SOLID);
    expect(kindAt(grid, 2, -0.4)).toBe(CELL_OUTDOOR);
    expect(kindAt(grid, 4.4, 1.5)).toBe(CELL_OUTDOOR);
  });

  it("records which face owns each indoor cell", () => {
    const graph = plan({ x: 0, y: 0, w: 4, h: 3 }, { x: 4, y: 0, w: 3, h: 3 });
    const faces = detectFaces(graph);
    const grid = rasterisePlan(graph, faces)!;
    const inFirst = worldToCell(grid, { x: 2, y: 1.5 })!;
    const inSecond = worldToCell(grid, { x: 5.5, y: 1.5 })!;
    const a = grid.faceIndex[inFirst.cy * grid.width + inFirst.cx];
    const b = grid.faceIndex[inSecond.cy * grid.width + inSecond.cx];
    expect(a).not.toBe(b);
    expect(faces[a].polygon.some((p) => p.x <= 4)).toBe(true);
  });

  it("has nothing to rasterise without walls or without rooms", () => {
    expect(rasterisePlan({ vertices: [], walls: [] }, [])).toBeNull();
    const open: PlanGraph = {
      vertices: [
        { id: "a", x: 0, y: 0 },
        { id: "b", x: 3, y: 0 },
      ],
      walls: [{ id: "w", a: "a", b: "b", thickness: 0.1 }],
    };
    expect(rasterisePlan(open, detectFaces(open))).toBeNull();
  });

  it("seals a room built from the thinnest walls", () => {
    const grid = build(plan({ x: 0, y: 0, w: 4, h: 3, thickness: 0.02 }));
    const field = computeDaylight(grid, sun(45, 180), NORTH_UP);
    for (let i = 0; i < field.length; i++) {
      expect(field[i]).toBe(0);
    }
  });

  it("keeps opening cells passable, with the indoors ending at the wall line", () => {
    const grid = build(
      plan({ x: 0, y: 0, w: 4, h: 3, openings: { bottom: [opening("door", 0.5, 0.9)] } }),
    );
    // The gap is a hole, not a wall...
    expect(kindAt(grid, 2, 2.9)).not.toBe(CELL_SOLID);
    expect(kindAt(grid, 2, 3.05)).not.toBe(CELL_SOLID);
    // ...the room reaches it from inside, and beyond it is outdoors.
    expect(kindAt(grid, 2, 2.9)).toBe(CELL_INDOOR);
    expect(kindAt(grid, 2, 3.4)).toBe(CELL_OUTDOOR);
  });

  it("gives nested rooms their own face, inner one winning", () => {
    const graph = plan({ x: 0, y: 0, w: 8, h: 6 }, { x: 2, y: 2, w: 2, h: 2 });
    const faces = detectFaces(graph);
    const grid = rasterisePlan(graph, faces)!;
    const inner = worldToCell(grid, { x: 3, y: 3 })!;
    const innerFace = grid.faceIndex[inner.cy * grid.width + inner.cx];
    expect(faces[innerFace].area).toBeCloseTo(4, 1);
  });

  it("collects exterior windows as sky sources, and only them", () => {
    const graph = plan(
      {
        x: 0,
        y: 0,
        w: 4,
        h: 3,
        openings: {
          top: [opening("window", 0.5, 1.2)],
          bottom: [opening("door", 0.5, 0.9)],
          right: [opening("window", 0.5, 1)],
        },
      },
      { x: 4, y: 0, w: 3, h: 3 },
    );
    const grid = rasterisePlan(graph, detectFaces(graph))!;
    // The top window is exterior; the right one sits between two rooms and the
    // door is never a sky source.
    expect(grid.windows).toHaveLength(1);
    const [window] = grid.windows;
    expect(Math.abs(window.a.x - window.b.x)).toBeCloseTo(1.2, 6);
    expect(window.a.y).toBeCloseTo(0, 6);
    expect(window.samples).toHaveLength(4);
    const portal = worldToCell(grid, { x: 2, y: 0 })!;
    expect(grid.cells[portal.cy * grid.width + portal.cx] & CELL_PORTAL).toBe(CELL_PORTAL);
  });

  it("caps the grid and coarsens cells for an outsized plan", () => {
    const grid = build(plan({ x: 0, y: 0, w: 200, h: 100 }));
    expect(grid.width).toBeLessThanOrEqual(512);
    expect(grid.height).toBeLessThanOrEqual(512);
    expect(grid.cellM).toBeGreaterThan(0.15);
  });
});

describe("computeDaylight direct sun", () => {
  const southWindow = () =>
    plan({ x: 0, y: 0, w: 4, h: 3, openings: { bottom: [opening("window", 0.5, 1.2)] } });

  it("lights a band the width of the window, not the room", () => {
    const grid = build(southWindow());
    const field = computeDaylight(grid, sun(30, 180), NORTH_UP);
    const inBand = lightAt(grid, field, 2, 2.5);
    const offBand = lightAt(grid, field, 0.5, 2.5);
    expect(inBand).toBeGreaterThan(0);
    expect(offBand).toBeLessThan(inBand * 0.5);
  });

  it("pools near the window at noon and throws deep at dusk", () => {
    const grid = build(southWindow());
    const noon = computeDaylight(grid, sun(60, 180), NORTH_UP);
    const evening = computeDaylight(grid, sun(8, 180), NORTH_UP);
    const nearWindow = { x: 2, y: 2.6 };
    const deep = { x: 2, y: 0.4 };
    const noonRatio = lightAt(grid, noon, deep.x, deep.y) / lightAt(grid, noon, nearWindow.x, nearWindow.y);
    const eveningRatio =
      lightAt(grid, evening, deep.x, deep.y) / lightAt(grid, evening, nearWindow.x, nearWindow.y);
    expect(eveningRatio).toBeGreaterThan(noonRatio);
  });

  it("carries sun through a doorway into the next room", () => {
    const graph = plan(
      { x: 0, y: 0, w: 4, h: 3, openings: { bottom: [opening("window", 0.5, 1.2)] } },
      { x: 0, y: -3, w: 4, h: 3, openings: { bottom: [opening("door", 0.5, 1)] } },
    );
    const grid = build(graph);
    const field = computeDaylight(grid, sun(10, 180), NORTH_UP);
    const behindDoor = lightAt(grid, field, 2, -1);
    const behindWall = lightAt(grid, field, 3.5, -1);
    expect(behindDoor).toBeGreaterThan(0);
    expect(behindWall).toBeLessThan(behindDoor);
  });

  it("carries sun through an interior window the same way", () => {
    const graph = plan(
      { x: 0, y: 0, w: 4, h: 3, openings: { bottom: [opening("window", 0.5, 1.2)] } },
      { x: 0, y: -3, w: 4, h: 3, openings: { bottom: [opening("window", 0.5, 1.2)] } },
    );
    const grid = build(graph);
    // The shared wall's window is not a sky source...
    expect(grid.windows).toHaveLength(1);
    // ...but the low sun still shines straight through both panes.
    const field = computeDaylight(grid, sun(10, 180), NORTH_UP);
    expect(lightAt(grid, field, 2, -1)).toBeGreaterThan(0);
  });

  it("is fully dark at night", () => {
    const grid = build(southWindow());
    const field = computeDaylight(grid, sun(-20, 180), NORTH_UP);
    expect(field.every((v) => v === 0)).toBe(true);
  });
});

describe("computeDaylight sky light", () => {
  it("falls off with distance from the window", () => {
    const grid = build(
      plan({ x: 0, y: 0, w: 4, h: 6, openings: { bottom: [opening("window", 0.5, 1.2)] } }),
    );
    const field = computeDaylight(grid, sun(-1, 0), NORTH_UP);
    const near = lightAt(grid, field, 2, 5.5);
    const mid = lightAt(grid, field, 2, 4);
    const far = lightAt(grid, field, 2, 2);
    expect(near).toBeGreaterThan(mid);
    expect(mid).toBeGreaterThan(far);
    expect(far).toBeGreaterThan(0);
  });

  it("gives a wider window more light", () => {
    const narrow = build(
      plan({ x: 0, y: 0, w: 4, h: 3, openings: { bottom: [opening("window", 0.5, 0.6)] } }),
    );
    const wide = build(
      plan({ x: 0, y: 0, w: 4, h: 3, openings: { bottom: [opening("window", 0.5, 1.8)] } }),
    );
    const at = { x: 2, y: 2 };
    const narrowLight = lightAt(narrow, computeDaylight(narrow, sun(-1, 0), NORTH_UP), at.x, at.y);
    const wideLight = lightAt(wide, computeDaylight(wide, sun(-1, 0), NORTH_UP), at.x, at.y);
    expect(wideLight).toBeGreaterThan(narrowLight * 1.5);
  });

  it("is blocked by an interior wall", () => {
    // Two rooms; the window is in the left one, and the shared wall has no
    // opening at all, so the right room sees no sky.
    const graph = plan(
      { x: 0, y: 0, w: 4, h: 3, openings: { bottom: [opening("window", 0.5, 1.2)] } },
      { x: 4, y: 0, w: 4, h: 3 },
    );
    const grid = build(graph);
    const field = computeDaylight(grid, sun(-1, 0), NORTH_UP);
    expect(lightAt(grid, field, 6, 1.5)).toBe(0);
  });
});

describe("the bounce", () => {
  it("rounds a corner an L-shaped room hides from its window", () => {
    // The L: a wide bar with a leg the window cannot see into directly.
    const graph: PlanGraph = {
      vertices: [
        { id: "a", x: 0, y: 0 },
        { id: "b", x: 6, y: 0 },
        { id: "c", x: 6, y: 2 },
        { id: "d", x: 2, y: 2 },
        { id: "e", x: 2, y: 5 },
        { id: "f", x: 0, y: 5 },
      ],
      walls: [
        { id: "w1", a: "a", b: "b", thickness: 0.1, openings: [opening("window", 0.9, 1)] },
        { id: "w2", a: "b", b: "c", thickness: 0.1 },
        { id: "w3", a: "c", b: "d", thickness: 0.1 },
        { id: "w4", a: "d", b: "e", thickness: 0.1 },
        { id: "w5", a: "e", b: "f", thickness: 0.1 },
        { id: "w6", a: "f", b: "a", thickness: 0.1 },
      ],
    };
    const grid = build(graph);
    // Daytime, sun on the window side: the bar is sunlit, the leg sees none of
    // it directly — anything in the leg arrived by bouncing round the corner.
    const field = computeDaylight(grid, sun(30, 0), NORTH_UP);
    const nearCorner = lightAt(grid, field, 1, 2.6);
    const deepInLeg = lightAt(grid, field, 1, 3.5);
    expect(nearCorner).toBeGreaterThan(0);
    expect(deepInLeg).toBeGreaterThan(0);
    expect(nearCorner).toBeGreaterThan(deepInLeg);
  });

  it("cannot tunnel between rooms that only share a corner", () => {
    const graph = plan(
      { x: 0, y: 0, w: 3, h: 3, openings: { top: [opening("window", 0.5, 1.2)] } },
      { x: 3, y: 3, w: 3, h: 3 },
    );
    const grid = build(graph);
    const field = computeDaylight(grid, sun(45, 0), NORTH_UP);
    for (let cy = 0; cy < grid.height; cy++) {
      for (let cx = 0; cx < grid.width; cx++) {
        const idx = cy * grid.width + cx;
        if (grid.faceIndex[idx] < 0) continue;
        const x = grid.originX + (cx + 0.5) * grid.cellM;
        const y = grid.originY + (cy + 0.5) * grid.cellM;
        if (x > 3.2 && y > 3.2) {
          expect(field[idx], `sealed room lit at ${x},${y}`).toBe(0);
        }
      }
    }
  });
});

describe("lampField", () => {
  const twoRooms = () =>
    plan(
      { x: 0, y: 0, w: 4, h: 3, openings: { right: [opening("door", 0.5, 1)] } },
      { x: 4, y: 0, w: 4, h: 3 },
    );

  it("falls off with distance and stops at walls", () => {
    const grid = build(twoRooms());
    const field = lampField(grid, { x: 1, y: 1.5 });
    expect(lightAt(grid, field, 1, 1.5)).toBeGreaterThan(lightAt(grid, field, 2.5, 1.5));
    // The far room behind the solid stretch of wall gets only bounce, if anything.
    expect(lightAt(grid, field, 1, 1.5)).toBeGreaterThan(lightAt(grid, field, 5, 0.5) * 5);
  });

  it("spills through the doorway into the next room", () => {
    const grid = build(twoRooms());
    const field = lampField(grid, { x: 3, y: 1.5 });
    expect(lightAt(grid, field, 4.6, 1.5)).toBeGreaterThan(0);
  });

  it("superposes: two lamps are the sum of each alone", () => {
    const grid = build(twoRooms());
    const a = lampField(grid, { x: 1, y: 1 });
    const b = lampField(grid, { x: 3, y: 2 });
    const probe = worldToCell(grid, { x: 2, y: 1.5 })!;
    const idx = probe.cy * grid.width + probe.cx;
    const combined = combineLight(grid, [
      { field: a, rgb: { r: 255, g: 255, b: 255 }, intensity: 1 },
      { field: b, rgb: { r: 255, g: 255, b: 255 }, intensity: 1 },
    ]);
    const expected = 1 - Math.exp(-1.6 * (a[idx] + b[idx]));
    expect(combined.rgba[idx * 4] / 255).toBeCloseTo(expected, 1);
  });

  it("returns an empty field for a lamp outside the grid", () => {
    const grid = build(twoRooms());
    const field = lampField(grid, { x: 100, y: 100 });
    expect(field.every((v) => v === 0)).toBe(true);
  });
});

describe("combineLight", () => {
  it("tints per channel and leaves everything outside rooms black", () => {
    const grid = build(
      plan({ x: 0, y: 0, w: 4, h: 3, openings: { bottom: [opening("window", 0.5, 1.2)] } }),
    );
    const daylight = computeDaylight(grid, sun(45, 180), NORTH_UP);
    const { rgba } = combineLight(grid, [
      { field: daylight, rgb: { r: 255, g: 128, b: 0 }, intensity: 1 },
    ]);
    const lit = worldToCell(grid, { x: 2, y: 2.5 })!;
    const litIdx = (lit.cy * grid.width + lit.cx) * 4;
    expect(rgba[litIdx]).toBeGreaterThan(0);
    expect(rgba[litIdx + 1]).toBeLessThan(rgba[litIdx]);
    expect(rgba[litIdx + 2]).toBe(0);
    expect(rgba[litIdx + 3]).toBe(255);
    const out = worldToCell(grid, { x: 2, y: -0.4 })!;
    const outIdx = (out.cy * grid.width + out.cx) * 4;
    expect(rgba[outIdx]).toBe(0);
    expect(rgba[outIdx + 1]).toBe(0);
    expect(rgba[outIdx + 2]).toBe(0);
    expect(rgba[outIdx + 3]).toBe(255);
  });

  it("ranks rendered brightness: windowed room, then door-connected, then sealed", () => {
    const graph = plan(
      { x: 0, y: 0, w: 4, h: 3, openings: { bottom: [opening("window", 0.5, 1.2)], right: [opening("door", 0.5, 1)] } },
      { x: 4, y: 0, w: 4, h: 3 },
      { x: 8, y: 0, w: 4, h: 3 },
    );
    const faces = detectFaces(graph);
    const grid = rasterisePlan(graph, faces)!;
    const daylight = computeDaylight(grid, sun(45, 180), NORTH_UP);
    const { rgba } = combineLight(grid, [
      { field: daylight, rgb: { r: 255, g: 255, b: 255 }, intensity: 1 },
    ]);
    const byX = (x: number) => {
      const cell = worldToCell(grid, { x, y: 1.5 })!;
      return rgba[(cell.cy * grid.width + cell.cx) * 4];
    };
    expect(byX(2)).toBeGreaterThan(byX(6));
    expect(byX(6)).toBeGreaterThan(byX(10));
    expect(byX(10)).toBe(0);
  });

  it("carries light through an opening without a step at the room boundary", () => {
    // Light crossing into the next room must fade with distance alone: the
    // rooms' shared edge is not a brightness cliff.
    const graph = plan(
      { x: 0, y: 0, w: 4, h: 3, openings: { bottom: [opening("opening", 0.5, 1.1)] } },
      { x: 0, y: 3, w: 4, h: 3 },
    );
    const grid = build(graph);
    const field = lampField(grid, { x: 2, y: 2.2 });
    const { rgba } = combineLight(grid, [
      { field, rgb: { r: 255, g: 255, b: 255 }, intensity: 1 },
    ]);
    const at = (y: number) => {
      const cell = worldToCell(grid, { x: 2, y })!;
      return rgba[(cell.cy * grid.width + cell.cx) * 4];
    };
    const near = at(2.85);
    const far = at(3.15);
    expect(far).toBeGreaterThan(0);
    // A tenth of a metre across the boundary keeps most of the brightness.
    expect(far).toBeGreaterThan(near * 0.6);
  });

  it("stays bounded with sources stacked on top of each other", () => {
    const grid = build(
      plan({
        x: 0,
        y: 0,
        w: 4,
        h: 3,
        openings: { bottom: [opening("window", 0.3, 1.2), opening("window", 0.7, 1.2)] },
      }),
    );
    const daylight = computeDaylight(grid, sun(60, 180), NORTH_UP);
    const lamp = lampField(grid, { x: 2, y: 2 });
    const { rgba } = combineLight(grid, [
      { field: daylight, rgb: { r: 255, g: 244, b: 220 }, intensity: 1 },
      { field: lamp, rgb: { r: 255, g: 200, b: 120 }, intensity: 1 },
      { field: lamp, rgb: { r: 255, g: 200, b: 120 }, intensity: 1 },
    ]);
    for (let i = 0; i < rgba.length; i++) {
      expect(rgba[i]).toBeLessThanOrEqual(255);
    }
  });

  it("is deterministic", () => {
    const graph = plan(
      { x: 0, y: 0, w: 4, h: 3, openings: { bottom: [opening("window", 0.5, 1.2)] } },
      { x: 0, y: -3, w: 4, h: 3, openings: { bottom: [opening("door", 0.5, 1)] } },
    );
    const grid = build(graph);
    const first = computeDaylight(grid, sun(30, 170), NORTH_UP);
    const second = computeDaylight(grid, sun(30, 170), NORTH_UP);
    expect(second).toEqual(first);
    const combinedA = combineLight(grid, [
      { field: first, rgb: { r: 255, g: 255, b: 255 }, intensity: 1 },
    ]);
    const combinedB = combineLight(grid, [
      { field: second, rgb: { r: 255, g: 255, b: 255 }, intensity: 1 },
    ]);
    expect(combinedB.rgba).toEqual(combinedA.rgba);
  });
});

describe("two rooms separated by a thin outdoor strip", () => {
  /** Rooms 0.3 m apart, each with a door gap facing the strip, lamps inside. */
  const separated = () =>
    plan(
      { x: 0, y: 0, w: 4, h: 3, openings: { bottom: [opening("door", 0.5, 1)] } },
      { x: 0, y: 3.3, w: 4, h: 3, openings: { top: [opening("door", 0.5, 1)] } },
    );

  it("keeps the strip outdoors instead of bridging the rooms", () => {
    const grid = build(separated());
    expect(kindAt(grid, 1, 3.15)).not.toBe(CELL_INDOOR);
    expect(kindAt(grid, 3.5, 3.15)).not.toBe(CELL_INDOOR);
  });

  it("keeps lamp light on its own side of the strip", () => {
    const grid = build(separated());
    const field = lampField(grid, { x: 2, y: 1.5 });
    expect(lightAt(grid, field, 2, 1.5)).toBeGreaterThan(0);
    // Facing door gaps or not, the far room gets nothing.
    expect(lightAt(grid, field, 2, 4.5)).toBe(0);
    expect(lightAt(grid, field, 2, 3.8)).toBe(0);
  });

  it("still lets a doorway in a genuinely shared wall spill light", () => {
    const shared = plan(
      { x: 0, y: 0, w: 4, h: 3, openings: { bottom: [opening("door", 0.5, 1)] } },
      { x: 0, y: 3, w: 4, h: 3 },
    );
    const grid = build(shared);
    const field = lampField(grid, { x: 2, y: 1.5 });
    expect(lightAt(grid, field, 2, 3.8)).toBeGreaterThan(0);
  });
});

describe("temperature-tinted sources", () => {
  it("lands a cold reading blue-heavy and a hot one red-heavy", () => {
    const graph = plan({ x: 0, y: 0, w: 4, h: 3 });
    const grid = build(graph);
    const field = lampField(grid, { x: 2, y: 1.5 });
    const probe = worldToCell(grid, { x: 2, y: 1.5 })!;
    const idx = (probe.cy * grid.width + probe.cx) * 4;
    const cold = combineLight(grid, [{ field, rgb: temperatureToRgb(16), intensity: 0.9 }]);
    expect(cold.rgba[idx + 2]).toBeGreaterThan(cold.rgba[idx]);
    const hot = combineLight(grid, [{ field, rgb: temperatureToRgb(27), intensity: 0.9 }]);
    expect(hot.rgba[idx]).toBeGreaterThan(hot.rgba[idx + 2]);
  });
});

describe("furniture that blocks light", () => {
  const room = () => plan({ x: 0, y: 0, w: 6, h: 4 });
  const box = (over: Partial<FloorplanFurnitureData> = {}): FloorplanFurnitureData => ({
    id: "furn-1",
    kind: "box",
    x: 3,
    y: 2,
    width: 0.4,
    height: 3,
    rotation: 0,
    occluder: true,
    ...over,
  });

  function litBehind(furniture: FloorplanFurnitureData[], probeX = 3.25): number {
    const graph = room();
    const grid = rasterisePlan(graph, detectFaces(graph), furniture)!;
    const field = lampField(grid, { x: 1, y: 2 });
    const { rgba } = combineLight(grid, [
      { field, rgb: { r: 255, g: 255, b: 255 }, intensity: 1 },
    ]);
    const cell = worldToCell(grid, { x: probeX, y: 2 })!;
    return rgba[(cell.cy * grid.width + cell.cx) * 4];
  }

  it("blacks out what a wall-to-wall piece hides", () => {
    // Spanning the room, nothing can travel around it.
    expect(litBehind([box({ height: 4.2 })])).toBe(0);
  });

  it("deepens the shadow behind a piece light can round", () => {
    // A box with gaps above and below still lets the bounce past, so the test
    // is how much darker it gets, not whether anything survives.
    const blocked = litBehind([box()]);
    const open = litBehind([box({ occluder: false })]);
    expect(open).toBeGreaterThan(0);
    expect(blocked).toBeLessThan(open / 2);
  });

  it("leaves the lit side of the piece alone", () => {
    // Between lamp and piece nothing changed, so the shadow is a shadow and
    // not the whole room dimming.
    expect(litBehind([box()], 2.5)).toBe(litBehind([box({ occluder: false })], 2.5));
  });

  it("keeps the shadow through the render bleed", () => {
    // The bleed fills unlit non-indoor cells from their neighbours so a room's
    // light reaches its clip edge; an occluder must be exempt, or it would be
    // filled in with the light it is blocking.
    const graph = room();
    const piece = box();
    const grid = rasterisePlan(graph, detectFaces(graph), [piece])!;
    const field = lampField(grid, { x: 1, y: 2 });
    const { rgba } = combineLight(grid, [
      { field, rgb: { r: 255, g: 255, b: 255 }, intensity: 1 },
    ]);
    for (let cy = 0; cy < grid.height; cy++) {
      for (let cx = 0; cx < grid.width; cx++) {
        const idx = cy * grid.width + cx;
        if (!(grid.cells[idx] & CELL_OCCLUDER)) continue;
        expect(rgba[idx * 4], `occluder cell ${cx},${cy}`).toBe(0);
      }
    }
  });

  it("blocks along the footprint it was turned to", () => {
    // Upright, the piece is a narrow column at x≈3; turned, it lies across the
    // room, and the cells it blocks turn with it.
    const graph = room();
    const occluding = (rotation: number) => {
      const grid = rasterisePlan(graph, detectFaces(graph), [box({ rotation })])!;
      const cell = worldToCell(grid, { x: 4.2, y: 2 })!;
      return (grid.cells[cell.cy * grid.width + cell.cx] & CELL_OCCLUDER) !== 0;
    };
    expect(occluding(0)).toBe(false);
    expect(occluding(90)).toBe(true);
  });

  it("stamps a piece thinner than a cell rather than letting it vanish", () => {
    const graph = room();
    const grid = rasterisePlan(graph, detectFaces(graph), [box({ width: 0.02, height: 0.02 })])!;
    const solid = [...grid.cells].filter((c) => c & CELL_OCCLUDER).length;
    expect(solid).toBeGreaterThan(0);
  });

  it("leaves the plan alone when nothing occludes", () => {
    const graph = room();
    const withNone = rasterisePlan(graph, detectFaces(graph), [])!;
    const withOpen = rasterisePlan(graph, detectFaces(graph), [box({ occluder: false })])!;
    expect([...withOpen.cells]).toEqual([...withNone.cells]);
  });
});

describe("render bleed near a neighbouring room", () => {
  it("glows on its own side of a shared wall, junction corners included", () => {
    // Two rooms sharing their middle wall, lamp in the top room near its
    // bottom-left junction. The wall texels on the lit room's side of the
    // centerline take its light — the mid-span band and the corner block
    // where the shared wall meets the side wall — while the neighbour's side
    // stays black.
    const graph = plan({ x: 0, y: 0, w: 4, h: 3 }, { x: 0, y: 3, w: 4, h: 3 });
    const grid = build(graph);
    const field = lampField(grid, { x: 0.5, y: 2.5 });
    const { rgba } = combineLight(grid, [{ field, rgb: { r: 0, g: 255, b: 0 }, intensity: 1 }]);
    const greenAt = (x: number, y: number) => {
      const cell = worldToCell(grid, { x, y })!;
      return rgba[(cell.cy * grid.width + cell.cx) * 4 + 1];
    };
    expect(greenAt(0.075, 2.925), "junction corner, lit side").toBeGreaterThan(0);
    expect(greenAt(1.0, 2.925), "shared wall mid-span, lit side").toBeGreaterThan(0);
    expect(greenAt(1.0, 3.075), "shared wall, neighbour side").toBe(0);
  });

  it("never paints bled light where the neighbour's clip could show it", () => {
    // Rooms 0.3 m apart; a lamp against the hallway's wall facing the kitchen.
    const graph = plan(
      { x: 0, y: 0, w: 4, h: 3 },
      { x: 0, y: 3.3, w: 4, h: 3 },
    );
    const grid = build(graph);
    const field = lampField(grid, { x: 2, y: 3.8 });
    const { rgba } = combineLight(grid, [
      { field, rgb: { r: 0, g: 255, b: 0 }, intensity: 1 },
    ]);
    // Every texel the kitchen's clip can show — its interior plus one cell of
    // surround — stays black.
    for (let cy = 0; cy < grid.height; cy++) {
      for (let cx = 0; cx < grid.width; cx++) {
        const idx = cy * grid.width + cx;
        const y = grid.originY + (cy + 0.5) * grid.cellM;
        const x = grid.originX + (cx + 0.5) * grid.cellM;
        const nearKitchen = x > -0.2 && x < 4.2 && y > -0.2 && y < 3.05;
        if (!nearKitchen) continue;
        expect(rgba[idx * 4 + 1], `green at ${x.toFixed(2)},${y.toFixed(2)}`).toBe(0);
      }
    }
  });
});
