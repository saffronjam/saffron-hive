import { describe, it, expect } from "vitest";
import { detectFaces, normalizeGraph } from "$lib/floorplan";
import type { PlanGraph, PlanOpening, PlanVertex, PlanWall } from "$lib/floorplan";

function vertex(id: string, x: number, y: number): PlanVertex {
  return { id, x, y };
}

function wall(id: string, a: string, b: string): PlanWall {
  return { id, a, b, thickness: 0.1 };
}

function pair(w: PlanWall): string[] {
  return [w.a, w.b].sort();
}

describe("normalizeGraph", () => {
  it("merges endpoints within the drop tolerance, smallest id surviving at its position", () => {
    const graph: PlanGraph = {
      vertices: [
        vertex("v-b", 0.005, 0),
        vertex("v-a", 0, 0),
        vertex("v-c", 1, 0),
        vertex("v-d", 0, 1),
      ],
      walls: [wall("w-1", "v-b", "v-c"), wall("w-2", "v-a", "v-d")],
    };
    const out = normalizeGraph(graph);
    expect(out.vertices.map((v) => v.id).sort()).toEqual(["v-a", "v-c", "v-d"]);
    const survivor = out.vertices.find((v) => v.id === "v-a")!;
    expect(survivor.x).toBe(0);
    expect(survivor.y).toBe(0);
    expect(out.walls.find((w) => w.id === "w-1")!.a).toBe("v-a");
  });

  it("still merges exact coincidences when the drop tolerance is zero", () => {
    const graph: PlanGraph = {
      vertices: [
        vertex("v-a", 0, 0),
        vertex("v-b", 1e-9, 0),
        vertex("v-c", 1, 0),
        vertex("v-d", 0, 1),
      ],
      walls: [wall("w-1", "v-b", "v-c"), wall("w-2", "v-a", "v-d")],
    };
    const out = normalizeGraph(graph, 0);
    expect(out.vertices.map((v) => v.id).sort()).toEqual(["v-a", "v-c", "v-d"]);
  });

  it("keeps vertices apart beyond the tolerance", () => {
    const graph: PlanGraph = {
      vertices: [
        vertex("v-a", 0, 0),
        vertex("v-b", 0.05, 0),
        vertex("v-c", 1, 0),
        vertex("v-d", 0, 1),
      ],
      walls: [wall("w-1", "v-b", "v-c"), wall("w-2", "v-a", "v-d")],
    };
    const out = normalizeGraph(graph);
    expect(out.vertices).toHaveLength(4);
  });

  it("splits a wall where another wall's endpoint sits on its interior", () => {
    const graph: PlanGraph = {
      vertices: [
        vertex("v-a", 0, 0),
        vertex("v-b", 4, 0),
        vertex("v-c", 2, 0),
        vertex("v-d", 2, 2),
      ],
      walls: [wall("w-ab", "v-a", "v-b"), wall("w-cd", "v-c", "v-d")],
    };
    const out = normalizeGraph(graph);
    expect(out.walls).toHaveLength(3);
    const pairs = out.walls.map(pair);
    expect(pairs).toContainEqual(["v-a", "v-c"]);
    expect(pairs).toContainEqual(["v-b", "v-c"]);
    expect(pairs).toContainEqual(["v-c", "v-d"]);
    expect(out.walls.find((w) => w.id === "w-ab")).toBeDefined();
  });

  it("does not split a curved wall", () => {
    const graph: PlanGraph = {
      vertices: [
        vertex("v-a", 0, 0),
        vertex("v-b", 4, 0),
        vertex("v-c", 2, 0),
        vertex("v-d", 2, 2),
      ],
      walls: [{ ...wall("w-ab", "v-a", "v-b"), curve: { x: 2, y: 1 } }, wall("w-cd", "v-c", "v-d")],
    };
    const out = normalizeGraph(graph);
    expect(out.walls).toHaveLength(2);
  });

  it("drops zero-length walls, including ones collapsed by a merge", () => {
    const graph: PlanGraph = {
      vertices: [vertex("v-a", 0, 0), vertex("v-b", 0.005, 0), vertex("v-c", 1, 0)],
      walls: [wall("w-1", "v-a", "v-b"), wall("w-2", "v-a", "v-a"), wall("w-3", "v-a", "v-c")],
    };
    const out = normalizeGraph(graph);
    expect(out.walls.map((w) => w.id)).toEqual(["w-3"]);
  });

  it("drops duplicate walls between the same vertex pair, smallest id surviving", () => {
    const graph: PlanGraph = {
      vertices: [vertex("v-a", 0, 0), vertex("v-b", 1, 0)],
      walls: [wall("w-b", "v-a", "v-b"), wall("w-a", "v-b", "v-a")],
    };
    const out = normalizeGraph(graph);
    expect(out.walls.map((w) => w.id)).toEqual(["w-a"]);
  });

  it("drops orphaned vertices", () => {
    const graph: PlanGraph = {
      vertices: [vertex("v-a", 0, 0), vertex("v-b", 1, 0), vertex("v-lone", 5, 5)],
      walls: [wall("w-1", "v-a", "v-b")],
    };
    const out = normalizeGraph(graph);
    expect(out.vertices.map((v) => v.id).sort()).toEqual(["v-a", "v-b"]);
  });

  it("is pure and leaves the input graph untouched", () => {
    const graph: PlanGraph = {
      vertices: [vertex("v-a", 0, 0), vertex("v-b", 0.005, 0), vertex("v-c", 1, 0)],
      walls: [wall("w-1", "v-b", "v-c"), wall("w-2", "v-a", "v-c")],
    };
    const snapshot = structuredClone(graph);
    normalizeGraph(graph);
    expect(graph).toEqual(snapshot);
  });
});

