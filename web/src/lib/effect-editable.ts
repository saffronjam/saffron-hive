import { EffectKind, EffectStepKind, type Effect, type EffectStep } from "$lib/gql/graphql";
import { deviceHasCapability, type Device } from "$lib/stores/devices";

export type StepKind =
  | "wait"
  | "set_on_off"
  | "set_brightness"
  | "set_color_rgb"
  | "set_color_temp";

export interface WaitStepConfig {
  duration_ms: number;
}

export interface SetOnOffStepConfig {
  value: boolean;
  transition_ms: number;
}

export interface SetBrightnessStepConfig {
  value: number;
  transition_ms: number;
}

export interface SetColorRGBStepConfig {
  r: number;
  g: number;
  b: number;
  transition_ms: number;
}

export interface SetColorTempStepConfig {
  mireds: number;
  transition_ms: number;
}

export type StepConfig =
  | { kind: "wait"; config: WaitStepConfig }
  | { kind: "set_on_off"; config: SetOnOffStepConfig }
  | { kind: "set_brightness"; config: SetBrightnessStepConfig }
  | { kind: "set_color_rgb"; config: SetColorRGBStepConfig }
  | { kind: "set_color_temp"; config: SetColorTempStepConfig };

export interface EditableStep {
  /** Stable client-side id used for keyed iteration during editing. */
  uid: string;
  step: StepConfig;
  /** Trailing wait card synthesised by the loop toggle; non-deletable. */
  trailing?: boolean;
}

export const MIN_WAIT_MS = 50;
export const DEFAULT_TRAILING_WAIT_MS = 200;
export const DEFAULT_TRANSITION_MS = 200;

export function gqlKindToString(kind: EffectStepKind): StepKind {
  switch (kind) {
    case EffectStepKind.Wait:
      return "wait";
    case EffectStepKind.SetOnOff:
      return "set_on_off";
    case EffectStepKind.SetBrightness:
      return "set_brightness";
    case EffectStepKind.SetColorRgb:
      return "set_color_rgb";
    case EffectStepKind.SetColorTemp:
      return "set_color_temp";
  }
}

export function stringToGqlKind(kind: StepKind): EffectStepKind {
  switch (kind) {
    case "wait":
      return EffectStepKind.Wait;
    case "set_on_off":
      return EffectStepKind.SetOnOff;
    case "set_brightness":
      return EffectStepKind.SetBrightness;
    case "set_color_rgb":
      return EffectStepKind.SetColorRgb;
    case "set_color_temp":
      return EffectStepKind.SetColorTemp;
  }
}

export function defaultStepConfig(kind: StepKind): StepConfig {
  switch (kind) {
    case "wait":
      return { kind: "wait", config: { duration_ms: 250 } };
    case "set_on_off":
      return { kind: "set_on_off", config: { value: true, transition_ms: 0 } };
    case "set_brightness":
      return {
        kind: "set_brightness",
        config: { value: 200, transition_ms: DEFAULT_TRANSITION_MS },
      };
    case "set_color_rgb":
      return {
        kind: "set_color_rgb",
        config: { r: 255, g: 0, b: 0, transition_ms: DEFAULT_TRANSITION_MS },
      };
    case "set_color_temp":
      return {
        kind: "set_color_temp",
        config: { mireds: 370, transition_ms: DEFAULT_TRANSITION_MS },
      };
  }
}

export function newEditableStep(kind: StepKind): EditableStep {
  return { uid: crypto.randomUUID(), step: defaultStepConfig(kind) };
}

