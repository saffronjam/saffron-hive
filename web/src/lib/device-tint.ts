import {
  isLightControlDevice,
  isRuntimeEnabledDevice,
  type Device,
  type DeviceState,
} from "$lib/stores/devices";
import { ContactRole } from "$lib/gql/graphql";
import { formatContactSummary, summarizeContacts } from "$lib/contact-summary";
import { contactIcon } from "$lib/utils";
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
const LIVE_COLOR_CLUSTER_DISTANCE = 0.08;
const MIN_SECONDARY_COLOR_SHARE = 0.01;

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

/** `#rgb` or `#rrggbb` to channels, or null when the value is neither. */
export function hexToRgb(hex: string): RGB | null {
  const match = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim());
  if (!match) return null;
  const digits = match[1].length === 3 ? match[1].replace(/./g, (c) => c + c) : match[1];
  const value = parseInt(digits, 16);
  return { r: (value >> 16) & 255, g: (value >> 8) & 255, b: value & 255 };
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

/**
 * The heat ramp's stops, in Celsius. Cold reads deep blue, comfortable reads
 * green, warm runs yellow to red — the vocabulary of a heat map rather than of
 * light, so a temperature view never looks like a room with a lamp in it.
 */
const HEAT_STOPS: { c: number; rgb: RGB }[] = [
  { c: 16, rgb: { r: 0, g: 120, b: 255 } },
  { c: 18, rgb: { r: 0, g: 200, b: 255 } },
  { c: 20, rgb: { r: 0, g: 230, b: 140 } },
  { c: 21.5, rgb: { r: 170, g: 240, b: 40 } },
  { c: 23, rgb: { r: 255, g: 220, b: 0 } },
  { c: 25, rgb: { r: 255, g: 140, b: 0 } },
  { c: 27, rgb: { r: 255, g: 30, b: 0 } },
];

/**
 * Room temperature (raw Celsius) → the map's heat colour, clamped to the ends
 * of {@link HEAT_STOPS} and interpolated between them.
 */
export function temperatureToRgb(celsius: number): RGB {
  const first = HEAT_STOPS[0];
  const last = HEAT_STOPS[HEAT_STOPS.length - 1];
  if (celsius <= first.c) return first.rgb;
  if (celsius >= last.c) return last.rgb;
  for (let i = 1; i < HEAT_STOPS.length; i++) {
    const hi = HEAT_STOPS[i];
    if (celsius > hi.c) continue;
    const lo = HEAT_STOPS[i - 1];
    return lerpRgb(lo.rgb, hi.rgb, (celsius - lo.c) / (hi.c - lo.c));
  }
  return last.rgb;
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

interface OKLab {
  l: number;
  a: number;
  b: number;
}

interface WeightedColor {
  key: string;
  rgb: RGB;
  lab: OKLab;
  weight: number;
}

interface ColorCluster {
  key: string;
  members: WeightedColor[];
  lab: OKLab;
  weight: number;
}

interface LightContribution {
  device: Device;
  rgb: RGB;
  output: number;
  capacity: number;
  dimmable: boolean;
}

export interface AggregateLightAppearance {
  colors: string[];
  dominantColor: string | null;
  tintStrength: number;
  outputRatio: number | null;
  active: boolean;
  hasDimmable: boolean;
}

export interface AggregateLightAppearanceOptions {
  brightnessPreview?: number;
}

function rgbChannelToLinear(channel: number): number {
  const value = clamp01(channel / 255);
  return value <= 0.04045 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4);
}

function rgbToOKLab(rgb: RGB): OKLab {
  const red = rgbChannelToLinear(rgb.r);
  const green = rgbChannelToLinear(rgb.g);
  const blue = rgbChannelToLinear(rgb.b);
  const l = 0.4122214708 * red + 0.5363325363 * green + 0.0514459929 * blue;
  const m = 0.2119034982 * red + 0.6806995451 * green + 0.1073969566 * blue;
  const s = 0.0883024619 * red + 0.2817188376 * green + 0.6299787005 * blue;
  const lRoot = Math.cbrt(l);
  const mRoot = Math.cbrt(m);
  const sRoot = Math.cbrt(s);
  return {
    l: 0.2104542553 * lRoot + 0.793617785 * mRoot - 0.0040720468 * sRoot,
    a: 1.9779984951 * lRoot - 2.428592205 * mRoot + 0.4505937099 * sRoot,
    b: 0.0259040371 * lRoot + 0.7827717662 * mRoot - 0.808675766 * sRoot,
  };
}

