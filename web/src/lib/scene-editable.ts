import {
  deviceSceneCapabilities,
  isLightControlDevice,
  isRuntimeEnabledDevice,
  type Device,
} from "$lib/stores/devices";
import { deviceDisplayName, groupDisplayName } from "$lib/utils";
import {
  evaluateExpression,
  resolveTargetDevices,
  type Clause,
  type GroupLite,
  type RoomLite,
} from "$lib/target-resolve";
import {
  SceneLightOverrideKind,
  SceneTargetType,
  type DesiredSceneStateInput,
  type SceneDefinitionInput,
  type VibeFieldDomain,
} from "$lib/gql/graphql";

export type TargetKind = "device" | "group" | "room" | "expression";
export type VibeDomain = "full_color" | "white_ambience";
export type VibeSourceKind = "preset" | "photo" | "guided";

export interface SceneColor {
  r: number;
  g: number;
  b: number;
  x?: number;
  y?: number;
}

export interface DesiredSceneState {
  on?: boolean | null;
  brightness?: number | null;
  colorTemp?: number | null;
  color?: SceneColor | null;
  transition?: number | null;
  targetTemperature?: number | null;
  hvacMode?: string | null;
  fanMode?: string | null;
  swing?: string | null;
}

export interface VibeFieldSample {
  lightness?: number | null;
  chroma?: number | null;
  hue?: number | null;
  brightness?: number | null;
  mireds?: number | null;
}

export interface DynamicLighting {
  domain: VibeDomain;
  sourceKind: VibeSourceKind;
  presetId?: string | null;
  presetTitle?: string | null;
  guidedSelectedIds: string[];
  seed: string;
  brightness: number;
  movement: number;
  cycleSeconds: number;
  gridWidth: number;
  gridHeight: number;
  samples: VibeFieldSample[];
  sourceInput?:
    | { preset: { presetId: string; seed?: string } }
    | {
        photo: {
          domain: VibeFieldDomain;
          seed: string;
          width: number;
          height: number;
          rgbBase64: string;
        };
      }
    | { guided: { domain: VibeFieldDomain; seed: string; selectedIds: string[] } };
}

type StoredDynamicLighting = Omit<
  DynamicLighting,
  "guidedSelectedIds" | "gridWidth" | "gridHeight" | "samples"
> &
  Partial<Pick<DynamicLighting, "guidedSelectedIds" | "gridWidth" | "gridHeight" | "samples">>;

export type SceneLightOverride =
  | { kind: "state"; deviceId: string; state: DesiredSceneState }
  | { kind: "effect"; deviceId: string; effectId: string }
  | { kind: "native_effect"; deviceId: string; nativeEffectName: string };

export interface SceneSupportingState {
  deviceId: string;
  state: DesiredSceneState;
}

export interface SceneTargetData {
  __typename: string;
  id: string;
  name?: string;
  groupName?: string | null;
  deviceName?: string | null;
  friendlyName?: string | null;
  icon?: string | null;
  source?: string;
  removed?: boolean;
  type?: string;
  members?: { id: string; memberType: string; memberId: string }[];
  resolvedDevices?: Device[];
}

export interface SceneTargetEntry {
  targetType: TargetKind;
  targetId: string;
  target?: SceneTargetData | null;
  expression?: Clause[];
  name?: string;
}

export interface ScenePreview {
  width: number;
  height: number;
  pixels: { r: number; g: number; b: number }[];
  swatches: { x: number; y: number; color: { r: number; g: number; b: number } }[];
}

export interface SceneData {
  id: string;
  name: string;
  icon?: string | null;
  targets: SceneTargetEntry[];
  lighting: {
    dynamicSource?: ({ __typename?: string } & StoredDynamicLighting) | null;
    overrides: ({ __typename?: string } & SceneLightOverride)[];
  };
  supportingStates: ({ __typename?: string } & SceneSupportingState)[];
  preview: ScenePreview;
  activatedAt?: string | null;
}

export interface EditableTarget {
  uid: string;
  type: TargetKind;
  id: string;
  name: string;
  icon?: string | null;
  deviceType?: string;
  removed?: boolean;
  expression?: Clause[];
}

export interface EditorState {
  targets: EditableTarget[];
  dynamicSource: DynamicLighting | null;
  overrides: Map<string, SceneLightOverride>;
  supportingStates: Map<string, SceneSupportingState>;
}

export function newTargetUid(): string {
  return crypto.randomUUID();
}

