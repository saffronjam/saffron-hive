import {
  snippet,
  type Completion,
  type CompletionContext,
  type CompletionResult,
} from "@codemirror/autocomplete";
import type { EditorView } from "@codemirror/view";
import { m } from "$lib/i18n/messages";
import { locale } from "$lib/i18n/locale.svelte";
import { historyFieldLabel, identifierLabel } from "$lib/i18n/vocabulary";
import {
  CLAUSE_DEVICE_ROLES,
  CLAUSE_DEVICE_TYPES,
  capabilityLabel,
  clauseSubjects,
} from "$lib/target-resolve";
import {
  actionOptions,
  conditionOptions,
  triggerOptions,
} from "$lib/components/graph/automation-node-options";
import { operatorOptions } from "$lib/components/graph/automation-node-options";
import { capabilityToExprProperty, weekdayLabel } from "$lib/components/graph/trigger-expr";
import type { Capability } from "$lib/stores/devices";
import { COMPARATORS } from "./expr";
import { cursorContext, type CursorContext } from "./json-paths";
import { ACTION_KEYS, CLAUSE_KEYS, type Path } from "./model";
import type { EntityKind, Names } from "./names";
import { definitionKind } from "./parse";
import { DAY_CODES } from "./values";

type Slot =
  | "root"
  | "define"
  | "definition"
  | "rules"
  | "rule"
  | "graph"
  | "graphEntry"
  | "triggers"
  | "trigger"
  | "schedule"
  | "conditions"
  | "condition"
  | "time"
  | "aggregate"
  | "measure"
  | "actions"
  | "action"
  | "set"
  | "targetOnly"
  | "effect"
  | "change"
  | "configure"
  | "alarm"
  | "where"
  | "clause"
  | "state"
  | "list";

/** What follows a key when it is inserted. */
type Template = "object" | "array" | "string" | "scalar";

interface Option {
  /** What is inserted: a key, or a value written as JSON. */
  value: string;
  label: string;
  detail?: string;
  template?: Template;
  type?: string;
}

/** Slots whose value may be one element or a list of them. */
const LIST_ITEM: Partial<Record<Slot, Slot>> = {
  rules: "rule",
  graph: "graphEntry",
  triggers: "trigger",
  conditions: "condition",
  actions: "action",
  where: "clause",
};

const ONE_OR_MANY: Partial<Record<Slot, Slot>> = {
  triggers: "trigger",
  conditions: "condition",
  actions: "action",
};

const CHILDREN: Partial<Record<Slot, Record<string, Slot>>> = {
  root: { define: "define", rules: "rules", graph: "graph" },
  rule: { when: "triggers", if: "conditions", do: "actions" },
  graphEntry: { when: "trigger", if: "condition", do: "action", after: "list" },
  trigger: { state: "state", schedule: "schedule", where: "list" },
  schedule: { days: "list" },
  condition: {
    time: "time",
    state: "state",
    any: "aggregate",
    all: "aggregate",
    count: "aggregate",
    avg: "measure",
    min: "measure",
    max: "measure",
    since: "measure",
    not: "condition",
    day: "list",
  },
  aggregate: { state: "state", where: "where" },
  measure: { where: "where" },
  action: {
    set: "set",
    toggle: "targetOnly",
    effect: "effect",
    change: "change",
    configure: "configure",
    alarm: "alarm",
    cycle: "list",
  },
  set: { state: "state", where: "where" },
  targetOnly: { where: "where" },
  effect: { where: "where" },
  change: { where: "where" },
  clause: { not: "clause", or: "clause" },
  time: { between: "list" },
};

/** The slot of the object or value at a path. */
function slotAt(path: Path): Slot | null {
  let slot: Slot = "root";
  for (const segment of path) {
    if (typeof segment === "number") {
      const item: Slot | undefined = LIST_ITEM[slot];
      if (!item && slot !== "list") return null;
      slot = item ?? "list";
      continue;
    }
    const resolved: Slot = ONE_OR_MANY[slot] ?? slot;
    if (resolved === "define") {
      slot = "definition";
      continue;
    }
    if (resolved === "definition") {
      const next = CHILDREN.condition?.[segment] ?? CHILDREN.action?.[segment];
      if (!next) return null;
      slot = next;
      continue;
    }
    const next = CHILDREN[resolved]?.[segment];
    if (!next) return null;
    slot = next;
  }
  return slot;
}

