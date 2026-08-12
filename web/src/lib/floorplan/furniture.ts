import type { Component } from "svelte";
import {
  Armchair,
  Bath,
  Bed,
  BedDouble,
  BedSingle,
  Circle,
  Sofa,
  Square,
  Toilet,
  Waves,
} from "@lucide/svelte";
import type { FloorplanFurnitureData } from "$lib/floorplan-editable";
import type { PlanGraph, Point } from "./types";
import { flattenWall, vertexMap } from "./geometry";

/** Nothing may be scaled below this, in meters. */
export const MIN_FURNITURE_M = 0.2;

/** How a piece may be resized. */
export type FurnitureScale = "uniform" | "free";

/** Which handle of the scale gizmo is being dragged. */
export type ScaleAxis = "x" | "y" | "both";

/** Where a piece's footprint ends, for occlusion and hit-testing. */
export type FurnitureFootprint = "rect" | "ellipse";

/**
 * One primitive of a top-view symbol, in a box centred on the origin. `body` is
 * the piece's outline, `detail` the lines that make it readable as what it is;
 * the renderer maps the two to tokens, so no colour lives in the catalogue.
 */
export type FurnitureShape =
  | { s: "rect"; x: number; y: number; w: number; h: number; r?: number; role: "body" | "detail" }
  | { s: "ellipse"; x: number; y: number; rx: number; ry: number; role: "body" | "detail" }
  | { s: "line"; x1: number; y1: number; x2: number; y2: number; role: "detail" };

export interface FurnitureKind {
  id: string;
  label: string;
  group: "Fixtures" | "Beds" | "Sofas" | "Shapes";
  icon: Component;
  /** True size in meters, which is what a piece is dropped at. */
  size: { width: number; height: number };
  scale: FurnitureScale;
  footprint: FurnitureFootprint;
  /** The symbol, rebuilt for the piece's current size. */
  draw(width: number, height: number): FurnitureShape[];
}

/**
 * Detail bands hold their real depth however far a piece is stretched — a 1.8 m
 * bed has the same pillow as a 1.1 m one, which is the whole reason the symbols
 * are built per size rather than drawn once and scaled.
 */
const PILLOW_M = 0.25;
const SOFA_BACK_M = 0.22;
const SOFA_ARM_M = 0.18;
const CISTERN_M = 0.2;
const RIM_M = 0.04;

/** Basin as a share of the vanity top it sits in, and the tap's radius. */
const BASIN_W = 0.56;
const BASIN_H = 0.68;
const TAP_R = 0.02;

/** A bath's well as a share of its outer shell. */
const WELL_W = 0.86;
const WELL_H = 0.72;

/** The band depth that fits in `span`, never eating more than a third of it. */
function band(depth: number, span: number): number {
  return Math.min(depth, span / 3);
}

function bodyRect(w: number, h: number, r = 0.04): FurnitureShape {
  return { s: "rect", x: -w / 2, y: -h / 2, w, h, r, role: "body" };
}

function drawBed(w: number, h: number): FurnitureShape[] {
  const pillow = band(PILLOW_M, h);
  return [
    bodyRect(w, h, 0.06),
    { s: "rect", x: -w / 2, y: -h / 2, w, h: pillow, r: 0.04, role: "detail" },
    { s: "line", x1: -w / 2, y1: -h / 2 + h * 0.55, x2: w / 2, y2: -h / 2 + h * 0.55 },
  ] as FurnitureShape[];
}

function drawSofa(w: number, h: number, arms: "both" | "left" | "none"): FurnitureShape[] {
  const back = band(SOFA_BACK_M, h);
  const arm = band(SOFA_ARM_M, w);
  const out: FurnitureShape[] = [
    bodyRect(w, h, 0.06),
    { s: "rect", x: -w / 2, y: -h / 2, w, h: back, r: 0.04, role: "detail" },
  ];
  if (arms === "both" || arms === "left") {
    out.push({ s: "rect", x: -w / 2, y: -h / 2, w: arm, h, r: 0.04, role: "detail" });
  }
  if (arms === "both") {
    out.push({ s: "rect", x: w / 2 - arm, y: -h / 2, w: arm, h, r: 0.04, role: "detail" });
  }
  return out;
}

