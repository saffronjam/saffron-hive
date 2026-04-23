import type { Device, DeviceState } from "$lib/stores/devices";
import type { ActionPayload } from "$lib/scene-editable";

interface RGB {
  r: number;
  g: number;
  b: number;
}

const WARM: RGB = { r: 255, g: 138, b: 54 };
const COOL: RGB = { r: 160, g: 200, b: 255 };
const CREAM: RGB = { r: 255, g: 230, b: 190 };
const DIM: RGB = { r: 80, g: 80, b: 80 };
const NEUTRAL: RGB = { r: 120, g: 120, b: 120 };

const MIRED_MIN = 150;
const MIRED_MAX = 500;
const BRIGHTNESS_MAX = 254;

function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n));
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function lerpRgb(a: RGB, b: RGB, t: number): RGB {
  return {
    r: Math.round(lerp(a.r, b.r, t)),
    g: Math.round(lerp(a.g, b.g, t)),
    b: Math.round(lerp(a.b, b.b, t)),
  };
}

function toCss(c: RGB): string {
  return `rgb(${c.r}, ${c.g}, ${c.b})`;
}

function miredToRgb(mired: number): RGB {
  const t = clamp01((mired - MIRED_MIN) / (MIRED_MAX - MIRED_MIN));
  return lerpRgb(COOL, WARM, t);
}

function brightnessToRgb(brightness: number): RGB {
  return lerpRgb(DIM, CREAM, clamp01(brightness / BRIGHTNESS_MAX));
}

interface TintInput {
  type?: string;
  on?: boolean | null;
  color?: { r: number; g: number; b: number } | null;
  colorTemp?: number | null;
  brightness?: number | null;
}

function resolveTintRgb(input: TintInput): RGB {
  if (!input.on) return NEUTRAL;
  if (input.color) return { r: input.color.r, g: input.color.g, b: input.color.b };
  if (input.colorTemp != null) return miredToRgb(input.colorTemp);
  if (input.brightness != null && input.type === "light") return brightnessToRgb(input.brightness);
  return CREAM;
}

/**
 * Returns a CSS `rgb(...)` string representing the device's current visual
 * tint, based on its live state. Colored lights → their color, colorTemp
 * lights → warm/cool interpolation, plain-brightness lights → dimmed cream,
 * plugs/switches when on → cream, anything else → neutral grey.
 */
export function deviceTint(device: Device): string {
  const state: DeviceState | null | undefined = device.state;
  return toCss(
    resolveTintRgb({
      type: device.type,
      on: state?.on,
      color: state?.color,
      colorTemp: state?.colorTemp,
      brightness: state?.brightness,
    }),
  );
}

/**
 * Wraps a CSS color in a `color-mix(...)` call that blends it with the card
 * background at a low ratio. Keeps tints readable in both light and dark
 * themes without hand-tuned per-theme variants.
 */
export function tintCardBg(color: string, mixPct = 12): string {
  return `color-mix(in srgb, ${color} ${mixPct}%, var(--card))`;
}

function payloadTintRgb(
  payload: ActionPayload,
  device: Device | undefined,
): { rgb: RGB; isSwitchOnly: boolean } {
  const rgb = resolveTintRgb({
    type: device?.type,
    on: payload.on,
    color: payload.color,
    colorTemp: payload.colorTemp,
    brightness: payload.brightness,
  });
  const isSwitchOnly = !payload.color && payload.colorTemp == null && payload.brightness == null;
  return { rgb, isSwitchOnly };
}

/**
 * Returns a CSS `linear-gradient(...)` string representing the scene's
 * desired colors across its devices. Colored/tempered/dimmable lights
 * contribute their hues; scenes made entirely of switch-style toggles fall
 * back to a cream gradient; scenes with no payloads fall back to neutral.
 */
export function sceneTint(
  payloads: Map<string, ActionPayload>,
  devicesById: Map<string, Device>,
): string {
  const nonSwitchColors: RGB[] = [];
  const switchColors: RGB[] = [];
  for (const [deviceId, payload] of payloads) {
    const device = devicesById.get(deviceId);
    const { rgb, isSwitchOnly } = payloadTintRgb(payload, device);
    if (!payload.on) continue;
    if (isSwitchOnly) switchColors.push(rgb);
    else nonSwitchColors.push(rgb);
  }
  const picked = nonSwitchColors.length > 0 ? nonSwitchColors : switchColors;
  if (picked.length === 0) return toCss(NEUTRAL);
  const unique = dedupe(picked).slice(0, 3);
  if (unique.length === 1)
    return `linear-gradient(135deg, ${toCss(unique[0])}, ${toCss(unique[0])})`;
  const stops = unique.map(toCss).join(", ");
  return `linear-gradient(135deg, ${stops})`;
}

function dedupe(colors: RGB[]): RGB[] {
  const seen = new Set<string>();
  const out: RGB[] = [];
  for (const c of colors) {
    const key = `${c.r},${c.g},${c.b}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(c);
  }
  return out;
}

/**
 * Scene tint derived purely from a list of `ActionPayload`s (no device
 * registry needed). Useful for scene cards/tables that only have stored
 * payloads available.
 */
export function sceneTintFromPayloads(payloads: ActionPayload[]): string {
  const nonSwitchColors: RGB[] = [];
  const switchColors: RGB[] = [];
  for (const payload of payloads) {
    if (!payload.on) continue;
    const rgb = resolveTintRgb({
      on: payload.on,
      color: payload.color,
      colorTemp: payload.colorTemp,
      brightness: payload.brightness,
    });
    const isSwitchOnly = !payload.color && payload.colorTemp == null && payload.brightness == null;
    if (isSwitchOnly) switchColors.push(rgb);
    else nonSwitchColors.push(rgb);
  }
  const picked = nonSwitchColors.length > 0 ? nonSwitchColors : switchColors;
  if (picked.length === 0) return toCss(NEUTRAL);
  const unique = dedupe(picked).slice(0, 3);
  if (unique.length === 1)
    return `linear-gradient(135deg, ${toCss(unique[0])}, ${toCss(unique[0])})`;
  const stops = unique.map(toCss).join(", ");
  return `linear-gradient(135deg, ${stops})`;
}
