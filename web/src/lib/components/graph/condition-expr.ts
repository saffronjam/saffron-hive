export type ConditionMode = "time_window" | "weekday" | "device_state" | "custom";
export type ConditionTargetType = "device" | "group" | "room";

export interface ConditionConfig {
  mode: ConditionMode;
  // time_window
  afterHour?: number;
  afterMinute?: number;
  beforeHour?: number;
  beforeMinute?: number;
  // weekday
  weekdays?: string[];
  // device_state (target may be a device, group, or room — groups/rooms only
  // expose `on`; the wire-level expression always uses `device("Name")`).
  targetType?: ConditionTargetType;
  targetId?: string;
  targetName?: string;
  property?: string;
  comparator?: string;
  value?: string;
  // custom
  customExpr?: string;
}

function escapeExprString(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function isNumericString(s: string): boolean {
  return s !== "" && !isNaN(Number(s));
}

function timeToMinutes(h: number, m: number): number {
  return h * 60 + m;
}

export function generateConditionExpr(config: ConditionConfig): string {
  switch (config.mode) {
    case "time_window": {
      const hasAfter = config.afterHour !== undefined;
      const hasBefore = config.beforeHour !== undefined;
      if (!hasAfter && !hasBefore) return "true";

      const afterMins = hasAfter ? timeToMinutes(config.afterHour!, config.afterMinute ?? 0) : 0;
      const beforeMins = hasBefore
        ? timeToMinutes(config.beforeHour!, config.beforeMinute ?? 0)
        : 0;
      const current = "(time.hour * 60 + time.minute)";

      if (hasAfter && hasBefore) {
        if (afterMins < beforeMins) {
          return `${current} >= ${afterMins} && ${current} < ${beforeMins}`;
        }
        // Wraparound (e.g. 22:00 - 02:00): "after OR before"
        return `${current} >= ${afterMins} || ${current} < ${beforeMins}`;
      }
      if (hasAfter) return `${current} >= ${afterMins}`;
      return `${current} < ${beforeMins}`;
    }
    case "weekday": {
      const days = config.weekdays ?? [];
      if (days.length === 0) return "true";
      const parts = days.map((d) => `time.weekday == "${d}"`);
      return parts.length > 1 ? `(${parts.join(" || ")})` : parts[0];
    }
    case "device_state": {
      if (!config.targetName || !config.property) return "true";
      const prop = `device("${escapeExprString(config.targetName)}").${config.property}`;
      const cmp = config.comparator ?? "==";
      const val = config.value ?? "";
      if (val === "") return "true";
      let formatted: string;
      if (val === "true" || val === "false") formatted = val;
      else if (isNumericString(val)) formatted = val;
      else formatted = `"${escapeExprString(val)}"`;
      return `${prop} ${cmp} ${formatted}`;
    }
    case "custom":
      return config.customExpr || "true";
    default:
      return "true";
  }
}

export function defaultConditionConfig(): ConditionConfig {
  return { mode: "time_window" };
}

export type ConditionField = "target" | "property" | "value" | "customExpr";

export interface ConditionValidationError {
  field: ConditionField;
  message: string;
}

export function validateConditionConfig(config: ConditionConfig): ConditionValidationError | null {
  switch (config.mode) {
    case "time_window":
    case "weekday":
      return null;
    case "device_state":
      if (!config.targetId) return { field: "target", message: "Pick a target" };
      if (!config.property) return { field: "property", message: "Pick a property" };
      if (config.value === undefined || config.value === "") {
        return { field: "value", message: "Set a value" };
      }
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

export function serializeConditionConfig(config: ConditionConfig): string {
  return JSON.stringify({ expr: generateConditionExpr(config) });
}

// normalizeConditionConfig reverse-parses a stored condition expression back
// into its UI mode. Falls back to "custom" mode if no pattern matches. The
// stored wire format always uses `device("Name").property`; the UI may later
// disambiguate the target as device, group, or room from the live lookups.
export function normalizeConditionConfig(raw: Record<string, unknown>): ConditionConfig {
  // If the raw object already has a mode field (e.g. cached TS shape), coerce.
  if (raw.mode && typeof raw.mode === "string") {
    return raw as unknown as ConditionConfig;
  }
  const expr = (raw.expr as string) ?? "";
  if (!expr || expr === "true") {
    return { mode: "time_window" };
  }

  // Time window pattern: (time.hour * 60 + time.minute) >= X && ... < Y
  const twRange = expr.match(
    /^\(time\.hour \* 60 \+ time\.minute\) >= (\d+) && \(time\.hour \* 60 \+ time\.minute\) < (\d+)$/,
  );
  if (twRange) {
    const a = Number(twRange[1]);
    const b = Number(twRange[2]);
    return {
      mode: "time_window",
      afterHour: Math.floor(a / 60),
      afterMinute: a % 60,
      beforeHour: Math.floor(b / 60),
      beforeMinute: b % 60,
    };
  }
  const twWrap = expr.match(
    /^\(time\.hour \* 60 \+ time\.minute\) >= (\d+) \|\| \(time\.hour \* 60 \+ time\.minute\) < (\d+)$/,
  );
  if (twWrap) {
    const a = Number(twWrap[1]);
    const b = Number(twWrap[2]);
    return {
      mode: "time_window",
      afterHour: Math.floor(a / 60),
      afterMinute: a % 60,
      beforeHour: Math.floor(b / 60),
      beforeMinute: b % 60,
    };
  }
  const twAfter = expr.match(/^\(time\.hour \* 60 \+ time\.minute\) >= (\d+)$/);
  if (twAfter) {
    const a = Number(twAfter[1]);
    return { mode: "time_window", afterHour: Math.floor(a / 60), afterMinute: a % 60 };
  }
  const twBefore = expr.match(/^\(time\.hour \* 60 \+ time\.minute\) < (\d+)$/);
  if (twBefore) {
    const b = Number(twBefore[1]);
    return { mode: "time_window", beforeHour: Math.floor(b / 60), beforeMinute: b % 60 };
  }

  // Weekday pattern: time.weekday == "..." ( || ... )
  const weekdayMatch = expr.match(/^\(?((time\.weekday == "[A-Za-z]+"(?: \|\| )?)+)\)?$/);
  if (weekdayMatch) {
    const days = Array.from(expr.matchAll(/time\.weekday == "([A-Za-z]+)"/g)).map((m) => m[1]);
    if (days.length > 0) return { mode: "weekday", weekdays: days };
  }

  // Device-state pattern: device("name").property CMP value. The UI fills in
  // targetType from the live device/group/room lookups (see
  // enrichConditionConfigWithTarget on the page side); without it we default
  // to "device" so the picker has a sensible starting point.
  const dev = expr.match(/^device\("([^"]+)"\)\.(\w+)\s*(==|!=|<=|>=|<|>)\s*(.+)$/);
  if (dev) {
    const [, name, property, comparator, rawVal] = dev;
    let val = rawVal.trim();
    if (val.startsWith('"') && val.endsWith('"')) {
      val = val.slice(1, -1);
    }
    return {
      mode: "device_state",
      targetType: "device",
      targetName: name,
      property,
      comparator,
      value: val,
    };
  }

  return { mode: "custom", customExpr: expr };
}
