import type { Device } from "$lib/gql/graphql";
import type { GroupLite, RoomLite, TargetKind } from "$lib/target-resolve";

export type TargetTreeNode =
  | {
      kind: "device";
      key: string;
      device: Device;
    }
  | {
      kind: "group" | "room";
      key: string;
      id: string;
      name: string;
      icon?: string | null;
      reachableCount: number;
      children: TargetTreeNode[];
      truncated: boolean;
    };

export interface BuildTargetTreeOptions {
  /**
   * Maximum nesting depth for container expansion. Containers reached at this
   * depth still appear as folders but their children are replaced with a
   * "truncated" indicator. Default 5 — same depth the GraphQL fragment
   * unrolls.
   */
  maxDepth?: number;
}

/**
 * Build a nested tree of folders/devices for a single scene target. Each
 * group or room becomes a folder whose children mirror its direct members
 * (recursively). Devices are leaves. Cycles (group↔room) are short-circuited
 * via a per-walk seen set.
 */
export function buildTargetTree(
  rootKey: string,
  target: { type: TargetKind; id: string },
  devicesById: Map<string, Device>,
  groupsLite: GroupLite[],
  roomsLite: RoomLite[],
  options: BuildTargetTreeOptions = {},
): TargetTreeNode {
  const maxDepth = options.maxDepth ?? 5;
  const groupByID = new Map(groupsLite.map((g) => [g.id, g]));
  const roomByID = new Map(roomsLite.map((r) => [r.id, r]));

  function reachableDeviceIds(type: TargetKind, id: string): Set<string> {
    const out = new Set<string>();
    const seen = new Set<string>();
    const walk = (t: TargetKind, i: string) => {
      const sk = `${t}:${i}`;
      if (seen.has(sk)) return;
      seen.add(sk);
      if (t === "device") {
        if (devicesById.has(i)) out.add(i);
        return;
      }
      if (t === "group") {
        const g = groupByID.get(i);
        if (!g) return;
        for (const m of g.members) walk(m.memberType as TargetKind, m.memberId);
        return;
      }
      const r = roomByID.get(i);
      if (!r) return;
      for (const m of r.members) walk(m.memberType as TargetKind, m.memberId);
    };
    walk(type, id);
    return out;
  }

  function build(
    keyPrefix: string,
    type: TargetKind,
    id: string,
    depth: number,
    seen: Set<string>,
  ): TargetTreeNode {
    if (type === "device") {
      const device = devicesById.get(id);
      return {
        kind: "device",
        key: `${keyPrefix}:device:${id}`,
        device: device ?? ({ id, name: id, type: "device", capabilities: [] } as unknown as Device),
      };
    }

    const sk = `${type}:${id}`;
    const cycle = seen.has(sk);
    const reach = reachableDeviceIds(type, id);

    if (type === "group") {
      const g = groupByID.get(id);
      const folder: TargetTreeNode = {
        kind: "group",
        key: `${keyPrefix}:group:${id}`,
        id,
        name: g?.name ?? id,
        icon: g?.icon ?? null,
        reachableCount: reach.size,
        children: [],
        truncated: false,
      };
      if (cycle) {
        folder.truncated = true;
        return folder;
      }
      if (depth >= maxDepth) {
        folder.truncated = true;
        return folder;
      }
      const nextSeen = new Set(seen);
      nextSeen.add(sk);
      if (g) {
        folder.children = g.members.map((m, i) =>
          build(`${folder.key}:${i}`, m.memberType as TargetKind, m.memberId, depth + 1, nextSeen),
        );
      }
      return folder;
    }

    const r = roomByID.get(id);
    const folder: TargetTreeNode = {
      kind: "room",
      key: `${keyPrefix}:room:${id}`,
      id,
      name: r?.name ?? id,
      icon: r?.icon ?? null,
      reachableCount: reach.size,
      children: [],
      truncated: false,
    };
    if (cycle) {
      folder.truncated = true;
      return folder;
    }
    if (depth >= maxDepth) {
      folder.truncated = true;
      return folder;
    }
    const nextSeen = new Set(seen);
    nextSeen.add(sk);
    if (r) {
      folder.children = r.members.map((m, i) =>
        build(`${folder.key}:${i}`, m.memberType as TargetKind, m.memberId, depth + 1, nextSeen),
      );
    }
    return folder;
  }

  return build(rootKey, target.type, target.id, 0, new Set());
}
