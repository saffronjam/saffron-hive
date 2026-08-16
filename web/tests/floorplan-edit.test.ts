import { describe, expect, it } from "vitest";
import {
  addOpening,
  addRoomClipped,
  detectFaces,
  bendWall,
  carryWallCurves,
  cloneGraph,
  connectPoints,
  removeOpenings,
  resizeAtCorner,
  setOpeningKind,
  setWallThickness,
  MIN_WALL_LENGTH_M,
  clampWallDrag,
  stampRoom,
  trimWallsInsideFaces,
  wallApex,
  withOpening,
} from "$lib/floorplan";
import type { IdMint, PlanGraph } from "$lib/floorplan";

function mint(): IdMint {
  let v = 0;
  let w = 0;
  return { vertexId: () => `v-${++v}`, wallId: () => `w-${++w}` };
}

function plan(): PlanGraph {
  return {
    vertices: [
      { id: "a", x: 0, y: 0 },
      { id: "b", x: 4, y: 0 },
    ],
    walls: [
      {
        id: "w",
        a: "a",
        b: "b",
        thickness: 0.1,
        openings: [
          { id: "o-1", t: 0.25, width: 0.9, kind: "door" },
          { id: "o-2", t: 0.75, width: 1.2, kind: "window" },
        ],
      },
    ],
  };
}

describe("cloneGraph", () => {
  it("copies deeply enough that edits cannot reach the original", () => {
    const original = plan();
    const copy = cloneGraph(original);
    copy.walls[0].openings![0].t = 0.9;
    copy.vertices[0].x = 99;
    expect(original.walls[0].openings![0].t).toBe(0.25);
    expect(original.vertices[0].x).toBe(0);
  });
});

describe("withOpening", () => {
  it("rewrites one opening and leaves the rest alone", () => {
    const next = withOpening(plan(), "w", "o-1", (o) => ({ ...o, width: 1.4 }));
    const openings = next.walls[0].openings!;
    expect(openings.find((o) => o.id === "o-1")!.width).toBe(1.4);
    expect(openings.find((o) => o.id === "o-2")!.width).toBe(1.2);
  });

  it("pulls an opening back inside its wall", () => {
    const next = withOpening(plan(), "w", "o-1", (o) => ({ ...o, t: 0 }));
    const moved = next.walls[0].openings!.find((o) => o.id === "o-1")!;
    // Centred at t=0 the gap would hang off the end, so it slides in by half.
    expect(moved.t).toBeGreaterThan(0);
  });

  it("does nothing for a wall or opening that is not there", () => {
    expect(withOpening(plan(), "missing", "o-1", (o) => ({ ...o, width: 9 }))).toEqual(plan());
    expect(withOpening(plan(), "w", "missing", (o) => ({ ...o, width: 9 }))).toEqual(plan());
  });
});

describe("removeOpenings", () => {
  it("drops the named openings", () => {
    const next = removeOpenings(plan(), ["o-1"]);
    expect(next.walls[0].openings!.map((o) => o.id)).toEqual(["o-2"]);
  });

  it("drops the field entirely once the last one goes", () => {
    const next = removeOpenings(plan(), ["o-1", "o-2"]);
    expect(next.walls[0].openings).toBeUndefined();
  });

  it("leaves a wall holding none of them untouched", () => {
    const before = plan();
    expect(removeOpenings(before, ["nope"]).walls[0]).toBe(before.walls[0]);
  });
});

describe("setOpeningKind", () => {
  it("changes just that opening's kind", () => {
    const next = setOpeningKind(plan(), "o-1", "window");
    expect(next.walls[0].openings!.find((o) => o.id === "o-1")!.kind).toBe("window");
    expect(next.walls[0].openings!.find((o) => o.id === "o-2")!.kind).toBe("window");
    expect(next.walls[0].openings!.find((o) => o.id === "o-1")!.width).toBe(0.9);
  });
});

describe("setWallThickness", () => {
  it("retickens one wall and no other", () => {
    const graph: PlanGraph = {
      vertices: plan().vertices,
      walls: [
        { id: "w-1", a: "a", b: "b", thickness: 0.1 },
        { id: "w-2", a: "b", b: "a", thickness: 0.1 },
      ],
    };
    const next = setWallThickness(graph, "w-1", 0.3);
    expect(next.walls[0].thickness).toBe(0.3);
    expect(next.walls[1].thickness).toBe(0.1);
  });
});

describe("bendWall", () => {
  const straight: PlanGraph = {
    vertices: [
      { id: "a", x: 0, y: 0 },
      { id: "b", x: 4, y: 0 },
    ],
    walls: [{ id: "w", a: "a", b: "b", thickness: 0.1 }],
  };

  it("bends the wall through the point it was given", () => {
    const next = bendWall(straight, "w", { x: 2, y: 1.5 }, 0.2);
    const apex = wallApex(next.walls[0], next.vertices);
    expect(apex.x).toBeCloseTo(2, 9);
    expect(apex.y).toBeCloseTo(1.5, 9);
  });

  it("straightens when the apex comes back to the centerline", () => {
    const bent = bendWall(straight, "w", { x: 2, y: 1.5 }, 0.2);
    expect(bent.walls[0].curve).toBeTruthy();
    const back = bendWall(bent, "w", { x: 2, y: 0.1 }, 0.2);
    expect(back.walls[0].curve).toBeUndefined();
  });

  it("keeps the bend when the apex is outside the straighten reach", () => {
    const next = bendWall(straight, "w", { x: 2, y: 0.5 }, 0.2);
    expect(next.walls[0].curve).toBeTruthy();
  });
});

