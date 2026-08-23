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
}

// TIMING_PRESETS feeds the Grace/Cooldown selects in the trigger node. Values
// are in milliseconds so the runtime and the UI agree without unit conversion.
export const TIMING_PRESETS: { value: number; label: string }[] = [
  { value: 0, label: "Immediate" },
  { value: 500, label: "500 ms" },
  { value: 1000, label: "1 s" },
  { value: 5000, label: "5 s" },
  { value: 10000, label: "10 s" },
  { value: 30000, label: "30 s" },
  { value: 60000, label: "1 min" },
];

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

function escapeExprString(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function isNumericString(s: string): boolean {
  return s !== "" && !isNaN(Number(s));
}

// generateFilterExpr composes the event-payload filter expression for an event
// trigger. It never applies to schedule triggers.
export function generateFilterExpr(config: TriggerConfig): string {
  switch (config.mode) {
    case "device_state": {
      if (!config.deviceId || !config.property) return "true";
      const prop = `trigger.payload.state.${config.property}`;
      const cmp = config.comparator ?? "==";
      const val = config.value ?? "";
      if (val === "") return "true";
      let formatted: string;
      if (val === "true" || val === "false") {
        formatted = val;
      } else if (isNumericString(val)) {
        formatted = val;
      } else {
        formatted = `"${escapeExprString(val)}"`;
      }
      return `trigger.device_id == "${escapeExprString(config.deviceId)}" && ${prop} != nil && ${prop} ${cmp} ${formatted}`;
    }
    case "device_event": {
      if (!config.deviceId) return "true";
      const parts: string[] = [];
      parts.push(`trigger.device_id == "${escapeExprString(config.deviceId)}"`);
      if (config.eventValue) {
        parts.push(`trigger.payload.action == "${escapeExprString(config.eventValue)}"`);
      }
      return parts.join(" && ");
    }
    case "availability": {
      if (!config.deviceId) return "true";
      return `trigger.device_id == "${escapeExprString(config.deviceId)}"`;
    }
    case "webhook":
      return "true";
    case "custom":
      return config.customExpr || "true";
    default:
      return "true";
  }
}

const WEEKDAY_CODES = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

function padN(n: number | undefined, fallback: number): number {
  return n ?? fallback;
}

// generateCronExpr composes a 6-field cron expression from the schedule fields.
// Sub-mode "custom" returns the raw cronExpr unchanged.
export function generateCronExpr(config: TriggerConfig): string {
  const submode = config.scheduleSubmode ?? "at";
  if (submode === "custom") {
    return config.cronExpr ?? "";
  }
  if (submode === "every") {
    const n = config.scheduleIntervalValue ?? 0;
    const unit = config.scheduleIntervalUnit ?? "seconds";
    if (n <= 0) return "";
    if (unit === "seconds") {
      if (n === 1) return "* * * * * *";
      return `*/${n} * * * * *`;
    }
    if (unit === "minutes") {
      if (n === 1) return "0 * * * * *";
      return `0 */${n} * * * *`;
    }
    // hours
    if (n === 1) return "0 0 * * * *";
    return `0 0 */${n} * * *`;
  }
  // "at"
  const sec = padN(config.scheduleSecond, 0);
  const min = padN(config.scheduleMinute, 0);
  const hr = padN(config.scheduleHour, 0);
  const weekdays = config.scheduleWeekdays ?? [];
  const dow = weekdays.length === 0 || weekdays.length === 7 ? "*" : weekdays.join(",");
  return `${sec} ${min} ${hr} * * ${dow}`;
}

export function humanizeCron(cronExpr: string): string {
  const atMatch = cronExpr.match(/^(\d+) (\d+) (\d+) \* \* (\S+)$/);
  if (atMatch) {
    const [, s, m, h, dow] = atMatch;
    const time = `${h.padStart(2, "0")}:${m.padStart(2, "0")}:${s.padStart(2, "0")}`;
    if (dow === "*") return `Every day at ${time}`;
    return `At ${time} on ${dow.replace(/,/g, ", ")}`;
  }
  const everySec = cronExpr.match(/^\*\/(\d+) \* \* \* \* \*$/);
  if (everySec) return `Every ${everySec[1]} seconds`;
  if (cronExpr === "* * * * * *") return "Every second";
  const everyMin = cronExpr.match(/^0 \*\/(\d+) \* \* \* \*$/);
  if (everyMin) return `Every ${everyMin[1]} minutes`;
  if (cronExpr === "0 * * * * *") return "Every minute";
  const everyHr = cronExpr.match(/^0 0 \*\/(\d+) \* \* \*$/);
  if (everyHr) return `Every ${everyHr[1]} hours`;
  if (cronExpr === "0 0 * * * *") return "Every hour";
  return cronExpr || "(not set)";
}

// parseAtModeFromCron returns {hour, minute, second, weekdays} if cron matches
// the "at" sub-mode pattern, otherwise null.
export function parseAtModeFromCron(cron: string): {
  hour: number;
  minute: number;
  second: number;
  weekdays: string[];
} | null {
  const m = cron.match(/^(\d+) (\d+) (\d+) \* \* (\S+)$/);
  if (!m) return null;
  const [, s, mm, hh, dow] = m;
  const weekdays = dow === "*" ? [] : dow.split(",").filter((d) => WEEKDAY_CODES.includes(d));
  if (dow !== "*" && weekdays.length !== dow.split(",").length) return null;
  return {
    hour: Number(hh),
    minute: Number(mm),
    second: Number(s),
    weekdays,
  };
}

// parseEveryModeFromCron returns {value, unit} if cron matches the "every"
// sub-mode pattern, otherwise null.
export function parseEveryModeFromCron(cron: string): {
  value: number;
  unit: ScheduleIntervalUnit;
} | null {
  let m = cron.match(/^\*\/(\d+) \* \* \* \* \*$/);
  if (m) return { value: Number(m[1]), unit: "seconds" };
  if (cron === "* * * * * *") return { value: 1, unit: "seconds" };
  m = cron.match(/^0 \*\/(\d+) \* \* \* \*$/);
  if (m) return { value: Number(m[1]), unit: "minutes" };
  if (cron === "0 * * * * *") return { value: 1, unit: "minutes" };
  m = cron.match(/^0 0 \*\/(\d+) \* \* \*$/);
  if (m) return { value: Number(m[1]), unit: "hours" };
  if (cron === "0 0 * * * *") return { value: 1, unit: "hours" };
  return null;
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
  const graceMs = typeof raw.grace_ms === "number" ? raw.grace_ms : undefined;
  const cooldownMs = typeof raw.cooldown_ms === "number" ? raw.cooldown_ms : undefined;

  // If the raw object already looks like our internal TS shape (has `mode`),
  // just coerce it.
  if ("mode" in raw && typeof raw.mode === "string") {
    return raw as unknown as TriggerConfig;
  }

  // Schedule trigger
  if (raw.kind === "schedule" || (typeof raw.cron_expr === "string" && raw.cron_expr !== "")) {
    const cron = (raw.cron_expr as string) ?? "";
    // Try to detect sub-mode
    const atParts = parseAtModeFromCron(cron);
    if (atParts) {
      return {
        mode: "schedule",
        scheduleSubmode: "at",
        cronExpr: cron,
        scheduleHour: atParts.hour,
        scheduleMinute: atParts.minute,
        scheduleSecond: atParts.second,
        scheduleWeekdays: atParts.weekdays,
        graceMs,
        cooldownMs,
      };
    }
    const every = parseEveryModeFromCron(cron);
    if (every) {
      return {
        mode: "schedule",
        scheduleSubmode: "every",
        cronExpr: cron,
        scheduleIntervalValue: every.value,
        scheduleIntervalUnit: every.unit,
        graceMs,
        cooldownMs,
      };
    }
    return {
      mode: "schedule",
      scheduleSubmode: "custom",
      cronExpr: cron,
      graceMs,
      cooldownMs,
    };
  }

  // Event-trigger fields can arrive in either persisted or in-memory casing.
  const eventType =
    (raw.event_type as string) ?? (raw.eventType as string) ?? "device.state_changed";
  const filter =
    (raw.filter_expr as string) ??
    (raw.condition_expr as string) ??
    (raw.condition as string) ??
    (raw.customExpr as string) ??
    "";

  if (eventType === "webhook.received") {
    const filters = Array.isArray(raw.webhook_filters)
      ? (raw.webhook_filters as WebhookFilterRule[])
      : [];
    return {
      mode: "webhook",
      eventType,
      endpointId: typeof raw.endpoint_id === "string" ? raw.endpoint_id : undefined,
      webhookFilters: filters,
      graceMs,
      cooldownMs,
    };
  }

  // Derive the UI mode from the filter expression shape.
  // deviceName can't be recovered from `trigger.device_id ==`-only filters;
  // the UI will fill it by looking up deviceId in the devices list.
  if (eventType === "device.availability_changed") {
    const m = filter.match(/^trigger\.device_id == "([^"]+)"$/);
    if (m) {
      return { mode: "availability", eventType, deviceId: m[1], graceMs, cooldownMs };
    }
  }
  if (eventType === "device.action_fired") {
    const eventWithValue = filter.match(
      /^trigger\.device_id == "([^"]+)" && trigger\.payload\.action == "([^"]+)"$/,
    );
    if (eventWithValue) {
      return {
        mode: "device_event",
        eventType,
        deviceId: eventWithValue[1],
        eventValue: eventWithValue[2],
        graceMs,
        cooldownMs,
      };
    }
    const eventDeviceOnly = filter.match(/^trigger\.device_id == "([^"]+)"$/);
    if (eventDeviceOnly) {
      return {
        mode: "device_event",
        eventType,
        deviceId: eventDeviceOnly[1],
        graceMs,
        cooldownMs,
      };
    }
  }
  if (eventType === "device.state_changed") {
    const scoped = filter.match(
      /^trigger\.device_id == "([^"]+)" && trigger\.payload\.state\.(\w+) != nil && trigger\.payload\.state\.\2\s*(==|!=|<=|>=|<|>)\s*(.+)$/,
    );
    if (scoped) {
      let val = scoped[4].trim();
      if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
      return {
        mode: "device_state",
        eventType,
        deviceId: scoped[1],
        property: scoped[2],
        comparator: scoped[3],
        value: val,
        graceMs,
        cooldownMs,
      };
    }
    const ds = filter.match(/^device\("([^"]+)"\)\.(\w+)\s*(==|!=|<=|>=|<|>)\s*(.+)$/);
    if (ds) {
      let val = ds[4].trim();
      if (val.startsWith('"') && val.endsWith('"')) {
        val = val.slice(1, -1);
      }
      return {
        mode: "device_state",
        eventType,
        deviceName: ds[1],
        property: ds[2],
        comparator: ds[3],
        value: val,
        graceMs,
        cooldownMs,
      };
    }
  }

  return {
    mode: "custom",
    eventType,
    customExpr: filter || "true",
    graceMs,
    cooldownMs,
  };
}

