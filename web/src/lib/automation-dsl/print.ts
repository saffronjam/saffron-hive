import type { Clause as TargetClause } from "$lib/target-resolve";
import {
  normalizeActionConfig,
  normalizeTriggerConfig,
  actionMacroCall,
} from "$lib/components/graph/trigger-expr";
import { normalizeConditionConfig } from "$lib/components/graph/condition-expr";
import { parseExpr, type Call, type Clause, type Literal } from "./expr";
import type { Names, EntityKind } from "./names";
import {
  AGGREGATE_FUNCTIONS,
  CLAUSE_KEYS,
  NODE_PREFIX,
  type JsonObject,
  type JsonValue,
  type WireAutomation,
  type WireEdge,
  type WireNode,
} from "./model";
import { formatClock, formatDuration, formatStateValue, parseDay } from "./values";

interface StoredDefinition {
  kind: "condition" | "target" | "action";
  expr?: string;
  target_expr?: TargetClause[];
  action?: JsonObject;
  params?: number;
}

type StoredDefinitions = Record<string, StoredDefinition>;

function parseJson(text: string): JsonObject {
  try {
    const parsed: unknown = JSON.parse(text || "{}");
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as JsonObject)
      : {};
  } catch {
    return {};
  }
}

export function parseStoredDefinitions(text: string): StoredDefinitions {
  return parseJson(text) as unknown as StoredDefinitions;
}

/** Turns "true", "21" and "idle" into true, 21 and "idle". */
function storedValue(value: string): JsonValue {
  if (value === "true") return true;
  if (value === "false") return false;
  if (value !== "" && !isNaN(Number(value))) return Number(value);
  return value;
}

const SUBJECT_KEYS: Record<string, string> = Object.fromEntries(
  Object.entries(CLAUSE_KEYS).map(([key, subject]) => [subject, key]),
);

const NAMED_SUBJECTS: Record<string, EntityKind> = {
  room: "room",
  group: "group",
  device: "device",
};

class Printer {
  constructor(
    private readonly names: Names,
    private readonly definitions: StoredDefinitions,
  ) {}

  private ref(kind: EntityKind, id: string): string {
    return this.names.name(kind, id);
  }

  clauses(clauses: TargetClause[]): JsonValue[] {
    return clauses.map((clause) => {
      const key = SUBJECT_KEYS[clause.subject] ?? clause.subject;
      const kind = NAMED_SUBJECTS[clause.subject];
      const values = clause.values.map((value) => (kind ? this.ref(kind, value) : value));
      const many =
        clause.op === "is_one_of" || clause.op === "is_not_one_of" || values.length !== 1;
      let printed: JsonValue = { [key]: many ? values : values[0] };
      if (clause.op === "is_not" || clause.op === "is_not_one_of") printed = { not: printed };
      if (clause.connector === "or") printed = { or: printed };
      return printed;
    });
  }

  /** A selector, compacted to a plain reference when it is one "is" clause. */
  selector(clauses: TargetClause[]): JsonObject {
    if (clauses.length === 1) {
      const [clause] = clauses;
      const kind = NAMED_SUBJECTS[clause.subject];
      if (kind && clause.op === "is" && clause.values.length === 1 && !clause.connector) {
        return { [kind]: this.ref(kind, clause.values[0]) };
      }
    }
    return { where: this.clauses(clauses) };
  }

  target(targetType: string, targetId: string, targetExpr: TargetClause[] = []): JsonObject {
    switch (targetType) {
      case "device":
      case "group":
      case "room":
        return { [targetType]: this.ref(targetType, targetId) };
      case "expression":
        return { where: this.clauses(targetExpr) };
      case "macro":
        return { target: `$${targetId}` };
      default:
        return {};
    }
  }

  /** A target written as an expression argument. */
  private exprTarget(arg: Literal): JsonObject | null {
    if (!arg || typeof arg !== "object" || Array.isArray(arg)) return null;
    const object = arg as Record<string, Literal>;
    for (const kind of ["device", "room", "group"] as const) {
      if (typeof object[kind] === "string")
        return { [kind]: this.ref(kind, object[kind] as string) };
    }
    if (Array.isArray(object.where))
      return { where: this.clauses(object.where as unknown as TargetClause[]) };
    if (typeof object.macro === "string") return { target: `$${object.macro}` };
    return null;
  }

