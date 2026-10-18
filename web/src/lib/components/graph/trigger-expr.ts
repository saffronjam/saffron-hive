import {
  fromLiteral,
  toLiteral,
  readValueType,
  actionPayloadFromAPI,
  actionPayloadToAPI,
} from "$lib/automation-authoring";
import type { AutomationConfigInput, AutomationTriggerInput } from "$lib/gql/graphql";
import type { Clause } from "$lib/target-resolve";
import { m } from "$lib/i18n/messages";
import { locale } from "$lib/i18n/locale.svelte";
import { formatList, formatShortDuration } from "$lib/i18n/format";

export type TriggerMode =
  | ""
  | "device_state"
  | "device_event"
  | "availability"
  | "webhook"
  | "schedule"
  | "custom";

export type WebhookFilterSource = "body" | "query" | "header";
export type WebhookFilterOperator =
  | "exists"
  | "not_exists"
  | "equals"
  | "not_equals"
  | "contains"
  | "starts_with"
  | "ends_with"
  | "greater_than"
  | "greater_than_or_equal"
  | "less_than"
  | "less_than_or_equal";
export type WebhookFilterValueType = "string" | "number" | "boolean" | "null";

export interface WebhookFilterRule {
  source: WebhookFilterSource;
  path: string;
  operator: WebhookFilterOperator;
  value_type?: WebhookFilterValueType;
  value?: string | number | boolean | null;
}

export type ScheduleSubmode = "at" | "every" | "custom";

export type ScheduleIntervalUnit = "seconds" | "minutes" | "hours";

export interface TriggerConfig {
  mode: TriggerMode;
  // event-trigger fields
  eventType?: string;
  deviceId?: string;
  deviceName?: string;
  property?: string;
  comparator?: string;
  value?: string;
  valueType?: "string" | "number" | "boolean" | "null";
  eventValue?: string;
  customExpr?: string;
  endpointId?: string;
  webhookFilters?: WebhookFilterRule[];
  // schedule-trigger fields
  scheduleSubmode?: ScheduleSubmode;
  cronExpr?: string;
  scheduleHour?: number;
  scheduleMinute?: number;
  scheduleSecond?: number;
  scheduleWeekdays?: string[]; // ["MON","TUE",...]
  scheduleIntervalValue?: number;
  scheduleIntervalUnit?: ScheduleIntervalUnit;
  // advanced timing (per-trigger), in milliseconds. 0 = immediate / no throttle.
  graceMs?: number;
  cooldownMs?: number;
  // device-state only: fire once the condition has held this long, in ms.
  holdMs?: number;
}

// TIMING_PRESETS feeds the Grace/Cooldown selects in the trigger node. Values
// are in milliseconds so the runtime and the UI agree without unit conversion.
export function timingPresets(): { value: number; label: string }[] {
  return [
    { value: 0, label: m.automation_timing_immediate({}, locale.messageOptions()) },
    { value: 500, label: formatShortDuration(500, "millisecond") },
    { value: 1000, label: formatShortDuration(1, "second") },
    { value: 5000, label: formatShortDuration(5, "second") },
    { value: 10000, label: formatShortDuration(10, "second") },
    { value: 30000, label: formatShortDuration(30, "second") },
    { value: 60000, label: formatShortDuration(1, "minute") },
  ];
}

/** Durations offered for a device-state trigger's "For" hold, in milliseconds. */
export function holdPresets(): { value: number; label: string }[] {
  return [
    { value: 0, label: m.automation_timing_immediate({}, locale.messageOptions()) },
    { value: 5_000, label: formatShortDuration(5, "second") },
    { value: 10_000, label: formatShortDuration(10, "second") },
    { value: 30_000, label: formatShortDuration(30, "second") },
    { value: 60_000, label: formatShortDuration(1, "minute") },
    { value: 120_000, label: formatShortDuration(2, "minute") },
    { value: 300_000, label: formatShortDuration(5, "minute") },
    { value: 600_000, label: formatShortDuration(10, "minute") },
    { value: 900_000, label: formatShortDuration(15, "minute") },
    { value: 1_800_000, label: formatShortDuration(30, "minute") },
    { value: 3_600_000, label: formatShortDuration(1, "hour") },
  ];
}