export const FURNITURE_KINDS: FurnitureKind[] = [
  {
    id: "sink",
    label: "Sink",
    group: "Fixtures",
    icon: Waves,
    size: { width: 0.8, height: 0.51 },
    scale: "uniform",
    footprint: "rect",
    draw: (w, h) => [
      bodyRect(w, h, 0.03),
      // Basin proportions off a standard vanity: 450 x 345 in an 800 x 510 top.
      {
        s: "rect",
        x: (-w * BASIN_W) / 2,
        y: (-h * BASIN_H) / 2 + h * 0.04,
        w: w * BASIN_W,
        h: h * BASIN_H,
        r: 0.05,
        role: "detail",
      },
      { s: "ellipse", x: 0, y: -h / 2 + h * 0.12, rx: TAP_R, ry: TAP_R, role: "detail" },
    ],
  },
  {
    id: "toilet",
    label: "Toilet",
    group: "Fixtures",
    icon: Toilet,
    size: { width: 0.35, height: 0.65 },
    scale: "uniform",
    footprint: "rect",
    draw: (w, h) => {
      const cistern = band(CISTERN_M, h);
      const bowlTop = -h / 2 + cistern;
      return [
        bodyRect(w, h, 0.05),
        { s: "rect", x: -w / 2, y: -h / 2, w, h: cistern, r: 0.03, role: "detail" },
        {
          s: "ellipse",
          x: 0,
          y: (bowlTop + h / 2) / 2,
          rx: w / 2 - band(RIM_M, w),
          ry: (h / 2 - bowlTop) / 2 - band(RIM_M, h),
          role: "detail",
        },
      ];
    },
  },
  {
    id: "bathtub",
    label: "Bathtub",
    group: "Fixtures",
    icon: Bath,
    size: { width: 1.7, height: 0.74 },
    scale: "uniform",
    footprint: "rect",
    draw: (w, h) => [
      bodyRect(w, h, 0.05),
      // The well inside its rim, and the drain a fixed 0.24 m off one end.
      {
        s: "rect",
        x: (-w * WELL_W) / 2,
        y: (-h * WELL_H) / 2,
        w: w * WELL_W,
        h: h * WELL_H,
        r: 0.08,
        role: "detail",
      },
      {
        s: "ellipse",
        x: 0,
        y: -h / 2 + Math.min(0.24, h / 3),
        rx: TAP_R,
        ry: TAP_R,
        role: "detail",
      },
    ],
  },
  {
    id: "bed-single",
    label: "Single bed",
    group: "Beds",
    icon: BedSingle,
    size: { width: 1.1, height: 2 },
    scale: "free",
    footprint: "rect",
    draw: drawBed,
  },
  {
    id: "bed-medium",
    label: "Small double bed",
    group: "Beds",
    icon: Bed,
    size: { width: 1.4, height: 2 },
    scale: "free",
    footprint: "rect",
    draw: drawBed,
  },
  {
    id: "bed-double",
    label: "Double bed",
    group: "Beds",
    icon: BedDouble,
    size: { width: 1.8, height: 2 },
    scale: "free",
    footprint: "rect",
    draw: drawBed,
  },
  {
    id: "sofa-straight",
    label: "Sofa",
    group: "Sofas",
    icon: Sofa,
    size: { width: 2.1, height: 0.9 },
    scale: "free",
    footprint: "rect",
    draw: (w, h) => drawSofa(w, h, "both"),
  },
  {
    id: "sofa-corner",
    label: "Sofa corner",
    group: "Sofas",
    icon: Sofa,
    size: { width: 0.9, height: 0.9 },
    scale: "free",
    footprint: "rect",
    draw: (w, h) => {
      const back = band(SOFA_BACK_M, Math.min(w, h));
      return [
        bodyRect(w, h, 0.06),
        { s: "rect", x: -w / 2, y: -h / 2, w, h: back, r: 0.04, role: "detail" },
        { s: "rect", x: -w / 2, y: -h / 2, w: back, h, r: 0.04, role: "detail" },
      ];
    },
  },
  {
    id: "sofa-center",
    label: "Sofa center",
    group: "Sofas",
    icon: Sofa,
    size: { width: 1, height: 0.9 },
    scale: "free",
    footprint: "rect",
    draw: (w, h) => drawSofa(w, h, "none"),
  },
  {
    id: "sofa-side",
    label: "Sofa side",
    group: "Sofas",
    icon: Sofa,
    size: { width: 0.9, height: 0.9 },
    scale: "free",
    footprint: "rect",
    draw: (w, h) => drawSofa(w, h, "left"),
  },
  {
    id: "armchair",
    label: "Armchair",
    group: "Sofas",
    icon: Armchair,
    size: { width: 0.85, height: 0.85 },
    scale: "uniform",
    footprint: "rect",
    draw: (w, h) => drawSofa(w, h, "both"),
  },
  {
    id: "box",
    label: "Box",
    group: "Shapes",
    icon: Square,
    size: { width: 1, height: 0.6 },
    scale: "free",
    footprint: "rect",
    draw: (w, h) => [bodyRect(w, h, 0.02)],
  },
  {
    id: "ellipse",
    label: "Ellipse",
    group: "Shapes",
    icon: Circle,
    size: { width: 0.9, height: 0.9 },
    scale: "free",
    footprint: "ellipse",
    draw: (w, h) => [{ s: "ellipse", x: 0, y: 0, rx: w / 2, ry: h / 2, role: "body" }],
  },
];

