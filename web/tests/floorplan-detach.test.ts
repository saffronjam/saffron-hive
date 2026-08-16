import { describe, expect, it } from "vitest";
import {
  detachFace,
  detachWallEnds,
  facePairKeys,
  wallPairKey,
  type IdMint,
} from "$lib/floorplan/detach";
import { detectFaces } from "$lib/floorplan";
import type { PlanGraph } from "$lib/floorplan";

function mint(): IdMint {
  let v = 0;
  let w = 0;
  return {
    vertexId: () => `new-vtx-${++v}`,
    wallId: () => `new-wall-${++w}`,
  };
}

/**
 * Two unit squares sharing the edge b–c:
 *
 *   a ---- b ---- e
 *   |  L   |  R   |
 *   d ---- c ---- f
 */
function twoRooms(): PlanGraph {
  return {
    vertices: [
      { id: "a", x: 0, y: 0 },
      { id: "b", x: 1, y: 0 },
      { id: "c", x: 1, y: 1 },
      { id: "d", x: 0, y: 1 },
      { id: "e", x: 2, y: 0 },
      { id: "f", x: 2, y: 1 },
    ],
    walls: [
      { id: "w-ab", a: "a", b: "b", thickness: 0.1 },
      { id: "w-bc", a: "b", b: "c", thickness: 0.1 },
      { id: "w-cd", a: "c", b: "d", thickness: 0.1 },
      { id: "w-da", a: "d", b: "a", thickness: 0.1 },
      { id: "w-be", a: "b", b: "e", thickness: 0.1 },
      { id: "w-ef", a: "e", b: "f", thickness: 0.1 },
      { id: "w-fc", a: "f", b: "c", thickness: 0.1 },
    ],
  };
}

function faceWith(graph: PlanGraph, ids: string[]) {
  const faces = detectFaces(graph);
  const face = faces.find(
    (f) => f.vertexIds.length === ids.length && ids.every((id) => f.vertexIds.includes(id)),
  );
  if (!face) throw new Error(`no face for ${ids.join(",")}`);
  return { face, others: faces.filter((f) => f !== face) };
}

describe("facePairKeys / wallPairKey", () => {
  it("keys edges undirected so both rooms agree on a shared wall", () => {
    const keys = facePairKeys({ vertexIds: ["a", "b", "c"], polygon: [], area: 1 });
    expect(keys).toEqual(new Set(["a|b", "b|c", "a|c"]));
    expect(wallPairKey({ a: "c", b: "b" })).toBe("b|c");
  });
});

