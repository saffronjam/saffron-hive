import { describe, expect, it } from "vitest";
import {
  capabilityUnion,
  capabilityUnionForTarget,
  evaluateExpression,
  hasCapability,
  resolveTargetDevices,
  settableNumericCapabilities,
  type GroupLite,
  type RoomLite,
} from "$lib/target-resolve";
import {
  CapabilityCategory,
  ContactRole,
  ControlledLoadRole,
  TargetClauseOperator,
  TargetClauseSubject,
  type Device,
} from "$lib/gql/graphql";

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
    label: null,
    description: null,
    category: CapabilityCategory.State,
    reportsValue: true,
    canSet: true,
    canGet: true,
    ...over,
  };
}

function dev(id: string, caps: Device["capabilities"]): Device {
  return {
    __typename: "Device" as const,
    id,
    name: id,
    friendlyName: "",
    seen: true,
    source: "zigbee2mqtt",
    type: "light",
    roles: { controlledLoad: null, contact: null },
    available: true,
    disabled: false,
    deleted: false,
    lastSeen: null,
    capabilities: caps,
    configuration: [],
    state: null,
  };
}

const light = dev("light-1", [
  cap("on_off"),
  cap("brightness", { type: "numeric", valueMin: 0, valueMax: 254 }),
  cap("color"),
]);
const plug = dev("plug-1", [
  cap("on_off"),
  cap("power", { type: "numeric", canSet: false, canGet: false }),
]);
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
    const room: RoomLite = {
      id: "r1",
      members: [
        { memberType: "device", memberId: "light-1" },
        { memberType: "device", memberId: "plug-1" },
      ],
    };
    const got = resolveTargetDevices({ type: "room", id: "r1" }, [light, plug], [], [room]);
    expect(got.map((d) => d.id).sort()).toEqual(["light-1", "plug-1"]);
  });

  it("room target: resolvedDevices shortcut is used when members is absent", () => {
    const room: RoomLite = {
      id: "r1",
      resolvedDevices: [{ id: "light-1" }, { id: "plug-1" }],
    };
    const got = resolveTargetDevices({ type: "room", id: "r1" }, [light, plug], [], [room]);
    expect(got.map((d) => d.id).sort()).toEqual(["light-1", "plug-1"]);
  });

  it("room target: missing members does not throw", () => {
    const room: RoomLite = { id: "r1" };
    const got = resolveTargetDevices({ type: "room", id: "r1" }, [light, plug], [], [room]);
    expect(got).toEqual([]);
  });

  it("group target: missing members does not throw", () => {
    const grp: GroupLite = { id: "g1" } as unknown as GroupLite;
    const got = resolveTargetDevices({ type: "group", id: "g1" }, [light, plug], [grp], []);
    expect(got).toEqual([]);
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
    const room: RoomLite = {
      id: "r1",
      members: [{ memberType: "device", memberId: "plug-1" }],
    };
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

  it("merges access semantics across members", () => {
    const a = dev("a", [cap("on_off", { canSet: false, canGet: false })]);
    const b = dev("b", [cap("on_off", { reportsValue: false, canGet: false })]);
    const u = capabilityUnion([a, b]);
    expect(u[0].reportsValue).toBe(true);
    expect(u[0].canSet).toBe(true);
    expect(u[0].canGet).toBe(false);
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

describe("settableNumericCapabilities", () => {
  it("returns settable numeric capabilities", () => {
    const caps = [
      cap("on_off", { type: "binary" }),
      cap("brightness", { type: "numeric", valueMin: 0, valueMax: 254 }),
      cap("color_temp", { type: "numeric", valueMin: 150, valueMax: 500 }),
    ];
    const result = settableNumericCapabilities(caps);
    expect(result.map((c) => c.name).sort()).toEqual(["brightness", "color_temp"]);
  });

  it("excludes read-only numeric capabilities", () => {
    const caps = [
      cap("temperature", { type: "numeric", valueMin: -40, valueMax: 80, canSet: false }),
      cap("brightness", { type: "numeric", valueMin: 0, valueMax: 254 }),
    ];
    const result = settableNumericCapabilities(caps);
    expect(result.map((c) => c.name)).toEqual(["brightness"]);
  });

  it("returns an empty list when no settable numeric capabilities exist", () => {
    const caps = [cap("on_off", { type: "binary" })];
    expect(settableNumericCapabilities(caps)).toEqual([]);
  });
});

describe("disabled devices", () => {
  // dev() stamps every fixture as type "light"; the expression case needs a
  // second type to have anything to complement against.
  const offPlug = { ...plug, type: "plug", disabled: true };
  const grp: GroupLite = {
    id: "g1",
    members: [
      { memberType: "device", memberId: "light-1" },
      { memberType: "device", memberId: "plug-1" },
    ],
  };

  it("are dropped from a resolved target by default", () => {
    const got = resolveTargetDevices({ type: "group", id: "g1" }, [light, offPlug], [grp], []);
    expect(got.map((d) => d.id)).toEqual(["light-1"]);
  });

  it("are dropped when targeted directly", () => {
    const got = resolveTargetDevices({ type: "device", id: "plug-1" }, [light, offPlug], [], []);
    expect(got).toEqual([]);
  });

  it("stay dropped from a room target without includeDisabled", () => {
    const room: RoomLite = {
      id: "r1",
      members: [
        { memberType: "device", memberId: "light-1" },
        { memberType: "device", memberId: "plug-1" },
      ],
    };
    const got = resolveTargetDevices({ type: "room", id: "r1" }, [light, offPlug], [], [room]);
    expect(got.map((d) => d.id)).toEqual(["light-1"]);
  });

  it("are kept in a room target with includeDisabled", () => {
    const room: RoomLite = {
      id: "r1",
      members: [
        { memberType: "device", memberId: "light-1" },
        { memberType: "device", memberId: "plug-1" },
      ],
    };
    const got = resolveTargetDevices({ type: "room", id: "r1" }, [light, offPlug], [], [room], {
      includeDisabled: true,
    });
    expect(got.map((d) => d.id).sort()).toEqual(["light-1", "plug-1"]);
    expect(got.find((d) => d.id === "plug-1")?.disabled).toBe(true);
  });

  it("come back once re-enabled", () => {
    const onPlug = { ...offPlug, disabled: false };
    const got = resolveTargetDevices({ type: "group", id: "g1" }, [light, onPlug], [grp], []);
    expect(got.map((d) => d.id).sort()).toEqual(["light-1", "plug-1"]);
  });

  it("leave the expression universe, so is_not cannot resurrect them", () => {
    const notLight = [
      {
        subject: TargetClauseSubject.DeviceType,
        op: TargetClauseOperator.IsNot,
        values: ["light"],
      },
    ];
    expect(evaluateExpression(notLight, [light, offPlug], [], [])).toEqual([]);
    const onPlug = { ...offPlug, disabled: false };
    expect(evaluateExpression(notLight, [light, onPlug], [], []).map((d) => d.id)).toEqual([
      "plug-1",
    ]);
  });

  it("do not contribute capabilities to a target union", () => {
    const caps = capabilityUnionForTarget({ type: "group", id: "g1" }, [light, offPlug], [grp], []);
    expect(hasCapability(caps, "power")).toBe(false);
    expect(hasCapability(caps, "color")).toBe(true);
  });
});

describe("deleted devices", () => {
  const deletedPlug = { ...plug, disabled: true, deleted: true };
  const grp: GroupLite = {
    id: "g1",
    members: [
      { memberType: "device", memberId: "light-1" },
      { memberType: "device", memberId: "plug-1" },
    ],
  };

  it("stay hidden when an editor includes disabled members", () => {
    const got = resolveTargetDevices({ type: "group", id: "g1" }, [light, deletedPlug], [grp], [], {
      includeDisabled: true,
    });
    expect(got.map((device) => device.id)).toEqual(["light-1"]);
  });

  it("do not contribute capabilities to runtime targets", () => {
    const caps = capabilityUnionForTarget(
      { type: "group", id: "g1" },
      [light, deletedPlug],
      [grp],
      [],
    );
    expect(hasCapability(caps, "power")).toBe(false);
  });
});

describe("semantic device roles", () => {
  const appliancePlug = {
    ...plug,
    type: "plug",
    roles: { controlledLoad: ControlledLoadRole.Appliance, contact: null },
  };
  const lightPlug = {
    ...plug,
    id: "light-plug",
    type: "plug",
    roles: { controlledLoad: ControlledLoadRole.Light, contact: null },
  };
  const climate = {
    ...plug,
    id: "climate",
    type: "climate",
    roles: { controlledLoad: null, contact: null },
  };
  const door = {
    ...plug,
    id: "door",
    type: "sensor",
    roles: { controlledLoad: null, contact: ContactRole.Door },
  };
  const generalContact = {
    ...plug,
    id: "contact",
    type: "sensor",
    roles: { controlledLoad: null, contact: ContactRole.General },
  };
  const devices = [appliancePlug, lightPlug, climate, door, generalContact] as Device[];

  it("resolves inherent and selected appliance roles", () => {
    const expression = [
      {
        subject: TargetClauseSubject.DeviceRole,
        op: TargetClauseOperator.Is,
        values: ["appliance"],
      },
    ];
    expect(
      evaluateExpression(expression, devices, [], [])
        .map((device) => device.id)
        .sort(),
    ).toEqual(["climate", "plug-1"]);
  });

  it("resolves door roles without including general contacts", () => {
    const expression = [
      {
        subject: TargetClauseSubject.DeviceRole,
        op: TargetClauseOperator.Is,
        values: ["door"],
      },
    ];
    expect(evaluateExpression(expression, devices, [], []).map((device) => device.id)).toEqual([
      "door",
    ]);
  });
});
