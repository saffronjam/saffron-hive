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
  /**
   * Scratch measurements: a line says how long it is, a box its area and both
   * of its sides.
   */
  measures: { id: string; kind: "line" | "rect"; a: Point; b: Point }[];
  /** A furniture piece being resized, measured on two sides like the stamp. */
  furniture: {
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
    rotation: number;
  } | null;
}

/** Below this a measurement is noise rather than information. */
const MIN_MEASURE_M = 0.005;

/** Rectangle sides shorter than this are not worth labelling. */
const MIN_STAMP_LABEL_M = 0.05;

/** How far a furniture measurement stands off the side it measures, in meters. */
const FURNITURE_LABEL_GAP_M = 0.18;

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

  for (const m of input.measures) {
    const w = Math.abs(m.b.x - m.a.x);
    const h = Math.abs(m.b.y - m.a.y);
    if (m.kind === "line") {
      const length = Math.hypot(m.b.x - m.a.x, m.b.y - m.a.y);
      if (length < MIN_MEASURE_M) continue;
      out.push({
        id: `measure-${m.id}`,
        x: (m.a.x + m.b.x) / 2,
        y: (m.a.y + m.b.y) / 2,
        text: formatMeters(length),
        tone: "measure",
        dy: -10,
        anchor: "middle",
      });
      continue;
    }
    if (w < MIN_MEASURE_M && h < MIN_MEASURE_M) continue;
    const left = Math.min(m.a.x, m.b.x);
    const top = Math.min(m.a.y, m.b.y);
    out.push({
      id: `measure-${m.id}-area`,
      x: left + w / 2,
      y: top + h / 2,
      text: formatArea(w * h),
      tone: "measure",
      dy: 0,
      anchor: "middle",
    });
    out.push({
      id: `measure-${m.id}-w`,
      x: left + w / 2,
      y: top - MIN_STAMP_LABEL_M,
      text: formatMeters(w),
      tone: "measure",
      dy: 0,
      anchor: "middle",
    });
    out.push({
      id: `measure-${m.id}-h`,
      x: left - MIN_STAMP_LABEL_M,
      y: top + h / 2,
      text: formatMeters(h),
      tone: "measure",
      dy: 0,
      anchor: "end",
    });
  }

  const piece = input.furniture;
  if (piece) {
    // The labels sit off the top and left edges, turning with the piece so they
    // stay beside the side they measure. The text itself never rotates.
    const rad = (piece.rotation * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    const at = (lx: number, ly: number) => ({
      x: piece.x + lx * cos - ly * sin,
      y: piece.y + lx * sin + ly * cos,
    });
    const top = at(0, -piece.height / 2 - FURNITURE_LABEL_GAP_M);
    const side = at(-piece.width / 2 - FURNITURE_LABEL_GAP_M, 0);
    out.push({
      id: `furniture-w-${piece.id}`,
      x: top.x,
      y: top.y,
      text: formatMeters(piece.width),
      tone: "measure",
      dy: 0,
      anchor: "middle",
    });
    out.push({
      id: `furniture-h-${piece.id}`,
      x: side.x,
      y: side.y,
      text: formatMeters(piece.height),
      tone: "measure",
      dy: 0,
      anchor: "middle",
    });
  }

  return out;
}
