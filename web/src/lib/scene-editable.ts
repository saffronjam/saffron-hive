import { deviceSceneCapabilities, type Device } from "$lib/stores/devices";

export interface SceneAction {
  id: string;
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

export interface SceneData {
  id: string;
  name: string;
  icon?: string | null;
  actions: SceneAction[];
  devicePayloads: SceneDevicePayloadEntry[];
}

export interface GroupData {
  id: string;
  name: string;
  members: GroupMemberData[];
  resolvedDevices: Device[];
}

export interface RoomData {
  id: string;
  name: string;
  icon?: string | null;
  devices: Device[];
}

export interface ActionPayload {
  on?: boolean;
  brightness?: number;
  colorTemp?: number;
  color?: { r: number; g: number; b: number; x: number; y: number };
}

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
  try {
    return JSON.parse(raw) as ActionPayload;
  } catch {
    return {};
  }
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

export function defaultScenePayload(device: Device | undefined): ActionPayload {
  if (!device) return { on: true };
  const caps = deviceSceneCapabilities(device);
  const payload: ActionPayload = {};
  if (caps.hasOnOff) payload.on = true;
  if (caps.hasBrightness) payload.brightness = 200;
  if (caps.hasColorTemp) payload.colorTemp = 370;
  return payload;
}