describe("normalizeGraph opening carry-through", () => {
  function door(id: string, t: number, width = 0.9): PlanOpening {
    return { id, t, width, kind: "door" };
  }

  /** A 4 m wall a–b with a wall meeting its midpoint, so a–b splits at t = 0.5. */
  function splitGraph(openings: PlanOpening[]): PlanGraph {
    return {
      vertices: [
        vertex("v-a", 0, 0),
        vertex("v-b", 4, 0),
        vertex("v-m", 2, 0),
        vertex("v-n", 2, 2),
      ],
      walls: [{ ...wall("w-ab", "v-a", "v-b"), openings }, wall("w-mn", "v-m", "v-n")],
    };
  }

  it("keeps a door on the first child and rescales its t", () => {
    const out = normalizeGraph(splitGraph([door("o-1", 0.25)]));
    const first = out.walls.find((w) => w.id === "w-ab")!;
    expect(first.a).toBe("v-a");
    expect(first.b).toBe("v-m");
    expect(first.openings).toHaveLength(1);
    expect(first.openings![0].id).toBe("o-1");
    expect(first.openings![0].t).toBeCloseTo(0.5, 9);
    expect(first.openings![0].width).toBe(0.9);
  });

  it("moves a door past the split onto the second child", () => {
    const out = normalizeGraph(splitGraph([door("o-1", 0.75)]));
    const first = out.walls.find((w) => w.id === "w-ab")!;
    const second = out.walls.find((w) => w.id === "w-ab~1")!;
    expect(first.openings).toBeUndefined();
    expect(second.a).toBe("v-m");
    expect(second.b).toBe("v-b");
    expect(second.openings).toHaveLength(1);
    expect(second.openings![0].t).toBeCloseTo(0.5, 9);
  });

  it("partitions several doors across the children", () => {
    const out = normalizeGraph(splitGraph([door("o-1", 0.1), door("o-2", 0.6), door("o-3", 0.9)]));
    const first = out.walls.find((w) => w.id === "w-ab")!;
    const second = out.walls.find((w) => w.id === "w-ab~1")!;
    expect(first.openings!.map((o) => o.id)).toEqual(["o-1"]);
    expect(second.openings!.map((o) => o.id)).toEqual(["o-2", "o-3"]);
    expect(second.openings![0].t).toBeCloseTo(0.2, 9);
    expect(second.openings![1].t).toBeCloseTo(0.8, 9);
  });

  it("keeps the metric width across a split", () => {
    const out = normalizeGraph(splitGraph([door("o-1", 0.25, 1.2)]));
    expect(out.walls.find((w) => w.id === "w-ab")!.openings![0].width).toBe(1.2);
  });

  it("merges the dropped duplicate's openings onto the surviving wall", () => {
    const out = normalizeGraph({
      vertices: [vertex("v-a", 0, 0), vertex("v-b", 4, 0)],
      walls: [
        { ...wall("w-b", "v-a", "v-b"), openings: [door("o-late", 0.75)] },
        { ...wall("w-a", "v-b", "v-a"), openings: [door("o-early", 0.25)] },
      ],
    });
    expect(out.walls).toHaveLength(1);
    expect(out.walls[0].id).toBe("w-a");
    expect(out.walls[0].openings!.map((o) => o.id).sort()).toEqual(["o-early", "o-late"]);
  });

  it("is idempotent: a second pass neither drops nor duplicates openings", () => {
    const once = normalizeGraph(splitGraph([door("o-1", 0.25), door("o-2", 0.75)]));
    const twice = normalizeGraph(once);
    expect(twice.walls.map((w) => w.openings ?? [])).toEqual(
      once.walls.map((w) => w.openings ?? []),
    );
  });
});

