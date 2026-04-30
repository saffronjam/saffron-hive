/**
 * Module-level "any popover just dismissed" stamp. bits-ui Popover is
 * non-modal — when an outside click closes the popover, the same click also
 * bubbles to the underlying element. Cards that own a whole-card `onclick`
 * (and any sibling cards on the same surface) call
 * {@link popoverDismissedRecently} from their click handlers and short-circuit
 * if the user was actually dismissing a popover, not toggling the card.
 *
 * The popover's `onOpenChange` calls {@link markPopoverDismissed} on close;
 * because bits-ui invokes this synchronously inside the outside-click event,
 * the timestamp lands before the click bubbles to any sibling card handler.
 */
let lastDismissedAt = 0;

export const POPOVER_DISMISS_GUARD_MS = 250;

export function markPopoverDismissed(): void {
  lastDismissedAt = Date.now();
}

export function popoverDismissedRecently(ms: number = POPOVER_DISMISS_GUARD_MS): boolean {
  return Date.now() - lastDismissedAt < ms;
}
