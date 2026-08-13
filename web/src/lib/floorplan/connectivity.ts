import { groupGlowDeviceIds } from "$lib/floorplan/glow";

/**
 * Pure geometry for the map's connectivity view: where each mesh node sits on
 * the plan, and which link lines to draw between them.
 */

export interface ConnectivityPlacementInput {
  kind: "device" | "group";
  x: number;
  y: number;
  /** The placed device's id (device placements). */
  deviceId?: string;
  /** The group's resolved device ids, in membership order (group placements). */
  memberIds?: readonly string[];
}

export interface ConnectivityNodePosition {
  x: number;
  y: number;
  /** Whether the node sits on its own marker or on a group's pin. */
  anchor: "placement" | "group";
}

export interface TopologyLinkInput {
  source: string;
  target: string;
  kind: string;
  quality: number;
  stale: boolean;
}

export interface TopologyInput {
  nodes: readonly { id: string; deviceId?: string | null }[];
  links: readonly TopologyLinkInput[];
}

export interface MeshLinkView {
  key: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  kind: string;
  quality: number;
  stale: boolean;
}

/**
 * Where each device sits in the connectivity view. Devices with their own
 * placement anchor there; devices reachable only through a group placement
 * sit on that group's pin, all on the same point — the group has one location
 * on the plan, and spreading its members around it would draw a shape the
 * plan does not have. A device in several groups belongs to the first
 * placement that reaches it, and devices absent from the topology get no
 * position at all.
 */
export function topologyNodePositions(
  placements: readonly ConnectivityPlacementInput[],
  topologyDeviceIds: ReadonlySet<string>,
): Map<string, ConnectivityNodePosition> {
  const positions = new Map<string, ConnectivityNodePosition>();

  const placedDeviceIds = new Set<string>();
  for (const pl of placements) {
    if (pl.kind === "device" && pl.deviceId) placedDeviceIds.add(pl.deviceId);
  }

  for (const pl of placements) {
    if (pl.kind !== "device" || !pl.deviceId) continue;
    if (!topologyDeviceIds.has(pl.deviceId)) continue;
    positions.set(pl.deviceId, { x: pl.x, y: pl.y, anchor: "placement" });
  }

  const assigned = new Set<string>(placedDeviceIds);
  for (const pl of placements) {
    if (pl.kind !== "group" || !pl.memberIds) continue;
    const members = groupGlowDeviceIds(pl.memberIds, assigned).filter((id) =>
      topologyDeviceIds.has(id),
    );
    for (const id of members) {
      assigned.add(id);
      positions.set(id, { x: pl.x, y: pl.y, anchor: "group" });
    }
  }

  return positions;
}

/**
 * The link lines to draw: parent and route links always, neighbour links only
 * when asked for, never a line to a node that has no position on the plan,
 * and never one between two devices sharing a spot — two members of the same
 * group would otherwise draw a line of zero length.
 */
export function buildMeshLinkViews(
  topo: TopologyInput,
  positions: ReadonlyMap<string, ConnectivityNodePosition>,
  opts: { showNeighbours: boolean },
): MeshLinkView[] {
  const deviceByNode = new Map<string, string>();
  for (const n of topo.nodes) deviceByNode.set(n.id, n.deviceId ?? n.id);

  const out: MeshLinkView[] = [];
  for (const link of topo.links) {
    if (link.kind === "neighbour" && !opts.showNeighbours) continue;
    const a = positions.get(deviceByNode.get(link.source) ?? link.source);
    const b = positions.get(deviceByNode.get(link.target) ?? link.target);
    if (!a || !b) continue;
    if (a.x === b.x && a.y === b.y) continue;
    out.push({
      key: `${link.source}~${link.target}`,
      x1: a.x,
      y1: a.y,
      x2: b.x,
      y2: b.y,
      kind: link.kind,
      quality: link.quality,
      stale: link.stale,
    });
  }
  return out;
}

/** How much of the mesh the plan can show: nodes with a position vs all. */
export function placedTopologyNodeCount(
  topo: TopologyInput,
  positions: ReadonlyMap<string, ConnectivityNodePosition>,
): { placed: number; total: number } {
  let placed = 0;
  for (const n of topo.nodes) {
    if (positions.has(n.deviceId ?? n.id)) placed++;
  }
  return { placed, total: topo.nodes.length };
}