/** A hold duration as text: whole hours or minutes when exact, otherwise seconds. */
export function formatHoldDuration(ms: number): string {
  if (ms <= 0) return m.automation_timing_immediate({}, locale.messageOptions());
  if (ms % 3_600_000 === 0) return formatShortDuration(ms / 3_600_000, "hour");
  if (ms % 60_000 === 0) return formatShortDuration(ms / 60_000, "minute");
  return formatShortDuration(Math.ceil(ms / 1000), "second");
}

const capToExprProperty: Record<string, string> = {
  on_off: "on",
  color_temp: "colorTemp",
  target_temperature: "targetTemperature",
  hvac_mode: "hvacMode",
  fan_mode: "fanMode",
  device_posture: "devicePosture",
  link_quality: "linkQuality",
};

export function capabilityToExprProperty(capName: string): string {
  return capToExprProperty[capName] ?? capName;
}

export function supportsDeviceEvents(device: {
  capabilities: readonly { name: string }[];
}): boolean {
  return device.capabilities.some((capability) => capability.name === "action");
}

export function eventTypeForMode(mode: TriggerMode): string {
  switch (mode) {
    case "":
      return "";
    case "device_state":
      return "device.state_changed";
    case "device_event":
      return "device.action_fired";
    case "availability":
      return "device.availability_changed";
    case "webhook":
      return "webhook.received";
    case "schedule":
      return ""; // not used for schedule triggers
    case "custom":
      return "device.state_changed";
  }
}

export function defaultTriggerConfig(): TriggerConfig {
  return { mode: "" };
}

export function normalizeTriggerConfig(raw: Record<string, unknown>): TriggerConfig {
  const t = (raw as AutomationConfigInput).trigger;
  if (!t) return defaultTriggerConfig();
  const { value, webhookFilters, ...rest } = t;
  return {
    ...Object.fromEntries(Object.entries(rest).filter(([, v]) => v !== null)),
    mode: t.mode === "unset" ? "" : t.mode,
    value: fromLiteral(value),
    valueType: readValueType(value),
    webhookFilters: webhookFilters?.map((f) => ({
      source: f.source,
      path: f.path,
      operator: f.operator,
      value_type: readValueType(f.value),
      value: f.value ? literalValue(f.value) : undefined,
    })),
  } as TriggerConfig;
}

function literalValue(
  value: NonNullable<AutomationTriggerInput["value"]>,
): string | number | boolean | null {
  return value.stringValue ?? value.numberValue ?? value.booleanValue ?? null;
}

export function serializeTriggerConfig(config: TriggerConfig): string {
  const { deviceName: _name, value, valueType, webhookFilters, ...rest } = config;
  const trigger: AutomationTriggerInput = {
    ...rest,
    mode: config.mode || "unset",
    value: toLiteral(value, valueType),
    webhookFilters: (webhookFilters ?? []).map((f) => ({
      source: f.source,
      path: f.path,
      operator: f.operator,
      value: f.value_type ? toLiteral(String(f.value ?? ""), f.value_type) : undefined,
    })),
    scheduleWeekdays: config.scheduleWeekdays ?? [],
  };
  return JSON.stringify({ trigger } satisfies AutomationConfigInput);
}

export function serializeOperatorConfig(config: { operator: string }): string {
  return JSON.stringify({
    operator: { kind: config.operator.toLowerCase() },
  } satisfies AutomationConfigInput);
}

export interface ActionConfigShape {
  actionType: string;
  targetType: string;
  targetId: string;
  targetExpr?: Clause[];
  payload: string;
}

export interface NormalizedActionConfig extends ActionConfigShape {
  targetName: string;
}

/** The action type of a node that calls an action macro from the definitions. */
export const MACRO_ACTION = "macro";

/** A call of an action macro: its name and arguments in stored form. */
export interface ActionMacroCall {
  use: string;
  args: unknown[];
}

/** The macro call stored in an action's payload, or null. */
export function actionMacroCall(config: ActionConfigShape): ActionMacroCall | null {
  if (config.actionType !== MACRO_ACTION) return null;
  try {
    const parsed = JSON.parse(config.payload) as ActionMacroCall;
    return typeof parsed.use === "string" ? { use: parsed.use, args: parsed.args ?? [] } : null;
  } catch {
    return null;
  }
}

