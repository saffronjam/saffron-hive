import type { Capability, Device } from "$lib/stores/devices";
import type { GroupLite, RoomLite } from "$lib/target-resolve";
import { evaluateExpression } from "$lib/target-resolve";
import { deviceDisplayName, entityDisplayName, groupDisplayName } from "$lib/utils";
import { historyFieldLabel, identifierLabel } from "$lib/i18n/vocabulary";
import { formatNumber, formatPercent } from "$lib/i18n/format";
import { automationValidationMessage } from "$lib/i18n/automation-validation";
import { m } from "$lib/i18n/messages";
import { locale } from "$lib/i18n/locale.svelte";
import {
  actionMacroCall,
  capabilityToExprProperty,
  formatHoldDuration,
  generateCronExpr,
  humanizeCron,
  validateActionConfig,
  validateTriggerConfig,
  weekdayLabel,
  type ActionConfigShape,
  type TriggerConfig,
} from "./trigger-expr";
import { validateConditionConfig, type ConditionConfig } from "./condition-expr";
import { actionOptions, operatorOptions } from "./automation-node-options";
import { Names } from "$lib/automation-dsl/names";
import { printExpression } from "$lib/automation-dsl/print";
import type { JsonObject, JsonValue } from "$lib/automation-dsl/model";

/** The names a summary resolves ids against. */
export interface SummaryLookups {
  devices: Device[];
  groups: GroupLite[];
  rooms: (RoomLite & { name: string })[];
  scenes: { id: string; name: string; rooms?: { id: string; name: string }[] }[];
  effects: (
    | { kind: "timeline"; id: string; name: string }
    | { kind: "native"; nativeName: string; name: string }
  )[];
  webhooks: { id: string; name: string }[];
}

/** One line describing what a node does, or why it is not ready yet. */
export interface NodeSummary {
  text: string;
  invalid: boolean;
}

const COMPARATOR_SYMBOLS: Record<string, string> = {
  "==": "=",
  "!=": "≠",
  ">": ">",
  "<": "<",
  ">=": "≥",
  "<=": "≤",
};

const WEEKDAY_CODES: Record<string, string> = {
  Monday: "MON",
  Tuesday: "TUE",
  Wednesday: "WED",
  Thursday: "THU",
  Friday: "FRI",
  Saturday: "SAT",
  Sunday: "SUN",
};

function invalid(code: Parameters<typeof automationValidationMessage>[0]): NodeSummary {
  return { text: automationValidationMessage(code), invalid: true };
}

function ok(text: string): NodeSummary {
  return { text, invalid: false };
}

function deviceName(lookups: SummaryLookups, id: string | undefined, fallback?: string): string {
  const device = lookups.devices.find((d) => d.id === id);
  if (device) return deviceDisplayName(device);
  return fallback || id || "";
}

function capabilityFor(
  device: Device | undefined,
  property: string | undefined,
): Capability | undefined {
  if (!device || !property) return undefined;
  return device.capabilities.find((c) => capabilityToExprProperty(c.name) === property);
}

function formatValue(value: string, capability: Capability | undefined): string {
  if (value === "true") return m.state_on({}, locale.messageOptions());
  if (value === "false") return m.state_off({}, locale.messageOptions());
  if (capability?.type === "numeric" && value !== "" && !isNaN(Number(value))) {
    const number = formatNumber(Number(value), { maximumFractionDigits: 2 });
    return capability.unit ? `${number} ${capability.unit}` : number;
  }
  return identifierLabel(value);
}

/** "{target}: {property} {comparator} {value}", shared by triggers and conditions. */
function stateComparison(
  target: string,
  property: string,
  comparator: string | undefined,
  value: string,
  capability: Capability | undefined,
): string {
  const symbol = COMPARATOR_SYMBOLS[comparator ?? "=="] ?? comparator ?? "=";
  return `${target}: ${historyFieldLabel(property)} ${symbol} ${formatValue(value, capability)}`;
}