export function newTrailingWait(durationMs = DEFAULT_TRAILING_WAIT_MS): EditableStep {
  return {
    uid: crypto.randomUUID(),
    step: { kind: "wait", config: { duration_ms: durationMs } },
    trailing: true,
  };
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

export function parseStepConfig(kind: StepKind, raw: string): StepConfig {
  const parsed = safeJsonParse(raw);
  const obj = isRecord(parsed) ? parsed : {};
  switch (kind) {
    case "wait":
      return { kind: "wait", config: { duration_ms: Math.max(MIN_WAIT_MS, num(obj.duration_ms, 250)) } };
    case "set_on_off":
      return {
        kind: "set_on_off",
        config: { value: bool(obj.value, true), transition_ms: Math.max(0, num(obj.transition_ms, 0)) },
      };
    case "set_brightness":
      return {
        kind: "set_brightness",
        config: {
          value: Math.min(254, Math.max(0, Math.round(num(obj.value, 200)))),
          transition_ms: Math.max(0, num(obj.transition_ms, DEFAULT_TRANSITION_MS)),
        },
      };
    case "set_color_rgb":
      return {
        kind: "set_color_rgb",
        config: {
          r: Math.min(255, Math.max(0, Math.round(num(obj.r, 255)))),
          g: Math.min(255, Math.max(0, Math.round(num(obj.g, 0)))),
          b: Math.min(255, Math.max(0, Math.round(num(obj.b, 0)))),
          transition_ms: Math.max(0, num(obj.transition_ms, DEFAULT_TRANSITION_MS)),
        },
      };
    case "set_color_temp":
      return {
        kind: "set_color_temp",
        config: {
          mireds: Math.max(0, Math.round(num(obj.mireds, 370))),
          transition_ms: Math.max(0, num(obj.transition_ms, DEFAULT_TRANSITION_MS)),
        },
      };
  }
}

export function stringifyStepConfig(s: StepConfig): string {
  return JSON.stringify(s.config);
}

export function effectStepsToEditable(loop: boolean, steps: readonly EffectStep[]): EditableStep[] {
  const editable: EditableStep[] = steps
    .slice()
    .sort((a, b) => a.index - b.index)
    .map((s) => ({
      uid: crypto.randomUUID(),
      step: parseStepConfig(gqlKindToString(s.kind), s.config),
    }));
  if (loop) {
    const last = editable.at(-1);
    if (last && last.step.kind === "wait") {
      last.trailing = true;
    } else {
      editable.push(newTrailingWait());
    }
  }
  return editable;
}

export function editableToInputSteps(steps: readonly EditableStep[]): {
  kind: EffectStepKind;
  config: string;
}[] {
  return steps.map((s) => ({
    kind: stringToGqlKind(s.step.kind),
    config: stringifyStepConfig(s.step),
  }));
}

/** Capability name required for a given step kind, or null for steps that need none. */
export function capabilityForStepKind(kind: StepKind): string | null {
  switch (kind) {
    case "set_on_off":
      return "on_off";
    case "set_brightness":
      return "brightness";
    case "set_color_rgb":
      return "color";
    case "set_color_temp":
      return "color_temp";
    case "wait":
      return null;
  }
}

/** Recompute required capabilities locally so the editor reflects step edits before save. */
export function computeRequiredCapabilities(steps: readonly EditableStep[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const s of steps) {
    const cap = capabilityForStepKind(s.step.kind);
    if (cap === null) continue;
    if (seen.has(cap)) continue;
    seen.add(cap);
    out.push(cap);
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
  field: "name" | "steps" | "step" | "nativeName";
  index?: number;
  message: string;
}

/** Validate an editable timeline effect. trailing wait cards are part of the loop pattern. */
export function validateTimelineEffect(
  name: string,
  loop: boolean,
  steps: readonly EditableStep[],
): EffectValidationError | null {
  if (name.trim() === "") return { field: "name", message: "Pick a name" };
  if (steps.length === 0) return { field: "steps", message: "Add at least one step" };
  if (loop) {
    const last = steps.at(-1);
    if (!last || last.step.kind !== "wait" || !last.trailing) {
      return {
        field: "steps",
        message: "Loop effects must end with a trailing wait step",
      };
    }
  } else {
    if (steps.some((s) => s.trailing)) {
      return {
        field: "steps",
        message: "Trailing wait step is only valid when loop is on",
      };
    }
  }
  for (let i = 0; i < steps.length; i++) {
    const s = steps[i];
    if (s.step.kind === "wait" && s.step.config.duration_ms < MIN_WAIT_MS) {
      return { field: "step", index: i, message: `Wait must be at least ${MIN_WAIT_MS}ms` };
    }
  }
  return null;
}

export function validateNativeEffect(name: string, nativeName: string | null): EffectValidationError | null {
  if (name.trim() === "") return { field: "name", message: "Pick a name" };
  if (!nativeName || nativeName.trim() === "") {
    return { field: "nativeName", message: "Pick a native effect" };
  }
  return null;
}

/** Title-case a native effect identifier such as "fireplace" → "Fireplace". */
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

export function effectSummary(e: Pick<Effect, "id" | "name" | "icon" | "kind" | "nativeName" | "loop" | "requiredCapabilities">): EffectSummary {
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
