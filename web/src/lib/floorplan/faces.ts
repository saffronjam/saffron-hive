import { flattenWall, pointInPolygon, shoelaceArea } from "./geometry";
import type { Face, PlanGraph, Point } from "./types";

/**
 * The face containing a point. Nested faces resolve to the smallest
 * containing area, so a room inside a larger outline wins over the outline.
 */
export function faceContainingPoint(faces: Face[], p: Point): Face | null {
  let best: Face | null = null;
  let bestArea = Infinity;
  for (const face of faces) {
    if (face.area < bestArea && pointInPolygon(p, face.polygon)) {
      best = face;
      bestArea = face.area;
    }
  }
  return best;
}

const MIN_FACE_AREA = 1e-9;

interface HalfEdgeNode {
  point: Point;
  neighbors: Array<{ to: string; angle: number }>;
}

/**
 * Detect the enclosed faces of a wall graph. Curved walls are flattened
 * first; each vertex gets an angle-sorted adjacency list; every unused
 * directed edge starts a leftmost-turn cycle walk. Walks with positive
 * signed area are interior faces (the outer face traces negative and is
 * discarded). `vertexIds` holds only graph vertices in canonical rotation:
 * lexicographically smallest id first, counter-clockwise order.
 */
export function detectFaces(graph: PlanGraph): Face[] {
  const nodes = new Map<string, HalfEdgeNode>();
  const realIds = new Set<string>();
  for (const v of graph.vertices) {
    nodes.set(v.id, { point: { x: v.x, y: v.y }, neighbors: [] });
    realIds.add(v.id);
  }

  let segmentCount = 0;
  const linked = new Set<string>();
  for (const wall of graph.walls) {
    if (wall.a === wall.b || !nodes.has(wall.a) || !nodes.has(wall.b)) continue;
    const polyline = flattenWall(wall, graph.vertices);
    if (polyline.length < 2) continue;
    let prevId = wall.a;
    for (let i = 1; i < polyline.length; i++) {
      const id = i === polyline.length - 1 ? wall.b : `${wall.id}#${i}`;
      if (!nodes.has(id)) nodes.set(id, { point: polyline[i], neighbors: [] });
      const pairKey = prevId < id ? `${prevId} ${id}` : `${id} ${prevId}`;
      if (!linked.has(pairKey) && prevId !== id) {
        linked.add(pairKey);
        link(nodes, prevId, id);
        segmentCount++;
      }
      prevId = id;
    }
  }

  for (const node of nodes.values()) {
    node.neighbors.sort((p, q) => p.angle - q.angle);
  }

  const used = new Set<string>();
  const faces: Face[] = [];
  const stepLimit = 4 * segmentCount + 8;
  for (const [fromId, node] of nodes) {
    for (const { to } of node.neighbors) {
      if (used.has(`${fromId}>${to}`)) continue;
      const cycle = walkCycle(nodes, used, fromId, to, stepLimit);
      if (!cycle) continue;
      const polygon = cycle.map((id) => nodes.get(id)!.point);
      const area = shoelaceArea(polygon);
      if (area <= MIN_FACE_AREA) continue;
      faces.push(canonicalFace(cycle, polygon, area, realIds));
    }
  }
  return faces;
}

function link(nodes: Map<string, HalfEdgeNode>, aId: string, bId: string): void {
  const a = nodes.get(aId)!;
  const b = nodes.get(bId)!;
  a.neighbors.push({ to: bId, angle: Math.atan2(b.point.y - a.point.y, b.point.x - a.point.x) });
  b.neighbors.push({ to: aId, angle: Math.atan2(a.point.y - b.point.y, a.point.x - b.point.x) });
}

function walkCycle(
  nodes: Map<string, HalfEdgeNode>,
  used: Set<string>,
  startFrom: string,
  startTo: string,
  stepLimit: number,
): string[] | null {
  const cycle: string[] = [startFrom];
  let prev = startFrom;
  let cur = startTo;
  used.add(`${startFrom}>${startTo}`);
  for (let step = 0; step < stepLimit; step++) {
    const next = clockwiseMost(nodes, prev, cur);
    if (next === null) return null;
    if (cur === startFrom && next === startTo) return cycle;
    cycle.push(cur);
    used.add(`${cur}>${next}`);
    prev = cur;
    cur = next;
  }
  return null;
}

function clockwiseMost(nodes: Map<string, HalfEdgeNode>, prev: string, cur: string): string | null {
  const node = nodes.get(cur)!;
  const prevNode = nodes.get(prev)!;
  const inAngle = Math.atan2(prevNode.point.y - node.point.y, prevNode.point.x - node.point.x);
  let best: string | null = null;
  let bestDelta = Infinity;
  for (const { to, angle } of node.neighbors) {
    let delta = inAngle - angle;
    if (delta <= 1e-9) delta += 2 * Math.PI;
    if (delta < bestDelta) {
      bestDelta = delta;
      best = to;
    }
  }
  return best;
}

function canonicalFace(
  cycle: string[],
  polygon: Point[],
  area: number,
  realIds: Set<string>,
): Face {
  let startIndex = 0;
  let smallest: string | null = null;
  for (let i = 0; i < cycle.length; i++) {
    if (!realIds.has(cycle[i])) continue;
    if (smallest === null || cycle[i] < smallest) {
      smallest = cycle[i];
      startIndex = i;
    }
  }
  const rotatedIds = [...cycle.slice(startIndex), ...cycle.slice(0, startIndex)];
  const rotatedPolygon = [...polygon.slice(startIndex), ...polygon.slice(0, startIndex)];
  return {
    vertexIds: rotatedIds.filter((id) => realIds.has(id)),
    polygon: rotatedPolygon,
    area,
  };
}
