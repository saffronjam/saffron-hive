import type { Device } from "$lib/stores/devices";

/**
 * Stable comparator for device list ordering: case-insensitive name, then id tiebreak.
 * Produces a deterministic order across reloads regardless of insertion order.
 */
export function compareDevicesByName(a: Device, b: Device): number {
  return (
    a.name.localeCompare(b.name, undefined, { sensitivity: "base" }) || a.id.localeCompare(b.id)
  );
}

/** A minimal automation node shape — just the `type` field is needed. */
export interface AutomationNodeLike {
  type: string;
}

export interface AutomationNodeCounts {
  trigger: number;
  operator: number;
  action: number;
}

/** Count trigger/operator/action nodes in an automation. */
export function automationNodeCounts(nodes: AutomationNodeLike[]): AutomationNodeCounts {
  let trigger = 0;
  let operator = 0;
  let action = 0;
  for (const n of nodes) {
    if (n.type === "trigger") trigger++;
    else if (n.type === "operator") operator++;
    else if (n.type === "action") action++;
  }
  return { trigger, operator, action };
}

/** A minimal group member shape — just the `memberType` field is needed. */
export interface GroupMemberLike {
  memberType: string;
}

/**
 * Human-readable breakdown of a group's members.
 * Examples: "2 devices", "1 device, 3 groups", "4 rooms". Empty input → "".
 */
export function groupMemberBreakdown(members: GroupMemberLike[]): string {
  let d = 0;
  let g = 0;
  let r = 0;
  for (const m of members) {
    if (m.memberType === "device") d++;
    else if (m.memberType === "group") g++;
    else if (m.memberType === "room") r++;
  }
  const parts: string[] = [];
  if (d > 0) parts.push(`${d} device${d === 1 ? "" : "s"}`);
  if (g > 0) parts.push(`${g} group${g === 1 ? "" : "s"}`);
  if (r > 0) parts.push(`${r} room${r === 1 ? "" : "s"}`);
  return parts.join(", ");
}

/** A minimal scene action shape — just the `targetType` field is needed. */
export interface SceneActionLike {
  targetType: string;
}

/**
 * Human-readable breakdown of a scene's targets.
 * Examples: "3 devices", "1 device, 2 groups". Empty input → "No targets".
 */
export function sceneTargetBreakdown(actions: SceneActionLike[]): string {
  let d = 0;
  let g = 0;
  for (const a of actions) {
    if (a.targetType === "device") d++;
    else if (a.targetType === "group") g++;
  }
  const parts: string[] = [];
  if (d > 0) parts.push(`${d} device${d === 1 ? "" : "s"}`);
  if (g > 0) parts.push(`${g} group${g === 1 ? "" : "s"}`);
  if (parts.length === 0) return "No targets";
  return parts.join(", ");
}
