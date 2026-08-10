import type { Action } from "svelte/action";

/** Callbacks fired by the hold-drag state machine. */
export interface HoldDragCallbacks {
  /** The drag engaged. Receives the initiating pointerdown event. */
  onstart: (e: PointerEvent) => void;
  /** Pointer moved while the drag is engaged. */
  onmove: (e: PointerEvent) => void;
  /** Pointer released while the drag is engaged. */
  onend: (e: PointerEvent) => void;
  /** An engaged drag was aborted by the browser (pointercancel). */
  oncancel?: () => void;
}

export interface HoldDragOptions extends HoldDragCallbacks {
  /** Touch / pen: press duration in ms before the drag engages. Default 250. */
  holdMs?: number;
  /**
   * Movement budget in px. Touch / pen movement past it before the hold
   * elapses cancels the press (so it can resolve as a tap or a scroll);
   * mouse movement past it engages a `mouseImmediate` drag. Default 8.
   */
  tolerancePx?: number;
  /** When true, all pointer input is ignored. */
  disabled?: boolean;
  /**
   * Engage mouse drags on movement past `tolerancePx` with no hold delay —
   * the desktop click-and-drag convention. Without it mouse input is
   * ignored entirely.
   */
  mouseImmediate?: boolean;
}

/** Lifecycle of a tracked pointer. */
export type HoldDragState = "idle" | "pending" | "dragging";

/**
 * The hold-drag pointer state machine, detached from any element. Feed it
 * pointer events from wherever they are captured; it filters by pointer id
 * and drives the {@link HoldDragCallbacks}. Touch and pen pointers engage
 * after an uninterrupted `holdMs` press (with a `navigator.vibrate(15)`
 * pulse); mouse pointers engage on movement past `tolerancePx` when
 * `mouseImmediate` is set. A press that never engages fires no callback, so
 * taps and clicks fall through to the host's own handlers.
 */
export interface HoldDragMachine {
  pointerdown(e: PointerEvent): void;
  pointermove(e: PointerEvent): void;
  pointerup(e: PointerEvent): void;
  pointercancel(e: PointerEvent): void;
  /** Current lifecycle state of the tracked pointer. */
  readonly state: HoldDragState;
  /** Replace the options (callbacks included) in place. */
  update(opts: HoldDragOptions): void;
  /** Abort silently: clear the hold timer and forget the tracked pointer. */
  reset(): void;
}

/** Create a {@link HoldDragMachine}. */
export function createHoldDrag(initial: HoldDragOptions): HoldDragMachine {
  let opts = initial;
  let state: HoldDragState = "idle";
  let pointerId = -1;
  let pointerType = "";
  let startX = 0;
  let startY = 0;
  let downEvent: PointerEvent | null = null;
  let holdTimer: ReturnType<typeof setTimeout> | null = null;

  function clearTimer() {
    if (holdTimer) {
      clearTimeout(holdTimer);
      holdTimer = null;
    }
  }

  function reset() {
    clearTimer();
    state = "idle";
    pointerId = -1;
    downEvent = null;
  }

  function isDragging(): boolean {
    return state === "dragging";
  }

  function engage() {
    const e = downEvent;
    if (!e) return;
    state = "dragging";
    opts.onstart(e);
    if (isDragging() && pointerType !== "mouse") {
      try {
        navigator.vibrate?.(15);
      } catch {
        // navigator.vibrate is unsupported on some platforms (iOS Safari)
      }
    }
  }

  function pointerdown(e: PointerEvent) {
    if (opts.disabled || state !== "idle" || e.button !== 0) return;
    const type = e.pointerType || "mouse";
    if (type === "mouse" && !opts.mouseImmediate) return;
    state = "pending";
    pointerId = e.pointerId;
    pointerType = type;
    startX = e.clientX;
    startY = e.clientY;
    downEvent = e;
    if (type !== "mouse") {
      holdTimer = setTimeout(() => {
        holdTimer = null;
        engage();
      }, opts.holdMs ?? 250);
    }
  }

  function pointermove(e: PointerEvent) {
    if (state === "idle" || e.pointerId !== pointerId) return;
    if (state === "pending") {
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      const tolerance = opts.tolerancePx ?? 8;
      if (dx * dx + dy * dy <= tolerance * tolerance) return;
      if (pointerType !== "mouse") {
        reset();
        return;
      }
      engage();
      if (!isDragging()) return;
    }
    e.preventDefault();
    opts.onmove(e);
  }

  function pointerup(e: PointerEvent) {
    if (state === "idle" || e.pointerId !== pointerId) return;
    const wasDragging = state === "dragging";
    reset();
    if (wasDragging) opts.onend(e);
  }

  function pointercancel(e: PointerEvent) {
    if (state === "idle" || e.pointerId !== pointerId) return;
    const wasDragging = state === "dragging";
    reset();
    if (wasDragging) opts.oncancel?.();
  }

  return {
    pointerdown,
    pointermove,
    pointerup,
    pointercancel,
    get state() {
      return state;
    },
    update(next: HoldDragOptions) {
      opts = next;
    },
    reset,
  };
}

/**
 * Hold-to-drag as a Svelte action. Listens for pointerdown on the node and
 * drives a {@link HoldDragMachine} from window-level move/up/cancel
 * listeners, so an engaged drag keeps tracking outside the node. The pointer
 * is captured on the node while the drag is engaged; a press that never
 * engages leaves clicks and scrolling untouched.
 */
export const holdDrag: Action<HTMLElement | SVGElement, HoldDragOptions> = (node, opts) => {
  let current = opts;
  let captured = -1;

  function release() {
    if (captured < 0) return;
    try {
      node.releasePointerCapture(captured);
    } catch {
      // capture may already be gone after pointerup
    }
    captured = -1;
  }

  const machine = createHoldDrag({
    get holdMs() {
      return current.holdMs;
    },
    get tolerancePx() {
      return current.tolerancePx;
    },
    get disabled() {
      return current.disabled;
    },
    get mouseImmediate() {
      return current.mouseImmediate;
    },
    onstart(e) {
      captured = e.pointerId;
      try {
        node.setPointerCapture(e.pointerId);
      } catch {
        captured = -1;
      }
      current.onstart(e);
    },
    onmove(e) {
      current.onmove(e);
    },
    onend(e) {
      release();
      current.onend(e);
    },
    oncancel() {
      release();
      current.oncancel?.();
    },
  });

  function onPointerDown(e: PointerEvent) {
    machine.pointerdown(e);
  }
  function onPointerMove(e: PointerEvent) {
    machine.pointermove(e);
  }
  function onPointerUp(e: PointerEvent) {
    machine.pointerup(e);
  }
  function onPointerCancel(e: PointerEvent) {
    machine.pointercancel(e);
  }

  node.addEventListener("pointerdown", onPointerDown as EventListener);
  window.addEventListener("pointermove", onPointerMove, { passive: false });
  window.addEventListener("pointerup", onPointerUp);
  window.addEventListener("pointercancel", onPointerCancel);

  return {
    update(next: HoldDragOptions) {
      current = next;
    },
    destroy() {
      machine.reset();
      release();
      node.removeEventListener("pointerdown", onPointerDown as EventListener);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerCancel);
    },
  };
};
