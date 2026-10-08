import type { Clause as TargetClause } from "$lib/target-resolve";
import {
  serializeActionConfig,
  serializeTriggerConfig,
  validateActionConfig,
  validateTriggerConfig,
  type TriggerConfig,
  type WebhookFilterRule,
} from "$lib/components/graph/trigger-expr";
import { automationValidationMessage } from "$lib/i18n/automation-validation";
import { m } from "$lib/i18n/messages";
import { locale } from "$lib/i18n/locale.svelte";
import { COMPARATORS, literalText, type Comparator, type Literal } from "./expr";
import type { EntityKind, Names } from "./names";
import {
  ACTION_KEYS,
  AGGREGATE_FUNCTIONS,
  CLAUSE_KEYS,
  CONDITION_KEYS,
  NODE_PREFIX,
  TARGET_KEYS,
  type Diagnostic,
  type JsonObject,
  type JsonValue,
  type Path,
  type WireAutomation,
  type WireEdge,
  type WireNode,
} from "./model";
import { assignIds, ruleEdgeKeys } from "./print";
import { DAY_CODES, parseClock, parseDay, parseDuration, parseStateValue } from "./values";

export interface ParseResult {
  automation: WireAutomation | null;
  diagnostics: Diagnostic[];
}

type DefinitionKind = "condition" | "target" | "action";

interface StoredDefinition {
  kind: DefinitionKind;
  expr?: string;
  target_expr?: TargetClause[];
  action?: JsonObject;
  params?: number;
}

interface Target {
  targetType: string;
  targetId: string;
  targetExpr: TargetClause[];
}

/** Thrown to abandon the element being compiled after recording a diagnostic. */
class Abort extends Error {}

const NAME_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*$/;
const PARAMETER = /^\$(\d+)$/;
const GO_DURATION = /^(?:(?:\d+(?:\.\d+)?(?:ms|s|m|h))+|\d+(?:\.\d+)?d)$/;

function isObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function quoteList(keys: readonly string[]): string {
  return keys.map((key) => `"${key}"`).join(", ");
}

class Compiler {
  readonly diagnostics: Diagnostic[] = [];
  private readonly kinds = new Map<string, DefinitionKind>();
  private readonly compiled: Record<string, StoredDefinition> = {};
  private readonly options = locale.messageOptions();

  constructor(private readonly names: Names) {}

  fail(path: Path, message: string): never {
    this.diagnostics.push({ path, message });
    throw new Abort();
  }

  /** Runs one element, keeping its diagnostics and continuing with the next. */
  attempt<T>(run: () => T): T | null {
    try {
      return run();
    } catch (error) {
      if (error instanceof Abort) return null;
      throw error;
    }
  }

  object(value: unknown, path: Path): JsonObject {
    if (!isObject(value)) this.fail(path, m.automation_code_expected_object({}, this.options));
    return value;
  }

  string(value: unknown, path: Path): string {
    if (typeof value !== "string")
      this.fail(path, m.automation_code_expected_string({}, this.options));
    return value;
  }

  array(value: unknown, path: Path): JsonValue[] {
    if (!Array.isArray(value)) this.fail(path, m.automation_code_expected_array({}, this.options));
    return value;
  }

  allowKeys(object: JsonObject, path: Path, allowed: readonly string[]): void {
    for (const key of Object.keys(object)) {
      if (!allowed.includes(key)) {
        this.fail([...path, key], m.automation_code_unknown_key({ key }, this.options));
      }
    }
  }

  /** The single key of `object` among `keys`. */
  oneOf(object: JsonObject, path: Path, keys: readonly string[]): string {
    const present = keys.filter((key) => key in object);
    if (present.length !== 1) {
      this.fail(
        present.length > 1 ? [...path, present[1]] : path,
        m.automation_code_one_of({ keys: quoteList(keys) }, this.options),
      );
    }
    return present[0];
  }

  resolve(kind: EntityKind, value: unknown, path: Path): string {
    const ref = this.string(value, path);
    const resolved = this.names.resolve(kind, ref);
    if (resolved.ok) return resolved.id;
    this.fail(
      path,
      resolved.reason === "ambiguous"
        ? m.automation_code_ambiguous_name({ name: ref }, this.options)
        : m.automation_code_unknown_name({ name: ref }, this.options),
    );
  }

  duration(value: unknown, path: Path): number {
    const text = this.string(value, path);
    const ms = parseDuration(text);
    if (ms === null)
      this.fail(path, m.automation_code_invalid_duration({ value: text }, this.options));
    return ms;
  }