  private state(field: string, value: Literal): JsonObject {
    return { [field]: formatStateValue(field, value) as JsonValue };
  }

  trigger(configText: string): JsonObject {
    const raw = parseJson(configText);
    const config = normalizeTriggerConfig(raw);
    let printed: JsonObject;
    switch (config.mode) {
      case "":
        return {};
      case "device_state": {
        const device = config.deviceId
          ? this.ref("device", config.deviceId)
          : (config.deviceName ?? "");
        const value = formatStateValue(config.property ?? "", storedValue(config.value ?? ""));
        const comparator = config.comparator ?? "==";
        printed = {
          device,
          state: {
            [config.property ?? ""]: (comparator === "=="
              ? value
              : { [comparator]: value }) as JsonValue,
          },
        };
        if (config.holdMs) printed.for = formatDuration(config.holdMs);
        break;
      }
      case "device_event":
        printed = {
          device: this.ref("device", config.deviceId ?? ""),
          event: config.eventValue ?? "",
        };
        break;
      case "availability":
        printed = { availability: this.ref("device", config.deviceId ?? "") };
        break;
      case "schedule":
        printed = { schedule: this.schedule(config) };
        break;
      case "webhook":
        printed = { webhook: this.ref("webhook", config.endpointId ?? "") };
        if (config.webhookFilters?.length)
          printed.where = config.webhookFilters as unknown as JsonValue;
        break;
      default:
        printed = { expr: config.customExpr ?? "true" };
        if (config.eventType && config.eventType !== "device.state_changed") {
          printed.event_type = config.eventType;
        }
    }
    if (config.graceMs) printed.grace = formatDuration(config.graceMs);
    if (config.cooldownMs) printed.cooldown = formatDuration(config.cooldownMs);
    return printed;
  }

  private schedule(config: ReturnType<typeof normalizeTriggerConfig>): JsonObject {
    if (config.scheduleSubmode === "at") {
      const at: JsonObject = {
        at: formatClock(
          config.scheduleHour ?? 0,
          config.scheduleMinute ?? 0,
          config.scheduleSecond ?? 0,
        ),
      };
      const days = config.scheduleWeekdays ?? [];
      if (days.length > 0 && days.length < 7) at.days = days.map((day) => day.toLowerCase());
      return at;
    }
    if (config.scheduleSubmode === "every") {
      const unit = { seconds: "s", minutes: "m", hours: "h" }[
        config.scheduleIntervalUnit ?? "seconds"
      ];
      return { every: `${config.scheduleIntervalValue ?? 1}${unit}` };
    }
    return { cron: config.cronExpr ?? "" };
  }

  condition(configText: string): JsonValue {
    const raw = parseJson(configText);
    if (typeof raw.use === "string") {
      return raw.negate === true ? { not: `$${raw.use}` } : `$${raw.use}`;
    }
    const expr = typeof raw.expr === "string" ? raw.expr : "";
    if (!expr) return {};
    return this.expression(expr);
  }

  expression(expr: string): JsonValue {
    const ast = parseExpr(expr);
    if (ast) {
      const printed = this.clauseList(ast.clauses);
      if (printed) return printed;
    }
    const legacy = normalizeConditionConfig({ expr });
    if (legacy.mode === "time_window") {
      const after =
        legacy.afterHour !== undefined
          ? formatClock(legacy.afterHour, legacy.afterMinute ?? 0)
          : null;
      const before =
        legacy.beforeHour !== undefined
          ? formatClock(legacy.beforeHour, legacy.beforeMinute ?? 0)
          : null;
      if (after && before) return { time: { between: [after, before] } };
      if (after) return { time: { after } };
      if (before) return { time: { before } };
    }
    if (legacy.mode === "weekday") {
      return { day: (legacy.weekdays ?? []).map((day) => parseDay(day) ?? day) };
    }
    return { expr };
  }

  private clauseList(clauses: Clause[]): JsonObject | null {
    if (clauses.length === 1) {
      const single = this.clause(clauses[0]);
      if (single) return single;
    }
    return this.stateComparisons(clauses);
  }

