/**
 * Suppresses prop-driven updates to an interactive control after the user
 * emits a change, until the incoming value confirms the change (matches what
 * was sent) or a safety timeout elapses.
 *
 * Solves the round-trip flicker on devices: the user picks a new value, the
 * mutation goes out, but the reported state lags behind by 100-500ms while
 * the command propagates through MQTT and the device confirms. Without a hold,
 * the control snaps back to the old value before the new one arrives.
 */

export interface ConfirmationHoldOptions<T> {
  matches: (incoming: T, pending: T) => boolean;
  /** Safety release if the device never confirms. Defaults to 3000ms. */
  timeoutMs?: number;
  /**
   * Schedule a timeout. Returns a cancel function. Override in tests with a
   * deterministic clock; defaults to setTimeout/clearTimeout.
   */
  schedule?: (cb: () => void, ms: number) => () => void;
}

export interface ConfirmationHold<T> {
  /** Mark `value` as pending; suppress prop syncs until confirmed or timed out. */
  hold(value: T): void;
  /**
   * Whether prop-driven updates should be suppressed for `incoming`. Returns
   * false (and clears the hold) once `incoming` matches the pending value.
   */
  shouldSuppress(incoming: T): boolean;
  /** Cancel an active hold immediately. */
  reset(): void;
  readonly active: boolean;
}

const defaultSchedule = (cb: () => void, ms: number): (() => void) => {
  const t = setTimeout(cb, ms);
  return () => clearTimeout(t);
};

export function createConfirmationHold<T>(opts: ConfirmationHoldOptions<T>): ConfirmationHold<T> {
  const matches = opts.matches;
  const timeoutMs = opts.timeoutMs ?? 3000;
  const schedule = opts.schedule ?? defaultSchedule;

  let pending: { value: T } | null = null;
  let cancelTimer: (() => void) | null = null;

  function release(): void {
    pending = null;
    if (cancelTimer) {
      cancelTimer();
      cancelTimer = null;
    }
  }

  return {
    hold(value: T) {
      pending = { value };
      if (cancelTimer) cancelTimer();
      cancelTimer = schedule(release, timeoutMs);
    },
    shouldSuppress(incoming: T): boolean {
      if (pending === null) return false;
      if (matches(incoming, pending.value)) {
        release();
        return false;
      }
      return true;
    },
    reset: release,
    get active() {
      return pending !== null;
    },
  };
}
