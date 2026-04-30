import { deviceSceneCapabilities, type Device } from "$lib/stores/devices";

export interface SceneAction {
  targetType: string;
  targetId: string;
  target: SceneTargetData;
  payload: string;
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

export interface StaticActionPayload {
  kind: "static";
  on?: boolean;
  brightness?: number;
  colorTemp?: number;
  color?: { r: number; g: number; b: number; x: number; y: number };
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

/** Stripped-down view of a static payload used by the device-state command path,
 * which does not understand the kind tag. */
export type StaticPayloadFields = Omit<StaticActionPayload, "kind">;

export type TargetKind = "device" | "group" | "room";

export interface EditableTarget {
  type: TargetKind;
  id: string;
  name: string;
  icon?: string | null;
  deviceType?: string;
}

export type DevicePayloadMap = Map<string, ActionPayload>;

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
  if (typeof obj.colorTemp === "number") out.colorTemp = obj.colorTemp;
  const color = obj.color;
  if (color && typeof color === "object" && !Array.isArray(color)) {
    const c = color as Record<string, unknown>;
    if (
      typeof c.r === "number" &&
      typeof c.g === "number" &&
      typeof c.b === "number" &&
      typeof c.x === "number" &&
      typeof c.y === "number"
    ) {
      out.color = { r: c.r, g: c.g, b: c.b, x: c.x, y: c.y };
    }
  }
  return out;
}

/** Serialize a payload to the on-disk shape with kind tagged. */
export function stringifyPayload(payload: ActionPayload): string {
  if (payload.kind === "effect") {
    return JSON.stringify({ kind: "effect", effect_id: payload.effectId });
  }
  if (payload.kind === "native_effect") {
    return JSON.stringify({ kind: "native_effect", native_name: payload.nativeName });
  }
  const { kind: _kind, ...rest } = payload;
  return JSON.stringify({ kind: "static", ...rest });
}

/** Static-only fields for the live device-command path; throws for effect payloads. */
export function staticFieldsOf(payload: ActionPayload): StaticPayloadFields {
  if (payload.kind !== "static") {
    return {};
  }
  const { kind: _kind, ...rest } = payload;
  return rest;
}

export function buildTargetInfo(action: SceneAction): EditableTarget {
  const t = action.target;
  if (t.__typename === "Group") {
    return { type: "group", id: t.id, name: t.name, icon: t.icon ?? null };
  }
  if (t.__typename === "Room") {
    return { type: "room", id: t.id, name: t.name, icon: t.icon ?? null };
  }
  return { type: "device", id: t.id, name: t.name, deviceType: t.type };
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
  if (caps.hasColorTemp) payload.colorTemp = 370;
  return payload;
}