  macro(reference: string, kind: DefinitionKind, path: Path): string {
    const name = reference.slice(1);
    const actual = this.kinds.get(name);
    if (!actual) this.fail(path, m.automation_code_unknown_macro({ name }, this.options));
    if (actual !== kind) this.fail(path, m.automation_code_wrong_macro({ name }, this.options));
    return name;
  }

  definitions(value: unknown, path: Path): string {
    if (value === undefined) return "{}";
    const define = this.object(value, path);
    for (const [name, body] of Object.entries(define)) {
      if (!NAME_PATTERN.test(name)) {
        this.diagnostics.push({
          path: [...path, name],
          message: m.automation_code_invalid_name({}, this.options),
        });
        continue;
      }
      this.kinds.set(name, definitionKind(body));
    }
    for (const [name, body] of Object.entries(define)) {
      const kind = this.kinds.get(name);
      if (!kind) continue;
      const at = [...path, name];
      const compiled = this.attempt((): StoredDefinition => {
        if (kind === "target") {
          return {
            kind,
            target_expr: this.selectorClauses(this.target(this.object(body, at), at, false), at),
          };
        }
        if (kind === "condition") return { kind, expr: this.conditionExpr(body, at) };
        const config = JSON.parse(this.actionConfig(body, at)) as JsonObject;
        const payloadText = typeof config.payload === "string" ? config.payload : "";
        let payload: JsonValue = payloadText;
        try {
          payload = payloadText ? (JSON.parse(payloadText) as JsonValue) : "";
        } catch {
          payload = payloadText;
        }
        const action = { ...config, payload };
        const params = Math.max(
          0,
          ...Array.from(JSON.stringify(action).matchAll(/"\$(\d+)"/g), (match) => Number(match[1])),
        );
        return { kind, action, ...(params ? { params } : {}) };
      });
      if (compiled) this.compiled[name] = compiled;
    }
    return JSON.stringify(this.compiled);
  }

  /** Clauses for a target: a selector as written, or one clause for a reference. */
  private selectorClauses(target: Target, path: Path): TargetClause[] {
    if (target.targetType === "expression") return target.targetExpr;
    if (target.targetType === "macro")
      this.fail(path, m.automation_code_wrong_macro({ name: target.targetId }, this.options));
    return [
      {
        subject: target.targetType as TargetClause["subject"],
        op: "is" as TargetClause["op"],
        values: [target.targetId],
      },
    ];
  }

  target(object: JsonObject, path: Path, required = true): Target {
    const present = TARGET_KEYS.filter((key) => key in object);
    if (present.length === 0) {
      if (!required)
        this.fail(path, m.automation_code_one_of({ keys: quoteList(TARGET_KEYS) }, this.options));
      return { targetType: "", targetId: "", targetExpr: [] };
    }
    const key = this.oneOf(object, path, TARGET_KEYS);
    const at = [...path, key];
    switch (key) {
      case "where":
        return {
          targetType: "expression",
          targetId: "",
          targetExpr: this.clauses(object.where, at),
        };
      case "target": {
        const reference = this.string(object.target, at);
        if (!reference.startsWith("$"))
          this.fail(at, m.automation_code_unknown_macro({ name: reference }, this.options));
        return {
          targetType: "macro",
          targetId: this.macro(reference, "target", at),
          targetExpr: [],
        };
      }
      default:
        return {
          targetType: key,
          targetId: this.resolve(key as EntityKind, object[key], at),
          targetExpr: [],
        };
    }
  }

  clauses(value: unknown, path: Path): TargetClause[] {
    return this.array(value, path).map((item, index) => {
      const at: Path = [...path, index];
      let clause = this.object(item, at);
      let connector: "or" | undefined;
      let negated = false;
      let inner = at;
      if ("or" in clause) {
        this.allowKeys(clause, inner, ["or"]);
        inner = [...inner, "or"];
        clause = this.object(clause.or, inner);
        connector = "or";
      }
      if ("not" in clause) {
        this.allowKeys(clause, inner, ["not"]);
        inner = [...inner, "not"];
        clause = this.object(clause.not, inner);
        negated = true;
      }
      const key = this.oneOf(clause, inner, Object.keys(CLAUSE_KEYS));
      this.allowKeys(clause, inner, [key]);
      const subject = CLAUSE_KEYS[key];
      const named = ["room", "group", "device"].includes(subject) ? (subject as EntityKind) : null;
      const raw = clause[key];
      const many = Array.isArray(raw);
      const values = (many ? raw : [raw]).map((value, i) => {
        const valueAt: Path = many ? [...inner, key, i] : [...inner, key];
        return named ? this.resolve(named, value, valueAt) : this.string(value, valueAt);
      });
      const op = negated ? (many ? "is_not_one_of" : "is_not") : many ? "is_one_of" : "is";
      return {
        ...(connector && index > 0 ? { connector: connector as TargetClause["connector"] } : {}),
        subject,
        op: op as TargetClause["op"],
        values,
      };
    });
  }

