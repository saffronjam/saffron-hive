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
  /**
   * Predicate deciding whether a device should appear as a leaf. Devices that
   * fail the filter are dropped from the tree and excluded from reachableCount
   * — folders that contain only filtered-out devices end up empty. The scene
   * editor passes `isSceneTarget` so buttons / non-controllable devices don't
   * surface in the target picker.
   */
  deviceFilter?: (device: Device) => boolean;
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
  const deviceFilter = options.deviceFilter ?? (() => true);
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
        const d = devicesById.get(i);
        if (d && deviceFilter(d)) out.add(i);
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
  ): TargetTreeNode | null {
    if (type === "device") {
      const device = devicesById.get(id);
      if (!device || !deviceFilter(device)) return null;
      return {
        kind: "device",
        key: `${keyPrefix}:device:${id}`,
        device,
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
        folder.children = g.members
          .map((m, i) =>
            build(`${folder.key}:${i}`, m.memberType as TargetKind, m.memberId, depth + 1, nextSeen),
          )
          .filter((c): c is TargetTreeNode => c !== null);
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
      folder.children = r.members
        .map((m, i) =>
          build(`${folder.key}:${i}`, m.memberType as TargetKind, m.memberId, depth + 1, nextSeen),
        )
        .filter((c): c is TargetTreeNode => c !== null);
    }
    return folder;
  }

  // Top-level call: device targets that fail the filter still need a tree
  // node for the existing top row to render — the editor decides separately
  // whether to drop them. Fall back to a synthetic device node when the
  // filter excludes a directly-targeted device so the caller can see it.
  const result = build(rootKey, target.type, target.id, 0, new Set());
  if (result) return result;
  const fallback = devicesById.get(target.id);
  return {
    kind: "device",
    key: `${rootKey}:device:${target.id}`,
    device:
      fallback ??
      ({ id: target.id, name: target.id, type: "device", capabilities: [] } as unknown as Device),
  };
}
