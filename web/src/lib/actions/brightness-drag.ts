import type { Action } from "svelte/action";

export interface BrightnessDragOpts {
  /** Current brightness, read fresh on each pointerdown to seed the drag. */
  initial: () => number;
  /** Live preview during drag; not committed to the device yet. */
  onpreview: (v: number) => void;
  /** Final commit on pointer release. Only fires when a drag actually happened. */
  oncommit: (v: number) => void;
  /**
   * Touch / pen only: how long the user must press without significant
   * motion before the drag is armed. Default 200 ms. Mouse input ignores
   * this and engages on movement past `mouseThreshold`.
   */
  holdMs?: number;
  /**
   * Touch / pen only: pre-activation movement budget. Movement past this
   * cancels the hold timer so the press can resolve as a tap or a scroll.
   */
  moveTolerance?: number;
  /** Mouse only: minimum px of horizontal movement before drag engages. */
  mouseThreshold?: number;
  /** Brightness clamp range. */
  range?: [number, number];
  /** Gate; when false, the action ignores all pointer events. */
  enabled?: () => boolean;
}

/**
 * Horizontal brightness drag, with two engagement paths chosen by pointer
 * type at `pointerdown`. Mouse input drags immediately once horizontal
 * motion crosses `mouseThreshold` (default 6 px) — same feel as a regular
 * click-and-drag slider, with no hold delay. Touch and pen input require a
 * `holdMs`-long press (default 200 ms) without significant motion before
 * the drag is armed; on hold-activation a short `navigator.vibrate(15)`
 * haptic pulse fires. In both modes the host receives `data-dragging="true"`
 * for the duration of the active drag — CSS uses it to drop the
 * brightness-fill transition (so the fill pins to the cursor / finger) and
 * to scale the card up ~5 % in place via `transform`. A release before
 * activation falls through as a normal click.
 */
export const brightnessDrag: Action<HTMLElement, BrightnessDragOpts> = (node, opts) => {
  let current = opts;

  let pointerId: number | null = null;
  let pointerType: string = "mouse";
  let startX = 0;
  let startY = 0;
  let lastClientX = 0;
  let activationX = 0;
  let startBrightness = 0;
  let elementWidth = 0;
  let lastValue = 0;
  let activated = false;
  let cancelled = false;
  let holdTimer: ReturnType<typeof setTimeout> | null = null;

  function clamp(v: number): number {
    const [min, max] = current.range ?? [0, 254];
    return Math.max(min, Math.min(max, v));
  }

  function compute(deltaX: number): number {
    const [min, max] = current.range ?? [0, 254];
    const span = max - min;
    const delta = (deltaX / Math.max(elementWidth, 1)) * span;
    return clamp(startBrightness + delta);
  }

  function clearHoldTimer() {
    if (holdTimer) {
      clearTimeout(holdTimer);
      holdTimer = null;
    }
  }

  function engageDrag(armed: boolean) {
    if (pointerId == null) return;
    activated = true;
    activationX = lastClientX;
    elementWidth = node.getBoundingClientRect().width;
    startBrightness = current.initial();
    lastValue = startBrightness;
    node.setAttribute("data-dragging", "true");
    if (armed) {
      try {
        navigator.vibrate?.(15);
      } catch {
        // navigator.vibrate is unsupported on some platforms (iOS Safari)
      }
    }
    try {
      node.setPointerCapture(pointerId);
    } catch {
      // pointer capture is best-effort
    }
  }

  function activateFromHold() {
    holdTimer = null;
    if (cancelled) return;
    engageDrag(true);
  }

  function clearDragAttrs() {
    node.removeAttribute("data-dragging");
  }

  function onPointerDown(e: PointerEvent) {
    if (current.enabled && !current.enabled()) return;
    if (e.button !== 0) return;
    pointerId = e.pointerId;
    pointerType = e.pointerType || "mouse";
    startX = e.clientX;
    startY = e.clientY;
    lastClientX = e.clientX;
    activated = false;
    cancelled = false;
    clearHoldTimer();
    if (pointerType !== "mouse") {
      const holdMs = current.holdMs ?? 200;
      holdTimer = setTimeout(activateFromHold, holdMs);
    }
  }

  function onPointerMove(e: PointerEvent) {
    if (pointerId == null || e.pointerId !== pointerId) return;
    lastClientX = e.clientX;

    if (!activated) {
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      if (pointerType === "mouse") {
        const threshold = current.mouseThreshold ?? 6;
        if (Math.abs(dx) < threshold) return;
        engageDrag(false);
      } else {
        const tolerance = current.moveTolerance ?? 8;
        if (Math.abs(dx) > tolerance || Math.abs(dy) > tolerance) {
          cancelled = true;
          clearHoldTimer();
        }
        return;
      }
    }

    const deltaX = e.clientX - activationX;
    const v = compute(deltaX);
    lastValue = v;
    current.onpreview(Math.round(v));
  }

  function onPointerUp(e: PointerEvent) {
    if (pointerId == null || e.pointerId !== pointerId) return;
    const wasActivated = activated;
    clearHoldTimer();
    if (wasActivated) {
      clearDragAttrs();
      try {
        node.releasePointerCapture(e.pointerId);
      } catch {
        // best-effort
      }
      current.oncommit(Math.round(lastValue));
      const suppress = (ce: Event) => {
        ce.stopPropagation();
        ce.preventDefault();
        node.removeEventListener("click", suppress, true);
      };
      node.addEventListener("click", suppress, true);
      requestAnimationFrame(() => {
        node.removeEventListener("click", suppress, true);
      });
    }
    pointerId = null;
    activated = false;
    cancelled = false;
  }

  function onPointerCancel(e: PointerEvent) {
    if (pointerId == null || e.pointerId !== pointerId) return;
    if (activated) clearDragAttrs();
    clearHoldTimer();
    pointerId = null;
    activated = false;
    cancelled = false;
  }

  node.addEventListener("pointerdown", onPointerDown);
  node.addEventListener("pointermove", onPointerMove);
  node.addEventListener("pointerup", onPointerUp);
  node.addEventListener("pointercancel", onPointerCancel);

  return {
    update(next: BrightnessDragOpts) {
      current = next;
    },
    destroy() {
      clearHoldTimer();
      clearDragAttrs();
      node.removeEventListener("pointerdown", onPointerDown);
      node.removeEventListener("pointermove", onPointerMove);
      node.removeEventListener("pointerup", onPointerUp);
      node.removeEventListener("pointercancel", onPointerCancel);
    },
  };
};
