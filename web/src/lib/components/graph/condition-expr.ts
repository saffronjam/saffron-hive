import { parseExpr, type Clause as ExprClause } from "$lib/automation-dsl/expr";
import {
  DAY_CODES,
  formatClock,
  fullDayName,
  parseClock,
  parseDay,
} from "$lib/automation-dsl/values";

export type ConditionMode = "" | "time_window" | "weekday" | "device_state" | "custom" | "macro";
export type ConditionTargetType = "device" | "group" | "room";

export interface ConditionConfig {
  mode: ConditionMode;
  // time_window
  afterHour?: number;
  afterMinute?: number;
  beforeHour?: number;
  beforeMinute?: number;
  // weekday, as full English names ("Monday")
  weekdays?: string[];
  // device_state: the stored expression addresses the target by id through
  // device(), group() or room(). Groups and rooms expose only `on`.
  targetType?: ConditionTargetType;
  targetId?: string;
  targetName?: string;
  property?: string;
  comparator?: string;
  value?: string;
  // custom
  customExpr?: string;
  // macro: a condition defined in the automation's definitions
  macro?: string;
  negate?: boolean;
}

function escapeExprString(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function isNumericString(s: string): boolean {
  return s !== "" && !isNaN(Number(s));
}

export function generateConditionExpr(config: ConditionConfig): string {
  switch (config.mode) {
    case "time_window": {
      const hasAfter = config.afterHour !== undefined;
      const hasBefore = config.beforeHour !== undefined;
      const after = formatClock(config.afterHour ?? 0, config.afterMinute ?? 0);
      const before = formatClock(config.beforeHour ?? 0, config.beforeMinute ?? 0);
      if (hasAfter && hasBefore) return `time.between("${after}", "${before}")`;
      if (hasAfter) return `time.after("${after}")`;
      if (hasBefore) return `time.before("${before}")`;
      return "true";
    }
    case "weekday": {
      const days = (config.weekdays ?? []).map(parseDay).filter((day) => day !== null);
      if (days.length === 0) return "true";
      return `day.in(${days.map((day) => `"${day}"`).join(", ")})`;
    }
    case "device_state": {
      if (!config.targetId || !config.property) return "true";
      const accessor = config.targetType ?? "device";
      const prop = `${accessor}("${escapeExprString(config.targetId)}").${config.property}`;
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
  return { mode: "" };
}

export type ConditionField = "mode" | "target" | "property" | "value" | "customExpr";

export interface ConditionValidationError {
  field: ConditionField;
  code: import("./trigger-expr").AutomationValidationCode;
}

export function validateConditionConfig(config: ConditionConfig): ConditionValidationError | null {
  if (!config.mode) return { field: "mode", code: "condition_required" };
  switch (config.mode) {
    case "time_window":
    case "weekday":
    case "macro":
      return null;
    case "device_state":
      if (!config.targetId) return { field: "target", code: "target_required" };
      if (!config.property) return { field: "property", code: "property_required" };
      if (config.value === undefined || config.value === "") {
        return { field: "value", code: "value_required" };
      }
      return null;
    case "custom":
      if (!config.customExpr || config.customExpr.trim() === "") {
        return { field: "customExpr", code: "expression_required" };
      }
      return null;
    default:
      return null;
  }
}

export function serializeConditionConfig(config: ConditionConfig): string {
  if (config.mode === "") return JSON.stringify({ mode: "" });
  if (config.mode === "macro") {
    return JSON.stringify(
      config.negate ? { use: config.macro, negate: true } : { use: config.macro },
    );
  }
  return JSON.stringify({ expr: generateConditionExpr(config) });
}

function clockParts(text: unknown): [number, number] | null {
  if (typeof text !== "string") return null;
  const clock = parseClock(text);
  return clock && clock[2] === 0 ? [clock[0], clock[1]] : null;
}

function fromMinutes(minutes: number): [number, number] {
  return [Math.floor(minutes / 60), minutes % 60];
}

/** A single-clause expression the visual editor can show as a mode. */
function modeFromClause(clause: ExprClause): ConditionConfig | null {
  if (clause.kind === "call") {
    const { fn, args } = clause.call;
    if (fn === "time.between" && args.length === 2) {
      const after = clockParts(args[0]);
      const before = clockParts(args[1]);
      if (!after || !before) return null;
      return {
        mode: "time_window",
        afterHour: after[0],
        afterMinute: after[1],
        beforeHour: before[0],
        beforeMinute: before[1],
      };
    }
    if (fn === "time.after" && args.length === 1) {
      const after = clockParts(args[0]);
      return after ? { mode: "time_window", afterHour: after[0], afterMinute: after[1] } : null;
    }
    if (fn === "time.before" && args.length === 1) {
      const before = clockParts(args[0]);
      return before
        ? { mode: "time_window", beforeHour: before[0], beforeMinute: before[1] }
        : null;
    }
    if (fn === "day.in" && args.length > 0) {
      const days = args.map((arg) => (typeof arg === "string" ? parseDay(arg) : null));
      if (days.some((day) => day === null)) return null;
      return {
        mode: "weekday",
        weekdays: DAY_CODES.filter((code) => days.includes(code)).map(fullDayName),
      };
    }
    return null;
  }
  if (clause.kind !== "compare") return null;
  const { fn, args, member } = clause.call;
  if (!["device", "group", "room"].includes(fn) || args.length !== 1 || !member) return null;
  if (typeof args[0] !== "string" || !("literal" in clause.right)) return null;
  const value = clause.right.literal;
  if (value !== null && typeof value === "object") return null;
  return {
    mode: "device_state",
    targetType: fn as ConditionTargetType,
    targetId: args[0],
    property: member,
    comparator: clause.op,
    value: String(value),
  };
}

/** Clock-arithmetic and weekday-equality expressions the editor reads. */
function modeFromArithmetic(expr: string): ConditionConfig | null {
  const current = String.raw`\(time\.hour \* 60 \+ time\.minute\)`;
  const range = new RegExp(`^${current} >= (\\d+) (&&|\\|\\|) ${current} < (\\d+)$`).exec(expr);
  if (range) {
    const [afterHour, afterMinute] = fromMinutes(Number(range[1]));
    const [beforeHour, beforeMinute] = fromMinutes(Number(range[3]));
    return { mode: "time_window", afterHour, afterMinute, beforeHour, beforeMinute };
  }
  const after = new RegExp(`^${current} >= (\\d+)$`).exec(expr);
  if (after) {
    const [afterHour, afterMinute] = fromMinutes(Number(after[1]));
    return { mode: "time_window", afterHour, afterMinute };
  }
  const before = new RegExp(`^${current} < (\\d+)$`).exec(expr);
  if (before) {
    const [beforeHour, beforeMinute] = fromMinutes(Number(before[1]));
    return { mode: "time_window", beforeHour, beforeMinute };
  }
  if (/^\(?(time\.weekday == "[A-Za-z]+"( \|\| )?)+\)?$/.test(expr)) {
    const days = Array.from(expr.matchAll(/time\.weekday == "([A-Za-z]+)"/g)).map(
      (match) => match[1],
    );
    return { mode: "weekday", weekdays: days };
  }
  return null;
}

/**
 * Reads a stored condition back into its editor mode. Anything the editor
 * cannot show as a mode opens as a custom expression.
 */
export function normalizeConditionConfig(raw: Record<string, unknown>): ConditionConfig {
  if ("mode" in raw && typeof raw.mode === "string") {
    return raw as unknown as ConditionConfig;
  }
  if (typeof raw.use === "string") {
    return { mode: "macro", macro: raw.use, negate: raw.negate === true };
  }
  const expr = typeof raw.expr === "string" ? raw.expr : "";
  if (!expr || expr === "true") return { mode: "time_window" };
  const arithmetic = modeFromArithmetic(expr);
  if (arithmetic) return arithmetic;
  const ast = parseExpr(expr);
  if (ast && ast.clauses.length === 1) {
    const mode = modeFromClause(ast.clauses[0]);
    if (mode) return mode;
  }
  return { mode: "custom", customExpr: expr };
}
