import type { Device } from "$lib/stores/devices";

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
  type?: string;
  members?: GroupMemberData[];
  resolvedDevices?: Device[];
}

export interface GroupMemberData {
  id: string;
  memberType: string;
  memberId: string;
}

export interface SceneData {
  id: string;
  name: string;
  icon?: string | null;
  actions: SceneAction[];
}

export interface GroupData {
  id: string;
  name: string;
  members: GroupMemberData[];
  resolvedDevices: Device[];
}

export interface ActionPayload {
  on?: boolean;
  brightness?: number;
  colorTemp?: number;
  color?: { r: number; g: number; b: number; x: number; y: number };
}

export interface TargetInfo {
  id: string;
  name: string;
  type: "device" | "group";
  deviceType?: string;
}

export interface EditableAction {
  targetType: string;
  targetId: string;
  target: TargetInfo;
  payload: ActionPayload;
}

export function parsePayload(raw: string): ActionPayload {
  try {
    return JSON.parse(raw) as ActionPayload;
  } catch {
    return { on: true, brightness: 127 };
  }
}

export function buildTargetInfo(action: SceneAction): TargetInfo {
  if (action.target.__typename === "Group") {
    return {
      id: action.target.id,
      name: action.target.name,
      type: "group",
    };
  }
  return {
    id: action.target.id,
    name: action.target.name,
    type: "device",
    deviceType: action.target.type,
  };
}

export function sceneToEditable(s: SceneData): EditableAction[] {
  return s.actions.map((a) => ({
    targetType: a.targetType,
    targetId: a.targetId,
    target: buildTargetInfo(a),
    payload: parsePayload(a.payload),
  }));
}
