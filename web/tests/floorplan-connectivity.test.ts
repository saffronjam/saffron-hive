import { describe, expect, it } from "vitest";
import {
  buildMeshLinkViews,
  placedTopologyNodeCount,
  topologyNodePositions,
  type ConnectivityPlacementInput,
  type TopologyInput,
} from "$lib/floorplan/connectivity";

const inTopology = new Set(["hub", "r1", "r2", "s1", "g1", "g2", "g3"]);

function devicePlacement(id: string, x: number, y: number): ConnectivityPlacementInput {
  return { kind: "device", x, y, deviceId: id };
}

describe("topologyNodePositions", () => {
  it("anchors placed devices at their own marker", () => {
    const positions = topologyNodePositions([devicePlacement("r1", 2, 3)], inTopology);
    expect(positions.get("r1")).toEqual({ x: 2, y: 3, anchor: "placement" });
  });

  it("omits devices absent from the topology", () => {
    const positions = topologyNodePositions([devicePlacement("stranger", 2, 3)], inTopology);
    expect(positions.size).toBe(0);
  });

  it("sits every group-only member on the group's single pin", () => {
    const positions = topologyNodePositions(
      [{ kind: "group", x: 10, y: 10, memberIds: ["g2", "g1", "g3"] }],
      inTopology,
    );
    expect(positions.size).toBe(3);
    for (const id of ["g1", "g2", "g3"]) {
      expect(positions.get(id), id).toEqual({ x: 10, y: 10, anchor: "group" });
    }
  });

  it("sits a lone group member on the pin too", () => {
    const positions = topologyNodePositions(
      [{ kind: "group", x: 4, y: 5, memberIds: ["g1", "stranger"] }],
      inTopology,
    );
    expect(positions.get("g1")).toEqual({ x: 4, y: 5, anchor: "group" });
  });

  it("prefers a device's own marker over its group membership", () => {
    const positions = topologyNodePositions(
      [
        { kind: "group", x: 10, y: 10, memberIds: ["g1", "r1"] },
        devicePlacement("r1", 2, 3),
      ],
      inTopology,
    );
    expect(positions.get("r1")).toEqual({ x: 2, y: 3, anchor: "placement" });
    expect(positions.get("g1")).toEqual({ x: 10, y: 10, anchor: "group" });
  });

  it("assigns a device in two groups to the first placement", () => {
    const positions = topologyNodePositions(
      [
        { kind: "group", x: 0, y: 0, memberIds: ["g1"] },
        { kind: "group", x: 8, y: 8, memberIds: ["g1", "g2"] },
      ],
      inTopology,
    );
    expect(positions.get("g1")).toEqual({ x: 0, y: 0, anchor: "group" });
    expect(positions.get("g2")).toEqual({ x: 8, y: 8, anchor: "group" });
  });
});

const topo: TopologyInput = {
  nodes: [
    { id: "hub", deviceId: "hub" },
    { id: "r1", deviceId: "r1" },
    { id: "r2", deviceId: "r2" },
    { id: "s1", deviceId: "s1" },
  ],
  links: [
    { source: "s1", target: "r1", kind: "parent", quality: 0.7, stale: false },
    { source: "r1", target: "hub", kind: "route", quality: 0.8, stale: false },
    { source: "r2", target: "r1", kind: "neighbour", quality: 0.5, stale: false },
    { source: "r2", target: "hub", kind: "route", quality: 0.4, stale: true },
  ],
};

const allPlaced = topologyNodePositions(
  [
    devicePlacement("hub", 0, 0),
    devicePlacement("r1", 1, 0),
    devicePlacement("r2", 2, 0),
    devicePlacement("s1", 3, 0),
  ],
  inTopology,
);

describe("buildMeshLinkViews", () => {
  it("draws parent and route links, hides neighbours by default", () => {
    const links = buildMeshLinkViews(topo, allPlaced, { showNeighbours: false });
    expect(links.map((l) => l.kind).sort()).toEqual(["parent", "route", "route"]);
  });

  it("adds neighbour links when asked", () => {
    const links = buildMeshLinkViews(topo, allPlaced, { showNeighbours: true });
    expect(links).toHaveLength(4);
  });

  it("passes the stale flag through", () => {
    const links = buildMeshLinkViews(topo, allPlaced, { showNeighbours: false });
    const stale = links.find((l) => l.stale);
    expect(stale?.key).toBe("r2~hub");
  });

  it("drops links with an unplaced endpoint", () => {
    const partial = topologyNodePositions(
      [devicePlacement("hub", 0, 0), devicePlacement("r1", 1, 0)],
      inTopology,
    );
    const links = buildMeshLinkViews(topo, partial, { showNeighbours: true });
    expect(links.map((l) => l.key)).toEqual(["r1~hub"]);
  });

  it("maps endpoints to positions", () => {
    const links = buildMeshLinkViews(topo, allPlaced, { showNeighbours: false });
    const parent = links.find((l) => l.kind === "parent")!;
    expect([parent.x1, parent.y1]).toEqual([3, 0]);
    expect([parent.x2, parent.y2]).toEqual([1, 0]);
  });

  it("drops links between two devices sharing a group's pin", () => {
    // r1 and s1 both reachable only through one group: same point, and the
    // parent link between them would be a line of zero length.
    const shared = topologyNodePositions(
      [
        devicePlacement("hub", 0, 0),
        { kind: "group", x: 5, y: 5, memberIds: ["r1", "s1"] },
      ],
      inTopology,
    );
    expect(shared.get("r1")).toEqual(shared.get("s1"));
    const links = buildMeshLinkViews(topo, shared, { showNeighbours: true });
    expect(links.map((l) => l.key)).toEqual(["r1~hub"]);
  });
});

describe("placedTopologyNodeCount", () => {
  it("counts nodes with a position against the whole mesh", () => {
    const partial = topologyNodePositions([devicePlacement("hub", 0, 0)], inTopology);
    expect(placedTopologyNodeCount(topo, partial)).toEqual({ placed: 1, total: 4 });
    expect(placedTopologyNodeCount(topo, allPlaced)).toEqual({ placed: 4, total: 4 });
  });
});
