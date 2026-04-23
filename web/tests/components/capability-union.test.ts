import { describe, expect, it } from "vitest";
import {
  capabilityUnion,
  capabilityUnionForTarget,
  hasCapability,
  resolveTargetDevices,
  type GroupLite,
  type RoomLite,
} from "$lib/target-resolve";
import type { Device } from "$lib/gql/graphql";

function cap(
  name: string,
  over: Partial<Device["capabilities"][0]> = {},
): Device["capabilities"][0] {
  return {
    __typename: "Capability" as const,
    name,
    type: "binary",
    values: null,
    valueMin: null,
    valueMax: null,
    unit: null,
    access: 7,
    ...over,
  };
}

function dev(id: string, caps: Device["capabilities"]): Device {
  return {
    __typename: "Device" as const,
    id,
    name: id,
    source: "zigbee",
    type: "light",
    available: true,
    lastSeen: null,
    capabilities: caps,
    state: null,
  };
}

const light = dev("light-1", [
  cap("on_off"),
  cap("brightness", { type: "numeric", valueMin: 0, valueMax: 254 }),
  cap("color"),
]);
const plug = dev("plug-1", [cap("on_off"), cap("power", { type: "numeric", access: 1 })]);
const bulb = dev("light-2", [
  cap("on_off"),
  cap("brightness", { type: "numeric", valueMin: 1, valueMax: 100 }),
  cap("color_temp", { type: "numeric", valueMin: 153, valueMax: 500 }),
]);

describe("resolveTargetDevices", () => {
  it("device target: returns exactly that device", () => {
    const got = resolveTargetDevices({ type: "device", id: "light-1" }, [light, plug], [], []);
    expect(got.map((d) => d.id)).toEqual(["light-1"]);
  });

  it("group target: returns members", () => {
    const grp: GroupLite = {
      id: "g1",
      members: [
        { memberType: "device", memberId: "light-1" },
        { memberType: "device", memberId: "plug-1" },
      ],
    };
    const got = resolveTargetDevices({ type: "group", id: "g1" }, [light, plug], [grp], []);
    expect(got.map((d) => d.id).sort()).toEqual(["light-1", "plug-1"]);
  });

  it("room target: returns devices", () => {
    const room: RoomLite = { id: "r1", devices: [{ id: "light-1" }, { id: "plug-1" }] };
    const got = resolveTargetDevices({ type: "room", id: "r1" }, [light, plug], [], [room]);
    expect(got.map((d) => d.id).sort()).toEqual(["light-1", "plug-1"]);
  });

  it("nested group: recursive resolution with dedupe", () => {
    const inner: GroupLite = {
      id: "inner",
      members: [{ memberType: "device", memberId: "light-1" }],
    };
    const outer: GroupLite = {
      id: "outer",
      members: [
        { memberType: "group", memberId: "inner" },
        { memberType: "device", memberId: "plug-1" },
        { memberType: "device", memberId: "light-1" }, // duplicate
      ],
    };
    const got = resolveTargetDevices(
      { type: "group", id: "outer" },
      [light, plug],
      [inner, outer],
      [],
    );
    expect(got.map((d) => d.id).sort()).toEqual(["light-1", "plug-1"]);
  });

  it("group cycle: bounded walk, no infinite loop", () => {
    const a: GroupLite = { id: "a", members: [{ memberType: "group", memberId: "b" }] };
    const b: GroupLite = {
      id: "b",
      members: [
        { memberType: "group", memberId: "a" },
        { memberType: "device", memberId: "light-1" },
      ],
    };
    const got = resolveTargetDevices({ type: "group", id: "a" }, [light], [a, b], []);
    expect(got.map((d) => d.id)).toEqual(["light-1"]);
  });

  it("room inside group: follows room membership", () => {
    const room: RoomLite = { id: "r1", devices: [{ id: "plug-1" }] };
    const grp: GroupLite = {
      id: "g1",
      members: [
        { memberType: "room", memberId: "r1" },
        { memberType: "device", memberId: "light-1" },
      ],
    };
    const got = resolveTargetDevices({ type: "group", id: "g1" }, [light, plug], [grp], [room]);
    expect(got.map((d) => d.id).sort()).toEqual(["light-1", "plug-1"]);
  });
});

describe("capabilityUnion", () => {
  it("single device returns its caps", () => {
    const u = capabilityUnion([light]);
    expect(u.map((c) => c.name).sort()).toEqual(["brightness", "color", "on_off"]);
  });

  it("deduplicates common caps across devices", () => {
    const u = capabilityUnion([light, plug]);
    const names = u.map((c) => c.name).sort();
    expect(names).toEqual(["brightness", "color", "on_off", "power"]);
  });

  it("widens numeric min/max across members", () => {
    const u = capabilityUnion([light, bulb]);
    const bri = u.find((c) => c.name === "brightness");
    expect(bri?.valueMin).toBe(0); // min(0, 1) — light
    expect(bri?.valueMax).toBe(254); // max(254, 100) — light
  });

  it("bitwise-ORs access flags so 'set' from any member sticks", () => {
    const a = dev("a", [cap("on_off", { access: 1 })]); // published only
    const b = dev("b", [cap("on_off", { access: 4 })]); // set only
    const u = capabilityUnion([a, b]);
    expect(u[0].access).toBe(5);
  });
});

describe("capabilityUnionForTarget + hasCapability", () => {
  it("group union enables brightness when any member supports it", () => {
    const grp: GroupLite = {
      id: "g1",
      members: [
        { memberType: "device", memberId: "light-1" },
        { memberType: "device", memberId: "plug-1" },
      ],
    };
    const u = capabilityUnionForTarget({ type: "group", id: "g1" }, [light, plug], [grp], []);
    expect(hasCapability(u, "brightness")).toBe(true);
    expect(hasCapability(u, "color")).toBe(true);
  });

  it("plug-only device target hides brightness", () => {
    const u = capabilityUnionForTarget({ type: "device", id: "plug-1" }, [light, plug], [], []);
    expect(hasCapability(u, "brightness")).toBe(false);
    expect(hasCapability(u, "on_off")).toBe(true);
  });
});
