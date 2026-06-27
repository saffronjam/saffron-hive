import { deviceSceneCapabilities, type Device } from "$lib/stores/devices";
import type { Clause } from "$lib/target-resolve";

export interface SceneAction {
  targetType: string;
  targetId: string;
  target: SceneTargetData | null;
  payload: string;
  expression?: Clause[];
  name?: string;
}

export interface SceneTargetData {
  __typename: string;
  id: string;
  name: string;
  icon?: string | null;
  type?: string;
  members?: GroupMemberData[];
  resolvedDevices?: Device[];
  devices?: Device[];
}

export interface GroupMemberData {
  id: string;
  memberType: string;
  memberId: string;
}

export interface SceneDevicePayloadEntry {
  deviceId: string;
  payload: string;
}

export interface SceneRoomRef {
  id: string;
  name: string;
  icon?: string | null;
}

export interface SceneData {
  id: string;
  name: string;
  icon?: string | null;
  rooms?: SceneRoomRef[];
  actions: SceneAction[];
  devicePayloads: SceneDevicePayloadEntry[];
  activatedAt?: string | null;
}

export interface GroupData {
  id: string;
  name: string;
  icon?: string | null;
  members: GroupMemberData[];
  resolvedDevices: Device[];
}

export interface RoomMemberData {
  id: string;
  memberType: string;
  memberId: string;
  device?: Device | null;
  group?: {
    id: string;
    name: string;
    icon?: string | null;
    resolvedDevices?: { id: string }[];
  } | null;
}

export interface RoomData {
  id: string;
  name: string;
  icon?: string | null;
  members: RoomMemberData[];
  resolvedDevices: Device[];
}

/**
 * Discriminator over a light's white-point. A bulb at any instant is either
 * in colour-temperature mode (driven by mireds) or in colour mode (driven by
 * RGB+xy chromaticity) — never both. Modelling the mutual exclusion in the
 * type prevents construction sites from accidentally setting both: the bulb
 * silently honours one and ignores the other, so a payload with both is
 * ambiguous user intent.
 *
 * Absent (`light: undefined`) means the payload does not touch the bulb's
 * white-point — useful for on/off + brightness-only commands, or for devices
 * with no colour capability at all.
 */
export type LightMode =
  | { kind: "colorTemp"; mireds: number }
  | { kind: "color"; r: number; g: number; b: number; x: number; y: number };

export interface StaticActionPayload {
  kind: "static";
  on?: boolean;
  brightness?: number;
  light?: LightMode;
}

export interface EffectActionPayload {
  kind: "effect";
  effectId: string;
}

export interface NativeEffectActionPayload {
  kind: "native_effect";
  nativeName: string;
}

export type ActionPayload = StaticActionPayload | EffectActionPayload | NativeEffectActionPayload;

/**
 * Flat-field shape used by the live device-command path (the GraphQL
 * `DeviceStateInput` and the on-disk JSON in `scene_device_payloads.payload`).
 * Mirrors the shared internal-map convention used by backend code; the nested
 * {@link LightMode} from {@link StaticActionPayload} is flattened to `color`
 * or `colorTemp` here via {@link staticFieldsOf} / {@link stringifyPayload}.
 */
export interface StaticPayloadFields {
  on?: boolean;
  brightness?: number;
  colorTemp?: number;
  color?: { r: number; g: number; b: number; x: number; y: number };
}

export type TargetKind = "device" | "group" | "room" | "expression";

export interface EditableTarget {
  type: TargetKind;
  id: string;
  name: string;
  icon?: string | null;
  deviceType?: string;
  expression?: Clause[];
}

export type DevicePayloadMap = Map<string, ActionPayload>;

/**
 * Read a stored scene payload. The on-disk shape carries `color` / `colorTemp`
 * as flat siblings (the lingua franca of the internal command/state map shared
 * with backend code); this function lifts them into the discriminated
 * {@link LightMode} the rest of the frontend uses. When a legacy row carries
 * both — the symptom of an old write before the discriminator existed — the
 * explicit RGB colour wins, mirroring the SQL heal migration.
 */