describe("connectPoints", () => {
  const empty: PlanGraph = { vertices: [], walls: [] };

  it("draws a wall between two fresh points", () => {
    const next = connectPoints(empty, { x: 0, y: 0 }, { x: 3, y: 0 }, 0.1, mint());
    expect(next.vertices).toHaveLength(2);
    expect(next.walls).toHaveLength(1);
    expect(next.walls[0].thickness).toBe(0.1);
  });

  it("reuses a vertex already sitting on the point", () => {
    const seeded: PlanGraph = { vertices: [{ id: "a", x: 0, y: 0 }], walls: [] };
    const next = connectPoints(seeded, { x: 0, y: 0 }, { x: 3, y: 0 }, 0.1, mint());
    expect(next.vertices).toHaveLength(2);
    expect([next.walls[0].a, next.walls[0].b]).toContain("a");
  });

  it("draws nothing for a segment with no length", () => {
    expect(connectPoints(empty, { x: 1, y: 1 }, { x: 1, y: 1 }, 0.1, mint())).toBe(empty);
  });
});

describe("stampRoom", () => {
  const empty: PlanGraph = { vertices: [], walls: [] };

  it("closes a room of four walls on four corners", () => {
    const next = stampRoom(empty, { x: 0, y: 0 }, { x: 4, y: 3 }, 0.1, mint());
    expect(next.vertices).toHaveLength(4);
    expect(next.walls).toHaveLength(4);
    // Every corner carries exactly two walls, which is what closed means.
    for (const v of next.vertices) {
      expect(next.walls.filter((w) => w.a === v.id || w.b === v.id)).toHaveLength(2);
    }
  });

  it("stamps the same room from either pair of opposite corners", () => {
    const forward = stampRoom(empty, { x: 0, y: 0 }, { x: 4, y: 3 }, 0.1, mint());
    const backward = stampRoom(empty, { x: 4, y: 3 }, { x: 0, y: 0 }, 0.1, mint());
    const corners = (g: PlanGraph) => g.vertices.map((v) => `${v.x},${v.y}`).sort();
    expect(corners(backward)).toEqual(corners(forward));
  });

  it("joins onto vertices the plan already has", () => {
    const seeded: PlanGraph = { vertices: [{ id: "corner", x: 0, y: 0 }], walls: [] };
    const next = stampRoom(seeded, { x: 0, y: 0 }, { x: 4, y: 3 }, 0.1, mint());
    expect(next.vertices).toHaveLength(4);
    expect(next.vertices.some((v) => v.id === "corner")).toBe(true);
  });
});

describe("addOpening", () => {
  const wall: PlanGraph = {
    vertices: [
      { id: "a", x: 0, y: 0 },
      { id: "b", x: 4, y: 0 },
    ],
    walls: [{ id: "w", a: "a", b: "b", thickness: 0.1 }],
  };

  it("cuts the opening where the point falls on the wall", () => {
    const next = addOpening(wall, "w", { x: 1, y: 0.3 }, "door", "o-1");
    const opening = next.walls[0].openings![0];
    expect(opening.id).toBe("o-1");
    expect(opening.kind).toBe("door");
    expect(opening.t).toBeCloseTo(0.25, 6);
  });

  it("gives each kind its own default width", () => {
    const door = addOpening(wall, "w", { x: 2, y: 0 }, "door", "o").walls[0].openings![0];
    const window = addOpening(wall, "w", { x: 2, y: 0 }, "window", "o").walls[0].openings![0];
    expect(window.width).toBeGreaterThan(door.width);
  });

  it("pulls an opening cut at the very end back inside the wall", () => {
    const opening = addOpening(wall, "w", { x: 0, y: 0 }, "door", "o").walls[0].openings![0];
    expect(opening.t).toBeGreaterThan(0);
  });

  it("keeps the openings already on the wall", () => {
    const once = addOpening(wall, "w", { x: 1, y: 0 }, "door", "o-1");
    const twice = addOpening(once, "w", { x: 3, y: 0 }, "window", "o-2");
    expect(twice.walls[0].openings!.map((o) => o.id)).toEqual(["o-1", "o-2"]);
  });

  it("changes nothing for a wall that is not there", () => {
    expect(addOpening(wall, "gone", { x: 1, y: 0 }, "door", "o")).toBe(wall);
  });
});

