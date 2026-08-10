import type { Point } from "./types";

/** Brush cursor radius on screen; world size follows the zoom, so zoomed out
 * paints rooms and zoomed in paints single fixtures. */
export const BRUSH_RADIUS_PX = 48;

/** Bounds the brush radius can be resized between, in screen pixels. */
export const MIN_BRUSH_RADIUS_PX = 16;
export const MAX_BRUSH_RADIUS_PX = 200;

/** One notch of the wheel or the palette stepper, in screen pixels. */
export const BRUSH_RADIUS_STEP_PX = 8;

/** Move the brush radius by `steps` notches, staying inside the bounds. */
export function stepBrushRadius(px: number, steps: number): number {
  const next = px + steps * BRUSH_RADIUS_STEP_PX;
  return Math.min(MAX_BRUSH_RADIUS_PX, Math.max(MIN_BRUSH_RADIUS_PX, next));
}

/** Convert a screen-pixel radius to world meters at the given zoom scale
 * (screen pixels per world meter). */
export function screenRadiusToWorld(px: number, zoomScale: number): number {
  return px / zoomScale;
}

export interface BrushPlacement {
  /** `placementKey` of the marker — a group and a device are separate targets. */
  id: string;
  x: number;
  y: number;
}

/**
 * Placement keys whose markers fall inside the brush circle. The caller expands
 * them to device ids, so a group and one of its members caught by the same
 * stroke still command each device once.
 */
export function brushHits(
  placements: BrushPlacement[],
  center: Point,
  radiusWorld: number,
): string[] {
  const out: string[] = [];
  for (const p of placements) {
    if (Math.hypot(p.x - center.x, p.y - center.y) <= radiusWorld) out.push(p.id);
  }
  return out;
}

/**
 * Tracks one brush stroke: `add` dedupes against everything already painted
 * this stroke, `drainPending` hands out the batch for the next command fire
 * (each device receives at most one command per stroke), `reset` starts the
 * next stroke clean.
 */
export interface StrokeAccumulator {
  add(ids: string[]): void;
  drainPending(): string[];
  reset(): void;
  readonly pendingCount: number;
}

export function createStrokeAccumulator(): StrokeAccumulator {
  const painted = new Set<string>();
  let pending: string[] = [];

  return {
    add(ids: string[]) {
      for (const id of ids) {
        if (painted.has(id)) continue;
        painted.add(id);
        pending.push(id);
      }
    },
    drainPending() {
      const out = pending;
      pending = [];
      return out;
    },
    reset() {
      painted.clear();
      pending = [];
    },
    get pendingCount() {
      return pending.length;
    },
  };
}