const BY_ID = new Map(FURNITURE_KINDS.map((k) => [k.id, k]));

export function furnitureKind(id: string): FurnitureKind | null {
  return BY_ID.get(id) ?? null;
}

/** The kinds grouped in catalogue order, for the drawer. */
export function furnitureGroups(): { group: FurnitureKind["group"]; kinds: FurnitureKind[] }[] {
  const out: { group: FurnitureKind["group"]; kinds: FurnitureKind[] }[] = [];
  for (const kind of FURNITURE_KINDS) {
    const last = out.at(-1);
    if (last && last.group === kind.group) last.kinds.push(kind);
    else out.push({ group: kind.group, kinds: [kind] });
  }
  return out;
}

/** A new piece of `kind`, at true size, centred on `at`. */
export function defaultFurniture(kindId: string, at: Point, id: string): FloorplanFurnitureData {
  const kind = furnitureKind(kindId);
  const size = kind?.size ?? { width: 1, height: 1 };
  return {
    id,
    kind: kindId,
    x: at.x,
    y: at.y,
    width: size.width,
    height: size.height,
    rotation: 0,
    occluder: false,
  };
}

/**
 * The size a piece takes when dragged to `w` × `h` along `axis`, honouring its
 * scale mode and the floor. A uniform kind keeps its ratio from whichever axis
 * moved furthest, so a corner drag never squashes it.
 */
export function resizeFurniture(
  kind: FurnitureKind,
  piece: { width: number; height: number },
  w: number,
  h: number,
  axis: ScaleAxis,
  step = 0,
): { width: number; height: number } {
  // Snapping lands the size on the grid step, so a piece resizes to round
  // dimensions whichever way it is turned.
  const snap = (v: number) => (step > 0 ? Math.round(v / step) * step : v);
  const floor = (v: number) => Math.max(MIN_FURNITURE_M, snap(v));
  if (kind.scale === "uniform") {
    const ratio = piece.height === 0 ? 1 : piece.width / piece.height;
    const byWidth = Math.abs(w - piece.width) >= Math.abs(h - piece.height);
    const width = floor(byWidth ? w : h * ratio);
    return { width, height: floor(width / (ratio === 0 ? 1 : ratio)) };
  }
  return {
    width: floor(axis === "y" ? piece.width : w),
    height: floor(axis === "x" ? piece.height : h),
  };
}