  /** A target as an expression argument. */
  private exprTarget(object: JsonObject, path: Path): Literal {
    const target = this.target(object, path, false);
    switch (target.targetType) {
      case "expression":
        return { where: target.targetExpr as unknown as Literal };
      case "macro":
        return { macro: target.targetId };
      default:
        return { [target.targetType]: target.targetId };
    }
  }

  /** `{ field: value }` with a single field. */
  private singleState(value: unknown, path: Path): [string, Literal] {
    const state = this.object(value, path);
    const fields = Object.keys(state);
    if (fields.length !== 1)
      this.fail(path, m.automation_code_one_of({ keys: "state" }, this.options));
    return [fields[0], this.stateValue(fields[0], state[fields[0]], [...path, fields[0]])];
  }

  private stateValue(field: string, value: unknown, path: Path): Literal {
    const converted = parseStateValue(field, value);
    if (!converted.ok)
      this.fail(path, m.automation_code_invalid_value({ key: field }, this.options));
    return converted.value as Literal;
  }

  /** Comparison keys (">", "<=", …) of an object, with their operands. */
  private comparisons(
    object: JsonObject,
    path: Path,
    required: boolean,
  ): [Comparator, JsonValue][] {
    const found = (
      Object.keys(object).filter((key) =>
        (COMPARATORS as readonly string[]).includes(key),
      ) as Comparator[]
    ).map((op): [Comparator, JsonValue] => [op, object[op]]);
    if (required && found.length === 0)
      this.fail(path, m.automation_code_one_of({ keys: quoteList(COMPARATORS) }, this.options));
    return found;
  }

  conditionConfig(value: unknown, path: Path): string {
    if (typeof value === "string" && value.startsWith("$")) {
      return JSON.stringify({ use: this.macro(value, "condition", path) });
    }
    const object = this.object(value, path);
    if (typeof object.use === "string") {
      this.allowKeys(object, path, ["id", "use"]);
      return JSON.stringify({ use: this.macro(object.use, "condition", [...path, "use"]) });
    }
    const keys = Object.keys(object).filter((key) => key !== "id");
    if (keys.length === 0) return JSON.stringify({ mode: "" });
    if (keys.length === 1 && typeof object.not === "string" && object.not.startsWith("$")) {
      return JSON.stringify({
        use: this.macro(object.not, "condition", [...path, "not"]),
        negate: true,
      });
    }
    const { id: _id, ...rest } = object;
    return JSON.stringify({ expr: this.conditionExpr(rest, path) });
  }

