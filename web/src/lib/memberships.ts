export interface MembershipRoom {
  id: string;
  name: string;
  icon?: string | null;
  devices: { id: string }[];
}

export interface MembershipGroupMemberRef {
  memberType: string;
  memberId: string;
}

export interface MembershipGroupMember extends MembershipGroupMemberRef {
  id: string;
}

export interface MembershipGroupRef {
  id: string;
  name: string;
  icon?: string | null;
  members: MembershipGroupMemberRef[];
}

export interface MembershipGroup {
  id: string;
  name: string;
  icon?: string | null;
  members: MembershipGroupMember[];
}

export interface Chip {
  id: string;
  name: string;
  icon?: string | null;
}

export interface DeviceChips {
  roomChips: Chip[];
  groupChips: Chip[];
}

/**
 * Build a Map of device id → room/group chips by reverse-indexing Room.devices and
 * Group.members. Only direct device membership counts: nested groups and rooms that
 * happen to contain a device are not reflected here (that's a separate concept —
 * resolved devices — and not what we show on the device card).
 */
export function chipsByDevice(
  rooms: readonly MembershipRoom[],
  groups: readonly MembershipGroupRef[],
): Map<string, DeviceChips> {
  const map = new Map<string, DeviceChips>();
  for (const room of rooms) {
    for (const d of room.devices) {
      const entry = map.get(d.id) ?? { roomChips: [], groupChips: [] };
      entry.roomChips.push({ id: room.id, name: room.name, icon: room.icon ?? null });
      map.set(d.id, entry);
    }
  }
  for (const group of groups) {
    for (const m of group.members) {
      if (m.memberType !== "device") continue;
      const entry = map.get(m.memberId) ?? { roomChips: [], groupChips: [] };
      entry.groupChips.push({ id: group.id, name: group.name, icon: group.icon ?? null });
      map.set(m.memberId, entry);
    }
  }
  return map;
}

export interface RoomMembershipRow {
  id: string;
  name: string;
  kind: "room";
  roomId: string;
}

export interface GroupMembershipRow {
  id: string;
  name: string;
  kind: "group";
  groupId: string;
  groupMemberId: string;
}

export type MembershipRowData = RoomMembershipRow | GroupMembershipRow;

/**
 * Compute the "what does this device belong to" row list for the device edit page.
 * Row `id` is prefixed so rooms and groups stay distinct even if a GroupMember id
 * happens to collide with a Room id. `groupMemberId` is the payload for
 * removeGroupMember; `roomId` + the known device id is the payload for removeRoomDevice.
 */
export function membershipRowsForDevice(
  deviceId: string | undefined,
  rooms: readonly MembershipRoom[],
  groups: readonly MembershipGroup[],
): MembershipRowData[] {
  if (!deviceId) return [];
  const roomRows: MembershipRowData[] = rooms
    .filter((r) => r.devices.some((d) => d.id === deviceId))
    .map((r) => ({
      id: `room:${r.id}`,
      name: r.name,
      kind: "room",
      roomId: r.id,
    }));

  const groupRows: MembershipRowData[] = [];
  for (const g of groups) {
    const member = g.members.find((m) => m.memberType === "device" && m.memberId === deviceId);
    if (!member) continue;
    groupRows.push({
      id: `group:${g.id}`,
      name: g.name,
      kind: "group",
      groupId: g.id,
      groupMemberId: member.id,
    });
  }

  return [...roomRows, ...groupRows];
}
