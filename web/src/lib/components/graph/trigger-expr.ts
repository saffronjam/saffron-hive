export type TriggerMode = "device_state" | "button_action" | "availability" | "schedule" | "custom";

export type TriggerKind = "event" | "schedule";

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
}

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
      if (!config.deviceId || !config.deviceName) return "true";
      const parts: string[] = [];
      parts.push(`trigger.device_id == "${escapeExprString(config.deviceId)}"`);
      if (config.actionValue) {
        parts.push(
          `device("${escapeExprString(config.deviceName)}").action == "${escapeExprString(config.actionValue)}"`,
        );
      }
      return parts.join(" && ");
    }
    case "availability": {
      if (!config.deviceId) return "true";
      return `trigger.device_id == "${escapeExprString(config.deviceId)}"`;
    }
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
    case "device_state":
    case "button_action":
      return "device.state_changed";
    case "availability":
      return "device.availability_changed";
    case "schedule":
      return ""; // not used for schedule triggers
    case "custom":
      return "device.state_changed";
  }
}

export function triggerKindForMode(mode: TriggerMode): TriggerKind {
  return mode === "schedule" ? "schedule" : "event";
}

export function defaultTriggerConfig(): TriggerConfig {
  return {
    mode: "device_state",
    eventType: "device.state_changed",
  };
}

export function normalizeTriggerConfig(raw: Record<string, unknown>): TriggerConfig {
  // If the raw object already looks like our internal TS shape (has `mode`),
  // just coerce it.
  if (raw.mode && typeof raw.mode === "string") {
    return raw as unknown as TriggerConfig;
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
      };
    }
    return {
      mode: "schedule",
      scheduleSubmode: "custom",
      cronExpr: cron,
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

  return {
    mode: "custom",
    eventType,
    customExpr: filter || "true",
  };
}

export function serializeTriggerConfig(config: TriggerConfig): string {
  if (config.mode === "schedule") {
    return JSON.stringify({
      kind: "schedule",
      cron_expr: generateCronExpr(config),
    });
  }
  return JSON.stringify({
    kind: "event",
    event_type: config.eventType ?? eventTypeForMode(config.mode),
    filter_expr: generateFilterExpr(config),
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
