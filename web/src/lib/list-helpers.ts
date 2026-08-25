import type { Device } from "$lib/stores/devices";
import type { SearchState } from "$lib/components/hive-searchbar";
import { deviceDisplayName } from "$lib/utils";

/**
 * Stable comparator for device list ordering: case-insensitive name, then id tiebreak.
 * Produces a deterministic order across reloads regardless of insertion order.
 */
const collator = new Intl.Collator(undefined, { sensitivity: "base" });

export function compareDevicesByName(a: Device, b: Device): number {
  return collator.compare(deviceDisplayName(a), deviceDisplayName(b)) || a.id.localeCompare(b.id);
}

/**
 * Orders a device list with the ones discovered since the last visit first, then
 * by name. `newIds` is the device list's mount-time snapshot rather than a live
 * read of `device.seen`, so rows do not reshuffle under the cursor the moment
 * the mark-seen mutation lands.
 */
export function compareDevicesByNewThenName(
  newIds: ReadonlySet<string>,
): (a: Device, b: Device) => number {
  return (a, b) => {
    const rank = Number(newIds.has(b.id)) - Number(newIds.has(a.id));
    return rank || compareDevicesByName(a, b);
  };
}

export function filterDevices(devices: Device[], search: SearchState): Device[] {
  const values = (keyword: string) =>
    search.chips.filter((chip) => chip.keyword === keyword).map((chip) => chip.value);
  const typeValues = values("type");
  const enabledValues = values("enabled");
  const deletedValues = values("deleted");
  const query = search.freeText.toLowerCase();

  return devices.filter((device) => {
    const deletedValue = device.deleted ? "yes" : "no";
    if (deletedValues.length === 0) {
      if (device.deleted) return false;
    } else if (!deletedValues.includes(deletedValue)) {
      return false;
    }
    if (typeValues.length > 0 && !typeValues.includes(device.type)) return false;
    if (
      enabledValues.length > 0 &&
      !enabledValues.includes(device.disabled || device.deleted ? "no" : "yes")
    ) {
      return false;
    }
    if (!query) return true;
    return (
      deviceDisplayName(device).toLowerCase().includes(query) ||
      device.type.toLowerCase().includes(query) ||
      device.source.toLowerCase().includes(query)
    );
  });
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

/** A minimal scene room shape — just the display name is needed. */
export interface SceneRoomLike {
  name: string;
}

/**
 * Which rooms a scene is present in, as a one-line summary. One room reads as its
 * own name; several collapse to "Multi-room" rather than an unbounded list that
 * would overflow a card subtitle. Empty → `""` so callers omit the segment.
 */
export function sceneRoomLabel(rooms: SceneRoomLike[]): string {
  if (rooms.length === 0) return "";
  if (rooms.length === 1) return rooms[0].name;
  return "Multi-room";
}

/**
 * Human-readable breakdown of a scene's targets by target kind.
 * Counts device, group, room, and expression (selector) targets.
 * Examples: "3 devices", "1 device, 2 groups", "1 room, 3 selectors".
 * Empty input → "No targets".
 */
export function sceneTargetBreakdown(actions: SceneActionLike[]): string {
  let d = 0;
  let g = 0;
  let r = 0;
  let e = 0;
  for (const a of actions) {
    if (a.targetType === "device") d++;
    else if (a.targetType === "group") g++;
    else if (a.targetType === "room") r++;
    else if (a.targetType === "expression") e++;
  }
  const parts: string[] = [];
  if (d > 0) parts.push(`${d} device${d === 1 ? "" : "s"}`);
  if (g > 0) parts.push(`${g} group${g === 1 ? "" : "s"}`);
  if (r > 0) parts.push(`${r} room${r === 1 ? "" : "s"}`);
  if (e > 0) parts.push(`${e} selector${e === 1 ? "" : "s"}`);
  if (parts.length === 0) return "No targets";
  return parts.join(", ");
}
