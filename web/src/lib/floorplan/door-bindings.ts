import { pointSegmentDistance } from "./geometry";
import { openingAnchor, openingSpan } from "./openings";
import type { PlanDoorBinding, PlanGraph, PlanOpening, PlanWall, Point } from "./types";

export interface DoorBindingGeometry {
  center: Point;
  start: Point;
  end: Point;
  hinge: Point;
  latch: Point;
  length: number;
  closedAngle: number;
  openAngle: number;
}

export interface DoorBindingView {
  binding: PlanDoorBinding;
  wall: PlanWall;
  opening: PlanOpening;
  geometry: DoorBindingGeometry;
}

export interface DoorSnapTarget {
  binding: Omit<PlanDoorBinding, "deviceId">;
  geometry: DoorBindingGeometry;
  distance: number;
}

function openingEntry(
  graph: PlanGraph,
  openingId: string,
): { wall: PlanWall; opening: PlanOpening } | null {
  for (const wall of graph.walls) {
    const opening = wall.openings?.find((candidate) => candidate.id === openingId);
    if (opening) return { wall, opening };
  }
  return null;
}

export function doorBindingGeometry(
  graph: PlanGraph,
  wall: PlanWall,
  opening: PlanOpening,
  binding: Pick<PlanDoorBinding, "hingeSide" | "swingSide">,
): DoorBindingGeometry {
  const span = openingSpan(wall, graph.vertices, opening);
  const anchor = openingAnchor(wall, graph.vertices, opening);
  const start = span[0] ?? anchor.point;
  const end = span[span.length - 1] ?? anchor.point;
  const hinge = binding.hingeSide === "end" ? end : start;
  const latch = binding.hingeSide === "end" ? start : end;
  const length = Math.hypot(latch.x - hinge.x, latch.y - hinge.y);
  const closedAngle = Math.atan2(latch.y - hinge.y, latch.x - hinge.x);
  const side = binding.swingSide === "left" ? 1 : -1;
  const openAngle = Math.atan2(anchor.normal.y * side, anchor.normal.x * side);
  return {
    center: anchor.point,
    start,
    end,
    hinge,
    latch,
    length,
    closedAngle,
    openAngle,
  };
}

export function doorBindingViews(graph: PlanGraph, bindings: PlanDoorBinding[]): DoorBindingView[] {
  return bindings.flatMap((binding) => {
    const entry = openingEntry(graph, binding.openingId);
    if (!entry || entry.opening.kind !== "door") return [];
    return [
      {
        binding,
        ...entry,
        geometry: doorBindingGeometry(graph, entry.wall, entry.opening, binding),
      },
    ];
  });
}

export function doorLeafAngle(geometry: DoorBindingGeometry, open: boolean): number {
  return open ? geometry.openAngle : geometry.closedAngle;
}

export function doorSnapTarget(
  graph: PlanGraph,
  point: Point,
  maxDistance: number,
): DoorSnapTarget | null {
  let best: DoorSnapTarget | null = null;
  for (const wall of graph.walls) {
    for (const opening of wall.openings ?? []) {
      if (opening.kind !== "door") continue;
      const span = openingSpan(wall, graph.vertices, opening);
      if (span.length === 0) continue;
      let distance = Number.POSITIVE_INFINITY;
      if (span.length === 1) distance = Math.hypot(point.x - span[0].x, point.y - span[0].y);
      for (let i = 1; i < span.length; i++) {
        distance = Math.min(distance, pointSegmentDistance(point, span[i - 1], span[i]));
      }
      if (distance > maxDistance || (best && distance >= best.distance)) continue;

      const anchor = openingAnchor(wall, graph.vertices, opening);
      const start = span[0];
      const end = span[span.length - 1];
      const startDistance = Math.hypot(point.x - start.x, point.y - start.y);
      const endDistance = Math.hypot(point.x - end.x, point.y - end.y);
      const hingeSide = endDistance < startDistance ? "end" : "start";
      const sideDot =
        (point.x - anchor.point.x) * anchor.normal.x + (point.y - anchor.point.y) * anchor.normal.y;
      const swingSide = sideDot < 0 ? "right" : "left";
      const binding = { openingId: opening.id, hingeSide, swingSide } as const;
      best = {
        binding,
        geometry: doorBindingGeometry(graph, wall, opening, binding),
        distance,
      };
    }
  }
  return best;
}

export function pruneDoorBindings(
  graph: PlanGraph,
  bindings: PlanDoorBinding[],
): PlanDoorBinding[] {
  const doors = new Set(
    graph.walls.flatMap((wall) =>
      (wall.openings ?? [])
        .filter((opening) => opening.kind === "door")
        .map((opening) => opening.id),
    ),
  );
  const openings = new Set<string>();
  const devices = new Set<string>();
  return bindings.filter((binding) => {
    if (
      !doors.has(binding.openingId) ||
      openings.has(binding.openingId) ||
      devices.has(binding.deviceId)
    ) {
      return false;
    }
    openings.add(binding.openingId);
    devices.add(binding.deviceId);
    return true;
  });
}