function rotatePoint(p: Point, deg: number): Point {
  const rad = (deg * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  return { x: p.x * cos - p.y * sin, y: p.x * sin + p.y * cos };
}

/** The piece's footprint corners in world space, rotation applied. */
export function furnitureCorners(piece: FloorplanFurnitureData): Point[] {
  const hw = piece.width / 2;
  const hh = piece.height / 2;
  return (
    [
      { x: -hw, y: -hh },
      { x: hw, y: -hh },
      { x: hw, y: hh },
      { x: -hw, y: hh },
    ] as Point[]
  ).map((c) => {
    const r = rotatePoint(c, piece.rotation);
    return { x: piece.x + r.x, y: piece.y + r.y };
  });
}

/** `p` in the piece's own unrotated frame, centred on it. */
export function toLocal(piece: FloorplanFurnitureData, p: Point): Point {
  return rotatePoint({ x: p.x - piece.x, y: p.y - piece.y }, -piece.rotation);
}

/**
 * Whether `p` is on the piece. Rotation is undone first, so a turned bed is not
 * grabbable from a corner of its bounding box that it does not cover.
 */
export function furnitureContainsPoint(piece: FloorplanFurnitureData, p: Point): boolean {
  const local = toLocal(piece, p);
  const hw = piece.width / 2;
  const hh = piece.height / 2;
  if (furnitureKind(piece.kind)?.footprint === "ellipse") {
    if (hw === 0 || hh === 0) return false;
    return (local.x / hw) ** 2 + (local.y / hh) ** 2 <= 1;
  }
  return Math.abs(local.x) <= hw && Math.abs(local.y) <= hh;
}

/** The shapes to draw for a piece, already sized. */
export function furnitureShapes(piece: FloorplanFurnitureData): FurnitureShape[] {
  const kind = furnitureKind(piece.kind);
  if (!kind) return [bodyRect(piece.width, piece.height)];
  return kind.draw(piece.width, piece.height);
}

/** A handle on the scale gizmo: a corner, or the middle of one edge. */
export type ScaleHandle = "nw" | "ne" | "se" | "sw" | "n" | "e" | "s" | "w";

const HANDLE_LOCAL: Record<ScaleHandle, Point> = {
  nw: { x: -1, y: -1 },
  n: { x: 0, y: -1 },
  ne: { x: 1, y: -1 },
  e: { x: 1, y: 0 },
  se: { x: 1, y: 1 },
  s: { x: 0, y: 1 },
  sw: { x: -1, y: 1 },
  w: { x: -1, y: 0 },
};

const HANDLE_AXIS: Record<ScaleHandle, ScaleAxis> = {
  nw: "both",
  ne: "both",
  se: "both",
  sw: "both",
  n: "y",
  s: "y",
  e: "x",
  w: "x",
};

/** The handles a kind offers: corners only when its ratio is locked. */
export function scaleHandles(kind: FurnitureKind): ScaleHandle[] {
  const corners: ScaleHandle[] = ["nw", "ne", "se", "sw"];
  return kind.scale === "uniform" ? corners : [...corners, "n", "e", "s", "w"];
}

/** A handle's world position on the piece. */
export function scaleHandlePoint(piece: FloorplanFurnitureData, handle: ScaleHandle): Point {
  const local = HANDLE_LOCAL[handle];
  const p = rotatePoint(
    { x: (local.x * piece.width) / 2, y: (local.y * piece.height) / 2 },
    piece.rotation,
  );
  return { x: piece.x + p.x, y: piece.y + p.y };
}

/** Move a piece so its centre lands on `to`. */
export function moveFurniture(piece: FloorplanFurnitureData, to: Point): FloorplanFurnitureData {
  return { ...piece, x: to.x, y: to.y };
}

/** Rotation in degrees from a piece's centre toward `p`, snapped unless free. */
export function rotateFurnitureTo(
  piece: FloorplanFurnitureData,
  p: Point,
  snapDeg = 15,
): FloorplanFurnitureData {
  const raw = (Math.atan2(p.y - piece.y, p.x - piece.x) * 180) / Math.PI + 90;
  const snapped = snapDeg > 0 ? Math.round(raw / snapDeg) * snapDeg : raw;
  return { ...piece, rotation: ((snapped % 360) + 360) % 360 };
}

/**
 * Resize a piece from one handle toward `p`, keeping the opposite corner or
 * edge where it is — the piece grows away from the handle you hold, not from
 * its centre.
 */
export function resizeFromHandle(
  piece: FloorplanFurnitureData,
  handle: ScaleHandle,
  p: Point,
  step = 0,
): FloorplanFurnitureData {
  const kind = furnitureKind(piece.kind);
  if (!kind) return piece;
  const local = toLocal(piece, p);
  const dir = HANDLE_LOCAL[handle];
  const axis = HANDLE_AXIS[handle];
  const anchorLocal = { x: (-dir.x * piece.width) / 2, y: (-dir.y * piece.height) / 2 };
  const wanted = {
    width: dir.x === 0 ? piece.width : Math.abs(local.x - anchorLocal.x),
    height: dir.y === 0 ? piece.height : Math.abs(local.y - anchorLocal.y),
  };
  const size = resizeFurniture(kind, piece, wanted.width, wanted.height, axis, step);
  // The anchor stays put, so the centre shifts by half of what the size did.
  const shiftLocal = {
    x: (dir.x * (size.width - piece.width)) / 2,
    y: (dir.y * (size.height - piece.height)) / 2,
  };
  const shift = rotatePoint(shiftLocal, piece.rotation);
  return { ...piece, x: piece.x + shift.x, y: piece.y + shift.y, ...size };
}

/**
 * The placements standing inside an occluding piece. A lamp there produces no
 * light at all — its cell is solid, so the field starts blocked — which is why
 * the map keeps lights out of one rather than letting them vanish.
 */
export function placementsInsideFurniture<T extends Point>(
  piece: FloorplanFurnitureData,
  placements: T[],
): T[] {
  if (!piece.occluder) return [];
  return placements.filter((p) => furnitureContainsPoint(piece, p));
}

/** The nearest point outside a piece, for settling a marker that landed on one. */
export function nearestPointOutside(piece: FloorplanFurnitureData, p: Point): Point {
  if (!furnitureContainsPoint(piece, p)) return p;
  const local = toLocal(piece, p);
  const hw = piece.width / 2;
  const hh = piece.height / 2;
  const margin = 0.05;
  // Leave by whichever edge is closest, so a marker slides out the short way.
  const out = [
    { d: hw - local.x, v: { x: hw + margin, y: local.y } },
    { d: hw + local.x, v: { x: -hw - margin, y: local.y } },
    { d: hh - local.y, v: { x: local.x, y: hh + margin } },
    { d: hh + local.y, v: { x: local.x, y: -hh - margin } },
  ].reduce((a, b) => (b.d < a.d ? b : a));
  const world = rotatePoint(out.v, piece.rotation);
  return { x: piece.x + world.x, y: piece.y + world.y };
}

/** How square a wall must be to snap against, in meters over its length. */
const AXIS_EPSILON = 1e-6;

/**
 * Slide a piece flush against any wall face within `reach`.
 *
 * Snapping the centre to the grid can never put a piece against a wall: flush
 * asks for `face ∓ half the piece`, which lands on a grid step only when the
 * size happens to suit it. Snapping the piece's own edges instead makes flush
 * reachable at any size, rotation or wall thickness — and leaves the grid to
 * position everything else.
 */
export function snapFurnitureToWalls(
  piece: FloorplanFurnitureData,
  graph: PlanGraph,
  reach: number,
): Point {
  if (reach <= 0) return { x: piece.x, y: piece.y };
  const corners = furnitureCorners(piece);
  const minX = Math.min(...corners.map((c) => c.x));
  const maxX = Math.max(...corners.map((c) => c.x));
  const minY = Math.min(...corners.map((c) => c.y));
  const maxY = Math.max(...corners.map((c) => c.y));

  let bestX: number | null = null;
  let bestY: number | null = null;
  const consider = (delta: number, axis: "x" | "y") => {
    if (Math.abs(delta) > reach) return;
    if (axis === "x") {
      if (bestX === null || Math.abs(delta) < Math.abs(bestX)) bestX = delta;
    } else if (bestY === null || Math.abs(delta) < Math.abs(bestY)) {
      bestY = delta;
    }
  };

  const verts = vertexMap(graph.vertices);
  for (const wall of graph.walls) {
    const points = flattenWall(wall, verts);
    const half = wall.thickness / 2;
    for (let i = 1; i < points.length; i++) {
      const a = points[i - 1];
      const b = points[i];
      // Only square walls offer a clean face to sit against; a diagonal one
      // would need the piece turned to match, which is the user's business.
      if (Math.abs(a.x - b.x) < AXIS_EPSILON) {
        const spanY = [Math.min(a.y, b.y), Math.max(a.y, b.y)];
        if (maxY < spanY[0] - reach || minY > spanY[1] + reach) continue;
        for (const face of [a.x - half, a.x + half]) {
          consider(face - maxX, "x");
          consider(face - minX, "x");
        }
      } else if (Math.abs(a.y - b.y) < AXIS_EPSILON) {
        const spanX = [Math.min(a.x, b.x), Math.max(a.x, b.x)];
        if (maxX < spanX[0] - reach || minX > spanX[1] + reach) continue;
        for (const face of [a.y - half, a.y + half]) {
          consider(face - maxY, "y");
          consider(face - minY, "y");
        }
      }
    }
  }
  return { x: piece.x + (bestX ?? 0), y: piece.y + (bestY ?? 0) };
}
