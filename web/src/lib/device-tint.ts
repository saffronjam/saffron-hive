import { isLightControlDevice, type Device, type DeviceState } from "$lib/stores/devices";
import type { ActionPayload, StaticActionPayload } from "$lib/scene-editable";
import { formatTemperature, type TemperatureUnit } from "$lib/sensor-format";
import { Droplets, Gauge, Sun, Thermometer } from "@lucide/svelte";
import type { Component } from "svelte";

export interface RGB {
  r: number;
  g: number;
  b: number;
}

const WARM: RGB = { r: 255, g: 138, b: 54 };
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
export const APPLIANCE_TINT_COLOR = "rgb(96, 165, 250)";

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

function clamp255(n: number): number {
  return Math.round(Math.min(255, Math.max(0, n)));
}

/**
 * Approximate the RGB appearance of a black-body emitter at the given color
 * temperature (Tanner Helland's curve fit, valid ~1000–40000 K). This is the
 * one CT→RGB vocabulary shared by card tints and the map's light glow.
 */
export function kelvinToRgb(kelvin: number): RGB {
  const t = Math.min(400, Math.max(10, kelvin / 100));
  let r: number;
  let g: number;
  let b: number;
  if (t <= 66) {
    r = 255;
    g = 99.4708025861 * Math.log(t) - 161.1195681661;
    b = t <= 19 ? 0 : 138.5177312231 * Math.log(t - 10) - 305.0447927307;
  } else {
    r = 329.698727446 * Math.pow(t - 60, -0.1332047592);
    g = 288.1221695283 * Math.pow(t - 60, -0.0755148492);
    b = 255;
  }
  return { r: clamp255(r), g: clamp255(g), b: clamp255(b) };
}

/** Zigbee color temperature (mireds, clamped to the UI's 150–500 range) → RGB. */
export function miredToRgb(mired: number): RGB {
  const clamped = Math.min(MIRED_MAX, Math.max(MIRED_MIN, mired));
  return kelvinToRgb(1e6 / clamped);
}

function brightnessToRgb(brightness: number): RGB {
  return lerpRgb(DIM, CREAM, clamp01(brightness / BRIGHTNESS_MAX));
}

export interface TintInput {
  type?: string;
  on?: boolean | null;
  color?: { r: number; g: number; b: number } | null;
  colorTemp?: number | null;
  brightness?: number | null;
}

/**
 * Per-payload view used for tint computation: the flat-field projection of the
 * payload's discriminated {@link StaticActionPayload.light}. Callers that
 * already operate on flat device state (`Device.state.color` /
 * `.colorTemp`) skip this and build a {@link TintInput} directly.
 */
function staticPayloadTintInput(payload: StaticActionPayload, deviceType?: string): TintInput {
  return {
    type: deviceType,
    on: payload.on,
    color:
      payload.light?.kind === "color"
        ? { r: payload.light.r, g: payload.light.g, b: payload.light.b }
        : null,
    colorTemp: payload.light?.kind === "colorTemp" ? payload.light.mireds : null,
    brightness: payload.brightness,
  };
}

function staticPayloadIsSwitchOnly(payload: StaticActionPayload): boolean {
  return payload.light === undefined && payload.brightness == null;
}

export function resolveTintRgb(input: TintInput): RGB {
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
 * Tint strength for a collection of devices (a room, a group, the apartment),
 * suitable for driving the `--tint-strength` CSS variable.
 *
 * A light that is on but reports no brightness scores full strength rather than
 * zero: a switch-only bulb or a LIGHT-tagged plug is either on or off, and there
 * is no dimness to represent. Membership goes through `isLightControlDevice`, so
 * a tagged plug counts as a light here exactly as it does in the card's own
 * "N of M lights" count.
 */
export function groupTintStrength(devices: Device[]): number {
  const on = devices.filter((d) => isLightControlDevice(d) && d.state?.on);
  if (on.length === 0) return 0;

  const dimmable = on.filter((d) => d.state?.brightness != null);
  if (dimmable.length === 0) return 1;

  let sum = 0;
  for (const d of dimmable) sum += d.state!.brightness!;
  return brightnessToTintStrength(sum / dimmable.length);
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
    const rgb = resolveTintRgb(staticPayloadTintInput(payload));
    if (staticPayloadIsSwitchOnly(payload)) switchColors.push(rgb);
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
    if (isLightControlDevice(device)) return PLUG_TINT_COLOR;
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
    if (state.color == null && state.colorTemp == null && state.brightness == null) {
      if (isLightControlDevice(device)) colors.push(WARM);
      continue;
    }
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
  const rgb = resolveTintRgb(staticPayloadTintInput(payload, device?.type));
  return { rgb, isSwitchOnly: staticPayloadIsSwitchOnly(payload), on: payload.on === true };
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
 * Single-colour glow tint for a scene, suitable for driving a box-shadow
 * or solid-colour ring. Resolves the same nonSwitch / switch colour set
 * as {@link sceneTintColors} and returns the first deduplicated hue, or
 * a brand-token fallback when nothing resolves.
 */
export function sceneGlowColor(payloads: ActionPayload[]): string {
  const colors = sceneTintColors(payloads);
  return colors[0] ?? "var(--brand)";
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
    const rgb = resolveTintRgb(staticPayloadTintInput(payload));
    if (staticPayloadIsSwitchOnly(payload)) switchColors.push(rgb);
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