const TEMPLATES: Record<string, Template> = {
  define: "object",
  rules: "array",
  graph: "array",
  when: "object",
  if: "object",
  do: "object",
  state: "object",
  schedule: "object",
  time: "object",
  any: "object",
  all: "object",
  count: "object",
  avg: "object",
  min: "object",
  max: "object",
  since: "object",
  not: "object",
  or: "object",
  set: "object",
  toggle: "object",
  effect: "object",
  change: "object",
  configure: "object",
  alarm: "object",
  settings: "object",
  where: "array",
  days: "array",
  day: "array",
  between: "array",
  cycle: "array",
};

function keyOption(value: string, label: string, template?: Template): Option {
  return {
    value,
    label,
    detail: value,
    template: template ?? TEMPLATES[value] ?? "string",
    type: "property",
  };
}

/** Builds completion options for one editor state. */
class Suggester {
  private readonly options = locale.messageOptions();

  constructor(
    private readonly names: Names,
    private readonly macros: Map<string, string>,
  ) {}

  private targetKeys(): Option[] {
    return [
      keyOption("device", m.target_subject_device({}, this.options)),
      keyOption("room", m.target_subject_room({}, this.options)),
      keyOption("group", m.target_subject_group({}, this.options)),
      keyOption("where", m.automation_code_key_where({}, this.options)),
      keyOption("target", m.automation_code_key_target({}, this.options)),
    ];
  }

  private comparatorKeys(): Option[] {
    return COMPARATORS.map((op) => keyOption(op, op, "scalar"));
  }

  private macroOptions(kind: string, asKey: boolean): Option[] {
    return [...this.macros]
      .filter(([, macroKind]) => macroKind === kind)
      .map(([name]) => ({
        value: `$${name}`,
        label: `$${name}`,
        detail: m.automation_code_key_target({}, this.options),
        template: asKey ? "array" : undefined,
        type: "function",
      }));
  }

  private triggerKeys(): Option[] {
    const labels = Object.fromEntries(
      triggerOptions().map((option) => [option.value, option.label]),
    );
    return [
      keyOption("device", m.target_subject_device({}, this.options)),
      keyOption("state", labels.device_state),
      keyOption("event", labels.device_event),
      keyOption("availability", labels.availability),
      keyOption("schedule", labels.schedule),
      keyOption("webhook", labels.webhook),
      keyOption("where", m.automation_code_key_filters({}, this.options), "array"),
      keyOption("for", m.automation_node_hold({}, this.options)),
      keyOption("grace", m.automation_node_grace({}, this.options)),
      keyOption("cooldown", m.automation_node_cooldown({}, this.options)),
      keyOption("expr", m.automation_trigger_custom({}, this.options)),
      keyOption("event_type", m.automation_code_key_event_type({}, this.options)),
      keyOption("id", m.automation_code_key_id({}, this.options)),
    ];
  }

  private conditionKeys(): Option[] {
    const labels = Object.fromEntries(
      conditionOptions().map((option) => [option.value, option.label]),
    );
    const key = (name: string, label: string) => keyOption(name, label);
    return [
      key("time", labels.time_window),
      key("day", labels.weekday),
      key("state", labels.device_state),
      keyOption("device", m.target_subject_device({}, this.options)),
      keyOption("room", m.target_subject_room({}, this.options)),
      keyOption("group", m.target_subject_group({}, this.options)),
      key("any", m.automation_code_key_any({}, this.options)),
      key("all", m.automation_code_key_all({}, this.options)),
      key("count", m.automation_code_key_count({}, this.options)),
      key("avg", m.automation_code_key_avg({}, this.options)),
      key("min", m.automation_code_key_min({}, this.options)),
      key("max", m.automation_code_key_max({}, this.options)),
      key("since", m.automation_code_key_since({}, this.options)),
      key("scene_active", m.automation_code_key_scene_active({}, this.options)),
      key("not", m.automation_code_key_not({}, this.options)),
      key("expr", m.automation_condition_custom({}, this.options)),
      keyOption("id", m.automation_code_key_id({}, this.options)),
    ];
  }

  private actionKeys(): Option[] {
    const labels = Object.fromEntries(
      actionOptions().map((option) => [option.value, option.label]),
    );
    return [
      ...Object.entries(ACTION_KEYS).map(([key, actionType]) =>
        keyOption(key, labels[actionType] ?? key),
      ),
      ...this.macroOptions("action", true),
      keyOption("id", m.automation_code_key_id({}, this.options)),
    ];
  }