describe("detachFace", () => {
  it("leaves the neighbour's vertices and walls untouched", () => {
    const graph = twoRooms();
    const { face, others } = faceWith(graph, ["a", "b", "c", "d"]);
    const { graph: next } = detachFace(graph, face, others, mint());

    // Every original vertex still exists at its original position.
    for (const original of graph.vertices) {
      const kept = next.vertices.find((v) => v.id === original.id);
      expect(kept).toEqual(original);
    }
    // The neighbour's own walls survive byte-identical.
    for (const id of ["w-be", "w-ef", "w-fc", "w-bc"]) {
      expect(next.walls.find((w) => w.id === id)).toEqual(graph.walls.find((w) => w.id === id));
    }
  });

  it("duplicates shared corners but keeps exclusive ids", () => {
    const graph = twoRooms();
    const { face, others } = faceWith(graph, ["a", "b", "c", "d"]);
    const { movedVertexIds, idMap } = detachFace(graph, face, others, mint());

    // b and c are shared with the right-hand room; a and d are not.
    expect([...idMap.keys()].sort()).toEqual(["b", "c"]);
    expect(movedVertexIds.has("a")).toBe(true);
    expect(movedVertexIds.has("d")).toBe(true);
    expect(movedVertexIds.has("b")).toBe(false);
    expect(movedVertexIds.has("c")).toBe(false);
    expect(movedVertexIds.has(idMap.get("b")!)).toBe(true);
    expect(movedVertexIds.has(idMap.get("c")!)).toBe(true);
  });

  it("keeps both rooms closed: the shared wall is duplicated", () => {
    const graph = twoRooms();
    const { face, others } = faceWith(graph, ["a", "b", "c", "d"]);
    const { graph: next, idMap } = detachFace(graph, face, others, mint());

    // Original b–c stays for the neighbour; the ring gets its own copy.
    expect(next.walls.filter((w) => wallPairKey(w) === "b|c")).toHaveLength(1);
    const ringCopy = next.walls.find(
      (w) => wallPairKey(w) === wallPairKey({ a: idMap.get("b")!, b: idMap.get("c")! }),
    );
    expect(ringCopy).toBeDefined();
    expect(next.walls.length).toBe(graph.walls.length + 1);
  });

  it("produces a ring that still detects as its own face", () => {
    const graph = twoRooms();
    const { face, others } = faceWith(graph, ["a", "b", "c", "d"]);
    const { graph: next, movedVertexIds } = detachFace(graph, face, others, mint());

    const faces = detectFaces(next);
    expect(faces).toHaveLength(2);
    const moved = faces.find((f) => f.vertexIds.every((id) => movedVertexIds.has(id)));
    expect(moved).toBeDefined();
    expect(moved!.area).toBeCloseTo(1, 6);
    // The neighbour still reads as the untouched original face.
    const neighbour = faces.find((f) => f !== moved);
    expect(neighbour!.vertexIds.sort()).toEqual(["b", "c", "e", "f"]);
  });

  it("is a no-op for a room that touches nothing", () => {
    const graph: PlanGraph = {
      vertices: [
        { id: "a", x: 0, y: 0 },
        { id: "b", x: 1, y: 0 },
        { id: "c", x: 1, y: 1 },
        { id: "d", x: 0, y: 1 },
      ],
      walls: [
        { id: "w-ab", a: "a", b: "b", thickness: 0.1 },
        { id: "w-bc", a: "b", b: "c", thickness: 0.1 },
        { id: "w-cd", a: "c", b: "d", thickness: 0.1 },
        { id: "w-da", a: "d", b: "a", thickness: 0.1 },
      ],
    };
    const { face, others } = faceWith(graph, ["a", "b", "c", "d"]);
    const { graph: next, idMap, movedVertexIds } = detachFace(graph, face, others, mint());

    expect(idMap.size).toBe(0);
    expect(next.vertices).toEqual(graph.vertices);
    expect(next.walls).toEqual(graph.walls);
    expect(movedVertexIds).toEqual(new Set(["a", "b", "c", "d"]));
  });

  it("reports every vertex as duplicated when the room is fully enclosed", () => {
    // A centre square whose four corners each carry a spur wall outward.
    const graph: PlanGraph = {
      vertices: [
        { id: "a", x: 0, y: 0 },
        { id: "b", x: 1, y: 0 },
        { id: "c", x: 1, y: 1 },
        { id: "d", x: 0, y: 1 },
        { id: "out-a", x: -1, y: -1 },
        { id: "out-b", x: 2, y: -1 },
        { id: "out-c", x: 2, y: 2 },
        { id: "out-d", x: -1, y: 2 },
      ],
      walls: [
        { id: "w-ab", a: "a", b: "b", thickness: 0.1 },
        { id: "w-bc", a: "b", b: "c", thickness: 0.1 },
        { id: "w-cd", a: "c", b: "d", thickness: 0.1 },
        { id: "w-da", a: "d", b: "a", thickness: 0.1 },
        { id: "s-a", a: "a", b: "out-a", thickness: 0.1 },
        { id: "s-b", a: "b", b: "out-b", thickness: 0.1 },
        { id: "s-c", a: "c", b: "out-c", thickness: 0.1 },
        { id: "s-d", a: "d", b: "out-d", thickness: 0.1 },
      ],
    };
    const { face, others } = faceWith(graph, ["a", "b", "c", "d"]);
    const { idMap, movedVertexIds } = detachFace(graph, face, others, mint());

    expect(idMap.size).toBe(4);
    for (const id of ["a", "b", "c", "d"]) expect(movedVertexIds.has(id)).toBe(false);
    expect(movedVertexIds.size).toBe(4);
  });
});