  conditionExpr(value: unknown, path: Path): string {
    if (typeof value === "string")
      this.fail(
        path,
        m.automation_code_wrong_macro({ name: value.replace(/^\$/, "") }, this.options),
      );
    const object = this.object(value, path);
    const primary = this.oneOf(object, path, CONDITION_KEYS);
    const at: Path = [...path, primary];
    switch (primary) {
      case "time": {
        const time = this.object(object.time, at);
        const key = this.oneOf(time, at, ["between", "after", "before"]);
        this.allowKeys(time, at, [key]);
        const clock = (text: unknown, clockPath: Path) => {
          const raw = this.string(text, clockPath);
          if (!parseClock(raw))
            this.fail(clockPath, m.automation_code_invalid_time({ value: raw }, this.options));
          return raw;
        };
        if (key === "between") {
          const range = this.array(time.between, [...at, "between"]);
          if (range.length !== 2)
            this.fail(
              [...at, "between"],
              m.automation_code_invalid_value({ key: "between" }, this.options),
            );
          return `time.between(${JSON.stringify(clock(range[0], [...at, "between", 0]))}, ${JSON.stringify(clock(range[1], [...at, "between", 1]))})`;
        }
        return `time.${key}(${JSON.stringify(clock(time[key], [...at, key]))})`;
      }
      case "day": {
        const days = this.array(object.day, at).map((day, index) => {
          const text = this.string(day, [...at, index]);
          const code = parseDay(text);
          if (!code)
            this.fail([...at, index], m.automation_code_unknown_day({ value: text }, this.options));
          return code;
        });
        const ordered = DAY_CODES.filter((code) => days.includes(code));
        return `day.in(${ordered.map((code) => JSON.stringify(code)).join(", ")})`;
      }
      case "state": {
        this.allowKeys(object, path, ["state", "device", "room", "group"]);
        const target = this.target(object, path, false);
        const state = this.object(object.state, at);
        const clauses: string[] = [];
        for (const [field, raw] of Object.entries(state)) {
          const fieldAt: Path = [...at, field];
          const accessor = `${target.targetType}(${JSON.stringify(target.targetId)}).${field}`;
          const ops = isObject(raw)
            ? this.comparisons(raw, fieldAt, true)
            : [["==", raw] as [Comparator, JsonValue]];
          if (isObject(raw)) this.allowKeys(raw, fieldAt, COMPARATORS);
          for (const [op, operand] of ops) {
            const literal = this.stateValue(
              field,
              operand,
              isObject(raw) ? [...fieldAt, op] : fieldAt,
            );
            clauses.push(`${accessor} ${op} ${literalText(literal)}`);
          }
        }
        if (clauses.length === 0)
          this.fail(at, m.automation_code_missing_key({ key: "state" }, this.options));
        return clauses.join(" && ");
      }
      case "any":
      case "all":
      case "count": {
        const body = this.object(object[primary], at);
        const target = this.exprTarget(body, at);
        const [field, wanted] = this.singleState(body.state, [...at, "state"]);
        const call = `${AGGREGATE_FUNCTIONS[primary]}(${literalText(target)}, ${JSON.stringify(field)}, ${literalText(wanted)})`;
        if (primary !== "count") {
          this.allowKeys(body, at, [...TARGET_KEYS, "state"]);
          return call;
        }
        this.allowKeys(body, at, [...TARGET_KEYS, "state", ...COMPARATORS]);
        return this.comparisons(body, at, true)
          .map(([op, operand]) => {
            if (typeof operand !== "number")
              this.fail([...at, op], m.automation_code_expected_number({}, this.options));
            return `${call} ${op} ${operand}`;
          })
          .join(" && ");
      }
      case "avg":
      case "min":
      case "max":
      case "since": {
        const body = this.object(object[primary], at);
        this.allowKeys(body, at, [...TARGET_KEYS, "field", ...COMPARATORS]);
        const target = this.exprTarget(body, at);
        const field = this.string(body.field, [...at, "field"]);
        const call = `${AGGREGATE_FUNCTIONS[primary]}(${literalText(target)}, ${JSON.stringify(field)})`;
        return this.comparisons(body, at, true)
          .map(([op, operand]) => {
            const opAt: Path = [...at, op];
            if (primary === "since") {
              const text = this.string(operand, opAt);
              if (!GO_DURATION.test(text))
                this.fail(opAt, m.automation_code_invalid_duration({ value: text }, this.options));
              return `${call} ${op} duration(${JSON.stringify(text)})`;
            }
            return `${call} ${op} ${literalText(this.stateValue(field, operand, opAt))}`;
          })
          .join(" && ");
      }
      case "scene_active":
        this.allowKeys(object, path, ["scene_active"]);
        return `scene_active(${JSON.stringify(this.resolve("scene", object.scene_active, at))})`;
      case "not":
        this.allowKeys(object, path, ["not"]);
        return `!(${this.conditionExpr(object.not, at)})`;
      default:
        this.allowKeys(object, path, ["expr"]);
        return this.string(object.expr, at);
    }
  }

