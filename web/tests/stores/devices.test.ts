import { describe, it, expect, beforeEach } from "vitest";
import { get } from "svelte/store";
import {
  deviceStore,
  isLightState,
  isSensorState,
  isSwitchState,
  type Device,
  type LightState,
  type SensorState,
  type SwitchState,
} from "$lib/stores/devices";

const lightState: LightState = {
  __typename: "LightState",
  on: true,
  brightness: 200,
  colorTemp: 350,
  color: null,
  transition: null,
};

const sensorState: SensorState = {
  __typename: "SensorState",
  temperature: 22.5,
  humidity: 45,
  battery: 87,
  pressure: null,
  illuminance: null,
};

const switchState: SwitchState = {
  __typename: "SwitchState",
  action: "single",
};

function makeDevice(id: string, name: string, state: LightState | SensorState | SwitchState | null = null): Device {
  return { id, name, source: "zigbee", type: "light", capabilities: [], available: true, lastSeen: "2026-01-01T00:00:00Z", state };
}

describe("type guards", () => {
  it("isLightState returns true for LightState", () => {
    expect(isLightState(lightState)).toBe(true);
  });

  it("isLightState returns false for SensorState", () => {
    expect(isLightState(sensorState)).toBe(false);
  });

  it("isSensorState returns true for SensorState", () => {
    expect(isSensorState(sensorState)).toBe(true);
  });

  it("isSensorState returns false for SwitchState", () => {
    expect(isSensorState(switchState)).toBe(false);
  });

  it("isSwitchState returns true for SwitchState", () => {
    expect(isSwitchState(switchState)).toBe(true);
  });

  it("isSwitchState returns false for LightState", () => {
    expect(isSwitchState(lightState)).toBe(false);
  });

  it("all guards return false for null", () => {
    expect(isLightState(null)).toBe(false);
    expect(isSensorState(null)).toBe(false);
    expect(isSwitchState(null)).toBe(false);
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

    const newState: LightState = { ...lightState, brightness: 100 };
    deviceStore.updateState("d1", newState);

    const map = get(deviceStore);
    expect((map["d1"].state as LightState).brightness).toBe(100);
    expect(original.state).toBe(lightState);
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
});