  /** `device("x").a == 1 && device("x").b > 2` as one state condition. */
  private stateComparisons(clauses: Clause[]): JsonObject | null {
    let accessor: string | null = null;
    let ref: string | null = null;
    const state: JsonObject = {};
    for (const clause of clauses) {
      if (clause.kind !== "compare" || !("literal" in clause.right)) return null;
      const { fn, args, member } = clause.call;
      if (!["device", "room", "group"].includes(fn) || args.length !== 1 || !member) return null;
      if (typeof args[0] !== "string") return null;
      if ((accessor && accessor !== fn) || (ref && ref !== args[0])) return null;
      accessor = fn;
      ref = args[0];
      const value = formatStateValue(member, clause.right.literal) as JsonValue;
      if (clause.op === "==" && !(member in state)) {
        state[member] = value;
        continue;
      }
      const existing = state[member];
      const ops: JsonObject =
        existing && typeof existing === "object" && !Array.isArray(existing) ? existing : {};
      if (existing !== undefined && ops !== existing) ops["=="] = existing;
      ops[clause.op] = value;
      state[member] = ops;
    }
    if (!accessor || ref === null) return null;
    return { ...this.accessorTarget(accessor, ref), state };
  }

  /** The target of device()/room()/group(), which may hold an id or a name. */
  private accessorTarget(accessor: string, ref: string): JsonObject {
    const kind = accessor as EntityKind;
    if (this.names.find(kind, ref)) return { [kind]: this.ref(kind, ref) };
    if (accessor === "device") {
      for (const candidate of ["device", "group", "room"] as const) {
        const resolved = this.names.resolve(candidate, ref);
        if (resolved.ok) return { [candidate]: this.ref(candidate, resolved.id) };
      }
    }
    return { [kind]: ref };
  }

  private clause(clause: Clause): JsonObject | null {
    if (clause.kind === "not") {
      const inner = this.clauseList(clause.inner.clauses);
      return inner ? { not: inner } : null;
    }
    const call: Call = clause.call;
    const args = call.args;
    if (clause.kind === "call") {
      if (
        call.fn === "time.between" &&
        args.length === 2 &&
        args.every((a) => typeof a === "string")
      ) {
        return { time: { between: args as string[] } };
      }
      if ((call.fn === "time.after" || call.fn === "time.before") && typeof args[0] === "string") {
        return { time: { [call.fn.slice(5)]: args[0] } };
      }
      if (call.fn === "day.in" && args.every((a) => typeof a === "string")) {
        return { day: args as string[] };
      }
      if (call.fn === "scene_active" && typeof args[0] === "string") {
        return { scene_active: this.ref("scene", args[0]) };
      }
      if (
        (call.fn === "any_of" || call.fn === "all_of") &&
        args.length === 3 &&
        typeof args[1] === "string"
      ) {
        const target = this.exprTarget(args[0]);
        if (!target) return null;
        return { [call.fn.slice(0, 3)]: { ...target, state: this.state(args[1], args[2]) } };
      }
      return null;
    }
    if (call.member !== undefined) return null;
    const aggregate = Object.entries(AGGREGATE_FUNCTIONS).find(([, fn]) => fn === call.fn)?.[0];
    if (!aggregate) return null;
    const target = this.exprTarget(args[0]);
    if (!target || typeof args[1] !== "string") return null;
    if (aggregate === "count" && args.length === 3 && "literal" in clause.right) {
      return {
        count: {
          ...target,
          state: this.state(args[1], args[2]),
          [clause.op]: clause.right.literal as JsonValue,
        },
      };
    }
    if (aggregate === "since" && args.length === 2 && "duration" in clause.right) {
      return { since: { ...target, field: args[1], [clause.op]: clause.right.duration } };
    }
    if (
      ["avg", "min", "max"].includes(aggregate) &&
      args.length === 2 &&
      "literal" in clause.right
    ) {
      return {
        [aggregate]: {
          ...target,
          field: args[1],
          [clause.op]: formatStateValue(args[1], clause.right.literal) as JsonValue,
        },
      };
    }
    return null;
  }