describe("resizeAtCorner", () => {
  /** A 4 x 3 room, corners a(0,0) b(4,0) c(4,3) d(0,3). */
  function room(): PlanGraph {
    return {
      vertices: [
        { id: "a", x: 0, y: 0 },
        { id: "b", x: 4, y: 0 },
        { id: "c", x: 4, y: 3 },
        { id: "d", x: 0, y: 3 },
      ],
      walls: [
        { id: "w-ab", a: "a", b: "b", thickness: 0.1 },
        { id: "w-bc", a: "b", b: "c", thickness: 0.1 },
        { id: "w-cd", a: "c", b: "d", thickness: 0.1 },
        { id: "w-da", a: "d", b: "a", thickness: 0.1 },
      ],
    };
  }
  const at = (g: PlanGraph, id: string) => g.vertices.find((v) => v.id === id)!;

  it("keeps the room square when a corner is dragged", () => {
    const next = resizeAtCorner(room(), "a", { x: -1, y: -2 });
    expect(at(next, "a")).toMatchObject({ x: -1, y: -2 });
    // The two neighbours follow on the axis they share with the corner.
    expect(at(next, "b")).toMatchObject({ x: 4, y: -2 });
    expect(at(next, "d")).toMatchObject({ x: -1, y: 3 });
    // The far corner does not move: only the walls on the grabbed corner follow.
    expect(at(next, "c")).toMatchObject({ x: 4, y: 3 });
  });

  it("grows the room by exactly what the corner was dragged", () => {
    const next = resizeAtCorner(room(), "c", { x: 6, y: 5 });
    const xs = next.vertices.map((v) => v.x);
    const ys = next.vertices.map((v) => v.y);
    expect(Math.max(...xs) - Math.min(...xs)).toBeCloseTo(6, 9);
    expect(Math.max(...ys) - Math.min(...ys)).toBeCloseTo(5, 9);
  });

  it("leaves every wall axis-aligned, which is what square means", () => {
    const next = resizeAtCorner(room(), "a", { x: -1.3, y: 0.7 });
    for (const w of next.walls) {
      const p = at(next, w.a);
      const q = at(next, w.b);
      const axisAligned = Math.abs(p.x - q.x) < 1e-9 || Math.abs(p.y - q.y) < 1e-9;
      expect(axisAligned, `${w.id} went diagonal`).toBe(true);
    }
  });

  it("does not drag a wall that meets the corner at an angle", () => {
    const graph = room();
    graph.vertices.push({ id: "e", x: 2, y: -2 });
    graph.walls.push({ id: "w-ae", a: "a", b: "e", thickness: 0.1 });
    const next = resizeAtCorner(graph, "a", { x: -1, y: 0 });
    // e shares neither axis with a, so it stays where it is.
    expect(at(next, "e")).toMatchObject({ x: 2, y: -2 });
  });

  it("leaves a curved wall's far end alone", () => {
    const graph = room();
    graph.walls[0] = { ...graph.walls[0], curve: { x: 2, y: -1 } };
    const next = resizeAtCorner(graph, "a", { x: 0, y: -2 });
    expect(at(next, "b")).toMatchObject({ x: 4, y: 0 });
  });

  it("does nothing for a corner that is not there", () => {
    const before = room();
    expect(resizeAtCorner(before, "gone", { x: 1, y: 1 })).toBe(before);
  });
});

describe("addRoomClipped", () => {
  const mintIds = () => mint();
  /** One 4 x 4 room at the origin. */
  function existing(): PlanGraph {
    return {
      vertices: [
        { id: "a", x: 0, y: 0 },
        { id: "b", x: 4, y: 0 },
        { id: "c", x: 4, y: 4 },
        { id: "d", x: 0, y: 4 },
      ],
      walls: [
        { id: "e-1", a: "a", b: "b", thickness: 0.1 },
        { id: "e-2", a: "b", b: "c", thickness: 0.1 },
        { id: "e-3", a: "c", b: "d", thickness: 0.1 },
        { id: "e-4", a: "d", b: "a", thickness: 0.1 },
      ],
    };
  }

  it("leaves a room placed clear of everything whole", () => {
    const graph = existing();
    const faces = detectFaces(graph);
    const next = addRoomClipped(graph, { x: 10, y: 10 }, { x: 13, y: 13 }, 0.1, mintIds(), faces);
    expect(detectFaces(next)).toHaveLength(2);
    expect(next.walls).toHaveLength(8);
  });

  it("stops a room placed over another at its edge", () => {
    const graph = existing();
    const faces = detectFaces(graph);
    // Overlaps the right half of the existing room.
    const next = addRoomClipped(graph, { x: 2, y: 1 }, { x: 7, y: 3 }, 0.1, mintIds(), faces);
    // Nothing of the new room runs through the old one.
    for (const wall of next.walls) {
      const from = next.vertices.find((v) => v.id === wall.a)!;
      const to = next.vertices.find((v) => v.id === wall.b)!;
      const mid = { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 };
      const inside = mid.x > 0.001 && mid.x < 3.999 && mid.y > 0.001 && mid.y < 3.999;
      expect(inside, `a wall runs through the room at ${mid.x},${mid.y}`).toBe(false);
    }
  });

  it("keeps the part of the room that lies outside", () => {
    const graph = existing();
    const faces = detectFaces(graph);
    const next = addRoomClipped(graph, { x: 2, y: 1 }, { x: 7, y: 3 }, 0.1, mintIds(), faces);
    // The far side of the new room is untouched, so it still closes a face.
    expect(detectFaces(next).length).toBeGreaterThan(1);
    expect(
      next.walls.some((w) => {
        const from = next.vertices.find((v) => v.id === w.a)!;
        const to = next.vertices.find((v) => v.id === w.b)!;
        return Math.min(from.x, to.x) >= 6.999;
      }),
    ).toBe(true);
  });

  it("keeps a room sharing an edge whole, since sharing is not overlapping", () => {
    const graph = existing();
    const faces = detectFaces(graph);
    const next = addRoomClipped(graph, { x: 4, y: 0 }, { x: 8, y: 4 }, 0.1, mintIds(), faces);
    expect(detectFaces(next)).toHaveLength(2);
  });

  it("has nothing to clip against on an empty plan", () => {
    const empty: PlanGraph = { vertices: [], walls: [] };
    const next = addRoomClipped(empty, { x: 0, y: 0 }, { x: 3, y: 3 }, 0.1, mintIds(), []);
    expect(next.walls).toHaveLength(4);
  });
});