  /** Capabilities of the target written beside the cursor, or of every device. */
  private capabilities(siblings: Record<string, unknown>): Capability[] {
    const ref =
      typeof siblings.device === "string" ? this.names.resolve("device", siblings.device) : null;
    const devices = this.names.lookups.devices;
    if (ref?.ok) return devices.find((device) => device.id === ref.id)?.capabilities ?? [];
    const unique = new Map<string, Capability>();
    for (const device of devices)
      for (const capability of device.capabilities) unique.set(capability.name, capability);
    return [...unique.values()];
  }

  private fieldOptions(siblings: Record<string, unknown>, settable: boolean): Option[] {
    const fields = new Map<string, Option>();
    for (const capability of this.capabilities(siblings)) {
      if (capability.name === "action") continue;
      if (settable && !capability.canSet) continue;
      const field = capabilityToExprProperty(capability.name);
      fields.set(
        field,
        keyOption(field, historyFieldLabel(field, capabilityLabel(capability.name)), "scalar"),
      );
    }
    if (settable)
      fields.set("transition", keyOption("transition", historyFieldLabel("transition"), "string"));
    return [...fields.values()];
  }

  keys(slot: Slot, context: CursorContext): Option[] {
    const resolved = ONE_OR_MANY[slot] ?? slot;
    switch (resolved) {
      case "root":
        return [
          keyOption("name", m.automation_code_key_name({}, this.options)),
          keyOption("define", m.automation_code_key_define({}, this.options)),
          keyOption("rules", m.automation_code_key_rules({}, this.options)),
          keyOption("graph", m.automation_code_key_graph({}, this.options)),
        ];
      case "rule":
        return [
          keyOption("when", m.automation_node_trigger({}, this.options)),
          keyOption("if", m.automation_node_condition({}, this.options)),
          keyOption("do", m.automation_node_action({}, this.options)),
        ];
      case "graphEntry":
        return [
          keyOption("id", m.automation_code_key_id({}, this.options)),
          keyOption("when", m.automation_node_trigger({}, this.options)),
          keyOption("if", m.automation_node_condition({}, this.options)),
          keyOption("op", m.automation_operator_title({}, this.options)),
          keyOption("do", m.automation_node_action({}, this.options)),
          keyOption("after", m.automation_code_key_after({}, this.options), "array"),
        ];
      case "definition":
        return [...this.conditionKeys(), ...this.actionKeys(), ...this.targetKeys()].filter(
          (option, index, all) =>
            option.value !== "id" && all.findIndex((o) => o.value === option.value) === index,
        );
      case "trigger":
        return this.triggerKeys();
      case "schedule":
        return [
          keyOption("at", m.automation_node_schedule_at({}, this.options)),
          keyOption("days", m.automation_code_key_days({}, this.options)),
          keyOption("every", m.automation_node_schedule_every({}, this.options)),
          keyOption("cron", m.automation_node_schedule_custom({}, this.options)),
        ];
      case "condition":
        return this.conditionKeys();
      case "time":
        return [
          keyOption("between", m.automation_code_key_between({}, this.options)),
          keyOption("after", m.automation_node_after({}, this.options)),
          keyOption("before", m.automation_node_before({}, this.options)),
        ];
      case "aggregate":
        return [
          ...this.targetKeys(),
          keyOption("state", m.automation_code_key_state({}, this.options)),
          ...this.comparatorKeys(),
        ];
      case "measure":
        return [
          ...this.targetKeys(),
          keyOption("field", m.automation_code_key_field({}, this.options)),
          ...this.comparatorKeys(),
        ];
      case "action":
        return this.actionKeys();
      case "set":
        return [
          ...this.targetKeys(),
          keyOption("state", m.automation_code_key_state({}, this.options)),
        ];
      case "targetOnly":
        return this.targetKeys();
      case "effect":
        return [
          keyOption("name", m.automation_code_key_effect({}, this.options)),
          ...this.targetKeys(),
        ];
      case "change":
        return [
          ...this.targetKeys(),
          ...this.fieldOptions(context.siblings, true).filter((o) => o.value !== "transition"),
        ];
      case "configure":
        return [
          keyOption("device", m.target_subject_device({}, this.options)),
          keyOption("settings", m.automation_code_key_settings({}, this.options)),
        ];
      case "alarm":
        return [
          keyOption("id", m.automation_code_key_id({}, this.options)),
          keyOption("severity", m.automation_node_severity({}, this.options)),
          keyOption("kind", m.automation_node_kind({}, this.options)),
          keyOption("message", m.automation_code_key_message({}, this.options)),
        ];
      case "clause":
        return [
          ...clauseSubjects().map((subject) => {
            const key =
              Object.entries(CLAUSE_KEYS).find(([, value]) => value === subject.value)?.[0] ??
              subject.value;
            return keyOption(key, subject.label);
          }),
          keyOption("not", m.automation_code_key_not({}, this.options)),
          keyOption("or", m.target_connector_or({}, this.options)),
        ];
      case "state": {
        const settable = context.path.some((segment) => segment === "set");
        return this.fieldOptions(context.siblings, settable);
      }
      default:
        return [];
    }
  }