function labDistance(a: OKLab, b: OKLab): number {
  return Math.hypot(a.l - b.l, a.a - b.a, a.b - b.b);
}

function clusterFor(color: WeightedColor): ColorCluster {
  return { key: color.key, members: [color], lab: color.lab, weight: color.weight };
}

function mergeColorClusters(a: ColorCluster, b: ColorCluster): ColorCluster {
  const weight = a.weight + b.weight;
  return {
    key: a.key < b.key ? a.key : b.key,
    members: [...a.members, ...b.members],
    lab: {
      l: (a.lab.l * a.weight + b.lab.l * b.weight) / weight,
      a: (a.lab.a * a.weight + b.lab.a * b.weight) / weight,
      b: (a.lab.b * a.weight + b.lab.b * b.weight) / weight,
    },
    weight,
  };
}

function clusterColors(colors: WeightedColor[]): ColorCluster[] {
  const clusters = colors.toSorted((a, b) => a.key.localeCompare(b.key)).map(clusterFor);
  for (;;) {
    let closest: { left: number; right: number; distance: number; key: string } | null = null;
    for (let left = 0; left < clusters.length; left++) {
      for (let right = left + 1; right < clusters.length; right++) {
        const distance = labDistance(clusters[left].lab, clusters[right].lab);
        const key = `${clusters[left].key}\u0000${clusters[right].key}`;
        if (
          distance <= LIVE_COLOR_CLUSTER_DISTANCE &&
          (!closest ||
            distance < closest.distance ||
            (distance === closest.distance && key < closest.key))
        ) {
          closest = { left, right, distance, key };
        }
      }
    }
    if (!closest) return clusters;
    const merged = mergeColorClusters(clusters[closest.left], clusters[closest.right]);
    clusters.splice(closest.right, 1);
    clusters.splice(closest.left, 1, merged);
  }
}

function representativeColor(cluster: ColorCluster): WeightedColor {
  return cluster.members.toSorted((a, b) => {
    const distance = labDistance(a.lab, cluster.lab) - labDistance(b.lab, cluster.lab);
    if (distance !== 0) return distance;
    if (a.weight !== b.weight) return b.weight - a.weight;
    return a.key.localeCompare(b.key);
  })[0];
}

function clusterHue(cluster: ColorCluster): number {
  const hue = Math.atan2(cluster.lab.b, cluster.lab.a);
  return hue < 0 ? hue + Math.PI * 2 : hue;
}

function representativePalette(colors: WeightedColor[]): { colors: RGB[]; dominant: RGB | null } {
  if (colors.length === 0) return { colors: [], dominant: null };
  const clusters = clusterColors(colors);
  const ranked = clusters.toSorted((a, b) => b.weight - a.weight || a.key.localeCompare(b.key));
  const dominant = representativeColor(ranked[0]).rgb;
  const totalWeight = ranked.reduce((sum, cluster) => sum + cluster.weight, 0);
  const candidates = ranked.filter(
    (cluster, index) => index === 0 || cluster.weight / totalWeight >= MIN_SECONDARY_COLOR_SHARE,
  );
  const selected = [candidates[0]];
  const remaining = candidates.slice(1);
  while (selected.length < 3 && remaining.length > 0) {
    remaining.sort((a, b) => {
      const aDistance = Math.min(...selected.map((picked) => labDistance(a.lab, picked.lab)));
      const bDistance = Math.min(...selected.map((picked) => labDistance(b.lab, picked.lab)));
      return bDistance - aDistance || b.weight - a.weight || a.key.localeCompare(b.key);
    });
    selected.push(remaining.shift()!);
  }
  selected.sort(
    (a, b) => clusterHue(a) - clusterHue(b) || a.lab.l - b.lab.l || a.key.localeCompare(b.key),
  );
  return { colors: selected.map((cluster) => representativeColor(cluster).rgb), dominant };
}

function visualRgb(device: Device): RGB {
  const state = device.state;
  if (state?.color) return { r: state.color.r, g: state.color.g, b: state.color.b };
  if (state?.colorTemp != null) return miredToRgb(state.colorTemp);
  if (device.displayColor) return hexToRgb(device.displayColor) ?? WARM;
  return WARM;
}

