export interface MembershipRoomMemberRef {
  memberType: string;
  memberId: string;
}

export interface MembershipRoomMember extends MembershipRoomMemberRef {
  id: string;
}

export interface MembershipRoomRef {
  id: string;
  name: string;
  icon?: string | null;
  members: MembershipRoomMemberRef[];
}

export interface MembershipRoom {
  id: string;
  name: string;
  icon?: string | null;
  members: MembershipRoomMember[];
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
 * Build a Map of device id → room/group chips by reverse-indexing room and group
 * member lists. Only direct device membership counts: nested groups inside a room
 * (or nested rooms inside a group) that happen to contain a device are not
 * reflected here. Transitive membership is a separate concept — resolved devices —
 * and is not what we show on the device card.
 */
export function chipsByDevice(
  rooms: readonly MembershipRoomRef[],
  groups: readonly MembershipGroupRef[],
): Map<string, DeviceChips> {
  const map = new Map<string, DeviceChips>();
  for (const room of rooms) {
    for (const m of room.members) {
      if (m.memberType !== "device") continue;
      const entry = map.get(m.memberId) ?? { roomChips: [], groupChips: [] };
      entry.roomChips.push({ id: room.id, name: room.name, icon: room.icon ?? null });
      map.set(m.memberId, entry);
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
  roomMemberId: string;
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
 * Row `id` is prefixed so rooms and groups stay distinct even if a RoomMember id
 * happens to collide with a GroupMember id. `roomMemberId` and `groupMemberId`
 * are the payloads for removeRoomMember / removeGroupMember respectively.
 */
export function membershipRowsForDevice(
  deviceId: string | undefined,
  rooms: readonly MembershipRoom[],
  groups: readonly MembershipGroup[],
): MembershipRowData[] {
  if (!deviceId) return [];
  const roomRows: MembershipRowData[] = [];
  for (const r of rooms) {
    const member = r.members.find((m) => m.memberType === "device" && m.memberId === deviceId);
    if (!member) continue;
    roomRows.push({
      id: `room:${r.id}`,
      name: r.name,
      kind: "room",
      roomId: r.id,
      roomMemberId: member.id,
    });
  }

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