  private named(kind: EntityKind, detail: string): Option[] {
    return this.names.all(kind).map((entity) => {
      const name = this.names.name(kind, entity.id);
      return {
        value: JSON.stringify(name),
        label: name === entity.id ? entity.display : name,
        detail,
        type: "variable",
      };
    });
  }

  private enumOptions(values: readonly string[], label: (value: string) => string): Option[] {
    return values.map((value) => ({
      value: JSON.stringify(value),
      label: label(value),
      detail: value,
      type: "enum",
    }));
  }

  private durations(): Option[] {
    return ["5s", "10s", "30s", "1m", "5m", "10m", "30m", "1h"].map((value) => ({
      value: JSON.stringify(value),
      label: value,
      type: "constant",
    }));
  }

  values(parent: Slot | null, key: string | number, context: CursorContext): Option[] {
    const resolved = parent ? (ONE_OR_MANY[parent] ?? parent) : null;
    const device = m.target_subject_device({}, this.options);
    if (resolved === "list") {
      const listKey = context.path[context.path.length - 2];
      if (listKey === "days" || listKey === "day")
        return this.enumOptions(DAY_CODES, (day) => weekdayLabel(day.toUpperCase()));
      if (listKey === "cycle")
        return this.named("scene", m.automation_code_kind_scene({}, this.options));
      return [];
    }
    if (typeof key === "number") {
      const clauseKey = context.path[context.path.length - 2];
      if (slotAt(context.path.slice(0, -2)) === "clause" && typeof clauseKey === "string") {
        return this.clauseValues(clauseKey);
      }
      if (resolved === "conditions")
        return this.macroOptions("condition", false).map((o) => ({
          ...o,
          value: JSON.stringify(o.value),
        }));
      if (resolved === "actions")
        return this.macroOptions("action", false).map((o) => ({
          ...o,
          value: JSON.stringify(o.value),
        }));
      return [];
    }
    if (resolved === "conditions" || resolved === "actions") {
      return this.macroOptions(resolved === "conditions" ? "condition" : "action", false).map(
        (o) => ({
          ...o,
          value: JSON.stringify(o.value),
        }),
      );
    }
    if (resolved === "clause") return this.clauseValues(key);
    switch (key) {
      case "device":
      case "availability":
        return this.named("device", device);
      case "room":
        return this.named("room", m.target_subject_room({}, this.options));
      case "group":
        return this.named("group", m.target_subject_group({}, this.options));
      case "scene":
      case "scene_active":
        return this.named("scene", m.automation_code_kind_scene({}, this.options));
      case "webhook":
        return this.named("webhook", m.automation_code_kind_webhook({}, this.options));
      case "name":
        return resolved === "effect"
          ? this.named("effect", m.automation_code_key_effect({}, this.options))
          : [];
      case "target":
        return this.macroOptions("target", false).map((o) => ({
          ...o,
          value: JSON.stringify(o.value),
        }));
      case "event": {
        const events =
          this.capabilities(context.siblings).find((capability) => capability.name === "action")
            ?.values ?? [];
        return this.enumOptions(events, identifierLabel);
      }
      case "field":
        return this.fieldOptions(context.siblings, false).map((option) => ({
          ...option,
          value: JSON.stringify(option.value),
          type: "enum",
        }));
      case "severity":
        return this.enumOptions(
          ["high", "medium", "low"],
          (value) =>
            ({
              high: m.automation_node_severity_high({}, this.options),
              medium: m.automation_node_severity_medium({}, this.options),
              low: m.automation_node_severity_low({}, this.options),
            })[value] ?? value,
        );
      case "op":
        return operatorOptions().map((option) => ({
          value: JSON.stringify(option.value.toLowerCase()),
          label: option.label,
          detail: option.value.toLowerCase(),
          type: "enum",
        }));
      case "for":
      case "grace":
      case "cooldown":
        return this.durations();
      default:
        return [];
    }
  }