  triggerConfig(value: unknown, path: Path): string {
    const object = this.object(value, path);
    const keys = Object.keys(object).filter((key) => key !== "id");
    if (keys.length === 0) return serializeTriggerConfig({ mode: "" });
    const primary = this.oneOf(object, path, [
      "schedule",
      "webhook",
      "availability",
      "event",
      "state",
      "expr",
    ]);
    const at: Path = [...path, primary];
    const timing = ["id", "grace", "cooldown"];
    let config: TriggerConfig;
    switch (primary) {
      case "state": {
        this.allowKeys(object, path, [...timing, "device", "state", "for"]);
        const deviceId = this.resolve("device", object.device, [...path, "device"]);
        const state = this.object(object.state, at);
        const fields = Object.keys(state);
        if (fields.length !== 1)
          this.fail(at, m.automation_code_one_of({ keys: "state" }, this.options));
        const property = fields[0];
        const raw = state[property];
        let comparator: Comparator = "==";
        let operand: JsonValue = raw;
        if (isObject(raw)) {
          this.allowKeys(raw, [...at, property], COMPARATORS);
          const ops = this.comparisons(raw, [...at, property], true);
          if (ops.length !== 1)
            this.fail(
              [...at, property],
              m.automation_code_one_of({ keys: quoteList(COMPARATORS) }, this.options),
            );
          [comparator, operand] = ops[0];
        }
        const literal = this.stateValue(property, operand, [...at, property]);
        config = {
          mode: "device_state",
          deviceId,
          property,
          comparator,
          value: literal === null ? "" : String(literal),
          holdMs:
            object.for === undefined ? undefined : this.duration(object.for, [...path, "for"]),
        };
        break;
      }
      case "event":
        this.allowKeys(object, path, [...timing, "device", "event"]);
        config = {
          mode: "device_event",
          deviceId: this.resolve("device", object.device, [...path, "device"]),
          eventValue: this.string(object.event, at),
        };
        break;
      case "availability":
        this.allowKeys(object, path, [...timing, "availability"]);
        config = {
          mode: "availability",
          deviceId: this.resolve("device", object.availability, at),
        };
        break;
      case "schedule":
        this.allowKeys(object, path, [...timing, "schedule"]);
        config = this.schedule(this.object(object.schedule, at), at);
        break;
      case "webhook":
        this.allowKeys(object, path, [...timing, "webhook", "where"]);
        config = {
          mode: "webhook",
          endpointId: this.resolve("webhook", object.webhook, at),
          webhookFilters:
            object.where === undefined
              ? []
              : (this.array(object.where, [...path, "where"]) as unknown as WebhookFilterRule[]),
        };
        break;
      default:
        this.allowKeys(object, path, [...timing, "expr", "event_type"]);
        config = {
          mode: "custom",
          customExpr: this.string(object.expr, at),
          eventType:
            object.event_type === undefined
              ? "device.state_changed"
              : this.string(object.event_type, [...path, "event_type"]),
        };
    }
    if (object.grace !== undefined)
      config.graceMs = this.duration(object.grace, [...path, "grace"]);
    if (object.cooldown !== undefined)
      config.cooldownMs = this.duration(object.cooldown, [...path, "cooldown"]);
    const error = validateTriggerConfig(config);
    if (error) this.fail(path, automationValidationMessage(error.code));
    return serializeTriggerConfig(config);
  }

  private schedule(schedule: JsonObject, path: Path): TriggerConfig {
    const kind = this.oneOf(schedule, path, ["at", "every", "cron"]);
    const at: Path = [...path, kind];
    if (kind === "at") {
      this.allowKeys(schedule, path, ["at", "days"]);
      const text = this.string(schedule.at, at);
      const clock = parseClock(text);
      if (!clock) this.fail(at, m.automation_code_invalid_time({ value: text }, this.options));
      const days =
        schedule.days === undefined
          ? []
          : this.array(schedule.days, [...path, "days"]).map((day, index) => {
              const dayText = this.string(day, [...path, "days", index]);
              const code = parseDay(dayText);
              if (!code)
                this.fail(
                  [...path, "days", index],
                  m.automation_code_unknown_day({ value: dayText }, this.options),
                );
              return code.toUpperCase();
            });
      return {
        mode: "schedule",
        scheduleSubmode: "at",
        scheduleHour: clock[0],
        scheduleMinute: clock[1],
        scheduleSecond: clock[2],
        scheduleWeekdays: DAY_CODES.map((code) => code.toUpperCase()).filter((code) =>
          days.includes(code),
        ),
      };
    }
    this.allowKeys(schedule, path, [kind]);
    if (kind === "every") {
      const text = this.string(schedule.every, at);
      const match = /^(\d+)(s|m|h)$/.exec(text.trim());
      if (!match || Number(match[1]) <= 0)
        this.fail(at, m.automation_code_invalid_duration({ value: text }, this.options));
      const unit = ({ s: "seconds", m: "minutes", h: "hours" } as const)[
        match[2] as "s" | "m" | "h"
      ];
      return {
        mode: "schedule",
        scheduleSubmode: "every",
        scheduleIntervalValue: Number(match[1]),
        scheduleIntervalUnit: unit,
      };
    }
    return {
      mode: "schedule",
      scheduleSubmode: "custom",
      cronExpr: this.string(schedule.cron, at),
    };
  }

