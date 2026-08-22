import type { Client } from "@urql/svelte";
import { graphql } from "$lib/gql";
import { rgbToXy } from "$lib/color";
import { isLightControlDevice, type Device } from "$lib/stores/devices";
import { CommandTargetType, type DeviceStateInput } from "$lib/gql/graphql";

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
  mutation GroupCommandsSetTargetState(
    $targetType: CommandTargetType!
    $targetId: ID!
    $state: DeviceStateInput!
  ) {
    setTargetState(targetType: $targetType, targetId: $targetId, state: $state)
  }
`);

export interface CommandTarget {
  targetType: CommandTargetType;
  targetId: string;
}

async function commitState(
  client: Client,
  devices: Device[],
  targets: Device[],
  state: DeviceStateInput,
  target?: CommandTarget,
): Promise<void> {
  const active = commandable(devices);
  if (target && active.length === targets.length) {
    await client.mutation(GROUP_COMMANDS_SET_DEVICE_STATE, { ...target, state }).toPromise();
    return;
  }
  await Promise.all(
    targets.map((device) =>
      client
        .mutation(GROUP_COMMANDS_SET_DEVICE_STATE, {
          targetType: CommandTargetType.Device,
          targetId: device.id,
          state,
        })
        .toPromise(),
    ),
  );
}

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

/**
 * Commandable subset of a device list. Disabled devices are dropped here rather
 * than in flattenGroupDevices so a group's member list still renders them
 * (greyed), while every fan-out below skips them. The server rejects them too.
 */
function commandable(devices: Device[]): Device[] {
  return devices.filter((d) => !d.disabled);
}

export async function commitGroupBrightness(
  client: Client,
  devices: Device[],
  brightness: number,
  target?: CommandTarget,
): Promise<void> {
  const lights = commandable(devices).filter(
    (d) => d.type === "light" && d.state?.brightness != null,
  );
  if (lights.length === 0) return;
  const input: { on?: true; brightness: number } = { brightness };
  if (lights.some((d) => !d.state?.on)) input.on = true;
  await commitState(client, devices, lights, input, target);
}

export async function commitGroupToggle(
  client: Client,
  devices: Device[],
  on: boolean,
  target?: CommandTarget,
): Promise<void> {
  const targets = commandable(devices).filter(isLightControlDevice);
  if (targets.length === 0) return;
  await commitState(client, devices, targets, { on }, target);
}

export async function commitGroupColor(
  client: Client,
  devices: Device[],
  color: { r: number; g: number; b: number },
  target?: CommandTarget,
): Promise<void> {
  const targets = commandable(devices).filter((d) =>
    d.capabilities.some((c) => c.name === "color"),
  );
  if (targets.length === 0) return;
  const xy = rgbToXy(color.r, color.g, color.b);
  const input: {
    on?: true;
    color: { r: number; g: number; b: number; x: number; y: number };
  } = { color: { ...color, x: xy.x, y: xy.y } };
  if (targets.some((d) => !d.state?.on)) input.on = true;
  await commitState(client, devices, targets, input, target);
}

export async function commitGroupTemp(
  client: Client,
  devices: Device[],
  mired: number,
  target?: CommandTarget,
): Promise<void> {
  const targets = commandable(devices).filter((d) =>
    d.capabilities.some((c) => c.name === "color_temp"),
  );
  if (targets.length === 0) return;
  const input: { on?: true; colorTemp: number } = { colorTemp: mired };
  if (targets.some((d) => !d.state?.on)) input.on = true;
  await commitState(client, devices, targets, input, target);
}