describe("resizeAtCorner along a run that is joined partway", () => {
  /**
   * A corner at v with a wall running left, and a wall running down through a
   * junction J where another room's wall goes off to the right:
   *
   *   L ---- v
   *          |
   *   . . .  J ---- M
   *          |
   *          K
   */
  function plan(): PlanGraph {
    return {
      vertices: [
        { id: "L", x: 0, y: 0 },
        { id: "v", x: 4, y: 0 },
        { id: "J", x: 4, y: 3 },
        { id: "M", x: 8, y: 3 },
        { id: "K", x: 4, y: 6 },
      ],
      walls: [
        { id: "w-Lv", a: "L", b: "v", thickness: 0.1 },
        { id: "w-vJ", a: "v", b: "J", thickness: 0.1 },
        { id: "w-JM", a: "J", b: "M", thickness: 0.1 },
        { id: "w-JK", a: "J", b: "K", thickness: 0.1 },
      ],
    };
  }
  const at = (g: PlanGraph, id: string) => g.vertices.find((x) => x.id === id)!;
  const axisAligned = (g: PlanGraph) =>
    g.walls.every((w) => {
      const p = at(g, w.a);
      const q = at(g, w.b);
      return Math.abs(p.x - q.x) < 1e-9 || Math.abs(p.y - q.y) < 1e-9;
    });

  it("keeps the run straight through the joint instead of bending it there", () => {
    const next = resizeAtCorner(plan(), "v", { x: 5, y: 0 });
    expect(axisAligned(next), "a wall went diagonal").toBe(true);
    // The whole vertical line moves together, joint and all.
    expect(at(next, "J").x).toBeCloseTo(5, 9);
    expect(at(next, "K").x).toBeCloseTo(5, 9);
  });

  it("lets the wall crossing the run just change length", () => {
    const next = resizeAtCorner(plan(), "v", { x: 5, y: 0 });
    // M is not on the line that moved, so it stays and its wall gets shorter.
    expect(at(next, "M")).toMatchObject({ x: 8, y: 3 });
    expect(at(next, "J").y).toBeCloseTo(3, 9);
  });

  it("carries the corner's other wall without disturbing the run", () => {
    const next = resizeAtCorner(plan(), "v", { x: 4, y: -2 });
    expect(axisAligned(next)).toBe(true);
    expect(at(next, "L")).toMatchObject({ x: 0, y: -2 });
    // Moving straight up leaves the vertical run's x alone.
    expect(at(next, "J")).toMatchObject({ x: 4, y: 3 });
  });

  it("never bends anything, whichever way the corner goes", () => {
    for (const to of [
      { x: 5, y: -1 },
      { x: 3, y: 1 },
      { x: 4.5, y: 0 },
      { x: 4, y: 2 },
    ]) {
      expect(axisAligned(resizeAtCorner(plan(), "v", to)), `bent going to ${to.x},${to.y}`).toBe(
        true,
      );
    }
  });
});