  actionConfig(value: unknown, path: Path): string {
    if (typeof value === "string") {
      if (!value.startsWith("$"))
        this.fail(path, m.automation_code_expected_object({}, this.options));
      return this.macroCall(value, [], path);
    }
    const object = this.object(value, path);
    if (typeof object.use === "string") {
      this.allowKeys(object, path, ["id", "use"]);
      return this.macroCall(object.use, [], [...path, "use"]);
    }
    const keys = Object.keys(object).filter((key) => key !== "id");
    const macroKeys = keys.filter((key) => key.startsWith("$"));
    if (macroKeys.length === 1 && keys.length === 1) {
      const args = this.array(object[macroKeys[0]], [...path, macroKeys[0]]);
      return this.macroCall(macroKeys[0], args, [...path, macroKeys[0]]);
    }
    if (keys.length === 0)
      return serializeActionConfig({ actionType: "", targetType: "", targetId: "", payload: "" });
    if ("raw" in object) {
      this.allowKeys(object, path, ["id", "raw"]);
      return JSON.stringify(this.object(object.raw, [...path, "raw"]));
    }
    const kind = this.oneOf(object, path, Object.keys(ACTION_KEYS));
    this.allowKeys(object, path, ["id", kind]);
    const at: Path = [...path, kind];
    const body = object[kind];
    let target: Target = { targetType: "", targetId: "", targetExpr: [] };
    let payload = "";
    const bodyObject = () => this.object(body, at);
    switch (kind) {
      case "set": {
        const set = bodyObject();
        this.allowKeys(set, at, [...TARGET_KEYS, "state"]);
        target = this.target(set, at);
        const state: JsonObject = {};
        for (const [field, raw] of Object.entries(this.object(set.state ?? {}, [...at, "state"]))) {
          state[field] = this.stateValue(field, raw, [...at, "state", field]) as JsonValue;
        }
        payload = JSON.stringify(state);
        break;
      }
      case "toggle": {
        const toggle = bodyObject();
        this.allowKeys(toggle, at, TARGET_KEYS);
        target = this.target(toggle, at);
        break;
      }
      case "scene":
        target = { targetType: "scene", targetId: this.resolve("scene", body, at), targetExpr: [] };
        break;
      case "cycle":
        payload = JSON.stringify({
          scenes: this.array(body, at).map((scene, index) =>
            this.resolve("scene", scene, [...at, index]),
          ),
        });
        break;
      case "effect": {
        const effect = bodyObject();
        this.allowKeys(effect, at, [...TARGET_KEYS, "name"]);
        target = this.target(effect, at);
        const id = this.resolve("effect", effect.name, [...at, "name"]);
        const native = this.names.find("effect", id)?.native ?? false;
        payload = JSON.stringify(native ? { native_name: id } : { effect_id: id });
        break;
      }
      case "change": {
        const change = bodyObject();
        target = this.target(change, at);
        const fields = Object.keys(change).filter(
          (key) => !(TARGET_KEYS as readonly string[]).includes(key),
        );
        if (fields.length !== 1)
          this.fail(at, m.automation_code_missing_key({ key: "brightness" }, this.options));
        const field = fields[0];
        const amount = change[field];
        if (typeof amount === "number") {
          payload = JSON.stringify({ field, delta: amount, mode: "absolute" });
        } else {
          const text = this.string(amount, [...at, field]);
          const match = /^([+-]?\d+(?:\.\d+)?)(%?)$/.exec(text.trim());
          if (!match)
            this.fail(
              [...at, field],
              m.automation_code_invalid_value({ key: field }, this.options),
            );
          payload = JSON.stringify({
            field,
            delta: Number(match[1]),
            mode: match[2] ? "percent" : "absolute",
          });
        }
        break;
      }
      case "configure": {
        const configure = bodyObject();
        this.allowKeys(configure, at, ["device", "settings"]);
        target = {
          targetType: "device",
          targetId: this.resolve("device", configure.device, [...at, "device"]),
          targetExpr: [],
        };
        const settings = Object.entries(
          this.object(configure.settings ?? {}, [...at, "settings"]),
        ).map(([capability, setting]) => ({
          capability,
          booleanValue: typeof setting === "boolean" ? setting : null,
          numberValue: typeof setting === "number" ? setting : null,
          stringValue: typeof setting === "string" ? setting : null,
        }));
        payload = JSON.stringify({ settings });
        break;
      }
      case "alarm": {
        const alarm = bodyObject();
        this.allowKeys(alarm, at, ["id", "severity", "kind", "message"]);
        payload = JSON.stringify({
          alarm_id: this.string(alarm.id ?? "", [...at, "id"]),
          severity:
            alarm.severity === undefined
              ? "medium"
              : this.string(alarm.severity, [...at, "severity"]),
          kind: alarm.kind === undefined ? "auto" : this.string(alarm.kind, [...at, "kind"]),
          message:
            alarm.message === undefined ? "" : this.string(alarm.message, [...at, "message"]),
        });
        break;
      }
      case "clear_alarm":
        payload = JSON.stringify({ alarm_id: this.string(body, at) });
        break;
    }
    const config = { actionType: ACTION_KEYS[kind], ...target, payload };
    const error = validateActionConfig(config);
    if (error) this.fail(path, automationValidationMessage(error.code));
    return serializeActionConfig(config);
  }