export function normalizeActionConfig(raw: Record<string, unknown>): NormalizedActionConfig {
  const c = raw as AutomationConfigInput;
  if (c.macro)
    return {
      actionType: MACRO_ACTION,
      targetType: "",
      targetId: "",
      targetName: "",
      targetExpr: [],
      payload: JSON.stringify({ use: c.macro.name, args: c.macro.arguments ?? [] }),
    };
  const a = c.action;
  if (!a)
    return {
      actionType: "",
      targetType: "",
      targetId: "",
      targetName: "",
      targetExpr: [],
      payload: "",
    };
  const scene = a.actionType === "activate_scene";
  return {
    actionType: a.actionType ?? "",
    targetType: scene ? "scene" : (a.targetType ?? ""),
    targetId: scene ? (a.payload?.sceneId ?? "") : (a.targetId ?? ""),
    targetName: "",
    targetExpr: (a.targetExpr ?? []) as Clause[],
    payload: scene ? "" : JSON.stringify(actionPayloadFromAPI(a.payload)),
  };
}

export function serializeActionConfig(config: ActionConfigShape): string {
  const macro = actionMacroCall(config);
  if (macro)
    return JSON.stringify({
      macro: { name: macro.use, arguments: macro.args },
    } satisfies AutomationConfigInput);
  const scene = config.actionType === "activate_scene";
  return JSON.stringify({
    action: {
      actionType: config.actionType,
      targetType: scene ? "" : config.targetType,
      targetId: scene ? "" : config.targetId,
      targetExpr: scene ? [] : (config.targetExpr ?? []),
      payload: scene ? { sceneId: config.targetId } : actionPayloadToAPI(config.payload),
    },
  } satisfies AutomationConfigInput);
}

export type TriggerField =
  | "mode"
  | "device"
  | "property"
  | "value"
  | "eventValue"
  | "endpoint"
  | "webhookFilter"
  | "interval"
  | "cronExpr"
  | "customExpr";

export interface ValidationError<F extends string> {
  field: F;
  code: AutomationValidationCode;
}

export type AutomationValidationCode =
  | "trigger_required"
  | "condition_required"
  | "device_required"
  | "property_required"
  | "value_required"
  | "event_required"
  | "webhook_required"
  | "filter_path_required"
  | "filter_value_type_required"
  | "filter_text_operator_type"
  | "filter_number_operator_type"
  | "filter_value_required"
  | "interval_positive"
  | "cron_required"
  | "expression_required"
  | "rules_required"
  | "target_required"
  | "action_required"
  | "alarm_id_required"
  | "json_invalid"
  | "effect_required"
  | "scenes_minimum"
  | "scene_reference_invalid"
  | "field_required"
  | "delta_non_zero"
  | "change_mode_invalid"
  | "settings_required"
  | "setting_invalid"
  | "setting_value_invalid";

export function validateTriggerConfig(config: TriggerConfig): ValidationError<TriggerField> | null {
  if (!config.mode) return { field: "mode", code: "trigger_required" };
  if (config.holdMs && !config.deviceId) return { field: "device", code: "device_required" };
  switch (config.mode) {
    case "device_state":
      if (!config.deviceId) return { field: "device", code: "device_required" };
      if (!config.property) return { field: "property", code: "property_required" };
      if (config.value === undefined || (config.value === "" && config.valueType !== "string")) {
        return { field: "value", code: "value_required" };
      }
      return null;
    case "device_event":
      if (!config.deviceId) return { field: "device", code: "device_required" };
      return null;
    case "availability":
      if (!config.deviceId) return { field: "device", code: "device_required" };
      return null;
    case "webhook": {
      if (!config.endpointId) return { field: "endpoint", code: "webhook_required" };
      for (const rule of config.webhookFilters ?? []) {
        if (!rule.path.trim()) return { field: "webhookFilter", code: "filter_path_required" };
        if (rule.operator === "exists" || rule.operator === "not_exists") continue;
        if (!rule.value_type) return { field: "webhookFilter", code: "filter_value_type_required" };
        if (
          (rule.operator === "contains" ||
            rule.operator === "starts_with" ||
            rule.operator === "ends_with") &&
          rule.value_type !== "string"
        ) {
          return { field: "webhookFilter", code: "filter_text_operator_type" };
        }
        if (
          (rule.operator === "greater_than" ||
            rule.operator === "greater_than_or_equal" ||
            rule.operator === "less_than" ||
            rule.operator === "less_than_or_equal") &&
          rule.value_type !== "number"
        ) {
          return { field: "webhookFilter", code: "filter_number_operator_type" };
        }
        if (rule.value_type !== "null" && (rule.value === undefined || rule.value === "")) {
          return { field: "webhookFilter", code: "filter_value_required" };
        }
      }
      return null;
    }
    case "schedule": {
      const submode = config.scheduleSubmode ?? "at";
      if (submode === "every") {
        if (!config.scheduleIntervalValue || config.scheduleIntervalValue <= 0) {
          return { field: "interval", code: "interval_positive" };
        }
      } else if (submode === "custom") {
        if (!config.cronExpr || config.cronExpr.trim() === "") {
          return { field: "cronExpr", code: "cron_required" };
        }
      }
      return null;
    }
    case "custom":
      if (!config.customExpr || config.customExpr.trim() === "") {
        return { field: "customExpr", code: "expression_required" };
      }
      return null;
    default:
      return null;
  }
}

