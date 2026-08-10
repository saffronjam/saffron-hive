/** A fixed-position panel's top-left corner in viewport px. */
export interface PanelPos {
  x: number;
  y: number;
}

/** The panel's dimensions and bounds used to place and clamp it. */
export interface PanelPlaceBounds {
  /** Panel width in px. */
  panelWidth: number;
  /** Panel height in px — measured, or a fallback estimate before mount. */
  panelHeight: number;
  /**
   * Left bound the panel should stay right of, typically the host editor's
   * left edge. Omit to fall back to the viewport margin.
   */
  minX?: number;
  /** Gap in px between the anchor rect and the panel. Default 8. */
  gap?: number;
}

/** Clamp a panel position so the panel stays inside the viewport and bounds. */
export function clampPanelPos(x: number, y: number, bounds: PanelPlaceBounds): PanelPos {
  const minX = bounds.minX ?? 8;
  const maxX = window.innerWidth - bounds.panelWidth - 8;
  const minY = 8;
  const maxY = window.innerHeight - bounds.panelHeight - 8;
  return {
    x: Math.max(minX, Math.min(maxX, x)),
    y: Math.max(minY, Math.min(Math.max(maxY, minY), y)),
  };
}

/**
 * Place a floating panel beside an anchor rect: to its right when the panel
 * fits inside the viewport, otherwise to its left, falling back to the right
 * again when the left slot would cross `minX`. The result is clamped via
 * {@link clampPanelPos}, top-aligned with the anchor.
 */
export function placeBesideRect(rect: DOMRect, bounds: PanelPlaceBounds): PanelPos {
  const gap = bounds.gap ?? 8;
  const leftBound = bounds.minX ?? 0;
  const fitsRight = rect.right + gap + bounds.panelWidth + 8 <= window.innerWidth;
  const desiredX = fitsRight ? rect.right + gap : rect.left - gap - bounds.panelWidth;
  const x = desiredX < leftBound ? rect.right + gap : desiredX;
  return clampPanelPos(x, rect.top, bounds);
}