  action(configText: string): JsonValue {
    const raw = parseJson(configText);
    const config = normalizeActionConfig(raw);
    const macro = actionMacroCall(config);
    if (macro) return this.macroCall(macro.use, macro.args);
    const payload = parseJson(config.payload);
    const target = this.target(config.targetType, config.targetId, config.targetExpr);
    switch (config.actionType) {
      case "":
        return {};
      case "set_device_state": {
        const state: JsonObject = {};
        for (const [field, value] of Object.entries(payload)) {
          state[field] = formatStateValue(field, value) as JsonValue;
        }
        return { set: { ...target, state } };
      }
      case "toggle_device_state":
        return { toggle: target };
      case "activate_scene":
        return { scene: this.ref("scene", config.targetId) };
      case "cycle_scenes": {
        const scenes = Array.isArray(payload.scenes) ? payload.scenes : [];
        return { cycle: scenes.map((id) => this.ref("scene", String(id))) };
      }
      case "run_effect": {
        const id = typeof payload.effect_id === "string" ? payload.effect_id : payload.native_name;
        return { effect: { name: this.ref("effect", String(id ?? "")), ...target } };
      }
      case "change_value": {
        const field = String(payload.field ?? "");
        const delta = typeof payload.delta === "number" ? payload.delta : 0;
        const amount: JsonValue =
          payload.mode === "absolute" ? delta : `${delta > 0 ? "+" : ""}${delta}%`;
        return { change: { ...target, [field]: amount } };
      }
      case "configure_device": {
        const settings: JsonObject = {};
        for (const entry of Array.isArray(payload.settings) ? payload.settings : []) {
          const setting = entry as JsonObject;
          const value = setting.booleanValue ?? setting.numberValue ?? setting.stringValue ?? null;
          settings[String(setting.capability)] = value;
        }
        return { configure: { ...target, settings } };
      }
      case "raise_alarm": {
        const alarm: JsonObject = { id: payload.alarm_id ?? "" };
        for (const key of ["severity", "kind", "message"]) {
          if (payload[key] !== undefined && payload[key] !== "") alarm[key] = payload[key];
        }
        return { alarm };
      }
      case "clear_alarm":
        return { clear_alarm: payload.alarm_id ?? "" };
      default:
        return { raw: raw };
    }
  }

  /** State fields an action macro passes each parameter to, by index. */
  paramFields(name: string): Map<number, string> {
    const fields = new Map<number, string>();
    const payload = this.definitions[name]?.action?.payload;
    if (payload && typeof payload === "object" && !Array.isArray(payload)) {
      for (const [field, value] of Object.entries(payload)) {
        const match = typeof value === "string" ? /^\$(\d+)$/.exec(value) : null;
        if (match) fields.set(Number(match[1]), field);
      }
    }
    return fields;
  }

  private macroCall(name: string, args: unknown[]): JsonValue {
    if (args.length === 0) return `$${name}`;
    const fields = this.paramFields(name);
    return {
      [`$${name}`]: args.map((arg, i) => {
        const field = fields.get(i + 1);
        return (field ? formatStateValue(field, arg) : arg) as JsonValue;
      }),
    };
  }

  definitionsDoc(): JsonObject | null {
    const entries = Object.entries(this.definitions);
    if (entries.length === 0) return null;
    const define: JsonObject = {};
    for (const [name, definition] of entries) {
      switch (definition.kind) {
        case "condition":
          define[name] = this.expression(definition.expr ?? "true");
          break;
        case "target":
          define[name] = this.selector(definition.target_expr ?? []);
          break;
        case "action": {
          const action = { ...definition.action };
          if (action.payload && typeof action.payload === "object") {
            action.payload = JSON.stringify(action.payload);
          }
          define[name] = this.action(JSON.stringify(action));
          break;
        }
      }
    }
    return define;
  }
}

interface Rule {
  triggers: WireNode[];
  conditions: WireNode[];
  actions: WireNode[];
}

function edgeKey(from: string, to: string): string {
  return `${from}\u0000${to}`;
}

function operatorKind(node: WireNode): string {
  const kind = parseJson(node.config).kind;
  return typeof kind === "string" ? kind.toLowerCase() : "";
}