describe("trimWallsInsideFaces on a room dragged over another", () => {
  /** Two 4 x 4 rooms, the second clear of the first, ready to be dragged onto it. */
  function twoRooms(): PlanGraph {
    const at = (id: string, x: number, y: number) => ({ id, x, y });
    return {
      vertices: [
        at("a", 0, 0),
        at("b", 4, 0),
        at("c", 4, 4),
        at("d", 0, 4),
        at("p", 10, 1),
        at("q", 14, 1),
        at("r", 14, 3),
        at("s", 10, 3),
      ],
      walls: [
        { id: "e-1", a: "a", b: "b", thickness: 0.1 },
        { id: "e-2", a: "b", b: "c", thickness: 0.1 },
        { id: "e-3", a: "c", b: "d", thickness: 0.1 },
        { id: "e-4", a: "d", b: "a", thickness: 0.1 },
        { id: "f-1", a: "p", b: "q", thickness: 0.1 },
        { id: "f-2", a: "q", b: "r", thickness: 0.1 },
        { id: "f-3", a: "r", b: "s", thickness: 0.1 },
        { id: "f-4", a: "s", b: "p", thickness: 0.1 },
      ],
    };
  }

  const moved = new Set(["p", "q", "r", "s"]);
  const draggedWalls = new Set(["f-1", "f-2", "f-3", "f-4"]);

  /** Slide the second room by `dx`, the way a face drag does. */
  function drag(graph: PlanGraph, dx: number): PlanGraph {
    return {
      ...graph,
      vertices: graph.vertices.map((v) => (moved.has(v.id) ? { ...v, x: v.x + dx } : v)),
    };
  }

  /** The rooms that stay put are the ones the drag never touched. */
  function staying(graph: PlanGraph) {
    return detectFaces(graph).filter((f) => f.vertexIds.every((id) => !moved.has(id)));
  }

  function runsThrough(graph: PlanGraph, box: { x0: number; y0: number; x1: number; y1: number }) {
    return graph.walls.some((w) => {
      const from = graph.vertices.find((v) => v.id === w.a)!;
      const to = graph.vertices.find((v) => v.id === w.b)!;
      const mid = { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 };
      return (
        mid.x > box.x0 + 0.001 &&
        mid.x < box.x1 - 0.001 &&
        mid.y > box.y0 + 0.001 &&
        mid.y < box.y1 - 0.001
      );
    });
  }

  it("cuts the dragged room at the edge of the one it lands on", () => {
    const dragged = drag(twoRooms(), -8);
    expect(runsThrough(dragged, { x0: 0, y0: 0, x1: 4, y1: 4 })).toBe(true);
    const next = trimWallsInsideFaces(dragged, draggedWalls, staying(dragged));
    expect(runsThrough(next, { x0: 0, y0: 0, x1: 4, y1: 4 })).toBe(false);
  });

  it("keeps the part hanging outside, so the dragged room still closes", () => {
    const dragged = drag(twoRooms(), -8);
    const next = trimWallsInsideFaces(dragged, draggedWalls, staying(dragged));
    expect(detectFaces(next).length).toBeGreaterThan(1);
    expect(
      next.walls.some((w) => {
        const from = next.vertices.find((v) => v.id === w.a)!;
        const to = next.vertices.find((v) => v.id === w.b)!;
        return Math.min(from.x, to.x) >= 5.999;
      }),
    ).toBe(true);
  });

  it("leaves the room it was dragged over alone", () => {
    const dragged = drag(twoRooms(), -8);
    const next = trimWallsInsideFaces(dragged, draggedWalls, staying(dragged));
    for (const id of ["a", "b", "c", "d"]) {
      expect(next.vertices.find((v) => v.id === id)).toEqual(
        twoRooms().vertices.find((v) => v.id === id),
      );
    }
  });

  it("leaves a drag that lands clear of everything whole", () => {
    const dragged = drag(twoRooms(), 5);
    const next = trimWallsInsideFaces(dragged, draggedWalls, staying(dragged));
    expect(next.walls).toHaveLength(8);
    expect(detectFaces(next)).toHaveLength(2);
  });

  it("keeps a drag that lands flush against an edge whole, since sharing is not overlapping", () => {
    const dragged = drag(twoRooms(), -6);
    const next = trimWallsInsideFaces(dragged, draggedWalls, staying(dragged));
    expect(detectFaces(next)).toHaveLength(2);
  });
});

