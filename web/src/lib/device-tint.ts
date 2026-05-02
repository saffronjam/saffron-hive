import type { Device, DeviceState } from "$lib/stores/devices";
import type { ActionPayload } from "$lib/scene-editable";
import { formatTemperature, type TemperatureUnit } from "$lib/sensor-format";
import { Droplets, Gauge, Sun, Thermometer } from "@lucide/svelte";
import type { Component } from "svelte";

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

/**
 * Default tint hue used for plug-style devices (no color, colorTemp, or
 * brightness state). Mirrors the warmest end of the colorTemp ramp, so a
 * plug renders the same as a warm-white light through the standard tint
 * pipeline.
 */
export const PLUG_TINT_COLOR = toCss(WARM);

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
 * Returns a 0..1 strength factor for a light at the given brightness, suitable
 * for driving the `--tint-strength` CSS variable. `null`/missing brightness
 * yields full strength (1). Uses a sqrt curve so low brightness still shows
 * a perceptible hue without making mid-brightness look flat.
 */
export function brightnessToTintStrength(brightness: number | null | undefined): number {
  if (brightness == null) return 1;
  const t = clamp01(brightness / BRIGHTNESS_MAX);
  return Math.sqrt(t);
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

/**
 * Returns a single `rgb(...)` string for the device's base tint hue, suitable
 * for driving a `--tint-color` custom property so CSS can interpolate between
 * values. Null when the device has no active tint (off / no state).
 */
export function deviceTintColor(device: Device): string | null {
  const state: DeviceState | null | undefined = device.state;
  if (!state?.on) return null;
  return toCss(
    resolveTintRgb({
      type: device.type,
      on: true,
      color: state.color,
      colorTemp: state.colorTemp,
      brightness: state.brightness,
    }),
  );
}

/**
 * Returns up to three `rgb(...)` strings representing the scene's desired
 * hues, for driving `--tint-color`, `--tint-color-2`, `--tint-color-3` custom
 * properties so CSS can interpolate between values. Empty when no payload is
 * switched on.
 */
export function sceneTintColors(payloads: ActionPayload[]): string[] {
  const nonSwitchColors: RGB[] = [];
  const switchColors: RGB[] = [];
  for (const payload of payloads) {
    if (payload.kind !== "static") continue;
    if (!payload.on) continue;
    const rgb = resolveTintRgb({
      on: true,
      color: payload.color,
      colorTemp: payload.colorTemp,
      brightness: payload.brightness,
    });
    const isSwitchOnly = !payload.color && payload.colorTemp == null && payload.brightness == null;
    if (isSwitchOnly) switchColors.push(rgb);
    else nonSwitchColors.push(rgb);
  }
  const picked = nonSwitchColors.length > 0 ? nonSwitchColors : switchColors;
  return dedupe(picked).slice(0, 3).map(toCss);
}

/**
 * Like {@link deviceTintColor} but ignores the device's on/off state, so
 * the returned colour is always the device's "natural" hue. Use when the
 * card keeps the tint class applied even while the device is off and
 * conveys on-state via `--tint-strength` instead — the gradient then
 * transitions smoothly to plain card colour as strength → 0.
 */
export function deviceTintBase(device: Device): string | null {
  const state: DeviceState | null | undefined = device.state;
  if (!state) return null;
  if (state.color == null && state.colorTemp == null && state.brightness == null) {
    return null;
  }
  return toCss(
    resolveTintRgb({
      type: device.type,
      on: true,
      color: state.color,
      colorTemp: state.colorTemp,
      brightness: state.brightness,
    }),
  );
}

/**
 * Like {@link groupTintColors} but ignores per-device on/off state. Use
 * for room/group cards that fade their gradient via `--tint-strength`
 * (driven by aggregate on-state) instead of dropping the tint class.
 */
export function groupBaseTintColors(devices: Device[]): string[] {
  const colors: RGB[] = [];
  for (const device of devices) {
    const state = device.state;
    if (!state) continue;
    if (state.color == null && state.colorTemp == null && state.brightness == null) continue;
    colors.push(
      resolveTintRgb({
        type: device.type,
        on: true,
        color: state.color,
        colorTemp: state.colorTemp,
        brightness: state.brightness,
      }),
    );
  }
  return dedupe(colors).slice(0, 3).map(toCss);
}

/**
 * Returns up to three `rgb(...)` strings aggregated from the current state of
 * a group's effective device list, mirroring {@link sceneTintColors} for live
 * device readings. Empty when no device is switched on.
 */
export function groupTintColors(devices: Device[]): string[] {
  const nonSwitchColors: RGB[] = [];
  const switchColors: RGB[] = [];
  for (const device of devices) {
    const state = device.state;
    if (!state?.on) continue;
    const rgb = resolveTintRgb({
      type: device.type,
      on: true,
      color: state.color,
      colorTemp: state.colorTemp,
      brightness: state.brightness,
    });
    const isSwitchOnly = !state.color && state.colorTemp == null && state.brightness == null;
    if (isSwitchOnly) switchColors.push(rgb);
    else nonSwitchColors.push(rgb);
  }
  const picked = nonSwitchColors.length > 0 ? nonSwitchColors : switchColors;
  return dedupe(picked).slice(0, 3).map(toCss);
}

function payloadTintRgb(
  payload: ActionPayload,
  device: Device | undefined,
): { rgb: RGB; isSwitchOnly: boolean; on: boolean } {
  if (payload.kind !== "static") {
    return { rgb: NEUTRAL, isSwitchOnly: false, on: false };
  }
  const rgb = resolveTintRgb({
    type: device?.type,
    on: payload.on,
    color: payload.color,
    colorTemp: payload.colorTemp,
    brightness: payload.brightness,
  });
  const isSwitchOnly = !payload.color && payload.colorTemp == null && payload.brightness == null;
  return { rgb, isSwitchOnly, on: payload.on === true };
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
    const { rgb, isSwitchOnly, on } = payloadTintRgb(payload, device);
    if (!on) continue;
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

export interface AggregatedReading {
  field: string;
  label: string;
  value: string;
  unit: string;
  icon: Component;
}

interface ReadingSpec {
  field: string;
  label: string;
  icon: Component;
  read: (state: DeviceState) => number | null | undefined;
  render: (avg: number, temperatureUnit: TemperatureUnit) => { value: string; unit: string };
}

const READING_SPECS: ReadingSpec[] = [
  {
    field: "temperature",
    label: "Temperature",
    icon: Thermometer,
    read: (s) => s.temperature,
    render: (n, unit) => formatTemperature(n, unit),
  },
  {
    field: "humidity",
    label: "Humidity",
    icon: Droplets,
    read: (s) => s.humidity,
    render: (n) => ({ value: n.toFixed(0), unit: "%" }),
  },
  {
    field: "pressure",
    label: "Pressure",
    icon: Gauge,
    read: (s) => s.pressure,
    render: (n) => ({ value: n.toFixed(0), unit: "hPa" }),
  },
  {
    field: "illuminance",
    label: "Illuminance",
    icon: Sun,
    read: (s) => s.illuminance,
    render: (n) => ({ value: n.toFixed(0), unit: "lx" }),
  },
];

/**
 * Aggregates sensor readings across a device list by averaging each
 * supported field over all devices that report it. Temperature is converted
 * into the caller's chosen unit (defaults to Celsius). Fields with no
 * contributing devices are omitted.
 */
export function aggregateSensorReadings(
  devices: Device[],
  temperatureUnit: TemperatureUnit = "celsius",
): AggregatedReading[] {
  const result: AggregatedReading[] = [];
  for (const spec of READING_SPECS) {
    let sum = 0;
    let count = 0;
    for (const device of devices) {
      if (!device.state) continue;
      const v = spec.read(device.state);
      if (v == null) continue;
      sum += v;
      count++;
    }
    if (count === 0) continue;
    const rendered = spec.render(sum / count, temperatureUnit);
    result.push({
      field: spec.field,
      label: spec.label,
      value: rendered.value,
      unit: rendered.unit,
      icon: spec.icon,
    });
  }
  return result;
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
    if (payload.kind !== "static") continue;
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