/** The edges a rule compiles to; see parse.ts ruleEdges for the shapes. */
export function ruleEdgeKeys(
  triggers: string[],
  conditions: string[],
  actions: string[],
  operators: { or?: string; and?: string },
): Set<string> {
  const keys = new Set<string>();
  if (conditions.length === 0) {
    for (const t of triggers) for (const a of actions) keys.add(edgeKey(t, a));
  } else if (conditions.length === 1) {
    for (const t of triggers) keys.add(edgeKey(t, conditions[0]));
    for (const a of actions) keys.add(edgeKey(conditions[0], a));
  } else {
    const and = operators.and ?? "";
    if (triggers.length === 1) keys.add(edgeKey(triggers[0], and));
    else {
      for (const t of triggers) keys.add(edgeKey(t, operators.or ?? ""));
      keys.add(edgeKey(operators.or ?? "", and));
    }
    for (const c of conditions) keys.add(edgeKey(c, and));
    for (const a of actions) keys.add(edgeKey(and, a));
  }
  return keys;
}

/** Splits a graph into rules, or returns null when some part is not a rule. */
function decompose(nodes: WireNode[], edges: WireEdge[]): Rule[] | null {
  const parent = new Map(nodes.map((node) => [node.id, node.id]));
  const find = (id: string): string => {
    let root = id;
    while (parent.get(root) !== root) root = parent.get(root)!;
    return root;
  };
  for (const edge of edges) {
    if (!parent.has(edge.fromNodeId) || !parent.has(edge.toNodeId)) return null;
    parent.set(find(edge.fromNodeId), find(edge.toNodeId));
  }
  const components = new Map<string, WireNode[]>();
  for (const node of nodes) {
    const root = find(node.id);
    components.set(root, [...(components.get(root) ?? []), node]);
  }
  const rules: Rule[] = [];
  for (const members of components.values()) {
    const ids = new Set(members.map((node) => node.id));
    const ofType = (type: WireNode["type"]) => members.filter((node) => node.type === type);
    const triggers = ofType("trigger");
    const conditions = ofType("condition");
    const operators = ofType("operator");
    const actions = ofType("action");
    if (triggers.length === 0) return null;
    const actual = new Set(
      edges
        .filter((edge) => ids.has(edge.fromNodeId))
        .map((e) => edgeKey(e.fromNodeId, e.toNodeId)),
    );
    if (actions.length === 0 && (triggers.length !== 1 || members.length !== 1)) return null;
    const ops: { or?: string; and?: string } = {};
    const wantOperators = conditions.length < 2 ? 0 : triggers.length === 1 ? 1 : 2;
    if (operators.length !== wantOperators) return null;
    for (const operator of operators) {
      const kind = operatorKind(operator);
      if (kind === "and" && !ops.and) ops.and = operator.id;
      else if (kind === "or" && !ops.or && wantOperators === 2) ops.or = operator.id;
      else return null;
    }
    const expected = ruleEdgeKeys(
      triggers.map((n) => n.id),
      conditions.map((n) => n.id),
      actions.map((n) => n.id),
      ops,
    );
    if (expected.size !== actual.size || [...expected].some((key) => !actual.has(key))) return null;
    rules.push({ triggers, conditions, actions });
  }
  const order = new Map(nodes.map((node, index) => [node.id, index]));
  return rules.sort((a, b) => order.get(a.triggers[0].id)! - order.get(b.triggers[0].id)!);
}

/**
 * Element ids the parser would assign on its own: each element without an
 * explicit id takes the next free "<prefix><n>" in document order.
 */
export function assignIds(
  elements: { prefix: string; explicit?: string }[],
  reserved: Iterable<string> = [],
): string[] {
  const taken = new Set<string>(reserved);
  for (const element of elements) if (element.explicit) taken.add(element.explicit);
  const counters = new Map<string, number>();
  return elements.map((element) => {
    if (element.explicit) return element.explicit;
    let n = counters.get(element.prefix) ?? 0;
    let id: string;
    do {
      n += 1;
      id = `${element.prefix}${n}`;
    } while (taken.has(id));
    counters.set(element.prefix, n);
    taken.add(id);
    return id;
  });
}