describe("trimWallsInsideFaces on a room dragged deeper a second time", () => {
  /** A room already cut once, so its walls carry the ids that splitting minted. */
  function alreadyCut(): PlanGraph {
    const at = (id: string, x: number, y: number) => ({ id, x, y });
    return {
      vertices: [
        at("a", 0, 0),
        at("b", 6, 0),
        at("c", 6, 6),
        at("d", 0, 6),
        at("p", 4, 4),
        at("q", 10, 4),
        at("r", 10, 10),
        at("s", 4, 10),
      ],
      walls: [
        { id: "e-1", a: "a", b: "b", thickness: 0.1 },
        { id: "e-2", a: "b", b: "c", thickness: 0.1 },
        { id: "e-3", a: "c", b: "d", thickness: 0.1 },
        { id: "e-4", a: "d", b: "a", thickness: 0.1 },
        { id: "f-1~1", a: "p", b: "q", thickness: 0.1 },
        { id: "f-2~1", a: "q", b: "r", thickness: 0.1 },
        { id: "f-3", a: "r", b: "s", thickness: 0.1 },
        { id: "f-4~2~1", a: "s", b: "p", thickness: 0.1 },
      ],
    };
  }

  const moved = new Set(["p", "q", "r", "s"]);
  const draggedWalls = new Set(["f-1~1", "f-2~1", "f-3", "f-4~2~1"]);

  function clipped(dx: number, dy: number) {
    const graph = alreadyCut();
    const dragged: PlanGraph = {
      ...graph,
      vertices: graph.vertices.map((v) =>
        moved.has(v.id) ? { ...v, x: v.x + dx, y: v.y + dy } : v,
      ),
    };
    const staying = detectFaces(dragged).filter((f) => f.vertexIds.every((id) => !moved.has(id)));
    return trimWallsInsideFaces(dragged, draggedWalls, staying);
  }

  function insideTheOtherRoom(graph: PlanGraph) {
    return graph.walls.filter((w) => {
      const from = graph.vertices.find((v) => v.id === w.a)!;
      const to = graph.vertices.find((v) => v.id === w.b)!;
      const mid = { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 };
      return mid.x > 0.001 && mid.x < 5.999 && mid.y > 0.001 && mid.y < 5.999;
    });
  }

  it("cuts a wall whose id already carries a split suffix", () => {
    expect(insideTheOtherRoom(clipped(0, 0))).toHaveLength(0);
  });

  it("cuts it again when the room is pushed deeper", () => {
    for (const [dx, dy] of [
      [-1, -1],
      [-2, -2],
      [-3, -1],
      [-1, -3],
    ]) {
      const left = insideTheOtherRoom(clipped(dx, dy));
      expect(left, `dragging (${dx},${dy}) left ${left.length} walls inside`).toHaveLength(0);
    }
  });
});

describe("clampWallDrag", () => {
  /** A 3 x 2 room whose left wall is the one being dragged. */
  function room(): PlanGraph {
    const at = (id: string, x: number, y: number) => ({ id, x, y });
    return {
      vertices: [at("a", 0, 0), at("b", 3, 0), at("c", 3, 2), at("d", 0, 2)],
      walls: [
        { id: "bottom", a: "a", b: "b", thickness: 0.1 },
        { id: "right", a: "b", b: "c", thickness: 0.1 },
        { id: "top", a: "c", b: "d", thickness: 0.1 },
        { id: "left", a: "d", b: "a", thickness: 0.1 },
      ],
    };
  }

  const rightwards = { x: 1, y: 0 };
  const movingLeftWall = new Map([
    ["a", { x: 0, y: 0 }],
    ["d", { x: 0, y: 2 }],
  ]);

  it("leaves a drag that keeps the room roomy alone", () => {
    expect(clampWallDrag(room(), movingLeftWall, rightwards, 1)).toBeCloseTo(1, 6);
    expect(clampWallDrag(room(), movingLeftWall, rightwards, -5)).toBeCloseTo(-5, 6);
  });

  it("stops the wall before the room reaches zero width", () => {
    // The room is 3 wide, so pushing 3 would close it exactly — the case the
    // grid lands on.
    expect(clampWallDrag(room(), movingLeftWall, rightwards, 3)).toBeCloseTo(
      3 - MIN_WALL_LENGTH_M,
      6,
    );
  });

  it("stops there however far past the limit the drag reaches", () => {
    for (const asked of [2.95, 3, 4, 20]) {
      expect(clampWallDrag(room(), movingLeftWall, rightwards, asked)).toBeCloseTo(
        3 - MIN_WALL_LENGTH_M,
        6,
      );
    }
  });

  it("never turns the room inside out", () => {
    const width = (d: number) => 3 - d;
    for (const asked of [3.5, 10]) {
      expect(
        width(clampWallDrag(room(), movingLeftWall, rightwards, asked)),
      ).toBeGreaterThanOrEqual(MIN_WALL_LENGTH_M - 1e-9);
    }
  });

  it("ignores walls that travel with the drag", () => {
    // Every corner moves, so nothing shortens and nothing limits the distance.
    const all = new Map([
      ["a", { x: 0, y: 0 }],
      ["b", { x: 3, y: 0 }],
      ["c", { x: 3, y: 2 }],
      ["d", { x: 0, y: 2 }],
    ]);
    expect(clampWallDrag(room(), all, rightwards, 50)).toBeCloseTo(50, 6);
  });

  it("clamps a drag running the other way too", () => {
    const movingRightWall = new Map([
      ["b", { x: 3, y: 0 }],
      ["c", { x: 3, y: 2 }],
    ]);
    expect(clampWallDrag(room(), movingRightWall, rightwards, -3)).toBeCloseTo(
      -(3 - MIN_WALL_LENGTH_M),
      6,
    );
  });
});

