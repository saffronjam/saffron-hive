import {
  EffectClipKind,
  EffectKind,
  type Effect,
  type EffectClip,
  type EffectTrack,
} from "$lib/gql/graphql";
import { deviceHasCapability, type Device } from "$lib/stores/devices";

export type ClipKind =
  | "set_on_off"
  | "set_brightness"
  | "set_color_rgb"
  | "set_color_temp"
  | "native_effect";

export interface SetOnOffClipConfig {
  value: boolean;
}

export interface SetBrightnessClipConfig {
  value: number;
}

export interface SetColorRGBClipConfig {
  r: number;
  g: number;
  b: number;
}

export interface SetColorTempClipConfig {
  mireds: number;
}

export interface NativeEffectClipConfig {
  name: string;
}

export type ClipConfig =
  | { kind: "set_on_off"; config: SetOnOffClipConfig }
  | { kind: "set_brightness"; config: SetBrightnessClipConfig }
  | { kind: "set_color_rgb"; config: SetColorRGBClipConfig }
  | { kind: "set_color_temp"; config: SetColorTempClipConfig }
  | { kind: "native_effect"; config: NativeEffectClipConfig };

export interface EditableClip {
  /** Stable client-side id used for keyed iteration during editing. */
  uid: string;
  startMs: number;
  transitionMinMs: number;
  transitionMaxMs: number;
  kind: ClipKind;
  config: ClipConfig;
}

export interface EditableTrack {
  /** Stable client-side id used for keyed iteration during editing. */
  uid: string;
  /** User-supplied label. Empty string is valid and rendered as a placeholder. */
  name: string;
  clips: EditableClip[];
}

export const DEFAULT_TRANSITION_MS = 200;
export const MIN_CLIP_VISUAL_PX = 30;

export function gqlKindToString(kind: EffectClipKind): ClipKind {
  switch (kind) {
    case EffectClipKind.SetOnOff:
      return "set_on_off";
    case EffectClipKind.SetBrightness:
      return "set_brightness";
    case EffectClipKind.SetColorRgb:
      return "set_color_rgb";
    case EffectClipKind.SetColorTemp:
      return "set_color_temp";
    case EffectClipKind.NativeEffect:
      return "native_effect";
  }
}

export function stringToGqlKind(kind: ClipKind): EffectClipKind {
  switch (kind) {
    case "set_on_off":
      return EffectClipKind.SetOnOff;
    case "set_brightness":
      return EffectClipKind.SetBrightness;
    case "set_color_rgb":
      return EffectClipKind.SetColorRgb;
    case "set_color_temp":
      return EffectClipKind.SetColorTemp;
    case "native_effect":
      return EffectClipKind.NativeEffect;
  }
}

export function defaultClipConfig(kind: ClipKind): ClipConfig {
  switch (kind) {
    case "set_on_off":
      return { kind: "set_on_off", config: { value: true } };
    case "set_brightness":
      return { kind: "set_brightness", config: { value: 200 } };
    case "set_color_rgb":
      return { kind: "set_color_rgb", config: { r: 255, g: 0, b: 0 } };
    case "set_color_temp":
      return { kind: "set_color_temp", config: { mireds: 370 } };
    case "native_effect":
      return { kind: "native_effect", config: { name: "" } };
  }
}

export function newEditableClip(kind: ClipKind, startMs = 0): EditableClip {
  const transitionMs =
    kind === "set_on_off" || kind === "native_effect" ? 0 : DEFAULT_TRANSITION_MS;
  return {
    uid: crypto.randomUUID(),
    startMs,
    transitionMinMs: transitionMs,
    transitionMaxMs: transitionMs,
    kind,
    config: defaultClipConfig(kind),
  };
}

export function newEditableTrack(): EditableTrack {
  return { uid: crypto.randomUUID(), name: "", clips: [] };
}