/** The smallest set of element ids to print so parsing gives back the same ids. */
function idsToPrint(elements: WireNode[]): Set<string> {
  const explicit = new Set<string>();
  for (;;) {
    const assigned = assignIds(
      elements.map((node) => ({
        prefix: NODE_PREFIX[node.type],
        explicit: explicit.has(node.id) ? node.id : undefined,
      })),
    );
    const before = explicit.size;
    elements.forEach((node, index) => {
      if (assigned[index] !== node.id) explicit.add(node.id);
    });
    if (explicit.size === before) return explicit;
  }
}

function withId(value: JsonValue, id: string, print: boolean): JsonValue {
  if (!print) return value;
  if (typeof value === "string") return { id, use: value };
  if (value && typeof value === "object" && !Array.isArray(value)) return { id, ...value };
  return value;
}

function oneOrMany(values: JsonValue[]): JsonValue {
  return values.length === 1 ? values[0] : values;
}

/** A condition expression in the readable language, or `{ expr }` when it has no structure. */
export function printExpression(expr: string, names: Names): JsonValue {
  return new Printer(names, {}).expression(expr);
}

/** Prints a stored automation in the readable automation language. */
export function printAutomation(wire: WireAutomation, names: Names): JsonObject {
  const definitions = parseStoredDefinitions(wire.definitions);
  const printer = new Printer(names, definitions);
  const doc: JsonObject = { name: wire.name };
  const define = printer.definitionsDoc();
  if (define) doc.define = define;

  const print = (node: WireNode): JsonValue => {
    switch (node.type) {
      case "trigger":
        return printer.trigger(node.config);
      case "condition":
        return printer.condition(node.config);
      case "action":
        return printer.action(node.config);
      default:
        return { op: operatorKind(node) || "and" };
    }
  };

  const rules = decompose(wire.nodes, wire.edges);
  if (rules) {
    const elements = rules.flatMap((rule) => [
      ...rule.triggers,
      ...rule.conditions,
      ...rule.actions,
    ]);
    const explicit = idsToPrint(elements);
    const element = (node: WireNode) => withId(print(node), node.id, explicit.has(node.id));
    doc.rules = rules.map((rule) => {
      const printed: JsonObject = { when: oneOrMany(rule.triggers.map(element)) };
      if (rule.conditions.length) printed.if = oneOrMany(rule.conditions.map(element));
      if (rule.actions.length) printed.do = oneOrMany(rule.actions.map(element));
      return printed;
    });
    return doc;
  }

  doc.graph = wire.nodes.map((node) => {
    const key = { trigger: "when", condition: "if", operator: "op", action: "do" }[node.type];
    const printed = print(node);
    const entry: JsonObject = { id: node.id };
    entry[key] = node.type === "operator" ? (printed as JsonObject).op : printed;
    const after = wire.edges
      .filter((edge) => edge.toNodeId === node.id)
      .map((edge) => edge.fromNodeId);
    if (after.length) entry.after = after;
    return entry;
  });
  return doc;
}

/**
 * Formats a document as JSON, keeping short arrays and objects on one line so
 * rules read like sentences.
 */
export function formatDocument(value: JsonValue, indent = ""): string {
  const inline = inlineJson(value);
  if (indent !== "" && inline.length + indent.length <= 88) return inline;
  if (Array.isArray(value)) {
    if (value.length === 0) return "[]";
    const inner = indent + "  ";
    return `[\n${value.map((item) => inner + formatDocument(item, inner)).join(",\n")}\n${indent}]`;
  }
  if (value && typeof value === "object") {
    const entries = Object.entries(value);
    if (entries.length === 0) return "{}";
    const inner = indent + "  ";
    return `{\n${entries
      .map(([key, item]) => `${inner}${JSON.stringify(key)}: ${formatDocument(item, inner)}`)
      .join(",\n")}\n${indent}}`;
  }
  return inline;
}

function inlineJson(value: JsonValue): string {
  if (Array.isArray(value)) return `[${value.map(inlineJson).join(", ")}]`;
  if (value && typeof value === "object") {
    const entries = Object.entries(value);
    if (entries.length === 0) return "{}";
    return `{ ${entries.map(([key, item]) => `${JSON.stringify(key)}: ${inlineJson(item)}`).join(", ")} }`;
  }
  return JSON.stringify(value);
}
