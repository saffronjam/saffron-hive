import { brightnessToTintStrength, resolveTintRgb, type RGB } from "$lib/device-tint";
import type { Point } from "./types";

/** Opacity of the per-face dark overlay when none of the room's lights are lit. */
export const AMBIENT_UNLIT_OPACITY = 0.35;

/** Glow radius in meters for a light at full brightness. */
export const GLOW_BASE_RADIUS_M = 1.6;

export interface GlowStop {
  offset: number;
  color: string;
  opacity: number;
}

interface GlowStateInput {
  on?: boolean | null;
  color?: { r: number; g: number; b: number } | null;
  colorTemp?: number | null;
  brightness?: number | null;
}

function css(c: RGB): string {
  return `rgb(${c.r}, ${c.g}, ${c.b})`;
}

function towardWhite(c: RGB, t: number): RGB {
  return {
    r: Math.round(c.r + (255 - c.r) * t),
    g: Math.round(c.g + (255 - c.g) * t),
    b: Math.round(c.b + (255 - c.b) * t),
  };
}

/**
 * The hue a light's glow should carry, resolved from the color channels
 * regardless of on/off — the circle's opacity, not its color, encodes off,
 * so the gradient keeps its hue while a fade-out runs. Null only when the
 * device reports no state at all.
 */
export function glowRgbForState(
  state: GlowStateInput | null | undefined,
  type = "light",
): RGB | null {
  if (!state) return null;
  return resolveTintRgb({
    type,
    on: true,
    color: state.color,
    colorTemp: state.colorTemp,
    brightness: state.brightness,
  });
}

/**
 * Radial-gradient stops for a glow disc: a near-white core (real emitters
 * clip to white at the source) and colored falloff with alpha ≈ (1-t)² —
 * an eased multi-stop ramp; a two-stop linear ramp reads as a flat disc
 * and is the main banding source.
 */
export function glowStops(rgb: RGB): GlowStop[] {
  const body = css(rgb);
  return [
    { offset: 0, color: css(towardWhite(rgb, 0.6)), opacity: 0.9 },
    { offset: 0.15, color: body, opacity: 0.72 },
    { offset: 0.3, color: body, opacity: 0.49 },
    { offset: 0.55, color: body, opacity: 0.2 },
    { offset: 0.8, color: body, opacity: 0.04 },
    { offset: 1, color: body, opacity: 0 },
  ];
}

/**
 * Glow radius in meters. Brightness shrinks the pool mildly — dimming is
 * mostly conveyed by opacity (`brightnessToTintStrength`), with radius as a
 * secondary cue. Missing brightness means an on/off light at full reach.
 */
export function glowRadius(brightness: number | null | undefined): number {
  if (brightness == null) return GLOW_BASE_RADIUS_M;
  const t = Math.min(1, Math.max(0, brightness / 254));
  return GLOW_BASE_RADIUS_M * (0.75 + 0.25 * t);
}

/**
 * The members a group marker's glow stands for: everything the group resolves
 * to, minus the devices carrying a marker of their own, deduped. A device
 * reachable through the group and placed directly glows once, at its own
 * marker — the group pool never doubles up on it.
 */
export function groupGlowDeviceIds(
  memberIds: readonly string[],
  placedDeviceIds: ReadonlySet<string>,
): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const id of memberIds) {
    if (placedDeviceIds.has(id) || seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }
  return out;
}

interface GlowMemberInput extends GlowStateInput {
  on?: boolean | null;
}

/**
 * One glow disc standing for several lights. The hue is the members' mean so a
 * mixed-colour group reads as a blend, while radius and opacity follow the
 * brightest member — a single bright light in a group pools like one light,
 * rather than being averaged into dimness. Null when no member reports state.
 */
export function aggregateGlow(
  members: GlowMemberInput[],
): { rgb: RGB; radius: number; opacity: number } | null {
  let count = 0;
  let r = 0;
  let g = 0;
  let b = 0;
  let radius = 0;
  let opacity = 0;
  for (const m of members) {
    const rgb = glowRgbForState(m);
    if (!rgb) continue;
    count++;
    r += rgb.r;
    g += rgb.g;
    b += rgb.b;
    radius = Math.max(radius, glowRadius(m.brightness));
    if (m.on) opacity = Math.max(opacity, brightnessToTintStrength(m.brightness));
  }
  if (count === 0) return null;
  return {
    rgb: { r: Math.round(r / count), g: Math.round(g / count), b: Math.round(b / count) },
    radius,
    opacity,
  };
}

/** One glow the map draws: a disc of light at a point, in world meters. */
export interface GlowView {
  id: string;
  x: number;
  y: number;
  rgb: RGB;
  radius: number;
  opacity: number;
}

/** A room's ambient overlay: its outline and how far to darken it. */
export interface GlowGroup {
  key: string;
  polygon: Point[];
  /**
   * How far to darken the room, from 0 for fully lit to
   * {@link AMBIENT_UNLIT_OPACITY} for a dark one. Lamps and daylight both lift it.
   */
  dim: number;
}

/**
 * The lights one marker stands for, already narrowed to the ones the map glows
 * for — whether a device counts as a light is the caller's policy, not the
 * glow's.
 */
export interface GlowSource {
  /** Stable key of the marker, which becomes the gradient's id. */
  key: string;
  x: number;
  y: number;
  lights: { id: string; state?: GlowStateInput | null }[];
  /** A group pools its members; a single device glows on its own terms. */
  pooled: boolean;
}

/**
 * The glow a marker casts, or null when it has nothing to cast. A group pools
 * only the members that carry no marker of their own, so a device reachable
 * both ways glows exactly once.
 */
export function markerGlow(source: GlowSource, placedDeviceIds: Set<string>): GlowView | null {
  const at = { id: source.key, x: source.x, y: source.y };
  if (!source.pooled) {
    const light = source.lights[0];
    const rgb = light ? glowRgbForState(light.state) : null;
    if (!light || !rgb) return null;
    return {
      ...at,
      rgb,
      radius: glowRadius(light.state?.brightness),
      opacity: light.state?.on ? brightnessToTintStrength(light.state?.brightness) : 0,
    };
  }
  const byId = new Map(source.lights.map((l) => [l.id, l]));
  const pooled = groupGlowDeviceIds(
    source.lights.map((l) => l.id),
    placedDeviceIds,
  ).map((id) => byId.get(id)!);
  const aggregated = aggregateGlow(
    pooled.map((l) => ({
      on: l.state?.on,
      color: l.state?.color,
      colorTemp: l.state?.colorTemp,
      brightness: l.state?.brightness,
    })),
  );
  return aggregated ? { ...at, ...aggregated } : null;
}
