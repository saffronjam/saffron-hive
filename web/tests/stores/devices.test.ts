import { describe, it, expect, beforeEach } from "vitest";
import { get } from "svelte/store";
import {
  deviceStore,
  deviceHasCapability,
  type Device,
  type DeviceState,
} from "$lib/stores/devices";

function empty(): DeviceState {
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

const lightState: DeviceState = {
  ...empty(),
  on: true,
  brightness: 200,
  colorTemp: 350,
};

const plugState: DeviceState = {
  ...empty(),
  on: true,
  power: 42.5,
  voltage: 230.1,
};

function makeDevice(
  id: string,
  name: string,
  state: DeviceState | null = null,
  type = "light",
): Device {
  return {
    id,
    name,
    friendlyName: "",
    seen: true,
    source: "zigbee2mqtt",
    type,
    tags: [],
    capabilities: [],
    available: true,
  disabled: false,
    lastSeen: "2026-01-01T00:00:00Z",
    state,
  };
}

describe("deviceHasCapability", () => {
  it("returns true when the capability is present", () => {
    const d = makeDevice("d1", "Light");
    d.capabilities = [
      { name: "on_off", type: "binary", access: 7 },
      { name: "brightness", type: "numeric", access: 7 },
    ];
    expect(deviceHasCapability(d, "on_off")).toBe(true);
    expect(deviceHasCapability(d, "brightness")).toBe(true);
  });

  it("returns false when the capability is absent", () => {
    const d = makeDevice("d1", "Light");
    d.capabilities = [{ name: "on_off", type: "binary", access: 7 }];
    expect(deviceHasCapability(d, "power")).toBe(false);
  });
});

describe("deviceStore", () => {
  beforeEach(() => {
    deviceStore.hydrate([]);
  });

  it("hydrate populates the store from an array", () => {
    const devices = [makeDevice("d1", "Light A"), makeDevice("d2", "Light B")];
    deviceStore.hydrate(devices);
    const map = get(deviceStore);
    expect(Object.keys(map)).toHaveLength(2);
    expect(map["d1"].name).toBe("Light A");
    expect(map["d2"].name).toBe("Light B");
  });

  it("hydrate replaces previous state", () => {
    deviceStore.hydrate([makeDevice("d1", "Old")]);
    deviceStore.hydrate([makeDevice("d2", "New")]);
    const map = get(deviceStore);
    expect(Object.keys(map)).toHaveLength(1);
    expect(map["d1"]).toBeUndefined();
    expect(map["d2"].name).toBe("New");
  });

  it("addDevice adds a device", () => {
    deviceStore.hydrate([makeDevice("d1", "A")]);
    deviceStore.addDevice(makeDevice("d2", "B"));
    const map = get(deviceStore);
    expect(Object.keys(map)).toHaveLength(2);
    expect(map["d2"].name).toBe("B");
  });

  // The return value is what gates the "New device discovered" toast, so a
  // replay after a websocket reconnect must not look like a discovery.
  it("addDevice reports a first sighting only once", () => {
    deviceStore.hydrate([makeDevice("d1", "A")]);
    expect(deviceStore.addDevice(makeDevice("d2", "B"))).toBe(true);
    expect(deviceStore.addDevice(makeDevice("d2", "B"))).toBe(false);
    expect(deviceStore.addDevice(makeDevice("d1", "A"))).toBe(false);
  });

  it("markSeen clears the flag for the given devices only", () => {
    const a = { ...makeDevice("d1", "A"), seen: false };
    const b = { ...makeDevice("d2", "B"), seen: false };
    deviceStore.hydrate([a, b]);
    deviceStore.markSeen(["d1"]);
    const map = get(deviceStore);
    expect(map["d1"].seen).toBe(true);
    expect(map["d2"].seen).toBe(false);
  });

  it("addDevice keeps a device's seen flag across re-discovery", () => {
    deviceStore.hydrate([{ ...makeDevice("d1", "A"), seen: true }]);
    deviceStore.addDevice({ ...makeDevice("d1", "A"), seen: false });
    expect(get(deviceStore)["d1"].seen).toBe(true);
  });

  it("removeDevice removes a device", () => {
    deviceStore.hydrate([makeDevice("d1", "A"), makeDevice("d2", "B")]);
    deviceStore.removeDevice("d1");
    const map = get(deviceStore);
    expect(Object.keys(map)).toHaveLength(1);
    expect(map["d1"]).toBeUndefined();
    expect(map["d2"]).toBeDefined();
  });

  it("removeDevice is a no-op for unknown id", () => {
    deviceStore.hydrate([makeDevice("d1", "A")]);
    deviceStore.removeDevice("nonexistent");
    const map = get(deviceStore);
    expect(Object.keys(map)).toHaveLength(1);
  });

  it("updateState updates device state immutably", () => {
    const original = makeDevice("d1", "Light", lightState);
    deviceStore.hydrate([original]);

    const newState: DeviceState = { ...lightState, brightness: 100 };
    deviceStore.updateState("d1", newState);

    const map = get(deviceStore);
    expect(map["d1"].state?.brightness).toBe(100);
    expect(original.state).toBe(lightState);
  });

  it("updateState carries metering fields for plugs", () => {
    const original = makeDevice("p1", "Plug", plugState, "plug");
    deviceStore.hydrate([original]);
    deviceStore.updateState("p1", { ...plugState, power: 15 });
    expect(get(deviceStore)["p1"].state?.power).toBe(15);
  });

  it("updateState is a no-op for unknown device", () => {
    deviceStore.hydrate([makeDevice("d1", "A")]);
    deviceStore.updateState("nonexistent", lightState);
    const map = get(deviceStore);
    expect(Object.keys(map)).toHaveLength(1);
  });

  it("updateAvailability updates the available flag", () => {
    deviceStore.hydrate([makeDevice("d1", "A")]);
    expect(get(deviceStore)["d1"].available).toBe(true);

    deviceStore.updateAvailability("d1", false);
    expect(get(deviceStore)["d1"].available).toBe(false);
  });

  it("updateAvailability is a no-op for unknown device", () => {
    deviceStore.hydrate([makeDevice("d1", "A")]);
    deviceStore.updateAvailability("nonexistent", false);
    expect(get(deviceStore)["d1"].available).toBe(true);
  });

  it("updateState does not notify when state is unchanged", () => {
    deviceStore.hydrate([makeDevice("d1", "Light", lightState)]);
    let notifications = 0;
    const unsub = deviceStore.subscribe(() => notifications++);
    notifications = 0;
    deviceStore.updateState("d1", { ...lightState });
    unsub();
    expect(notifications).toBe(0);
  });

  it("updateAvailability does not notify when availability is unchanged", () => {
    deviceStore.hydrate([makeDevice("d1", "A")]);
    let notifications = 0;
    const unsub = deviceStore.subscribe(() => notifications++);
    notifications = 0;
    deviceStore.updateAvailability("d1", true);
    unsub();
    expect(notifications).toBe(0);
  });

  it("updateName does not notify when name is unchanged", () => {
    deviceStore.hydrate([makeDevice("d1", "Same")]);
    let notifications = 0;
    const unsub = deviceStore.subscribe(() => notifications++);
    notifications = 0;
    deviceStore.updateName("d1", "Same");
    unsub();
    expect(notifications).toBe(0);
  });

  it("updateState notifies when a single field changes", () => {
    deviceStore.hydrate([makeDevice("d1", "Light", lightState)]);
    let notifications = 0;
    const unsub = deviceStore.subscribe(() => notifications++);
    notifications = 0;
    deviceStore.updateState("d1", { ...lightState, brightness: 99 });
    unsub();
    expect(notifications).toBe(1);
  });
});