export function parsePayload(raw: string): ActionPayload {
  let obj: Record<string, unknown> = {};
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      obj = parsed as Record<string, unknown>;
    }
  } catch {
    // fall through to empty static payload
  }
  if (obj.kind === "effect") {
    const effectId = typeof obj.effect_id === "string" ? obj.effect_id : "";
    return { kind: "effect", effectId };
  }
  if (obj.kind === "native_effect") {
    const nativeName = typeof obj.native_name === "string" ? obj.native_name : "";
    return { kind: "native_effect", nativeName };
  }
  const out: StaticActionPayload = { kind: "static" };
  if (typeof obj.on === "boolean") out.on = obj.on;
  if (typeof obj.brightness === "number") out.brightness = obj.brightness;
  const colorMode = parseFlatColor(obj.color);
  if (colorMode) {
    out.light = colorMode;
  } else if (typeof obj.colorTemp === "number") {
    out.light = { kind: "colorTemp", mireds: obj.colorTemp };
  }
  return out;
}

function parseFlatColor(raw: unknown): LightMode | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const c = raw as Record<string, unknown>;
  if (
    typeof c.r !== "number" ||
    typeof c.g !== "number" ||
    typeof c.b !== "number" ||
    typeof c.x !== "number" ||
    typeof c.y !== "number"
  ) {
    return null;
  }
  return { kind: "color", r: c.r, g: c.g, b: c.b, x: c.x, y: c.y };
}

/**
 * Write a payload back to the on-disk shape. The nested `light` discriminator
 * is flattened to the `color` / `colorTemp` siblings the storage layer
 * (`scene_device_payloads.payload`) and backend `commandFromDesired` consume.
 */
export function stringifyPayload(payload: ActionPayload): string {
  if (payload.kind === "effect") {
    return JSON.stringify({ kind: "effect", effect_id: payload.effectId });
  }
  if (payload.kind === "native_effect") {
    return JSON.stringify({ kind: "native_effect", native_name: payload.nativeName });
  }
  return JSON.stringify({ kind: "static", ...flattenStaticPayload(payload) });
}

function flattenStaticPayload(payload: StaticActionPayload): StaticPayloadFields {
  const flat: StaticPayloadFields = {};
  if (payload.on !== undefined) flat.on = payload.on;
  if (payload.brightness !== undefined) flat.brightness = payload.brightness;
  if (payload.light?.kind === "color") {
    const { r, g, b, x, y } = payload.light;
    flat.color = { r, g, b, x, y };
  } else if (payload.light?.kind === "colorTemp") {
    flat.colorTemp = payload.light.mireds;
  }
  return flat;
}

/**
 * Flat-field view of a static payload, matching the GraphQL `DeviceStateInput`
 * shape used by the live device-command path. Effect payloads return an empty
 * object — they carry no per-field state.
 */
export function staticFieldsOf(payload: ActionPayload): StaticPayloadFields {
  if (payload.kind !== "static") {
    return {};
  }
  return flattenStaticPayload(payload);
}

export function buildTargetInfo(action: SceneAction): EditableTarget {
  if (action.targetType === "expression") {
    return {
      type: "expression",
      id: "",
      name: action.name || "Selector",
      expression: action.expression ?? [],
    };
  }
  const t = action.target;
  if (t?.__typename === "Group") {
    return { type: "group", id: t.id, name: t.name, icon: t.icon ?? null };
  }
  if (t?.__typename === "Room") {
    return { type: "room", id: t.id, name: t.name, icon: t.icon ?? null };
  }
  return { type: "device", id: t?.id ?? "", name: t?.name ?? "", deviceType: t?.type };
}

export interface EditorState {
  targets: EditableTarget[];
  payloads: DevicePayloadMap;
}

export function sceneToEditorState(s: SceneData): EditorState {
  const targets = s.actions.map(buildTargetInfo);
  const payloads: DevicePayloadMap = new Map();
  for (const p of s.devicePayloads) {
    payloads.set(p.deviceId, parsePayload(p.payload));
  }
  return { targets, payloads };
}

export function defaultScenePayload(device: Device | undefined): StaticActionPayload {
  if (!device) return { kind: "static", on: true };
  const caps = deviceSceneCapabilities(device);
  const payload: StaticActionPayload = { kind: "static" };
  if (caps.hasOnOff) payload.on = true;
  if (caps.hasBrightness) payload.brightness = 200;
  if (caps.hasColorTemp) payload.light = { kind: "colorTemp", mireds: 370 };
  return payload;
}
