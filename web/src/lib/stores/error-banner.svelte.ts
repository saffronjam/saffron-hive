/**
 * ErrorBanner holds a transient error string used by edit pages' banner UI.
 * `setWithAutoDismiss` also schedules a clear after `dismissMs`; if a newer
 * error arrives before the timer fires, the timer is a no-op (guarded by
 * reference equality on `message`) so the new error isn't prematurely cleared.
 */
export class ErrorBanner {
  message = $state<string | null>(null);

  setWithAutoDismiss(msg: string, dismissMs = 5000) {
    this.message = msg;
    setTimeout(() => {
      if (this.message === msg) {
        this.message = null;
      }
    }, dismissMs);
  }

  clear() {
    this.message = null;
  }
}