export function serializeTriggerConfig(config: TriggerConfig): string {
  if (config.mode === "") return JSON.stringify({ mode: "" });

  const timing: { grace_ms?: number; cooldown_ms?: number } = {};
  if (config.graceMs && config.graceMs > 0) timing.grace_ms = config.graceMs;
  if (config.cooldownMs && config.cooldownMs > 0) timing.cooldown_ms = config.cooldownMs;

  if (config.mode === "schedule") {
    return JSON.stringify({
      kind: "schedule",
      cron_expr: generateCronExpr(config),
      ...timing,
    });
  }
  if (config.mode === "webhook") {
    return JSON.stringify({
      kind: "event",
      event_type: "webhook.received",
      filter_expr: "true",
      endpoint_id: config.endpointId ?? "",
      webhook_filters: config.webhookFilters ?? [],
      ...timing,
    });
  }
  return JSON.stringify({
    kind: "event",
    event_type: config.eventType ?? eventTypeForMode(config.mode),
    filter_expr: generateFilterExpr(config),
    ...timing,
  });
}

export function serializeOperatorConfig(config: { operator: string }): string {
  return JSON.stringify({
    kind: config.operator.toLowerCase(),
  });
}

export function serializeActionConfig(config: {
  actionType: string;
  targetType: string;
  targetId: string;
  targetExpr?: { connector?: string; subject: string; op: string; values: string[] }[];
  payload: string;
}): string {
  return JSON.stringify({
    action_type: config.actionType,
    target_type: config.targetType,
    target_id: config.targetId,
    target_expr: config.targetExpr ?? [],
    payload: config.actionType === "toggle_device_state" ? "" : config.payload,
  });
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
  message: string;
}