export function buildTargetInfo(target: SceneTargetEntry): EditableTarget {
  if (target.targetType === "expression") {
    return {
      uid: newTargetUid(),
      type: "expression",
      id: "",
      name: target.name || "Selector",
      expression: target.expression ?? [],
    };
  }
  const resolved = target.target;
  if (target.targetType === "group") {
    return {
      uid: newTargetUid(),
      type: "group",
      id: target.targetId,
      name:
        resolved?.__typename === "Group"
          ? groupDisplayName({
              id: resolved.id,
              name: resolved.groupName,
              friendlyName: resolved.friendlyName,
            })
          : target.name || target.targetId,
      icon: resolved?.__typename === "Group" ? (resolved.icon ?? null) : null,
      removed: resolved?.__typename === "Group" ? (resolved.removed ?? false) : false,
    };
  }
  if (target.targetType === "room") {
    return {
      uid: newTargetUid(),
      type: "room",
      id: target.targetId,
      name:
        resolved?.__typename === "Room"
          ? (resolved.name ?? resolved.id)
          : target.name || target.targetId,
      icon: resolved?.__typename === "Room" ? (resolved.icon ?? null) : null,
    };
  }
  return {
    uid: newTargetUid(),
    type: "device",
    id: target.targetId,
    name:
      resolved?.__typename === "Device"
        ? deviceDisplayName({
            id: resolved.id,
            name: resolved.deviceName,
            friendlyName: resolved.friendlyName,
          })
        : target.name || target.targetId,
    deviceType: resolved?.__typename === "Device" ? resolved.type : undefined,
  };
}

export function sceneToEditorState(scene: SceneData): EditorState {
  const dynamicSource = scene.lighting.dynamicSource;
  return {
    targets: scene.targets.map(buildTargetInfo),
    dynamicSource: dynamicSource
      ? {
          ...dynamicSource,
          guidedSelectedIds: dynamicSource.guidedSelectedIds ?? [],
          gridWidth: dynamicSource.gridWidth ?? 0,
          gridHeight: dynamicSource.gridHeight ?? 0,
          samples: dynamicSource.samples ?? [],
        }
      : null,
    overrides: new Map(scene.lighting.overrides.map((override) => [override.deviceId, override])),
    supportingStates: new Map(
      scene.supportingStates.map((supporting) => [supporting.deviceId, supporting]),
    ),
  };
}

export function defaultDesiredState(device?: Device): DesiredSceneState {
  if (!device) return { on: true, brightness: 200, colorTemp: 370 };
  const capabilities = deviceSceneCapabilities(device);
  const state: DesiredSceneState = {};
  if (capabilities.hasOnOff) state.on = true;
  if (capabilities.hasBrightness) state.brightness = 200;
  if (capabilities.hasColorTemp) state.colorTemp = 370;
  if (stateEmpty(state) && capabilities.hasColor) state.color = { r: 255, g: 255, b: 255 };
  return state;
}

export function capturedSceneState(device: Device): DesiredSceneState | null {
  const source = device.state;
  if (!source) return null;
  const writable = new Set(
    device.capabilities
      .filter((capability) => capability.canSet)
      .map((capability) => capability.name),
  );
  const state: DesiredSceneState = {};
  if ((writable.has("on_off") || writable.has("state")) && source.on != null) state.on = source.on;
  if (writable.has("brightness") && source.brightness != null) state.brightness = source.brightness;
  if (writable.has("color_temp") && source.colorTemp != null) state.colorTemp = source.colorTemp;
  if (writable.has("color") && source.color) state.color = source.color;
  if (writable.has("target_temperature") && source.targetTemperature != null)
    state.targetTemperature = source.targetTemperature;
  if (writable.has("hvac_mode") && source.hvacMode) state.hvacMode = source.hvacMode;
  if (writable.has("fan_mode") && source.fanMode) state.fanMode = source.fanMode;
  if (writable.has("swing") && source.swing) state.swing = source.swing;
  return stateEmpty(state) ? null : state;
}

export function initialSupportingState(device: Device): DesiredSceneState | null {
  if (device.type === "sensor" || isLightControlDevice(device)) return null;
  return (
    capturedSceneState(device) ??
    (() => {
      const state = defaultDesiredState(device);
      return stateEmpty(state) ? null : state;
    })()
  );
}

export function stateEmpty(state: DesiredSceneState): boolean {
  return Object.values(state).every((value) => value == null);
}

function desiredStateControlsDevice(state: DesiredSceneState, device: Device): boolean {
  const writable = new Set(
    device.capabilities
      .filter((capability) => capability.canSet)
      .map((capability) => capability.name),
  );
  return (
    (state.on != null && writable.has("on_off")) ||
    (state.brightness != null && writable.has("brightness")) ||
    (state.colorTemp != null && writable.has("color_temp")) ||
    (state.color != null && writable.has("color")) ||
    (state.transition != null && writable.has("brightness")) ||
    (state.targetTemperature != null && writable.has("target_temperature")) ||
    (state.hvacMode != null && writable.has("hvac_mode")) ||
    (state.fanMode != null && writable.has("fan_mode")) ||
    (state.swing != null && writable.has("swing"))
  );
}

