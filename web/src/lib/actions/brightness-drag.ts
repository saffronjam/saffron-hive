import type { Action } from "svelte/action";

export interface BrightnessDragOpts {
  /** Current brightness, read fresh on each pointerdown to seed the drag. */
  initial: () => number;
  /** Live preview during drag; not committed to the device yet. */
  onpreview: (v: number) => void;
  /** Final commit on pointer release. Only fires when a drag actually happened. */
  oncommit: (v: number) => void;
  /** Minimum px of horizontal movement before a press becomes a drag. */
  threshold?: number;
  /** Brightness clamp range. */
  range?: [number, number];
  /** Gate; when false, the action ignores all pointer events. */
  enabled?: () => boolean;
}

/**
 * Press-then-drag horizontal brightness control. A short press without
 * horizontal motion past `threshold` falls through as a normal click — the
 * host element's existing click handler runs unchanged. Once horizontal
 * motion crosses the threshold the action enters drag mode, captures the
 * pointer, emits `onpreview` continuously, and on release emits `oncommit`
 * while suppressing the synthetic click so the host's click handler does
 * not fire as well.
 */
export const brightnessDrag: Action<HTMLElement, BrightnessDragOpts> = (node, opts) => {
  let current = opts;

  let pointerId: number | null = null;
  let startX = 0;
  let startBrightness = 0;
  let elementWidth = 0;
  let lastValue = 0;
  let dragging = false;
  let didDrag = false;

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

  function onPointerDown(e: PointerEvent) {
    if (current.enabled && !current.enabled()) return;
    if (e.button !== 0) return;
    pointerId = e.pointerId;
    startX = e.clientX;
    startBrightness = current.initial();
    elementWidth = node.getBoundingClientRect().width;
    lastValue = startBrightness;
    dragging = false;
    didDrag = false;
  }

  function onPointerMove(e: PointerEvent) {
    if (pointerId == null || e.pointerId !== pointerId) return;
    const deltaX = e.clientX - startX;
    if (!dragging) {
      const threshold = current.threshold ?? 6;
      if (Math.abs(deltaX) < threshold) return;
      dragging = true;
      didDrag = true;
      try {
        node.setPointerCapture(pointerId);
      } catch {
        // pointer capture is best-effort
      }
    }
    const v = compute(deltaX);
    lastValue = v;
    current.onpreview(Math.round(v));
  }

  function onPointerUp(e: PointerEvent) {
    if (pointerId == null || e.pointerId !== pointerId) return;
    const wasDragging = dragging;
    const dragOccurred = didDrag;
    pointerId = null;
    dragging = false;
    if (wasDragging) {
      try {
        node.releasePointerCapture(e.pointerId);
      } catch {
        // best-effort
      }
      current.oncommit(Math.round(lastValue));
    }
    if (dragOccurred) {
      // Suppress the synthetic click that follows a drag so the host's
      // onclick handler does not fire on top of our oncommit.
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
  }

  function onPointerCancel(e: PointerEvent) {
    if (pointerId == null || e.pointerId !== pointerId) return;
    pointerId = null;
    dragging = false;
    didDrag = false;
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
      node.removeEventListener("pointerdown", onPointerDown);
      node.removeEventListener("pointermove", onPointerMove);
      node.removeEventListener("pointerup", onPointerUp);
      node.removeEventListener("pointercancel", onPointerCancel);
    },
  };
};