export function validateTriggerConfig(config: TriggerConfig): ValidationError<TriggerField> | null {
  if (!config.mode) return { field: "mode", message: "Pick a trigger" };
  switch (config.mode) {
    case "device_state":
      if (!config.deviceId) return { field: "device", message: "Pick a device" };
      if (!config.property) return { field: "property", message: "Pick a property" };
      if (config.value === undefined || config.value === "") {
        return { field: "value", message: "Set a value" };
      }
      return null;
    case "device_event":
      if (!config.deviceId) return { field: "device", message: "Pick a device" };
      if (!config.eventValue) return { field: "eventValue", message: "Pick an event" };
      return null;
    case "availability":
      if (!config.deviceId) return { field: "device", message: "Pick a device" };
      return null;
    case "webhook": {
      if (!config.endpointId) return { field: "endpoint", message: "Pick a webhook" };
      for (const rule of config.webhookFilters ?? []) {
        if (!rule.path.trim()) return { field: "webhookFilter", message: "Set every filter path" };
        if (rule.operator === "exists" || rule.operator === "not_exists") continue;
        if (!rule.value_type)
          return { field: "webhookFilter", message: "Set every filter value type" };
        if (
          (rule.operator === "contains" ||
            rule.operator === "starts_with" ||
            rule.operator === "ends_with") &&
          rule.value_type !== "string"
        ) {
          return { field: "webhookFilter", message: "Use text with text comparisons" };
        }
        if (
          (rule.operator === "greater_than" ||
            rule.operator === "greater_than_or_equal" ||
            rule.operator === "less_than" ||
            rule.operator === "less_than_or_equal") &&
          rule.value_type !== "number"
        ) {
          return { field: "webhookFilter", message: "Use numbers with numeric comparisons" };
        }
        if (rule.value_type !== "null" && (rule.value === undefined || rule.value === "")) {
          return { field: "webhookFilter", message: "Set every filter value" };
        }
      }
      return null;
    }
    case "schedule": {
      const submode = config.scheduleSubmode ?? "at";
      if (submode === "every") {
        if (!config.scheduleIntervalValue || config.scheduleIntervalValue <= 0) {
          return { field: "interval", message: "Set a positive interval" };
        }
      } else if (submode === "custom") {
        if (!config.cronExpr || config.cronExpr.trim() === "") {
          return { field: "cronExpr", message: "Enter a cron expression" };
        }
      }
      return null;
    }
    case "custom":
      if (!config.customExpr || config.customExpr.trim() === "") {
        return { field: "customExpr", message: "Enter an expression" };
      }
      return null;
    default:
      return null;
  }
}

