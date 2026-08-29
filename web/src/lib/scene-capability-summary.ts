import { deviceSceneCapabilities, isLightControlDevice, type Device } from "$lib/stores/devices";
import {
  evaluateExpression,
  resolveTargetDevices,
  type GroupLite,
  type RoomLite,
} from "$lib/target-resolve";
import type { EditableTarget, VibeDomain } from "$lib/scene-editable";

export type VibeCapabilityClass =
  | "fullColor"
  | "tunableWhite"
  | "dimming"
  | "switchOnly"
  | "skipped";

export interface CapabilitySummary {
  fullColor: Device[];
  tunableWhite: Device[];
  dimming: Device[];
  switchOnly: Device[];
  skipped: Device[];
}

export function resolveSceneTargets(
  targets: EditableTarget[],
  devices: Device[],
  groups: GroupLite[],
  rooms: RoomLite[],
): Device[] {
  const resolved = new Map<string, Device>();
  for (const target of targets) {
    const members =
      target.type === "expression"
        ? evaluateExpression(target.expression ?? [], devices, groups, rooms)
        : resolveTargetDevices({ type: target.type, id: target.id }, devices, groups, rooms);
    for (const device of members) resolved.set(device.id, device);
  }
  return Array.from(resolved.values());
}

export function classifyVibeDevices(devices: Device[], domain: VibeDomain): CapabilitySummary {
  const summary: CapabilitySummary = {
    fullColor: [],
    tunableWhite: [],
    dimming: [],
    switchOnly: [],
    skipped: [],
  };
  for (const device of devices) {
    if (!isLightControlDevice(device)) {
      summary.skipped.push(device);
      continue;
    }
    const caps = deviceSceneCapabilities(device);
    let bucket: VibeCapabilityClass = "skipped";
    if (domain === "full_color" && caps.hasColor) bucket = "fullColor";
    else if (caps.hasColorTemp) bucket = "tunableWhite";
    else if (caps.hasBrightness) bucket = "dimming";
    else if (caps.hasOnOff) bucket = "switchOnly";
    summary[bucket].push(device);
  }
  return summary;
}

export function skippedReason(device: Device): string {
  return isLightControlDevice(device)
    ? "has no writable lighting capability"
    : "is not assigned the light role";
}
