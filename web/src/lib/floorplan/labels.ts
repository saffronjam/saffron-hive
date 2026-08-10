import { formatArea, formatMeters, wallLength } from "./measure";
import { poleOfInaccessibility } from "./geometry";
import type { Face, PlanGraph, Point } from "./types";

/**
 * What a label is for, which is what decides how it is drawn: a room's name, a
 * measurement, or something following the pointer mid-gesture.
 */
export type LabelTone = "room" | "area" | "measure" | "draft";

/** A piece of text the plan draws at a point, in world coordinates. */
export interface PlanLabel {
  id: string;
  x: number;
  y: number;
  text: string;
  tone: LabelTone;
  /** Screen-pixel nudge, applied after the label is un-scaled from the zoom. */
  dy: number;
  anchor: "middle" | "end";
}

export interface PlanLabelInput {
  faces: Face[];
  /** Display name per face, aligned with `faces`; null where the room is anonymous. */
  faceNames: (string | null)[];
  /** Live mode shows a room's name only — areas are an editing concern. */
  live: boolean;
  /** A room name following the pointer during a link drag. */
  draft: { point: Point; text: string } | null;
  graph: PlanGraph;
  /** Walls whose length is worth showing, because a gesture is changing it. */
  measuredWallIds: Set<string>;
  /** The wall being drawn right now, and how long it is so far. */
  rubber: { from: Point; to: Point; length: number } | null;
  /** The rectangle stamp in progress, measured on two sides. */
  stamp: { x: number; y: number; w: number; h: number } | null;
}

/** Below this a measurement is noise rather than information. */
const MIN_MEASURE_M = 0.005;

/** Rectangle sides shorter than this are not worth labelling. */
const MIN_STAMP_LABEL_M = 0.05;

/** Every label the plan draws, in the order they should be painted. */
export function planLabels(input: PlanLabelInput): PlanLabel[] {
  const out: PlanLabel[] = [];

  input.faces.forEach((face, i) => {
    const { x, y } = poleOfInaccessibility(face.polygon);
    const name = input.faceNames[i] ?? null;
    const key = face.vertexIds.join("-");
    if (name) {
      out.push({
        id: `room-${key}`,
        x,
        y,
        text: name,
        tone: "room",
        // The name lifts to make room for the area underneath it.
        dy: input.live ? 0 : -8,
        anchor: "middle",
      });
    }
    if (!input.live) {
      out.push({
        id: `area-${key}`,
        x,
        y,
        text: formatArea(face.area),
        tone: "area",
        dy: name ? 9 : 0,
        anchor: "middle",
      });
    }
  });

  if (input.draft) {
    out.push({
      id: "draft",
      x: input.draft.point.x,
      y: input.draft.point.y,
      text: input.draft.text,
      tone: "draft",
      dy: 0,
      anchor: "middle",
    });
  }

  for (const wall of input.graph.walls) {
    if (!input.measuredWallIds.has(wall.id)) continue;
    const a = input.graph.vertices.find((v) => v.id === wall.a);
    const b = input.graph.vertices.find((v) => v.id === wall.b);
    if (!a || !b) continue;
    out.push({
      id: `wall-${wall.id}`,
      x: (a.x + b.x) / 2,
      y: (a.y + b.y) / 2,
      text: formatMeters(wallLength(wall, input.graph.vertices)),
      tone: "measure",
      dy: -10,
      anchor: "middle",
    });
  }

  if (input.rubber && input.rubber.length > MIN_MEASURE_M) {
    out.push({
      id: "rubber",
      x: (input.rubber.from.x + input.rubber.to.x) / 2,
      y: (input.rubber.from.y + input.rubber.to.y) / 2,
      text: formatMeters(input.rubber.length),
      tone: "measure",
      dy: -10,
      anchor: "middle",
    });
  }

  const stamp = input.stamp;
  if (stamp && (stamp.w >= MIN_STAMP_LABEL_M || stamp.h >= MIN_STAMP_LABEL_M)) {
    out.push({
      id: "stamp-w",
      x: stamp.x + stamp.w / 2,
      y: stamp.y - MIN_STAMP_LABEL_M,
      text: formatMeters(stamp.w),
      tone: "measure",
      dy: 0,
      anchor: "middle",
    });
    out.push({
      id: "stamp-h",
      x: stamp.x - MIN_STAMP_LABEL_M,
      y: stamp.y + stamp.h / 2,
      text: formatMeters(stamp.h),
      tone: "measure",
      dy: 0,
      anchor: "end",
    });
  }

  return out;
}
