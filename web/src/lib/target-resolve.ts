import type { Capability, Device } from "$lib/gql/graphql";

export interface GroupLite {
  id: string;
  members: { memberType: string; memberId: string }[];
}

export interface RoomLite {
  id: string;
  devices: { id: string }[];
}

export type TargetKind = "device" | "group" | "room";

/**
 * Resolve a target (device / group / room) to the flat list of member devices
 * it covers. Groups may nest other groups or rooms; resolution is iterative
 * with a seen-set to stop cycles.
 */
export function resolveTargetDevices(
  target: { type: TargetKind; id: string },
  devices: Device[],
  groups: GroupLite[],
  rooms: RoomLite[],
): Device[] {
  const deviceByID = new Map(devices.map((d) => [d.id, d]));
  const groupByID = new Map(groups.map((g) => [g.id, g]));
  const roomByID = new Map(rooms.map((r) => [r.id, r]));

  const collected = new Map<string, Device>();
  const seenGroups = new Set<string>();
  const seenRooms = new Set<string>();

  function walk(type: TargetKind, id: string) {
    if (type === "device") {
      const d = deviceByID.get(id);
      if (d) collected.set(d.id, d);
      return;
    }
    if (type === "group") {
      if (seenGroups.has(id)) return;
      seenGroups.add(id);
      const g = groupByID.get(id);
      if (!g) return;
      for (const m of g.members) {
        if (m.memberType === "device") walk("device", m.memberId);
        else if (m.memberType === "group") walk("group", m.memberId);
        else if (m.memberType === "room") walk("room", m.memberId);
      }
      return;
    }
    if (type === "room") {
      if (seenRooms.has(id)) return;
      seenRooms.add(id);
      const r = roomByID.get(id);
      if (!r) return;
      for (const d of r.devices) walk("device", d.id);
    }
  }

  walk(target.type, target.id);
  return Array.from(collected.values());
}

/**
 * Capability union across a set of devices. Capabilities are deduped by
 * `name`; numeric min/max are widened to cover all members. Access is
 * bitwise-OR'd so a cap is "settable" if any member exposes set access.
 */
export function capabilityUnion(devices: Device[]): Capability[] {
  const byName = new Map<string, Capability>();
  for (const d of devices) {
    for (const c of d.capabilities) {
      const prev = byName.get(c.name);
      if (!prev) {
        byName.set(c.name, { ...c });
        continue;
      }
      const merged: Capability = { ...prev };
      merged.access = (prev.access ?? 0) | (c.access ?? 0);
      if (c.valueMin != null) {
        merged.valueMin = prev.valueMin != null ? Math.min(prev.valueMin, c.valueMin) : c.valueMin;
      }
      if (c.valueMax != null) {
        merged.valueMax = prev.valueMax != null ? Math.max(prev.valueMax, c.valueMax) : c.valueMax;
      }
      byName.set(c.name, merged);
    }
  }
  return Array.from(byName.values());
}

/** Return the capability union for a target, resolving through groups/rooms. */
export function capabilityUnionForTarget(
  target: { type: TargetKind; id: string },
  devices: Device[],
  groups: GroupLite[],
  rooms: RoomLite[],
): Capability[] {
  return capabilityUnion(resolveTargetDevices(target, devices, groups, rooms));
}

export function hasCapability(caps: Capability[], name: string): boolean {
  return caps.some((c) => c.name === name);
}