  private macroCall(reference: string, args: JsonValue[], path: Path): string {
    const name = this.macro(reference, "action", path);
    const definition = this.compiled[name];
    const params = definition?.params ?? 0;
    if (args.length !== params)
      this.fail(path, m.automation_code_macro_args({ name }, this.options));
    const payload = definition?.action?.payload;
    const fields = new Map<number, string>();
    if (isObject(payload)) {
      for (const [field, value] of Object.entries(payload)) {
        const match = typeof value === "string" ? PARAMETER.exec(value) : null;
        if (match) fields.set(Number(match[1]), field);
      }
    }
    const converted = args.map((arg, index) => {
      const field = fields.get(index + 1);
      return field ? this.stateValue(field, arg, [...path, index]) : arg;
    });
    return JSON.stringify(converted.length ? { use: name, args: converted } : { use: name });
  }
}

/** What a definition stands for, judged by its keys. */
export function definitionKind(body: JsonValue): DefinitionKind {
  if (!isObject(body)) return "condition";
  const keys = Object.keys(body);
  if (keys.some((key) => key in ACTION_KEYS || key.startsWith("$"))) return "action";
  if (keys.length > 0 && keys.every((key) => (TARGET_KEYS as readonly string[]).includes(key)))
    return "target";
  return "condition";
}

interface Element {
  type: WireNode["type"];
  value: JsonValue;
  path: Path;
  explicit?: string;
}

function explicitId(value: JsonValue): string | undefined {
  return isObject(value) && typeof value.id === "string" ? value.id : undefined;
}

function listOf(value: JsonValue | undefined): { items: JsonValue[]; many: boolean } {
  if (value === undefined) return { items: [], many: false };
  return Array.isArray(value) ? { items: value, many: true } : { items: [value], many: false };
}