describe("normalizeGraph wall crossings", () => {
  /** A horizontal and a vertical wall crossing at (1, 1), sharing no endpoint. */
  function crossedPair(): PlanGraph {
    return {
      vertices: [
        { id: "h1", x: 0, y: 1 },
        { id: "h2", x: 2, y: 1 },
        { id: "v1", x: 1, y: 0 },
        { id: "v2", x: 1, y: 2 },
      ],
      walls: [
        { id: "w-h", a: "h1", b: "h2", thickness: 0.1 },
        { id: "w-v", a: "v1", b: "v2", thickness: 0.1 },
      ],
    };
  }

  it("splits both walls through one shared crossing vertex", () => {
    const out = normalizeGraph(crossedPair());
    expect(out.walls).toHaveLength(4);
    expect(out.vertices).toHaveLength(5);

    const crossing = out.vertices.find((v) => v.id.startsWith("xing-"));
    expect(crossing).toBeDefined();
    expect(crossing!.x).toBeCloseTo(1, 9);
    expect(crossing!.y).toBeCloseTo(1, 9);

    // All four segments meet there, so the graph is planar at the crossing.
    const touching = out.walls.filter((w) => w.a === crossing!.id || w.b === crossing!.id);
    expect(touching).toHaveLength(4);
  });

  it("is stable: normalising twice yields the same crossing vertex", () => {
    const once = normalizeGraph(crossedPair());
    const twice = normalizeGraph(once);
    expect(twice.vertices.map((v) => v.id).sort()).toEqual(once.vertices.map((v) => v.id).sort());
  });

  it("does not read an end-to-end touch as a crossing", () => {
    const out = normalizeGraph({
      vertices: [
        { id: "a", x: 0, y: 0 },
        { id: "b", x: 1, y: 0 },
        { id: "c", x: 2, y: 0 },
      ],
      walls: [
        { id: "w-1", a: "a", b: "b", thickness: 0.1 },
        { id: "w-2", a: "b", b: "c", thickness: 0.1 },
      ],
    });
    expect(out.vertices.some((v) => v.id.startsWith("xing-"))).toBe(false);
  });

  it("leaves parallel walls alone", () => {
    const out = normalizeGraph({
      vertices: [
        { id: "a", x: 0, y: 0 },
        { id: "b", x: 2, y: 0 },
        { id: "c", x: 0, y: 1 },
        { id: "d", x: 2, y: 1 },
      ],
      walls: [
        { id: "w-1", a: "a", b: "b", thickness: 0.1 },
        { id: "w-2", a: "c", b: "d", thickness: 0.1 },
      ],
    });
    expect(out.walls).toHaveLength(2);
    expect(out.vertices.some((v) => v.id.startsWith("xing-"))).toBe(false);
  });

  it("does not split a crossing that involves a curved wall", () => {
    const graph = crossedPair();
    graph.walls[1] = { ...graph.walls[1], curve: { x: 1.4, y: 1 } };
    const out = normalizeGraph(graph);
    expect(out.walls).toHaveLength(2);
    expect(out.vertices.some((v) => v.id.startsWith("xing-"))).toBe(false);
  });

  it("detects the same faces whether or not a wall carries a full-width door", () => {
    const room: PlanGraph = {
      vertices: [
        vertex("a", 0, 0),
        vertex("b", 2, 0),
        vertex("c", 2, 2),
        vertex("d", 0, 2),
        vertex("e", 4, 0),
        vertex("f", 4, 2),
      ],
      walls: [
        wall("w-ab", "a", "b"),
        wall("w-bc", "b", "c"),
        wall("w-cd", "c", "d"),
        wall("w-da", "d", "a"),
        wall("w-be", "b", "e"),
        wall("w-ef", "e", "f"),
        wall("w-fc", "f", "c"),
      ],
    };
    const plain = detectFaces(normalizeGraph(room));

    const doored: PlanGraph = {
      ...room,
      walls: room.walls.map((w) =>
        w.id === "w-bc"
          ? { ...w, openings: [{ id: "o-1", t: 0.5, width: 5, kind: "door" as const }] }
          : w,
      ),
    };
    const withDoor = detectFaces(normalizeGraph(doored));

    expect(withDoor).toEqual(plain);
    expect(withDoor).toHaveLength(2);
  });

  it("detects both rooms when a divider overshoots the outline it crosses", () => {
    const out = normalizeGraph({
      vertices: [
        { id: "a", x: 0, y: 0 },
        { id: "b", x: 2, y: 0 },
        { id: "c", x: 2, y: 2 },
        { id: "d", x: 0, y: 2 },
        { id: "m1", x: 1, y: -0.5 },
        { id: "m2", x: 1, y: 2.5 },
      ],
      walls: [
        { id: "w-ab", a: "a", b: "b", thickness: 0.1 },
        { id: "w-bc", a: "b", b: "c", thickness: 0.1 },
        { id: "w-cd", a: "c", b: "d", thickness: 0.1 },
        { id: "w-da", a: "d", b: "a", thickness: 0.1 },
        { id: "w-mid", a: "m1", b: "m2", thickness: 0.1 },
      ],
    });
    const faces = detectFaces(out);
    expect(faces).toHaveLength(2);
    for (const face of faces) expect(face.area).toBeCloseTo(2, 6);
  });
});