  private clauseValues(key: string): Option[] {
    switch (key) {
      case "room":
        return this.named("room", m.target_subject_room({}, this.options));
      case "group":
        return this.named("group", m.target_subject_group({}, this.options));
      case "device":
        return this.named("device", m.target_subject_device({}, this.options));
      case "type":
        return this.enumOptions(CLAUSE_DEVICE_TYPES, identifierLabel);
      case "role":
        return this.enumOptions(CLAUSE_DEVICE_ROLES, identifierLabel);
      case "can":
      case "reports": {
        const names = new Set<string>();
        for (const device of this.names.lookups.devices)
          for (const capability of device.capabilities) names.add(capability.name);
        return this.enumOptions([...names].sort(), (name) => capabilityLabel(name));
      }
      default:
        return [];
    }
  }
}

function templateText(template: Template | undefined): string {
  switch (template) {
    case "object":
      return "{ ${} }";
    case "array":
      return "[${}]";
    case "string":
      return '"${}"';
    default:
      return "${}";
  }
}

function matches(option: Option, typed: string): number {
  if (typed === "") return 1;
  const needle = typed.toLowerCase();
  const label = option.label.toLowerCase();
  const value = option.value.toLowerCase().replace(/^"|"$/g, "");
  if (label.startsWith(needle) || value.startsWith(needle)) return 2;
  if (label.includes(needle) || value.includes(needle)) return 1;
  return 0;
}

/** The macro names defined in a document, by kind, from its last parsable text. */
function definedMacros(text: string, previous: Map<string, string>): Map<string, string> {
  try {
    const doc = JSON.parse(text) as { define?: Record<string, unknown> };
    const macros = new Map<string, string>();
    for (const [name, body] of Object.entries(doc.define ?? {})) {
      macros.set(name, definitionKind(body as never));
    }
    return macros;
  } catch {
    return previous;
  }
}

/**
 * Completion source for the automation language: keys and values offered
 * under their display names, inserting the canonical key or name.
 */
export function automationCompletions(names: () => Names) {
  let macros = new Map<string, string>();
  return (completion: CompletionContext): CompletionResult | null => {
    const text = completion.state.doc.toString();
    macros = definedMacros(text, macros);
    const context = cursorContext(text, completion.pos);
    if (!context) return null;
    if (!completion.explicit && context.prefix === "" && context.position === "value") return null;
    const suggester = new Suggester(names(), macros);
    const quoted = text[context.from] === '"';
    const to = quoted && text[completion.pos] === '"' ? completion.pos + 1 : completion.pos;

    let options: Option[];
    if (context.position === "key") {
      const slot = slotAt(context.path);
      if (!slot) return null;
      options = suggester
        .keys(slot, context)
        .filter((option) => !context.present.has(option.value) || option.value === context.prefix);
    } else {
      const parentPath = context.path.slice(0, -1);
      const key = context.path[context.path.length - 1];
      options = suggester.values(slotAt(parentPath), key, context);
    }
    const ranked = options
      .map((option) => ({ option, score: matches(option, context.prefix) }))
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score);
    if (ranked.length === 0) return null;

    return {
      from: context.from + (quoted ? 1 : 0),
      to: completion.pos,
      filter: false,
      options: ranked.map(
        ({ option }): Completion => ({
          label: option.label,
          detail: option.detail,
          type: option.type,
          apply: (view: EditorView) => {
            if (context.position === "key") {
              const insert = `${JSON.stringify(option.value)}: ${templateText(option.template)}`;
              snippet(insert)(view, { label: option.label }, context.from, to);
            } else {
              view.dispatch({
                changes: { from: context.from, to, insert: option.value },
                selection: { anchor: context.from + option.value.length },
              });
            }
          },
        }),
      ),
    };
  };
}