function safeJsonParse(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function num(v: unknown, fallback: number): number {
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}

function bool(v: unknown, fallback: boolean): boolean {
  return typeof v === "boolean" ? v : fallback;
}

function str(v: unknown, fallback: string): string {
  return typeof v === "string" ? v : fallback;
}

export function parseClipConfig(kind: ClipKind, raw: string): ClipConfig {
  const parsed = safeJsonParse(raw);
  const obj = isRecord(parsed) ? parsed : {};
  switch (kind) {
    case "set_on_off":
      return { kind: "set_on_off", config: { value: bool(obj.value, true) } };
    case "set_brightness":
      return {
        kind: "set_brightness",
        config: { value: Math.min(254, Math.max(0, Math.round(num(obj.value, 200)))) },
      };
    case "set_color_rgb":
      return {
        kind: "set_color_rgb",
        config: {
          r: Math.min(255, Math.max(0, Math.round(num(obj.r, 255)))),
          g: Math.min(255, Math.max(0, Math.round(num(obj.g, 0)))),
          b: Math.min(255, Math.max(0, Math.round(num(obj.b, 0)))),
        },
      };
    case "set_color_temp":
      return {
        kind: "set_color_temp",
        config: { mireds: Math.max(0, Math.round(num(obj.mireds, 370))) },
      };
    case "native_effect":
      return { kind: "native_effect", config: { name: str(obj.name, "") } };
  }
}

export function stringifyClipConfig(c: ClipConfig): string {
  return JSON.stringify(c.config);
}

type EffectTrackData = Pick<EffectTrack, "id" | "index" | "name"> & {
  clips: ReadonlyArray<
    Pick<EffectClip, "id" | "startMs" | "transitionMinMs" | "transitionMaxMs" | "kind" | "config">
  >;
};

type EffectInputData = {
  tracks: ReadonlyArray<EffectTrackData>;
};

export function effectToEditable(effect: EffectInputData): EditableTrack[] {
  const sortedTracks = effect.tracks.slice().sort((a, b) => a.index - b.index);
  return sortedTracks.map((t) => ({
    uid: crypto.randomUUID(),
    name: t.name,
    clips: t.clips
      .slice()
      .sort((a, b) => a.startMs - b.startMs)
      .map((c) => {
        const k = gqlKindToString(c.kind);
        return {
          uid: crypto.randomUUID(),
          startMs: Math.max(0, c.startMs),
          transitionMinMs: Math.max(0, c.transitionMinMs),
          transitionMaxMs: Math.max(c.transitionMinMs, c.transitionMaxMs),
          kind: k,
          config: parseClipConfig(k, c.config),
        } satisfies EditableClip;
      }),
  }));
}

export interface ClipInputDto {
  startMs: number;
  transitionMinMs: number;
  transitionMaxMs: number;
  kind: EffectClipKind;
  config: string;
}

export interface TrackInputDto {
  name: string;
  clips: ClipInputDto[];
}

export function editableToInputTracks(tracks: readonly EditableTrack[]): TrackInputDto[] {
  return tracks.map((t) => ({
    name: t.name,
    clips: t.clips
      .slice()
      .sort((a, b) => a.startMs - b.startMs)
      .map((c) => ({
        startMs: c.startMs,
        transitionMinMs: c.transitionMinMs,
        transitionMaxMs: c.transitionMaxMs,
        kind: stringToGqlKind(c.kind),
        config: stringifyClipConfig(c.config),
      })),
  }));
}

/** Capability name required for a given clip kind, or null for clips that need none. */
export function capabilityForClipKind(kind: ClipKind): string | null {
  switch (kind) {
    case "set_on_off":
      return "on_off";
    case "set_brightness":
      return "brightness";
    case "set_color_rgb":
      return "color";
    case "set_color_temp":
      return "color_temp";
    case "native_effect":
      return null;
  }
}

/** Recompute required capabilities locally so the editor reflects clip edits before save. */
export function computeRequiredCapabilities(tracks: readonly EditableTrack[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const t of tracks) {
    for (const c of t.clips) {
      const cap = capabilityForClipKind(c.kind);
      if (cap === null) continue;
      if (seen.has(cap)) continue;
      seen.add(cap);
      out.push(cap);
    }
  }
  return out;
}

export function deviceSupportsCaps(device: Device, caps: readonly string[]): boolean {
  for (const c of caps) {
    if (!deviceHasCapability(device, c)) return false;
  }
  return true;
}

export interface EffectValidationError {
  field: "name" | "duration" | "tracks" | "clip" | "nativeName";
  trackIndex?: number;
  clipIndex?: number;
  message: string;
}

function clipEnd(c: EditableClip): number {
  return c.startMs + Math.max(c.transitionMaxMs, 0);
}

function isValidClipConfig(c: EditableClip): boolean {
  switch (c.config.kind) {
    case "set_on_off":
      return typeof c.config.config.value === "boolean";
    case "set_brightness": {
      const v = c.config.config.value;
      return Number.isFinite(v) && v >= 0 && v <= 254;
    }
    case "set_color_rgb": {
      const { r, g, b } = c.config.config;
      const ok = (n: number) => Number.isFinite(n) && n >= 0 && n <= 255;
      return ok(r) && ok(g) && ok(b);
    }
    case "set_color_temp": {
      const m = c.config.config.mireds;
      return Number.isFinite(m) && m >= 0;
    }
    case "native_effect":
      return c.config.config.name.trim() !== "";
  }
}

export function validateTimelineEffect(
  name: string,
  durationMs: number,
  loop: boolean,
  tracks: readonly EditableTrack[],
): EffectValidationError | null {
  if (name.trim() === "") return { field: "name", message: "Pick a name" };
  if (!Number.isFinite(durationMs) || durationMs < 0) {
    return { field: "duration", message: "Duration must be zero or positive" };
  }
  for (let ti = 0; ti < tracks.length; ti++) {
    const track = tracks[ti];
    const sorted = track.clips.slice().sort((a, b) => a.startMs - b.startMs);
    for (let ci = 0; ci < sorted.length; ci++) {
      const clip = sorted[ci];
      if (clip.startMs < 0) {
        return {
          field: "clip",
          trackIndex: ti,
          clipIndex: ci,
          message: "Clip start must be zero or positive",
        };
      }
      if (clip.transitionMinMs < 0 || clip.transitionMaxMs < clip.transitionMinMs) {
        return {
          field: "clip",
          trackIndex: ti,
          clipIndex: ci,
          message: "Clip transition bounds are invalid",
        };
      }
      if (!isValidClipConfig(clip)) {
        return {
          field: "clip",
          trackIndex: ti,
          clipIndex: ci,
          message: "Clip configuration is invalid",
        };
      }
      if (loop && clipEnd(clip) > durationMs) {
        return {
          field: "clip",
          trackIndex: ti,
          clipIndex: ci,
          message: "Clip extends past the loop end",
        };
      }
      if (ci > 0) {
        const prev = sorted[ci - 1];
        if (clip.startMs < clipEnd(prev)) {
          return {
            field: "clip",
            trackIndex: ti,
            clipIndex: ci,
            message: "Clips on a track cannot overlap",
          };
        }
      }
    }
  }
  return null;
}

export function validateNativeEffect(
  name: string,
  nativeName: string | null,
): EffectValidationError | null {
  if (name.trim() === "") return { field: "name", message: "Pick a name" };
  if (!nativeName || nativeName.trim() === "") {
    return { field: "nativeName", message: "Pick a native effect" };
  }
  return null;
}

export function nativeOptionLabel(name: string, displayName?: string | null): string {
  if (displayName && displayName.trim() !== "") return displayName;
  if (!name) return "";
  return name.charAt(0).toUpperCase() + name.slice(1).replaceAll("_", " ");
}

export interface EffectSummary {
  id: string;
  name: string;
  icon?: string | null;
  kind: EffectKind;
  nativeName?: string | null;
  loop: boolean;
  requiredCapabilities: readonly string[];
}

export function effectSummary(
  e: Pick<Effect, "id" | "name" | "icon" | "kind" | "nativeName" | "loop" | "requiredCapabilities">,
): EffectSummary {
  return {
    id: e.id,
    name: e.name,
    icon: e.icon ?? null,
    kind: e.kind,
    nativeName: e.nativeName ?? null,
    loop: e.loop,
    requiredCapabilities: e.requiredCapabilities,
  };
}

export function maxClipEnd(tracks: readonly EditableTrack[]): number {
  let maxEnd = 0;
  for (const t of tracks) {
    for (const c of t.clips) {
      const end = clipEnd(c);
      if (end > maxEnd) maxEnd = end;
    }
  }
  return maxEnd;
}

/**
 * Finds a free start position on a track for a clip of `width` ms, preferring
 * `desiredStart` (or as close to it as possible). Returns the chosen start, or
 * null if no gap on the track fits the requested width.
 *
 * Algorithm: build the sorted occupied intervals, then walk the gaps in
 * insertion order [0, first.start), [first.end, second.start), ...,
 * [last.end, +infinity). For each gap that fits `width`, the candidate is
 * clamp(desiredStart, gap.start, gap.end - width). The gap closest to
 * desiredStart (by candidate distance) wins.
 */
export function findFreeStartOnTrack(
  track: EditableTrack,
  desiredStart: number,
  width: number,
): number | null {
  const w = Math.max(0, Math.round(width));
  const want = Math.max(0, Math.round(desiredStart));
  const intervals = track.clips
    .slice()
    .sort((a, b) => a.startMs - b.startMs)
    .map((c) => ({ start: c.startMs, end: c.startMs + Math.max(c.transitionMaxMs, 0) }));

  type Gap = { start: number; end: number };
  const gaps: Gap[] = [];
  let cursor = 0;
  for (const iv of intervals) {
    if (iv.start > cursor) gaps.push({ start: cursor, end: iv.start });
    if (iv.end > cursor) cursor = iv.end;
  }
  gaps.push({ start: cursor, end: Number.POSITIVE_INFINITY });

  let best: number | null = null;
  let bestDelta = Number.POSITIVE_INFINITY;
  for (const g of gaps) {
    const fits = g.end === Number.POSITIVE_INFINITY ? true : g.end - g.start >= w;
    if (!fits) continue;
    const upper = g.end === Number.POSITIVE_INFINITY ? Number.POSITIVE_INFINITY : g.end - w;
    const candidate = Math.min(Math.max(want, g.start), upper);
    const delta = Math.abs(candidate - want);
    if (delta < bestDelta) {
      bestDelta = delta;
      best = candidate;
    }
  }
  return best;
}
