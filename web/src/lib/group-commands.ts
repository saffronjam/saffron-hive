import type { Client } from "@urql/svelte";
import { graphql } from "$lib/gql";
import { rgbToXy } from "$lib/color";
import type { Device } from "$lib/stores/devices";

export interface GroupMemberRef {
  memberType: string;
  memberId: string;
}

export interface GroupLite {
  id: string;
  members: GroupMemberRef[];
}

export interface RoomLite {
  id: string;
  resolvedDevices: { id: string }[];
}

const GROUP_COMMANDS_SET_DEVICE_STATE = graphql(`
  mutation GroupCommandsSetDeviceState($deviceId: ID!, $state: DeviceStateInput!) {
    setDeviceState(deviceId: $deviceId, state: $state) {
      id
      state {
        on
        brightness
      }
    }
  }
`);

/**
 * Recursively walk a group's member list, returning a deduplicated list of
 * devices reachable through nested groups and rooms. Cycles are guarded.
 */
export function flattenGroupDevices(
  group: GroupLite,
  allDevices: readonly Device[],
  allGroups: readonly GroupLite[],
  allRooms: readonly RoomLite[],
): Device[] {
  const deviceById = new Map(allDevices.map((d) => [d.id, d]));
  const groupById = new Map(allGroups.map((g) => [g.id, g]));
  const roomById = new Map(allRooms.map((r) => [r.id, r]));

  const visited = new Set<string>();
  const ids = new Set<string>();

  function walk(g: GroupLite) {
    if (visited.has(g.id)) return;
    visited.add(g.id);
    for (const member of g.members) {
      if (member.memberType === "device") {
        ids.add(member.memberId);
      } else if (member.memberType === "room") {
        const room = roomById.get(member.memberId);
        if (room) for (const d of room.resolvedDevices) ids.add(d.id);
      } else if (member.memberType === "group") {
        const sub = groupById.get(member.memberId);
        if (sub) walk(sub);
      }
    }
  }

  walk(group);

  const out: Device[] = [];
  for (const id of ids) {
    const d = deviceById.get(id);
    if (d) out.push(d);
  }
  return out;
}

export async function commitGroupBrightness(
  client: Client,
  devices: Device[],
  brightness: number,
): Promise<void> {
  const lights = devices.filter((d) => d.type === "light" && d.state?.brightness != null);
  if (lights.length === 0) return;
  await Promise.all(
    lights.map((d) => {
      const input: { on?: true; brightness: number } = { brightness };
      if (!d.state?.on) input.on = true;
      return client
        .mutation(GROUP_COMMANDS_SET_DEVICE_STATE, { deviceId: d.id, state: input })
        .toPromise();
    }),
  );
}

export async function commitGroupToggle(
  client: Client,
  devices: Device[],
  on: boolean,
): Promise<void> {
  const targets = devices.filter((d) => d.capabilities.some((c) => c.name === "on_off"));
  if (targets.length === 0) return;
  await Promise.all(
    targets.map((d) =>
      client
        .mutation(GROUP_COMMANDS_SET_DEVICE_STATE, { deviceId: d.id, state: { on } })
        .toPromise(),
    ),
  );
}

export async function commitGroupColor(
  client: Client,
  devices: Device[],
  color: { r: number; g: number; b: number },
): Promise<void> {
  const targets = devices.filter((d) => d.capabilities.some((c) => c.name === "color"));
  if (targets.length === 0) return;
  const xy = rgbToXy(color.r, color.g, color.b);
  await Promise.all(
    targets.map((d) => {
      const input: {
        on?: true;
        color: { r: number; g: number; b: number; x: number; y: number };
      } = { color: { ...color, x: xy.x, y: xy.y } };
      if (!d.state?.on) input.on = true;
      return client
        .mutation(GROUP_COMMANDS_SET_DEVICE_STATE, { deviceId: d.id, state: input })
        .toPromise();
    }),
  );
}

export async function commitGroupTemp(
  client: Client,
  devices: Device[],
  mired: number,
): Promise<void> {
  const targets = devices.filter((d) => d.capabilities.some((c) => c.name === "color_temp"));
  if (targets.length === 0) return;
  await Promise.all(
    targets.map((d) => {
      const input: { on?: true; colorTemp: number } = { colorTemp: mired };
      if (!d.state?.on) input.on = true;
      return client
        .mutation(GROUP_COMMANDS_SET_DEVICE_STATE, { deviceId: d.id, state: input })
        .toPromise();
    }),
  );
}
