export type TriggerMode =
  | "device_state"
  | "button_action"
  | "availability"
  | "schedule"
  | "manual"
  | "custom";

export type TriggerKind = "event" | "schedule" | "manual";

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
  actionValue?: string;
  customExpr?: string;
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
};

export function capabilityToExprProperty(capName: string): string {
  return capToExprProperty[capName] ?? capName;
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
      if (!config.deviceName || !config.property) return "true";
      const prop = `device("${escapeExprString(config.deviceName)}").${config.property}`;
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
      return `${prop} ${cmp} ${formatted}`;
    }
    case "button_action": {
      if (!config.deviceId) return "true";
      const parts: string[] = [];
      parts.push(`trigger.device_id == "${escapeExprString(config.deviceId)}"`);
      if (config.actionValue) {
        parts.push(`trigger.payload.action == "${escapeExprString(config.actionValue)}"`);
      }
      return parts.join(" && ");
    }
    case "availability": {
      if (!config.deviceId) return "true";
      return `trigger.device_id == "${escapeExprString(config.deviceId)}"`;
    }
    case "custom":
      return config.customExpr || "true";
    case "manual":
      return "true";
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
    case "device_state":
      return "device.state_changed";
    case "button_action":
      return "device.action_fired";
    case "availability":
      return "device.availability_changed";
    case "schedule":
      return ""; // not used for schedule triggers
    case "manual":
      return ""; // not used for manual triggers
    case "custom":
      return "device.state_changed";
  }
}

export function triggerKindForMode(mode: TriggerMode): TriggerKind {
  if (mode === "schedule") return "schedule";
  if (mode === "manual") return "manual";
  return "event";
}

export function defaultTriggerConfig(): TriggerConfig {
  return {
    mode: "device_state",
    eventType: "device.state_changed",
  };
}

export function normalizeTriggerConfig(raw: Record<string, unknown>): TriggerConfig {
  const graceMs = typeof raw.grace_ms === "number" ? raw.grace_ms : undefined;
  const cooldownMs = typeof raw.cooldown_ms === "number" ? raw.cooldown_ms : undefined;

  // If the raw object already looks like our internal TS shape (has `mode`),
  // just coerce it.
  if (raw.mode && typeof raw.mode === "string") {
    return raw as unknown as TriggerConfig;
  }

  // Manual trigger (has no config beyond kind)
  if (raw.kind === "manual") {
    return { mode: "manual", graceMs, cooldownMs };
  }

  // Schedule trigger (new shape)
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

  // Event trigger (new or legacy shape)
  const eventType =
    (raw.event_type as string) ?? (raw.eventType as string) ?? "device.state_changed";
  const filter =
    (raw.filter_expr as string) ??
    (raw.condition_expr as string) ??
    (raw.condition as string) ??
    (raw.customExpr as string) ??
    "";

  // Reverse-engineer the UI mode from the filter expression shape.
  // deviceName can't be recovered from `trigger.device_id ==`-only filters;
  // the UI will fill it by looking up deviceId in the devices list.
  if (eventType === "device.availability_changed") {
    const m = filter.match(/^trigger\.device_id == "([^"]+)"$/);
    if (m) {
      return { mode: "availability", eventType, deviceId: m[1], graceMs, cooldownMs };
    }
  }
  if (eventType === "device.action_fired") {
    const btnFull = filter.match(
      /^trigger\.device_id == "([^"]+)" && trigger\.payload\.action == "([^"]+)"$/,
    );
    if (btnFull) {
      return {
        mode: "button_action",
        eventType,
        deviceId: btnFull[1],
        actionValue: btnFull[2],
        graceMs,
        cooldownMs,
      };
    }
    const btnDevOnly = filter.match(/^trigger\.device_id == "([^"]+)"$/);
    if (btnDevOnly) {
      return {
        mode: "button_action",
        eventType,
        deviceId: btnDevOnly[1],
        graceMs,
        cooldownMs,
      };
    }
  }
  if (eventType === "device.state_changed") {
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
  if (config.mode === "manual") {
    return JSON.stringify({ kind: "manual", ...timing });
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
  payload: string;
}): string {
  return JSON.stringify({
    action_type: config.actionType,
    target_type: config.targetType,
    target_id: config.targetId,
    payload: config.payload,
  });
}

// Legacy alias so existing callers keep working until we update them all.
export const generateConditionExpr = generateFilterExpr;

export type TriggerField =
  | "device"
  | "property"
  | "value"
  | "actionValue"
  | "interval"
  | "cronExpr"
  | "customExpr";

export interface ValidationError<F extends string> {
  field: F;
  message: string;
}

export function validateTriggerConfig(config: TriggerConfig): ValidationError<TriggerField> | null {
  switch (config.mode) {
    case "device_state":
      if (!config.deviceId) return { field: "device", message: "Pick a device" };
      if (!config.property) return { field: "property", message: "Pick a property" };
      if (config.value === undefined || config.value === "") {
        return { field: "value", message: "Set a value" };
      }
      return null;
    case "button_action":
      if (!config.deviceId) return { field: "device", message: "Pick a device" };
      if (!config.actionValue) return { field: "actionValue", message: "Pick an action" };
      return null;
    case "availability":
      if (!config.deviceId) return { field: "device", message: "Pick a device" };
      return null;
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
    case "manual":
      return null;
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
  payload: string;
}

export type ActionField = "actionType" | "target" | "payload";

export function validateActionConfig(
  config: ActionConfigShape,
): ValidationError<ActionField> | null {
  if (!config.actionType) return { field: "actionType", message: "Pick an action type" };
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
      if (
        !parsed.effect_id ||
        typeof parsed.effect_id !== "string" ||
        parsed.effect_id.trim() === ""
      ) {
        return { field: "payload", message: "Pick an effect" };
      }
    } catch {
      return { field: "payload", message: "Payload must be valid JSON" };
    }
    if (!config.targetType || !config.targetId) {
      return { field: "target", message: "Pick a target" };
    }
    return null;
  }
  if (!config.targetType || !config.targetId) {
    return { field: "target", message: "Pick a target" };
  }
  return null;
}