/**
 * A fanout action's target is valid when it is either a direct device/group/room
 * or an expression with at least one rule.
 */
function targetSelected(config: ActionConfigShape): boolean {
  if (config.targetType === "expression") return (config.targetExpr?.length ?? 0) > 0;
  return !!config.targetType && !!config.targetId;
}

function targetError(config: ActionConfigShape): ValidationError<ActionField> {
  return {
    field: "target",
    code: config.targetType === "expression" ? "rules_required" : "target_required",
  };
}

export type ActionField = "actionType" | "target" | "payload";

export function validateActionConfig(
  config: ActionConfigShape,
): ValidationError<ActionField> | null {
  if (!config.actionType) return { field: "actionType", code: "action_required" };
  if (config.actionType === MACRO_ACTION) return null;
  if (config.actionType === "raise_alarm" || config.actionType === "clear_alarm") {
    try {
      const parsed = JSON.parse(config.payload || "{}") as Record<string, unknown>;
      if (
        !parsed.alarm_id ||
        typeof parsed.alarm_id !== "string" ||
        parsed.alarm_id.trim() === ""
      ) {
        return { field: "payload", code: "alarm_id_required" };
      }
    } catch {
      return { field: "payload", code: "json_invalid" };
    }
    return null;
  }
  if (config.actionType === "run_effect") {
    try {
      const parsed = JSON.parse(config.payload || "{}") as Record<string, unknown>;
      const hasEffect = typeof parsed.effect_id === "string" && parsed.effect_id.trim() !== "";
      const hasNative = typeof parsed.native_name === "string" && parsed.native_name.trim() !== "";
      if (hasEffect === hasNative) {
        return { field: "payload", code: "effect_required" };
      }
    } catch {
      return { field: "payload", code: "json_invalid" };
    }
    if (!targetSelected(config)) return targetError(config);
    return null;
  }
  if (config.actionType === "cycle_scenes") {
    let parsed: { scenes?: unknown };
    try {
      parsed = JSON.parse(config.payload || "{}") as { scenes?: unknown };
    } catch {
      return { field: "payload", code: "json_invalid" };
    }
    const scenes = Array.isArray(parsed.scenes) ? parsed.scenes : [];
    if (scenes.length < 2) {
      return { field: "payload", code: "scenes_minimum" };
    }
    if (scenes.some((s) => typeof s !== "string" || !s)) {
      return { field: "payload", code: "scene_reference_invalid" };
    }
    return null;
  }
  if (config.actionType === "toggle_device_state") {
    if (!targetSelected(config)) return targetError(config);
    return null;
  }
  if (config.actionType === "change_value") {
    if (!targetSelected(config)) return targetError(config);
    let parsed: { field?: unknown; delta?: unknown; mode?: unknown };
    try {
      parsed = JSON.parse(config.payload || "{}") as {
        field?: unknown;
        delta?: unknown;
        mode?: unknown;
      };
    } catch {
      return { field: "payload", code: "json_invalid" };
    }
    if (typeof parsed.field !== "string" || parsed.field.trim() === "") {
      return { field: "payload", code: "field_required" };
    }
    if (typeof parsed.delta !== "number" || !Number.isFinite(parsed.delta) || parsed.delta === 0) {
      return { field: "payload", code: "delta_non_zero" };
    }
    if (parsed.mode !== undefined && parsed.mode !== "absolute" && parsed.mode !== "percent") {
      return { field: "payload", code: "change_mode_invalid" };
    }
    return null;
  }
  if (config.actionType === "configure_device") {
    if (config.targetType !== "device" || !config.targetId) {
      return { field: "target", code: "device_required" };
    }
    let parsed: { settings?: unknown };
    try {
      parsed = JSON.parse(config.payload || "{}") as { settings?: unknown };
    } catch {
      return { field: "payload", code: "json_invalid" };
    }
    if (!Array.isArray(parsed.settings) || parsed.settings.length === 0) {
      return { field: "payload", code: "settings_required" };
    }
    for (const setting of parsed.settings) {
      if (typeof setting !== "object" || setting === null) {
        return { field: "payload", code: "setting_invalid" };
      }
      const value = setting as Record<string, unknown>;
      if (typeof value.capability !== "string" || value.capability === "") {
        return { field: "payload", code: "setting_invalid" };
      }
      const typedValues = [value.booleanValue, value.numberValue, value.stringValue].filter(
        (candidate) => candidate !== null && candidate !== undefined,
      );
      if (
        typedValues.length !== 1 ||
        (typeof typedValues[0] !== "boolean" &&
          typeof typedValues[0] !== "number" &&
          typeof typedValues[0] !== "string")
      ) {
        return { field: "payload", code: "setting_value_invalid" };
      }
    }
    return null;
  }
  if (!targetSelected(config)) return targetError(config);
  return null;
}