describe("normalizeGraph collinear cleanup", () => {
  /** A straight run a-b-c along x, with `b` holding nothing else. */
  function run(overrides: Partial<PlanWall> = {}): PlanGraph {
    return {
      vertices: [vertex("a", 0, 0), vertex("b", 1, 0), vertex("c", 2, 0)],
      walls: [
        { id: "w-ab", a: "a", b: "b", thickness: 0.1 },
        { id: "w-bc", a: "b", b: "c", thickness: 0.1, ...overrides },
      ],
    };
  }

  it("rejoins a run split by a vertex that holds nothing else", () => {
    const out = normalizeGraph(run());
    expect(out.walls).toHaveLength(1);
    expect(out.walls[0].id).toBe("w-ab");
    expect([out.walls[0].a, out.walls[0].b].sort()).toEqual(["a", "c"]);
    expect(out.vertices.map((v) => v.id).sort()).toEqual(["a", "c"]);
  });

  it("collapses a longer run all the way down", () => {
    const out = normalizeGraph({
      vertices: [vertex("a", 0, 0), vertex("b", 1, 0), vertex("c", 2, 0), vertex("d", 3, 0)],
      walls: [
        { id: "w-ab", a: "a", b: "b", thickness: 0.1 },
        { id: "w-bc", a: "b", b: "c", thickness: 0.1 },
        { id: "w-cd", a: "c", b: "d", thickness: 0.1 },
      ],
    });
    expect(out.walls).toHaveLength(1);
    expect([out.walls[0].a, out.walls[0].b].sort()).toEqual(["a", "d"]);
  });

  it("keeps a corner", () => {
    const out = normalizeGraph({
      vertices: [vertex("a", 0, 0), vertex("b", 1, 0), vertex("c", 1, 1)],
      walls: [
        { id: "w-ab", a: "a", b: "b", thickness: 0.1 },
        { id: "w-bc", a: "b", b: "c", thickness: 0.1 },
      ],
    });
    expect(out.walls).toHaveLength(2);
  });

  it("keeps a T-junction, where the vertex holds a third wall", () => {
    const out = normalizeGraph({
      vertices: [vertex("a", 0, 0), vertex("b", 1, 0), vertex("c", 2, 0), vertex("s", 1, 1)],
      walls: [
        { id: "w-ab", a: "a", b: "b", thickness: 0.1 },
        { id: "w-bc", a: "b", b: "c", thickness: 0.1 },
        { id: "w-bs", a: "b", b: "s", thickness: 0.1 },
      ],
    });
    expect(out.walls).toHaveLength(3);
    expect(out.vertices.map((v) => v.id)).toContain("b");
  });

  it("keeps a split that carries meaning", () => {
    expect(normalizeGraph(run({ thickness: 0.3 })).walls).toHaveLength(2);
    expect(normalizeGraph(run({ curve: { x: 1.5, y: 0.4 } })).walls).toHaveLength(2);
    expect(
      normalizeGraph(run({ openings: [{ id: "o", t: 0.5, width: 0.4, kind: "door" }] })).walls,
    ).toHaveLength(2);
  });

  it("leaves a closed room alone", () => {
    const out = normalizeGraph({
      vertices: [vertex("a", 0, 0), vertex("b", 2, 0), vertex("c", 2, 2), vertex("d", 0, 2)],
      walls: [
        { id: "w-1", a: "a", b: "b", thickness: 0.1 },
        { id: "w-2", a: "b", b: "c", thickness: 0.1 },
        { id: "w-3", a: "c", b: "d", thickness: 0.1 },
        { id: "w-4", a: "d", b: "a", thickness: 0.1 },
      ],
    });
    expect(out.walls).toHaveLength(4);
    expect(out.vertices).toHaveLength(4);
  });
});