export function summarizeTrigger(config: TriggerConfig, lookups: SummaryLookups): NodeSummary {
  const error = validateTriggerConfig(config);
  if (error) return invalid(error.code);
  const options = locale.messageOptions();
  switch (config.mode) {
    case "device_state": {
      const device = lookups.devices.find((d) => d.id === config.deviceId);
      const text = stateComparison(
        deviceName(lookups, config.deviceId, config.deviceName),
        config.property ?? "",
        config.comparator,
        config.value ?? "",
        capabilityFor(device, config.property),
      );
      return ok(config.holdMs ? `${text} · ${formatHoldDuration(config.holdMs)}` : text);
    }
    case "device_event":
      return ok(
        m.automation_summary_device_event(
          {
            event: identifierLabel(config.eventValue ?? ""),
            device: deviceName(lookups, config.deviceId, config.deviceName),
          },
          options,
        ),
      );
    case "availability":
      return ok(
        m.automation_summary_availability(
          { device: deviceName(lookups, config.deviceId, config.deviceName) },
          options,
        ),
      );
    case "schedule":
      return ok(humanizeCron(generateCronExpr(config)));
    case "webhook": {
      const webhook = lookups.webhooks.find((w) => w.id === config.endpointId);
      return ok(
        m.automation_summary_webhook(
          { name: webhook ? entityDisplayName("webhook", webhook) : (config.endpointId ?? "") },
          options,
        ),
      );
    }
    case "custom":
      return ok(config.customExpr ?? "");
    default:
      return invalid("trigger_required");
  }
}

function pad(value: number | undefined): string {
  return String(value ?? 0).padStart(2, "0");
}

function usesMacro(name: string, negate = false): NodeSummary {
  const label = `${negate ? "!" : ""}$${name}`;
  return ok(m.automation_summary_uses_macro({ name: label }, locale.messageOptions()));
}

export function summarizeCondition(config: ConditionConfig, lookups: SummaryLookups): NodeSummary {
  const error = validateConditionConfig(config);
  if (error) return invalid(error.code);
  switch (config.mode) {
    case "macro":
      return usesMacro(config.macro ?? "", config.negate);
    case "time_window":
      return ok(
        `${pad(config.afterHour)}:${pad(config.afterMinute)}–${pad(config.beforeHour)}:${pad(config.beforeMinute)}`,
      );
    case "weekday":
      return ok(
        (config.weekdays ?? [])
          .map((day) => weekdayLabel(WEEKDAY_CODES[day] ?? day, "short"))
          .join(", "),
      );
    case "device_state": {
      const device =
        config.targetType === "device"
          ? lookups.devices.find((d) => d.id === config.targetId)
          : undefined;
      return ok(
        stateComparison(
          targetName(
            lookups,
            config.targetType ?? "device",
            config.targetId ?? "",
            config.targetName,
          ),
          config.property ?? "",
          config.comparator,
          config.value ?? "",
          capabilityFor(device, config.property),
        ),
      );
    }
    case "custom":
      return ok(describeExpression(config.customExpr ?? "", lookups) ?? config.customExpr ?? "");
    default:
      return invalid("condition_required");
  }
}

function isObject(value: JsonValue | undefined): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** The target written in a printed condition, as text. */
function describeTarget(object: JsonObject): string {
  for (const key of ["device", "room", "group", "target"]) {
    if (typeof object[key] === "string") return object[key] as string;
  }
  if (Array.isArray(object.where)) return m.automation_code_key_where({}, locale.messageOptions());
  return "";
}

function describeValue(value: JsonValue): string {
  if (value === true) return m.state_on({}, locale.messageOptions());
  if (value === false) return m.state_off({}, locale.messageOptions());
  return typeof value === "string" ? identifierLabel(value) : String(value);
}

/** "Presence = On", "Temperature > 21" for a printed state object. */
function describeState(state: JsonValue | undefined): string {
  if (!isObject(state)) return "";
  return Object.entries(state)
    .flatMap(([field, value]) =>
      isObject(value)
        ? Object.entries(value).map(
            ([op, operand]) =>
              `${historyFieldLabel(field)} ${COMPARATOR_SYMBOLS[op] ?? op} ${describeValue(operand)}`,
          )
        : [`${historyFieldLabel(field)} = ${describeValue(value)}`],
    )
    .join(" · ");
}