export function resolveSceneTargetLights(
  targets: EditorState["targets"],
  devices: Device[],
  groups: GroupLite[],
  rooms: RoomLite[],
  options?: { includeDisabled?: boolean },
): Device[] {
  const unique = new Map<string, Device>();
  for (const target of targets) {
    const resolved =
      target.type === "expression"
        ? evaluateExpression(target.expression ?? [], devices, groups, rooms)
        : resolveTargetDevices(
            { type: target.type, id: target.id },
            devices,
            groups,
            rooms,
            options,
          );
    for (const device of resolved) {
      if (isLightControlDevice(device)) unique.set(device.id, device);
    }
  }
  return Array.from(unique.values());
}

export function sceneControllableDeviceCount(
  state: EditorState,
  devices: Device[],
  groups: GroupLite[],
  rooms: RoomLite[],
): number {
  const enabledDevices = devices.filter(isRuntimeEnabledDevice);
  const controlled = new Set<string>();
  const fieldCapabilities = new Set(["on_off", "brightness", "color", "color_temp"]);

  for (const device of resolveSceneTargetLights(state.targets, enabledDevices, groups, rooms)) {
    const override = state.overrides.get(device.id);
    if (override?.kind === "effect" || override?.kind === "native_effect") {
      controlled.add(device.id);
      continue;
    }
    const dynamicControlsDevice =
      state.dynamicSource !== null &&
      device.capabilities.some(
        (capability) => capability.canSet && fieldCapabilities.has(capability.name),
      );
    const overrideControlsDevice =
      override?.kind === "state" && desiredStateControlsDevice(override.state, device);
    if (dynamicControlsDevice || overrideControlsDevice) controlled.add(device.id);
  }

  const devicesById = new Map(enabledDevices.map((device) => [device.id, device]));
  for (const supporting of state.supportingStates.values()) {
    const device = devicesById.get(supporting.deviceId);
    if (device && desiredStateControlsDevice(supporting.state, device)) controlled.add(device.id);
  }
  return controlled.size;
}

export function sceneStateInput(state: DesiredSceneState): DesiredSceneStateInput {
  const input: DesiredSceneStateInput = {};
  if (state.on != null) input.on = state.on;
  if (state.brightness != null) input.brightness = state.brightness;
  if (state.colorTemp != null) input.colorTemp = state.colorTemp;
  if (state.color != null) {
    input.color = { ...state.color, x: state.color.x ?? 0, y: state.color.y ?? 0 };
  }
  if (state.transition != null) input.transition = state.transition;
  if (state.targetTemperature != null) input.targetTemperature = state.targetTemperature;
  if (state.hvacMode != null) input.hvacMode = state.hvacMode;
  if (state.fanMode != null) input.fanMode = state.fanMode;
  if (state.swing != null) input.swing = state.swing;
  return input;
}

export function editorDefinitionInput(state: EditorState): SceneDefinitionInput {
  const targets = state.targets.map((target) => ({
    targetType: target.type as SceneTargetType,
    targetId: target.type === "expression" ? undefined : target.id,
    expression: target.type === "expression" ? (target.expression ?? []) : undefined,
    name: target.name || undefined,
  }));
  const overrides = Array.from(state.overrides.values()).map((override) => {
    if (override.kind === "state") {
      return {
        deviceId: override.deviceId,
        kind: SceneLightOverrideKind.State,
        state: sceneStateInput(override.state),
      };
    }
    if (override.kind === "effect") {
      return {
        deviceId: override.deviceId,
        kind: SceneLightOverrideKind.Effect,
        effectId: override.effectId,
      };
    }
    return {
      deviceId: override.deviceId,
      kind: SceneLightOverrideKind.NativeEffect,
      nativeEffectName: override.nativeEffectName,
    };
  });
  const dynamicSource = state.dynamicSource
    ? {
        source: state.dynamicSource.sourceInput,
        brightness: state.dynamicSource.brightness,
        movement: state.dynamicSource.movement,
        cycleSeconds: state.dynamicSource.cycleSeconds,
        seed: state.dynamicSource.seed,
      }
    : undefined;
  return {
    targets,
    lighting: {
      dynamicSource,
      overrides,
    },
    supportingStates: Array.from(state.supportingStates.values()).map((supporting) => ({
      deviceId: supporting.deviceId,
      state: sceneStateInput(supporting.state),
    })),
  };
}