export interface ActionConfigShape {
  actionType: string;
  targetType: string;
  targetId: string;
  targetExpr?: { connector?: string; subject: string; op: string; values: string[] }[];
  payload: string;
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
    message: config.targetType === "expression" ? "Add at least one rule" : "Pick a target",
  };
}

export type ActionField = "actionType" | "target" | "payload";

export function validateActionConfig(
  config: ActionConfigShape,
): ValidationError<ActionField> | null {
  if (!config.actionType) return { field: "actionType", message: "Pick an action" };
  if (config.actionType === "raise_alarm" || config.actionType === "clear_alarm") {
    try {
      const parsed = JSON.parse(config.payload || "{}") as Record<string, unknown>;
      if (
        !parsed.alarm_id ||
        typeof parsed.alarm_id !== "string" ||
        parsed.alarm_id.trim() === ""
      ) {
        return { field: "payload", message: "Set an alarm id" };
      }
    } catch {
      return { field: "payload", message: "Payload must be valid JSON" };
    }
    return null;
  }
  if (config.actionType === "run_effect") {
    try {
      const parsed = JSON.parse(config.payload || "{}") as Record<string, unknown>;
      const hasEffect = typeof parsed.effect_id === "string" && parsed.effect_id.trim() !== "";
      const hasNative = typeof parsed.native_name === "string" && parsed.native_name.trim() !== "";
      if (hasEffect === hasNative) {
        return { field: "payload", message: "Pick an effect" };
      }
    } catch {
      return { field: "payload", message: "Payload must be valid JSON" };
    }
    if (!targetSelected(config)) return targetError(config);
    return null;
  }
  if (config.actionType === "cycle_scenes") {
    let parsed: { scenes?: unknown };
    try {
      parsed = JSON.parse(config.payload || "{}") as { scenes?: unknown };
    } catch {
      return { field: "payload", message: "Payload must be valid JSON" };
    }
    const scenes = Array.isArray(parsed.scenes) ? parsed.scenes : [];
    if (scenes.length < 2) {
      return { field: "payload", message: "Add at least two scenes" };
    }
    if (scenes.some((s) => typeof s !== "string" || !s)) {
      return { field: "payload", message: "Invalid scene reference" };
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
      return { field: "payload", message: "Payload must be valid JSON" };
    }
    if (typeof parsed.field !== "string" || parsed.field.trim() === "") {
      return { field: "payload", message: "Pick a field" };
    }
    if (typeof parsed.delta !== "number" || !Number.isFinite(parsed.delta) || parsed.delta === 0) {
      return { field: "payload", message: "Set a non-zero delta" };
    }
    if (parsed.mode !== undefined && parsed.mode !== "absolute" && parsed.mode !== "percent") {
      return { field: "payload", message: "Mode must be absolute or percent" };
    }
    return null;
  }
  if (config.actionType === "configure_device") {
    if (config.targetType !== "device" || !config.targetId) {
      return { field: "target", message: "Pick a device" };
    }
    let parsed: { settings?: unknown };
    try {
      parsed = JSON.parse(config.payload || "{}") as { settings?: unknown };
    } catch {
      return { field: "payload", message: "Payload must be valid JSON" };
    }
    if (!Array.isArray(parsed.settings) || parsed.settings.length === 0) {
      return { field: "payload", message: "Add at least one setting" };
    }
    for (const setting of parsed.settings) {
      if (typeof setting !== "object" || setting === null) {
        return { field: "payload", message: "Invalid setting" };
      }
      const value = setting as Record<string, unknown>;
      if (typeof value.capability !== "string" || value.capability === "") {
        return { field: "payload", message: "Invalid setting" };
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
        return { field: "payload", message: "Invalid setting value" };
      }
    }
    return null;
  }
  if (!targetSelected(config)) return targetError(config);
  return null;
}