export function summarizeSchedule(config: TriggerConfig): string {
  const options = locale.messageOptions();
  switch (config.scheduleSubmode) {
    case "at": {
      const pad = (value: number | undefined) => String(value ?? 0).padStart(2, "0");
      const time = `${pad(config.scheduleHour)}:${pad(config.scheduleMinute)}:${pad(config.scheduleSecond)}`;
      const days = config.scheduleWeekdays ?? [];
      return days.length
        ? m.automation_schedule_at_days(
            { time, days: formatList(days.map((code) => weekdayLabel(code))) },
            options,
          )
        : m.automation_schedule_every_day_at({ time }, options);
    }
    case "every": {
      const count = config.scheduleIntervalValue ?? 1;
      if (config.scheduleIntervalUnit === "hours")
        return m.automation_schedule_every_hours({ count }, options);
      if (config.scheduleIntervalUnit === "seconds")
        return m.automation_schedule_every_seconds({ count }, options);
      return m.automation_schedule_every_minutes({ count }, options);
    }
    default:
      return humanizeCron(config.cronExpr ?? "");
  }
}

export function humanizeCron(cronExpr: string): string {
  const options = locale.messageOptions();
  const atMatch = cronExpr.match(/^(\d+) (\d+) (\d+) \* \* (\S+)$/);
  if (atMatch) {
    const [, s, minute, h, dow] = atMatch;
    const time = `${h.padStart(2, "0")}:${minute.padStart(2, "0")}:${s.padStart(2, "0")}`;
    if (dow === "*") return m.automation_schedule_every_day_at({ time }, options);
    return m.automation_schedule_at_days(
      { time, days: formatList(dow.split(",").map((code) => weekdayLabel(code))) },
      options,
    );
  }
  const everySec = cronExpr.match(/^\*\/(\d+) \* \* \* \* \*$/);
  if (everySec) return m.automation_schedule_every_seconds({ count: Number(everySec[1]) }, options);
  if (cronExpr === "* * * * * *") return m.automation_schedule_every_seconds({ count: 1 }, options);
  const everyMin = cronExpr.match(/^0 \*\/(\d+) \* \* \* \*$/);
  if (everyMin) return m.automation_schedule_every_minutes({ count: Number(everyMin[1]) }, options);
  if (cronExpr === "0 * * * * *") return m.automation_schedule_every_minutes({ count: 1 }, options);
  const everyHr = cronExpr.match(/^0 0 \*\/(\d+) \* \* \*$/);
  if (everyHr) return m.automation_schedule_every_hours({ count: Number(everyHr[1]) }, options);
  if (cronExpr === "0 0 * * * *") return m.automation_schedule_every_hours({ count: 1 }, options);
  return cronExpr || m.automation_schedule_not_set({}, options);
}

export function weekdayLabel(code: string, style: "long" | "short" | "narrow" = "long"): string {
  const offsets: Record<string, number> = {
    MON: 0,
    TUE: 1,
    WED: 2,
    THU: 3,
    FRI: 4,
    SAT: 5,
    SUN: 6,
  };
  const offset = offsets[code];
  if (offset === undefined) return code;
  const date = new Date(Date.UTC(2024, 0, 1 + offset));
  return new Intl.DateTimeFormat(locale.intlLocale, { weekday: style, timeZone: "UTC" }).format(
    date,
  );
}
