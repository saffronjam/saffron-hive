import type { AutomationConfigInput, AutomationConditionInput } from "$lib/gql/graphql";
import { fromLiteral, toLiteral, readValueType } from "$lib/automation-authoring";
import { fullDayName, parseDay } from "$lib/automation-dsl/values";
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
  valueType?: "string" | "number" | "boolean" | "null";
  // custom
  customExpr?: string;
  // macro: a condition defined in the automation's definitions
  macro?: string;
  negate?: boolean;
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
      return config.afterHour == null && config.beforeHour == null
        ? { field: "mode", code: "condition_required" }
        : null;
    case "weekday":
      return config.weekdays?.length ? null : { field: "mode", code: "condition_required" };
    case "macro":
      return null;
    case "device_state":
      if (!config.targetId) return { field: "target", code: "target_required" };
      if (!config.property) return { field: "property", code: "property_required" };
      if (config.value === undefined || (config.value === "" && config.valueType !== "string")) {
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
  if (config.mode === "macro")
    return JSON.stringify({
      macro: { name: config.macro ?? "", negate: config.negate, arguments: [] },
    } satisfies AutomationConfigInput);
  const { targetName: _name, value, valueType, macro: _macro, ...rest } = config;
  const condition: AutomationConditionInput = {
    ...rest,
    mode: config.mode || "unset",
    value: toLiteral(value, valueType),
    weekdays: config.weekdays ?? [],
  };
  return JSON.stringify({ condition } satisfies AutomationConfigInput);
}
export function normalizeConditionConfig(raw: Record<string, unknown>): ConditionConfig {
  const c = raw as AutomationConfigInput;
  if (c.macro) return { mode: "macro", macro: c.macro.name ?? "", negate: c.macro.negate ?? false };
  if (!c.condition || c.condition.mode === "unset")
    return {
      ...defaultConditionConfig(),
      ...(c.condition?.negate == null ? {} : { negate: c.condition.negate }),
    };
  const { value, ...rest } = c.condition;
  return {
    ...Object.fromEntries(Object.entries(rest).filter(([, v]) => v !== null)),
    mode: rest.mode,
    weekdays: rest.weekdays?.map((value) => {
      const day = parseDay(value);
      return day ? fullDayName(day) : value;
    }),
    value: fromLiteral(value),
    valueType: readValueType(value),
  } as ConditionConfig;
}