describe("detachWallEnds", () => {
  it("leaves the run continuing past the end on its own vertex", () => {
    // w-ab and w-be are the two halves of the top run, meeting at b; w-bc is
    // the party wall dropping down from it.
    const { graph, moved } = detachWallEnds(twoRooms(), "w-ab", detectFaces(twoRooms()), mint());

    const wAb = graph.walls.find((w) => w.id === "w-ab")!;
    const wBe = graph.walls.find((w) => w.id === "w-be")!;
    expect(wBe.a).toBe("b");
    expect(wAb.b).not.toBe("b");
    expect(graph.vertices.find((v) => v.id === wAb.b)).toMatchObject({ x: 1, y: 0 });
    expect([...moved.keys()].sort()).toEqual(["a", wAb.b].sort());
  });

  it("leaves a party wall where it is, so the room behind it cannot be pulled open", () => {
    const { graph } = detachWallEnds(twoRooms(), "w-ab", detectFaces(twoRooms()), mint());
    // w-bc bounds the right room, which this drag is not moving.
    expect(graph.walls.find((w) => w.id === "w-bc")!.a).toBe("b");
    // The right room's own ring is untouched.
    for (const id of ["w-bc", "w-be", "w-ef", "w-fc"]) {
      const before = twoRooms().walls.find((w) => w.id === id)!;
      expect(graph.walls.find((w) => w.id === id)).toMatchObject({ a: before.a, b: before.b });
    }
  });

  it("bridges the old corner to the new one so both rooms stay closed", () => {
    const { graph } = detachWallEnds(twoRooms(), "w-ab", detectFaces(twoRooms()), mint());
    const wAb = graph.walls.find((w) => w.id === "w-ab")!;
    const connector = graph.walls.find(
      (w) => (w.a === "b" && w.b === wAb.b) || (w.b === "b" && w.a === wAb.b),
    );
    expect(connector, "no connector between the old and new corner").toBeTruthy();
    // It stands in for the party wall, so it is as thick as one.
    expect(connector!.thickness).toBe(0.1);
  });

  it("adds no connector where only a straight run stays behind", () => {
    // A plain run a-b-c with nothing else attached: sliding the middle segment
    // detaches it cleanly rather than trailing stubs behind.
    const graph: PlanGraph = {
      vertices: [
        { id: "a", x: 0, y: 0 },
        { id: "b", x: 1, y: 0 },
        { id: "c", x: 2, y: 0 },
      ],
      walls: [
        { id: "w-ab", a: "a", b: "b", thickness: 0.1 },
        { id: "w-bc", a: "b", b: "c", thickness: 0.1 },
      ],
    };
    const result = detachWallEnds(graph, "w-ab", detectFaces(graph), mint());
    expect(result.graph.walls).toHaveLength(2);
  });

  it("keeps a free end's vertex, so a lone wall drags nothing extra", () => {
    const graph: PlanGraph = {
      vertices: [
        { id: "a", x: 0, y: 0 },
        { id: "b", x: 1, y: 0 },
      ],
      walls: [{ id: "w-ab", a: "a", b: "b", thickness: 0.1 }],
    };
    const result = detachWallEnds(graph, "w-ab", detectFaces(graph), mint());
    expect(result.graph.vertices).toHaveLength(2);
    expect([...result.moved.keys()].sort()).toEqual(["a", "b"]);
  });

  it("does not split where every neighbor meets it at an angle", () => {
    // At a only w-da attaches, and it is perpendicular, so it stretches along.
    const { graph } = detachWallEnds(twoRooms(), "w-ab", detectFaces(twoRooms()), mint());
    const wDa = graph.walls.find((w) => w.id === "w-da")!;
    expect(wDa.b).toBe("a");
  });

  it("splits both ends when the wall sits mid-run", () => {
    // A straight run a-b-c-d: dragging the middle segment must leave both
    // outer segments where they are.
    const graph: PlanGraph = {
      vertices: [
        { id: "a", x: 0, y: 0 },
        { id: "b", x: 1, y: 0 },
        { id: "c", x: 2, y: 0 },
        { id: "d", x: 3, y: 0 },
      ],
      walls: [
        { id: "w-ab", a: "a", b: "b", thickness: 0.1 },
        { id: "w-bc", a: "b", b: "c", thickness: 0.1 },
        { id: "w-cd", a: "c", b: "d", thickness: 0.1 },
      ],
    };
    const result = detachWallEnds(graph, "w-bc", detectFaces(graph), mint());
    const mid = result.graph.walls.find((w) => w.id === "w-bc")!;
    expect(mid.a).not.toBe("b");
    expect(mid.b).not.toBe("c");
    expect(result.graph.walls.find((w) => w.id === "w-ab")!.b).toBe("b");
    expect(result.graph.walls.find((w) => w.id === "w-cd")!.a).toBe("c");
    expect(result.moved.size).toBe(2);
  });

  it("treats a curved neighbor as following, never as a continuation", () => {
    const graph: PlanGraph = {
      vertices: [
        { id: "a", x: 0, y: 0 },
        { id: "b", x: 1, y: 0 },
        { id: "c", x: 2, y: 0 },
      ],
      walls: [
        { id: "w-ab", a: "a", b: "b", thickness: 0.1 },
        { id: "w-bc", a: "b", b: "c", thickness: 0.1, curve: { x: 1.5, y: 0.6 } },
      ],
    };
    const result = detachWallEnds(graph, "w-ab", detectFaces(graph), mint());
    expect(result.graph.walls.find((w) => w.id === "w-bc")!.a).toBe("b");
    expect([...result.moved.keys()].sort()).toEqual(["a", "b"]);
  });
});

