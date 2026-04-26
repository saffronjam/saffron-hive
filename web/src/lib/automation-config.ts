export interface AutomationNodeLike {
  type: string;
  config: string;
}

function safeParseJSON(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/**
 * For a trigger node, return "event" or "schedule" based on its stored
 * `kind`. Returns null for non-trigger nodes or when the config can't be
 * parsed.
 */
export function triggerKind(node: AutomationNodeLike): "event" | "schedule" | null {
  if (node.type !== "trigger") return null;
  const raw = safeParseJSON(node.config);
  if (!isRecord(raw)) return null;
  const kind = raw.kind;
  if (kind === "event" || kind === "schedule") return kind;
  if (typeof raw.cron_expr === "string" && raw.cron_expr !== "") return "schedule";
  return "event";
}

/**
 * For an action node, return its `action_type` (e.g. "set_device_state",
 * "activate_scene"). Returns null for non-action nodes or when unavailable.
 */
export function actionKind(node: AutomationNodeLike): string | null {
  if (node.type !== "action") return null;
  const raw = safeParseJSON(node.config);
  if (!isRecord(raw)) return null;
  const kind = raw.action_type;
  return typeof kind === "string" ? kind : null;
}

/**
 * Device IDs referenced by an action node. Only `set_device_state` actions
 * with a device-targeted config contribute. Trigger nodes reference devices
 * via expression strings (filter_expr) which are not deterministically
 * parseable — they return no IDs here.
 */
export function referencedDeviceIds(node: AutomationNodeLike): string[] {
  if (node.type !== "action") return [];
  const raw = safeParseJSON(node.config);
  if (!isRecord(raw)) return [];
  if (raw.action_type !== "set_device_state") return [];
  if (raw.target_type !== "device") return [];
  const id = raw.target_id;
  return typeof id === "string" && id !== "" ? [id] : [];
}

/**
 * Scene IDs referenced by an action node. Only `activate_scene` actions
 * contribute; the scene ID is stored in the `payload` field on the stored
 * config.
 */
export function referencedSceneIds(node: AutomationNodeLike): string[] {
  if (node.type !== "action") return [];
  const raw = safeParseJSON(node.config);
  if (!isRecord(raw)) return [];
  if (raw.action_type !== "activate_scene") return [];
  const id = raw.payload;
  return typeof id === "string" && id !== "" ? [id] : [];
}

/**
 * Effect IDs referenced by an action node. Only `run_effect` actions with a
 * stored timeline/native effect (`effect_id`) contribute; native-effect
 * references via `native_name` are reported by `referencedNativeEffectNames`
 * instead.
 */
export function referencedEffectIds(node: AutomationNodeLike): string[] {
  if (node.type !== "action") return [];
  const raw = safeParseJSON(node.config);
  if (!isRecord(raw)) return [];
  if (raw.action_type !== "run_effect") return [];
  const payload = typeof raw.payload === "string" ? safeParseJSON(raw.payload) : null;
  if (!isRecord(payload)) return [];
  const id = payload.effect_id;
  return typeof id === "string" && id !== "" ? [id] : [];
}

/**
 * Native effect names referenced by an action node. Only `run_effect`
 * actions with a `native_name` payload field contribute.
 */
export function referencedNativeEffectNames(node: AutomationNodeLike): string[] {
  if (node.type !== "action") return [];
  const raw = safeParseJSON(node.config);
  if (!isRecord(raw)) return [];
  if (raw.action_type !== "run_effect") return [];
  const payload = typeof raw.payload === "string" ? safeParseJSON(raw.payload) : null;
  if (!isRecord(payload)) return [];
  const name = payload.native_name;
  return typeof name === "string" && name !== "" ? [name] : [];
}
