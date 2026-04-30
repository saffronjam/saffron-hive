/**
 * Trailing-edge throttle. Each `Throttle` instance tracks one logical channel —
 * one for brightness, one for colour, one for colourTemp, and so on — so a
 * fast-firing colour drag doesn't starve a brightness drag and vice versa.
 *
 * The first call within a window fires immediately; subsequent calls schedule
 * a single trailing fire at the end of the window using the latest payload.
 * Use {@link flushThrottle} from drag-release / commit-on-blur paths to cancel
 * a pending trailing fire and replace it with an immediate one — otherwise the
 * device ends up at the second-to-last sampled value.
 */
export interface Throttle {
  lastSent: number;
  trailing: ReturnType<typeof setTimeout> | null;
}

export const DEFAULT_THROTTLE_MS = 250;

export function throttle(t: Throttle, fire: () => void, ms: number = DEFAULT_THROTTLE_MS): void {
  const now = Date.now();
  const elapsed = now - t.lastSent;
  if (t.trailing) {
    clearTimeout(t.trailing);
    t.trailing = null;
  }
  if (elapsed >= ms) {
    t.lastSent = now;
    fire();
  } else {
    t.trailing = setTimeout(() => {
      t.trailing = null;
      t.lastSent = Date.now();
      fire();
    }, ms - elapsed);
  }
}

/**
 * Cancel any pending trailing fire on the throttle. Pair with an immediate
 * commit-now call from the caller for "send the final value on release".
 */
export function flushThrottle(t: Throttle): void {
  if (t.trailing) {
    clearTimeout(t.trailing);
    t.trailing = null;
  }
  t.lastSent = Date.now();
}