/** Compiles a document of the automation language into its stored form. */
export function parseAutomation(doc: unknown, names: Names): ParseResult {
  const compiler = new Compiler(names);
  const options = locale.messageOptions();
  const result = compiler.attempt((): WireAutomation => {
    const root = compiler.object(doc, []);
    compiler.allowKeys(root, [], ["name", "define", "rules", "graph"]);
    const name = compiler.string(root.name ?? "", ["name"]);
    const definitions = compiler.definitions(root.define, ["define"]);
    const form = compiler.oneOf(root, [], ["rules", "graph"]);
    const entries = compiler.array(root[form], [form]);

    const nodes: WireNode[] = [];
    const edges: WireEdge[] = [];
    const compile = (element: Element, id: string) => {
      const config = compiler.attempt(() => {
        switch (element.type) {
          case "trigger":
            return compiler.triggerConfig(element.value, element.path);
          case "condition":
            return compiler.conditionConfig(element.value, element.path);
          case "action":
            return compiler.actionConfig(element.value, element.path);
          default: {
            const op = compiler.string(element.value, element.path).toLowerCase();
            if (!["and", "or", "not"].includes(op)) {
              compiler.fail(
                element.path,
                m.automation_code_one_of({ keys: quoteList(["and", "or", "not"]) }, options),
              );
            }
            return JSON.stringify({ kind: op });
          }
        }
      });
      if (config !== null) nodes.push({ id, type: element.type, config });
    };

    if (form === "rules") {
      const rules = entries.map((entry, index) => {
        const path: Path = ["rules", index];
        const rule = compiler.attempt(() => {
          const object = compiler.object(entry, path);
          compiler.allowKeys(object, path, ["when", "if", "do"]);
          if (!("when" in object))
            compiler.fail(path, m.automation_code_missing_key({ key: "when" }, options));
          return object;
        });
        const part = (key: string, type: Element["type"]): Element[] => {
          const { items, many } = listOf(rule?.[key]);
          return items.map((value, i) => ({
            type,
            value,
            path: many ? [...path, key, i] : [...path, key],
            explicit: explicitId(value),
          }));
        };
        return {
          triggers: part("when", "trigger"),
          conditions: part("if", "condition"),
          actions: part("do", "action"),
        };
      });
      const elements = rules.flatMap((rule) => [
        ...rule.triggers,
        ...rule.conditions,
        ...rule.actions,
      ]);
      const ids = assignIds(
        elements.map((element) => ({
          prefix: NODE_PREFIX[element.type],
          explicit: element.explicit,
        })),
      );
      checkDuplicates(compiler, elements, ids);
      elements.forEach((element, index) => compile(element, ids[index]));
      const idOf = new Map(elements.map((element, index) => [element, ids[index]]));
      const taken = new Set(ids);
      const nextOperator = () => assignIds([{ prefix: "o" }], taken)[0];
      for (const rule of rules) {
        const triggers = rule.triggers.map((element) => idOf.get(element)!);
        const conditions = rule.conditions.map((element) => idOf.get(element)!);
        const actions = rule.actions.map((element) => idOf.get(element)!);
        const operators: { or?: string; and?: string } = {};
        if (conditions.length >= 2) {
          if (triggers.length > 1) {
            operators.or = nextOperator();
            taken.add(operators.or);
            nodes.push({
              id: operators.or,
              type: "operator",
              config: JSON.stringify({ kind: "or" }),
            });
          }
          operators.and = nextOperator();
          taken.add(operators.and);
          nodes.push({
            id: operators.and,
            type: "operator",
            config: JSON.stringify({ kind: "and" }),
          });
        }
        for (const key of ruleEdgeKeys(triggers, conditions, actions, operators)) {
          const [fromNodeId, toNodeId] = key.split("\u0000");
          edges.push({ fromNodeId, toNodeId });
        }
      }
    } else {
      const elements: (Element & { after: JsonValue | undefined })[] = [];
      entries.forEach((entry, index) => {
        const path: Path = ["graph", index];
        compiler.attempt(() => {
          const object = compiler.object(entry, path);
          const key = compiler.oneOf(object, path, ["when", "if", "op", "do"]);
          compiler.allowKeys(object, path, ["id", key, "after"]);
          const type = (
            { when: "trigger", if: "condition", op: "operator", do: "action" } as const
          )[key as "when" | "if" | "op" | "do"];
          elements.push({
            type,
            value: object[key],
            path: [...path, key],
            explicit:
              object.id === undefined ? undefined : compiler.string(object.id, [...path, "id"]),
            after: object.after,
          });
        });
      });
      const ids = assignIds(
        elements.map((element) => ({
          prefix: NODE_PREFIX[element.type],
          explicit: element.explicit,
        })),
      );
      checkDuplicates(compiler, elements, ids);
      elements.forEach((element, index) => compile(element, ids[index]));
      const known = new Set(ids);
      elements.forEach((element, index) => {
        if (element.after === undefined) return;
        const afterPath: Path = [...element.path.slice(0, -1), "after"];
        compiler.attempt(() => {
          compiler.array(element.after, afterPath).forEach((from, i) => {
            const fromId = compiler.string(from, [...afterPath, i]);
            if (!known.has(fromId))
              compiler.fail(
                [...afterPath, i],
                m.automation_code_unknown_id({ id: fromId }, options),
              );
            edges.push({ fromNodeId: fromId, toNodeId: ids[index] });
          });
        });
      });
    }
    return { name, nodes, edges, definitions };
  });
  return {
    automation: compiler.diagnostics.length === 0 ? result : null,
    diagnostics: compiler.diagnostics,
  };
}

function checkDuplicates(compiler: Compiler, elements: Element[], ids: string[]): void {
  const seen = new Set<string>();
  ids.forEach((id, index) => {
    if (seen.has(id)) {
      compiler.diagnostics.push({
        path: elements[index].path,
        message: m.automation_code_duplicate_id({ id }, locale.messageOptions()),
      });
    }
    seen.add(id);
  });
}
