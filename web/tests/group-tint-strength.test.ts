import { describe, it, expect } from "vitest";
import { groupTintStrength } from "$lib/device-tint";
import { DeviceTag } from "$lib/gql/graphql";
import type { Device, DeviceState } from "$lib/stores/devices";

function emptyState(): DeviceState {
  return {
    on: null,
    brightness: null,
    colorTemp: null,
    color: null,
    transition: null,
    temperature: null,
    humidity: null,
    pressure: null,
    illuminance: null,
    battery: null,
    power: null,
    voltage: null,
    current: null,
    energy: null,
  };
}

function device(
  type: string,
  partial: Partial<DeviceState>,
  { tags = [], id = type }: { tags?: DeviceTag[]; id?: string } = {},
): Device {
  return {
    id,
    name: id,
    friendlyName: id,
    source: "zigbee2mqtt",
    type,
    tags,
    capabilities: [],
    available: true,
    disabled: false,
    lastSeen: null,
    state: { ...emptyState(), ...partial },
  } as unknown as Device;
}

describe("groupTintStrength", () => {
  it("is zero for an empty collection", () => {
    expect(groupTintStrength([])).toBe(0);
  });

  it("is zero when every light is off", () => {
    expect(groupTintStrength([device("light", { on: false, brightness: 254 })])).toBe(0);
  });

  it("scales with brightness for a dimmable light that is on", () => {
    const full = groupTintStrength([device("light", { on: true, brightness: 254 })]);
    const dim = groupTintStrength([device("light", { on: true, brightness: 40 })]);
    expect(full).toBe(1);
    expect(dim).toBeGreaterThan(0);
    expect(dim).toBeLessThan(full);
  });

  // The bug this guards: a light that reports no brightness scored zero, so a
  // room lit only by one rendered as if it were off.
  it("is full strength for a switch-only light that is on", () => {
    expect(groupTintStrength([device("light", { on: true })])).toBe(1);
  });

  it("is full strength for a LIGHT-tagged plug that is on", () => {
    const plug = device("plug", { on: true, power: 12 }, { tags: [DeviceTag.Light] });
    expect(groupTintStrength([plug])).toBe(1);
  });

  it("ignores a plug that is not tagged as a light", () => {
    expect(groupTintStrength([device("plug", { on: true, power: 12 })])).toBe(0);
  });

  it("averages only the members that report brightness", () => {
    const mixed = [
      device("light", { on: true, brightness: 100 }, { id: "dimmable" }),
      device("light", { on: true }, { id: "switch-only" }),
    ];
    expect(groupTintStrength(mixed)).toBe(
      groupTintStrength([device("light", { on: true, brightness: 100 })]),
    );
  });

  it("ignores sensors entirely", () => {
    expect(groupTintStrength([device("sensor", { temperature: 21 })])).toBe(0);
  });
});
