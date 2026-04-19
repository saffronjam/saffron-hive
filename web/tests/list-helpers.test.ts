import { describe, it, expect } from "vitest";
import {
  automationNodeCounts,
  compareDevicesByName,
  groupMemberBreakdown,
  sceneTargetBreakdown,
} from "$lib/list-helpers";
import type { Device } from "$lib/stores/devices";

function device(id: string, name: string): Device {
  return {
    id,
    name,
    source: "zigbee",
    type: "light",
    capabilities: [],
    available: true,
    lastSeen: "",
    state: null,
  };
}

describe("compareDevicesByName", () => {
  it("sorts by name alphabetically", () => {
    const input = [device("3", "Charlie"), device("1", "Alpha"), device("2", "Bravo")];
    input.sort(compareDevicesByName);
    expect(input.map((d) => d.name)).toEqual(["Alpha", "Bravo", "Charlie"]);
  });

  it("is case-insensitive", () => {
    const input = [device("1", "beta"), device("2", "Alpha")];
    input.sort(compareDevicesByName);
    expect(input.map((d) => d.name)).toEqual(["Alpha", "beta"]);
  });

  it("tiebreaks on id when names are equal", () => {
    const input = [device("b", "Same"), device("a", "Same")];
    input.sort(compareDevicesByName);
    expect(input.map((d) => d.id)).toEqual(["a", "b"]);
  });

  it("is stable across repeated sorts", () => {
    const input = [device("2", "X"), device("1", "X"), device("3", "A")];
    input.sort(compareDevicesByName);
    const first = input.map((d) => d.id);
    input.sort(compareDevicesByName);
    expect(input.map((d) => d.id)).toEqual(first);
  });
});

describe("automationNodeCounts", () => {
  it("returns zeros for empty input", () => {
    expect(automationNodeCounts([])).toEqual({ trigger: 0, operator: 0, action: 0 });
  });

  it("counts each node type", () => {
    const nodes = [
      { type: "trigger" },
      { type: "trigger" },
      { type: "operator" },
      { type: "action" },
      { type: "action" },
      { type: "action" },
    ];
    expect(automationNodeCounts(nodes)).toEqual({ trigger: 2, operator: 1, action: 3 });
  });

  it("ignores unknown node types", () => {
    const nodes = [{ type: "trigger" }, { type: "condition" }, { type: "unknown" }];
    expect(automationNodeCounts(nodes)).toEqual({ trigger: 1, operator: 0, action: 0 });
  });
});

describe("groupMemberBreakdown", () => {
  it("returns empty string for empty input", () => {
    expect(groupMemberBreakdown([])).toBe("");
  });

  it("pluralizes based on count", () => {
    expect(groupMemberBreakdown([{ memberType: "device" }])).toBe("1 device");
    expect(groupMemberBreakdown([{ memberType: "device" }, { memberType: "device" }])).toBe(
      "2 devices",
    );
  });

  it("combines device/group/room with commas, omitting zero categories", () => {
    const members = [
      { memberType: "device" },
      { memberType: "device" },
      { memberType: "group" },
      { memberType: "room" },
      { memberType: "room" },
      { memberType: "room" },
    ];
    expect(groupMemberBreakdown(members)).toBe("2 devices, 1 group, 3 rooms");
  });

  it("ignores unknown member types", () => {
    expect(groupMemberBreakdown([{ memberType: "device" }, { memberType: "alien" }])).toBe(
      "1 device",
    );
  });
});

describe("sceneTargetBreakdown", () => {
  it("returns 'No targets' for empty input", () => {
    expect(sceneTargetBreakdown([])).toBe("No targets");
  });

  it("pluralizes and joins", () => {
    expect(sceneTargetBreakdown([{ targetType: "device" }])).toBe("1 device");
    expect(
      sceneTargetBreakdown([
        { targetType: "device" },
        { targetType: "device" },
        { targetType: "group" },
      ]),
    ).toBe("2 devices, 1 group");
  });

  it("ignores unknown target types", () => {
    expect(sceneTargetBreakdown([{ targetType: "device" }, { targetType: "scene" }])).toBe(
      "1 device",
    );
  });
});