describe("clampWallDrag with a short joint in the way", () => {
  /**
   * A room whose top-right corner carries a 0.1 m connector — the stub a wall
   * drag leaves between the corner it came from and the one it moved to.
   */
  function jointed(): PlanGraph {
    const at = (id: string, x: number, y: number) => ({ id, x, y });
    return {
      vertices: [at("a", 0, 0), at("b", 3, 0), at("c", 3, 2), at("d", 0, 2), at("joint", 2.9, 2)],
      walls: [
        { id: "bottom", a: "a", b: "b", thickness: 0.1 },
        { id: "right", a: "b", b: "c", thickness: 0.1 },
        { id: "stub", a: "joint", b: "c", thickness: 0.1 },
        { id: "top", a: "joint", b: "d", thickness: 0.1 },
        { id: "left", a: "d", b: "a", thickness: 0.1 },
      ],
    };
  }

  const leftwards = { x: -1, y: 0 };
  const movingRightWall = new Map([
    ["b", { x: 3, y: 0 }],
    ["c", { x: 3, y: 2 }],
  ]);

  it("does not let a joint already at the floor freeze the drag", () => {
    // The stub is exactly 0.1 m and dragging left shortens it, but the room is
    // 3 m wide and has plenty of travel left.
    expect(clampWallDrag(jointed(), movingRightWall, leftwards, 1)).toBeCloseTo(1, 6);
  });

  it("still stops before the room itself collapses", () => {
    expect(clampWallDrag(jointed(), movingRightWall, leftwards, 5)).toBeCloseTo(
      3 - MIN_WALL_LENGTH_M,
      6,
    );
  });

  it("lets the joint close rather than holding the wall off it", () => {
    // Travelling 0.1 m takes the stub to zero, which is how the corner rejoins.
    expect(clampWallDrag(jointed(), movingRightWall, leftwards, 0.1)).toBeCloseTo(0.1, 6);
  });
});

describe("bendWall refuses a curve that crosses another wall", () => {
  /** A 6 x 4 room; the bend targets its bottom wall. */
  function room(): PlanGraph {
    const at = (id: string, x: number, y: number) => ({ id, x, y });
    return {
      vertices: [at("a", 0, 0), at("b", 6, 0), at("c", 6, 4), at("d", 0, 4)],
      walls: [
        { id: "top", a: "a", b: "b", thickness: 0.1 },
        { id: "right", a: "b", b: "c", thickness: 0.1 },
        { id: "bottom", a: "c", b: "d", thickness: 0.1 },
        { id: "left", a: "d", b: "a", thickness: 0.1 },
      ],
    };
  }

  it("allows a bend that stays inside the room", () => {
    const next = bendWall(room(), "bottom", { x: 3, y: 2.5 }, 0.1);
    expect(next.walls.find((w) => w.id === "bottom")!.curve).toBeDefined();
  });

  it("refuses a bend whose curve would pierce the opposite wall", () => {
    const graph = room();
    const next = bendWall(graph, "bottom", { x: 3, y: -2 }, 0.1);
    expect(next).toBe(graph);
    expect(next.walls.find((w) => w.id === "bottom")!.curve).toBeUndefined();
  });

  it("refuses a bend swinging out through a side wall", () => {
    const graph = room();
    const next = bendWall(graph, "bottom", { x: -2.9, y: 1.7 }, 0.1);
    expect(next.walls.find((w) => w.id === "bottom")!.curve).toBeUndefined();
  });

  it("keeps the last legal curve when the drag runs past the limit", () => {
    const legal = bendWall(room(), "bottom", { x: 3, y: 2.5 }, 0.1);
    const stuck = bendWall(legal, "bottom", { x: 3, y: -2 }, 0.1);
    expect(stuck.walls.find((w) => w.id === "bottom")!.curve).toEqual(
      legal.walls.find((w) => w.id === "bottom")!.curve,
    );
  });

  it("always allows straightening back", () => {
    const legal = bendWall(room(), "bottom", { x: 3, y: 2.5 }, 0.1);
    const straight = bendWall(legal, "bottom", { x: 3, y: 3.95 }, 0.15);
    expect(straight.walls.find((w) => w.id === "bottom")!.curve).toBeUndefined();
  });
});