function describeComparisons(object: JsonObject): string {
  return Object.keys(COMPARATOR_SYMBOLS)
    .filter((op) => op in object)
    .map((op) => `${COMPARATOR_SYMBOLS[op]} ${describeValue(object[op])}`)
    .join(" ");
}

/** A condition written with the language's functions, in words. */
function describeCondition(printed: JsonValue): string | null {
  if (typeof printed === "string") return printed;
  if (!isObject(printed) || "expr" in printed) return null;
  const options = locale.messageOptions();
  const [key] = Object.keys(printed).filter(
    (k) => !["device", "room", "group", "target", "where"].includes(k),
  );
  const body = printed[key];
  switch (key) {
    case "state":
      return `${describeTarget(printed)}: ${describeState(body)}`;
    case "any":
    case "all":
    case "count": {
      if (!isObject(body)) return null;
      const label = {
        any: m.automation_code_key_any,
        all: m.automation_code_key_all,
        count: m.automation_code_key_count,
      }[key]({}, options);
      const count = key === "count" ? ` ${describeComparisons(body)}` : "";
      return `${label}${count}: ${describeTarget(body)} · ${describeState(body.state)}`;
    }
    case "avg":
    case "min":
    case "max":
    case "since": {
      if (!isObject(body)) return null;
      const label = {
        avg: m.automation_code_key_avg,
        min: m.automation_code_key_min,
        max: m.automation_code_key_max,
        since: m.automation_code_key_since,
      }[key]({}, options);
      const field = typeof body.field === "string" ? historyFieldLabel(body.field) : "";
      return `${describeTarget(body)}: ${label} ${field} ${describeComparisons(body)}`;
    }
    case "scene_active":
      return `${m.automation_code_key_scene_active({}, options)}: ${String(body)}`;
    case "not": {
      const inner = describeCondition(body);
      return inner ? `${m.automation_code_key_not({}, options)} ${inner}` : null;
    }
    default:
      return null;
  }
}

function describeExpression(expr: string, lookups: SummaryLookups): string | null {
  return describeCondition(printExpression(expr, new Names(lookups)));
}

function targetName(
  lookups: SummaryLookups,
  targetType: string,
  targetId: string,
  fallback?: string,
): string {
  switch (targetType) {
    case "device":
      return deviceName(lookups, targetId, fallback);
    case "group": {
      const group = lookups.groups.find((g) => g.id === targetId);
      return group ? groupDisplayName(group) : fallback || targetId;
    }
    case "room": {
      const room = lookups.rooms.find((r) => r.id === targetId);
      return room ? entityDisplayName("room", room) : fallback || targetId;
    }
    case "scene": {
      const scene = lookups.scenes.find((s) => s.id === targetId);
      return scene ? entityDisplayName("scene", scene) : fallback || targetId;
    }
    case "macro":
      return `$${targetId}`;
    default:
      return fallback || targetId;
  }
}

