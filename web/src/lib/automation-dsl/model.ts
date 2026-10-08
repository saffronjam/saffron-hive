import type { Clause as TargetClause } from "$lib/target-resolve";

/** A node as stored: its config is the JSON the engine reads. */
export interface WireNode {
  id: string;
  type: "trigger" | "condition" | "operator" | "action";
  config: string;
}

export interface WireEdge {
  fromNodeId: string;
  toNodeId: string;
}

/** An automation as stored, without layout. */
export interface WireAutomation {
  name: string;
  nodes: WireNode[];
  edges: WireEdge[];
  /** JSON object of compiled macros keyed by name. */
  definitions: string;
}

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

export type JsonObject = { [key: string]: JsonValue };

export type Path = (string | number)[];

/** A problem in a document, located by the path of the value it concerns. */
export interface Diagnostic {
  path: Path;
  message: string;
}

/** Target keys shared by every place a target can be written. */
export const TARGET_KEYS = ["device", "room", "group", "where", "target"] as const;

/** Language keys for target selector subjects. */
export const CLAUSE_KEYS: Record<string, TargetClause["subject"]> = {
  room: "room" as TargetClause["subject"],
  group: "group" as TargetClause["subject"],
  device: "device" as TargetClause["subject"],
  type: "device_type" as TargetClause["subject"],
  role: "device_role" as TargetClause["subject"],
  can: "writable_capability" as TargetClause["subject"],
  reports: "reported_capability" as TargetClause["subject"],
};

/** Keys that make an object an action, mapped to the stored action type. */
export const ACTION_KEYS: Record<string, string> = {
  set: "set_device_state",
  toggle: "toggle_device_state",
  scene: "activate_scene",
  cycle: "cycle_scenes",
  effect: "run_effect",
  change: "change_value",
  configure: "configure_device",
  alarm: "raise_alarm",
  clear_alarm: "clear_alarm",
};

/** Keys that make an object a condition. */
export const CONDITION_KEYS = [
  "time",
  "day",
  "state",
  "any",
  "all",
  "count",
  "avg",
  "min",
  "max",
  "since",
  "scene_active",
  "not",
  "expr",
] as const;

export const AGGREGATE_FUNCTIONS: Record<string, string> = {
  any: "any_of",
  all: "all_of",
  count: "count_of",
  avg: "avg_of",
  min: "min_of",
  max: "max_of",
  since: "since",
};

export const NODE_PREFIX: Record<WireNode["type"], string> = {
  trigger: "t",
  condition: "c",
  operator: "o",
  action: "a",
};