describe("curves ride along with the walls that carry them", () => {
  it("straightens when the apex is dropped anywhere on the wall's line", () => {
    const graph: PlanGraph = {
      vertices: [
        { id: "a", x: 0, y: 0 },
        { id: "b", x: 6, y: 0 },
        { id: "c", x: 6, y: 4 },
        { id: "d", x: 0, y: 4 },
      ],
      walls: [
        { id: "top", a: "a", b: "b", thickness: 0.1 },
        { id: "right", a: "b", b: "c", thickness: 0.1 },
        { id: "bottom", a: "c", b: "d", thickness: 0.1 },
        { id: "left", a: "d", b: "a", thickness: 0.1 },
      ],
    };
    const bent = bendWall(graph, "bottom", { x: 3, y: 2.5 }, 0.1);
    // Off-centre along the wall, but on its line: the curve must clear, or a
    // wall that looks straight would keep a hidden control point.
    const dropped = bendWall(bent, "bottom", { x: 1.2, y: 4.05 }, 0.15);
    expect(dropped.walls.find((w) => w.id === "bottom")!.curve).toBeUndefined();
  });

  it("translates the control point when a rigid drag carries the whole wall", () => {
    const graph: PlanGraph = {
      vertices: [
        { id: "a", x: 0, y: 0 },
        { id: "b", x: 4, y: 0 },
        { id: "c", x: 4, y: 3 },
        { id: "d", x: 0, y: 3 },
      ],
      walls: [
        { id: "top", a: "a", b: "b", thickness: 0.1, curve: { x: 2, y: -1 } },
        { id: "right", a: "b", b: "c", thickness: 0.1 },
        { id: "bottom", a: "c", b: "d", thickness: 0.1 },
        { id: "left", a: "d", b: "a", thickness: 0.1 },
      ],
    };
    const moved = new Set(["a", "b", "c", "d"]);
    const g = {
      ...graph,
      walls: graph.walls.map((w) => ({ ...w })),
      vertices: graph.vertices.map((v) => ({ ...v, y: v.y + 5 })),
    };
    expect(carryWallCurves(g, (id) => moved.has(id), { x: 0, y: 5 })).toBe(true);
    expect(g.walls.find((w) => w.id === "top")!.curve).toEqual({ x: 2, y: 4 });
  });

  it("vetoes a frame whose carried curve would cross a wall", () => {
    // A curved wall translated until its bulge pierces a standing wall.
    const graph: PlanGraph = {
      vertices: [
        { id: "a", x: 0, y: 0 },
        { id: "b", x: 4, y: 0 },
        { id: "s1", x: -1, y: -1 },
        { id: "s2", x: 5, y: -1 },
      ],
      walls: [
        { id: "bow", a: "a", b: "b", thickness: 0.1, curve: { x: 2, y: -3 } },
        { id: "bar", a: "s1", b: "s2", thickness: 0.1 },
      ],
    };
    const moved = new Set(["a", "b"]);
    const g = { ...graph, walls: graph.walls.map((w) => ({ ...w })) };
    // In place the bow already pierces the bar: the frame is refused.
    expect(carryWallCurves(g, (id) => moved.has(id), { x: 0, y: 0 })).toBe(false);
  });

  it("vetoes moving one endpoint of a curved wall until its arc crosses a wall", () => {
    // The curve's endpoint travels while the absolute control stays: the arc
    // sweeps out through the standing wall on the left.
    const graph: PlanGraph = {
      vertices: [
        { id: "a", x: 0.5, y: 0 },
        { id: "b", x: 4, y: 3 },
        { id: "s1", x: 0, y: -2 },
        { id: "s2", x: 0, y: 3 },
      ],
      walls: [
        { id: "bow", a: "a", b: "b", thickness: 0.1, curve: { x: -3, y: 1.5 } },
        { id: "side", a: "s1", b: "s2", thickness: 0.1 },
      ],
    };
    const g = { ...graph, walls: graph.walls.map((w) => ({ ...w })) };
    expect(carryWallCurves(g, (id) => id === "b", { x: 0, y: 0 })).toBe(false);
  });

  it("vetoes dragging a straight wall into a stationary curve", () => {
    // Neither end of the bow moves; the bar's vertex travels until the bar
    // lies across the arc. The frame is refused all the same.
    const graph: PlanGraph = {
      vertices: [
        { id: "a", x: 0, y: 0 },
        { id: "b", x: 4, y: 0 },
        { id: "s1", x: -1, y: -2 },
        { id: "s2", x: 5, y: -2 },
      ],
      walls: [
        { id: "bow", a: "a", b: "b", thickness: 0.1, curve: { x: 2, y: -3 } },
        { id: "bar", a: "s1", b: "s2", thickness: 0.1 },
      ],
    };
    const g = {
      ...graph,
      walls: graph.walls.map((w) => ({ ...w })),
      vertices: graph.vertices.map((v) => (v.id === "s1" ? { ...v, y: -0.5 } : v)),
    };
    expect(carryWallCurves(g, (id) => id === "s1", { x: 0, y: 1.5 })).toBe(false);
  });

  it("leaves a pre-existing crossing elsewhere draggable", () => {
    // The plan already holds an illegal arc far from the drag; a frame that
    // moves unrelated geometry must not be held hostage by it.
    const graph: PlanGraph = {
      vertices: [
        { id: "a", x: 0, y: 0 },
        { id: "b", x: 4, y: 0 },
        { id: "s1", x: -1, y: -1 },
        { id: "s2", x: 5, y: -1 },
        { id: "far1", x: 20, y: 0 },
        { id: "far2", x: 24, y: 0 },
      ],
      walls: [
        { id: "bow", a: "a", b: "b", thickness: 0.1, curve: { x: 2, y: -3 } },
        { id: "bar", a: "s1", b: "s2", thickness: 0.1 },
        { id: "away", a: "far1", b: "far2", thickness: 0.1 },
      ],
    };
    const g = {
      ...graph,
      walls: graph.walls.map((w) => ({ ...w })),
      vertices: graph.vertices.map((v) => (v.id === "far1" ? { ...v, y: 1 } : v)),
    };
    expect(carryWallCurves(g, (id) => id === "far1", { x: 0, y: 1 })).toBe(true);
  });
});