function parsePayload(raw: string): Record<string, unknown> {
  try {
    const parsed: unknown = JSON.parse(raw || "{}");
    return typeof parsed === "object" && parsed !== null ? (parsed as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

/**
 * The position in a cycle_scenes list whose scene fired last. The stored
 * `cycle_index` is the next position to fire. Returns -1 before the first fire.
 */
export function activeCycleIndex(sceneCount: number, runtimeState: string | undefined): number {
  if (sceneCount === 0) return -1;
  const next = parsePayload(runtimeState ?? "{}").cycle_index;
  if (typeof next !== "number") return -1;
  return (next - 1 + sceneCount) % sceneCount;
}

function stateParts(payload: Record<string, unknown>): string[] {
  const options = locale.messageOptions();
  const parts: string[] = [];
  if (typeof payload.on === "boolean") {
    parts.push(payload.on ? m.state_on({}, options) : m.state_off({}, options));
  }
  if (typeof payload.brightness === "number") {
    parts.push(formatPercent(payload.brightness / 254, { maximumFractionDigits: 0 }));
  }
  if (typeof payload.colorTemp === "number" && payload.colorTemp > 0) {
    parts.push(`${Math.round(1_000_000 / payload.colorTemp)} K`);
  }
  if (payload.color != null) parts.push(historyFieldLabel("color"));
  if (typeof payload.targetTemperature === "number") {
    parts.push(`${formatNumber(payload.targetTemperature, { maximumFractionDigits: 1 })} °C`);
  }
  return parts;
}

export function summarizeAction(
  config: ActionConfigShape & { targetName?: string },
  lookups: SummaryLookups,
  options: { runtimeState?: string; live?: boolean } = {},
): NodeSummary {
  const error = validateActionConfig(config);
  if (error) return invalid(error.code);
  const macro = actionMacroCall(config);
  if (macro) return usesMacro(macro.use);
  const messageOptions = locale.messageOptions();
  const payload = parsePayload(config.payload);
  const target =
    config.targetType === "expression"
      ? m.shared_device_count(
          {
            count: evaluateExpression(
              config.targetExpr ?? [],
              lookups.devices,
              lookups.groups,
              lookups.rooms,
            ).length,
          },
          messageOptions,
        )
      : targetName(lookups, config.targetType, config.targetId, config.targetName);
  switch (config.actionType) {
    case "set_device_state": {
      const parts = stateParts(payload);
      return ok(parts.length > 0 ? `${target}: ${parts.join(" · ")}` : target);
    }
    case "toggle_device_state":
      return ok(m.automation_summary_toggle({ target }, messageOptions));
    case "activate_scene":
      return ok(m.automation_summary_activate_scene({ scene: target }, messageOptions));
    case "cycle_scenes": {
      const scenes = Array.isArray(payload.scenes)
        ? payload.scenes.filter((s): s is string => typeof s === "string")
        : [];
      const active = activeCycleIndex(scenes.length, options.runtimeState);
      if (options.live && active >= 0) {
        return ok(
          m.automation_summary_cycle_current(
            { scene: targetName(lookups, "scene", scenes[active]) },
            messageOptions,
          ),
        );
      }
      return ok(m.automation_summary_cycle_scenes({ count: scenes.length }, messageOptions));
    }
    case "run_effect": {
      const effect = lookups.effects.find((e) =>
        e.kind === "timeline" ? e.id === payload.effect_id : e.nativeName === payload.native_name,
      );
      const name = effect
        ? effect.kind === "timeline"
          ? entityDisplayName("effect", effect)
          : effect.name
        : String(payload.effect_id ?? payload.native_name ?? "");
      return ok(m.automation_summary_run_effect({ effect: name, target }, messageOptions));
    }
    case "change_value": {
      const delta = typeof payload.delta === "number" ? payload.delta : 0;
      const amount = `${delta > 0 ? "+" : ""}${formatNumber(delta)}${payload.mode === "absolute" ? "" : " %"}`;
      return ok(
        m.automation_summary_change_value(
          { field: historyFieldLabel(String(payload.field ?? "")), amount, target },
          messageOptions,
        ),
      );
    }
    case "configure_device":
      return ok(m.automation_summary_configure({ device: target }, messageOptions));
    case "raise_alarm":
      return ok(
        m.automation_summary_raise_alarm(
          { message: String(payload.message || payload.alarm_id || "") },
          messageOptions,
        ),
      );
    case "clear_alarm":
      return ok(
        m.automation_summary_clear_alarm({ alarm: String(payload.alarm_id ?? "") }, messageOptions),
      );
    default:
      return ok(
        actionOptions().find((o) => o.value === config.actionType)?.label ?? config.actionType,
      );
  }
}

/** The operator's kind ("AND", "OR", "NOT") as shown on the node. */
export function operatorLabel(operator: string): string {
  return operatorOptions().find((option) => option.value === operator)?.label ?? operator;
}
