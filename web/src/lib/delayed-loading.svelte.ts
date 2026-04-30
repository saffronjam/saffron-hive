/**
 * Reactive helper that returns a `visible` flag which only becomes `true`
 * once the source loading state has been continuously truthy for `delayMs`.
 * If loading flips back to false before the timeout, the indicator never
 * shows. Use to avoid a "Loading…" flash on routes where data normally
 * arrives well within the delay.
 *
 * Must be called during component initialization (it registers an `$effect`).
 */
export function delayedLoading(getLoading: () => boolean, delayMs = 250) {
  let visible = $state(false);
  let timer: ReturnType<typeof setTimeout> | null = null;

  $effect(() => {
    const loading = getLoading();
    if (!loading) {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      visible = false;
      return;
    }
    if (timer || visible) return;
    timer = setTimeout(() => {
      visible = true;
      timer = null;
    }, delayMs);
    return () => {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
    };
  });

  return {
    get visible() {
      return visible;
    },
  };
}