function lightContribution(
  device: Device,
  brightnessPreview: number | undefined,
): LightContribution | null {
  const state = device.state;
  if (
    !isRuntimeEnabledDevice(device) ||
    !device.available ||
    !isLightControlDevice(device) ||
    !state ||
    typeof state.on !== "boolean"
  ) {
    return null;
  }
  const dimmable = state.brightness != null;
  const capacity = dimmable
    ? BRIGHTNESS_MAX
    : Math.max(0, Math.min(BRIGHTNESS_MAX, device.displayBrightness ?? BRIGHTNESS_MAX));
  const preview = dimmable && brightnessPreview != null ? brightnessPreview : null;
  const on = preview != null ? preview > 0 : state.on;
  const level = dimmable
    ? Math.max(0, Math.min(BRIGHTNESS_MAX, preview ?? state.brightness!))
    : capacity;
  return {
    device,
    rgb: visualRgb(device),
    output: on ? level : 0,
    capacity,
    dimmable,
  };
}

/**
 * Live visual state for a room, group, or apartment. Color comes only from
 * currently emitting lights; fill measures emitted output against the known
 * capacity of every available member.
 */
export function aggregateLightAppearance(
  devices: Device[],
  options: AggregateLightAppearanceOptions = {},
): AggregateLightAppearance {
  const contributions = devices
    .map((device) => lightContribution(device, options.brightnessPreview))
    .filter((value): value is LightContribution => value !== null);
  const active = contributions.filter((contribution) => contribution.output > 0);
  const palette = representativePalette(
    active.map((contribution) => ({
      key: `${toCss(contribution.rgb)}\u0000${contribution.device.id}`,
      rgb: contribution.rgb,
      lab: rgbToOKLab(contribution.rgb),
      weight: contribution.output,
    })),
  );
  const totalOutput = contributions.reduce((sum, contribution) => sum + contribution.output, 0);
  const totalCapacity = contributions.reduce((sum, contribution) => sum + contribution.capacity, 0);
  const activeIntensity = active.length === 0 ? 0 : totalOutput / (BRIGHTNESS_MAX * active.length);
  return {
    colors: palette.colors.map(toCss),
    dominantColor: palette.dominant ? toCss(palette.dominant) : null,
    tintStrength: brightnessToTintStrength(activeIntensity * BRIGHTNESS_MAX),
    outputRatio: totalCapacity > 0 ? clamp01(totalOutput / totalCapacity) : null,
    active: active.length > 0,
    hasDimmable: contributions.some((contribution) => contribution.dimmable),
  };
}

/** Colors retained by a collection's lights, for controls that remain useful while off. */
export function rememberedLightPalette(devices: Device[]): string[] {
  const colors = devices
    .filter(
      (device) => isRuntimeEnabledDevice(device) && isLightControlDevice(device) && device.state,
    )
    .map((device) => {
      const rgb = visualRgb(device);
      return {
        key: `${toCss(rgb)}\u0000${device.id}`,
        rgb,
        lab: rgbToOKLab(rgb),
        weight: 1,
      };
    });
  return representativePalette(colors).colors.map(toCss);
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
  // A device with no colour of its own wears the one the user gave it, so a
  // A plug with the light role stands for the bulb it actually turns on.
  if (state.color == null && state.colorTemp == null && device.displayColor) {
    return device.displayColor;
  }
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

export function tintIconGradient(colors: string[]): string {
  if (colors.length === 0) return "";
  if (colors.length === 1) {
    const color = colors[0];
    return `linear-gradient(135deg, color-mix(in srgb, color-mix(in srgb, ${color} 70%, white) 50%, var(--card)), color-mix(in srgb, ${color} 50%, var(--card)), color-mix(in srgb, color-mix(in srgb, ${color} 65%, black) 50%, var(--card)))`;
  }
  const stops = colors
    .slice(0, 3)
    .map((color) => `color-mix(in srgb, ${color} 50%, var(--card))`)
    .join(", ");
  return `linear-gradient(135deg, ${stops})`;
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
  options: { includeGeneralContact?: boolean } = {},
): AggregatedReading[] {
  const result: AggregatedReading[] = [];
  const contactRoles = options.includeGeneralContact
    ? [ContactRole.General, ContactRole.Door, ContactRole.Window]
    : [ContactRole.Door, ContactRole.Window];
  for (const role of contactRoles) {
    const summary = summarizeContacts(devices, role);
    if (!summary) continue;
    const value =
      devices.length === 1
        ? summary.open === 1
          ? "Open"
          : summary.closed === 1
            ? "Closed"
            : "Unknown"
        : formatContactSummary(summary);
    result.push({
      field: "contact",
      label: summary.label,
      value,
      unit: "",
      icon: contactIcon(summary.role),
    });
  }
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
