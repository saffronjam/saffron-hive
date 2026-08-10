/**
 * Drop focus from a control activated with the pointer, so the browser's
 * focus ring does not linger on it after a click.
 *
 * Toolbar buttons that stay armed show that themselves — the map's brush
 * swatches and tool buttons switch to the `secondary` variant — so a ring on
 * top of that reads as a second, conflicting selection. Keyboard activation
 * keeps its focus: `detail` is 0 for a click synthesised by Enter or Space and
 * positive for a real pointer click, which is the only thing this blurs.
 */
export function dropPointerFocus(e: MouseEvent): void {
  if (e.detail === 0) return;
  const target = e.currentTarget;
  if (target instanceof HTMLElement) target.blur();
}