describe("detachFace where a neighbour wraps a corner", () => {
  /**
   * A square with an L-shaped room hugging two of its sides, so the corner c is
   * where both of the shared walls meet and no wall outside the square touches
   * it:
   *
   *   g ------------- f
   *   |               |
   *   d ----- c       |
   *   |   □   |   L   |
   *   a ----- b ----- e
   */
  function wrapped(): PlanGraph {
    const at = (id: string, x: number, y: number) => ({ id, x, y });
    return {
      vertices: [
        at("a", 0, 0),
        at("b", 4, 0),
        at("c", 4, 4),
        at("d", 0, 4),
        at("e", 6, 0),
        at("f", 6, 6),
        at("g", 0, 6),
      ],
      walls: [
        { id: "w1", a: "a", b: "b", thickness: 0.1 },
        { id: "w2", a: "b", b: "c", thickness: 0.1 },
        { id: "w3", a: "c", b: "d", thickness: 0.1 },
        { id: "w4", a: "d", b: "a", thickness: 0.1 },
        { id: "w5", a: "b", b: "e", thickness: 0.1 },
        { id: "w6", a: "e", b: "f", thickness: 0.1 },
        { id: "w7", a: "f", b: "g", thickness: 0.1 },
        { id: "w8", a: "g", b: "d", thickness: 0.1 },
      ],
    };
  }

  function split() {
    const graph = wrapped();
    const faces = detectFaces(graph);
    const square = faces.find((f) => f.vertexIds.length === 4)!;
    return detachFace(
      graph,
      square,
      faces.filter((f) => f !== square),
      mint(),
    );
  }

  it("takes a copy of the corner both shared walls meet at", () => {
    const { idMap } = split();
    expect(idMap.has("c")).toBe(true);
  });

  it("leaves every corner the neighbour uses where it was", () => {
    const { graph: next, movedVertexIds } = split();
    for (const id of ["b", "c", "d", "e", "f", "g"]) {
      const kept = next.vertices.find((v) => v.id === id);
      expect(kept, `the neighbour lost ${id}`).toEqual(wrapped().vertices.find((v) => v.id === id));
      expect(movedVertexIds.has(id), `${id} moves with the room`).toBe(false);
    }
  });

  it("keeps the neighbour a closed room after the square is dragged away", () => {
    const { graph: next, movedVertexIds } = split();
    const dragged = {
      ...next,
      vertices: next.vertices.map((v) =>
        movedVertexIds.has(v.id) ? { ...v, x: v.x - 20, y: v.y - 20 } : v,
      ),
    };
    const faces = detectFaces(dragged);
    expect(faces).toHaveLength(2);
    // The L keeps the area it had; nothing of it was stretched or dragged.
    expect(faces.map((f) => Math.round(f.area)).sort((x, y) => x - y)).toEqual([16, 20]);
  });
});

describe("detachFace with openings on a shared wall", () => {
  function withDoor(): PlanGraph {
    const graph = twoRooms();
    return {
      ...graph,
      walls: graph.walls.map((w) =>
        w.id === "w-bc"
          ? { ...w, openings: [{ id: "door-1", kind: "door" as const, t: 0.5, width: 0.9 }] }
          : w,
      ),
    };
  }

  it("keeps every opening id unique — the door stays with the neighbour", () => {
    const graph = withDoor();
    const { face, others } = faceWith(graph, ["a", "b", "c", "d"]);
    const { graph: next } = detachFace(graph, face, others, mint());
    const ids = next.walls.flatMap((w) => (w.openings ?? []).map((o) => o.id));
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toEqual(["door-1"]);
    // The surviving door sits on the neighbour's original wall.
    const keeper = next.walls.find((w) => (w.openings ?? []).length > 0)!;
    expect(keeper.id).toBe("w-bc");
  });

  it("moves openings on walls the room owns outright", () => {
    const graph = twoRooms();
    const withWindow = {
      ...graph,
      walls: graph.walls.map((w) =>
        w.id === "w-da"
          ? { ...w, openings: [{ id: "win-1", kind: "window" as const, t: 0.5, width: 0.6 }] }
          : w,
      ),
    };
    const { face, others } = faceWith(withWindow, ["a", "b", "c", "d"]);
    const { graph: next, movedVertexIds } = detachFace(withWindow, face, others, mint());
    const wall = next.walls.find((w) => w.id === "w-da")!;
    expect(wall.openings).toHaveLength(1);
    // Its wall's endpoints belong to the moving ring, so the window travels.
    expect(movedVertexIds.has(wall.a)).toBe(true);
    expect(movedVertexIds.has(wall.b)).toBe(true);
  });
});
