import { writable } from "svelte/store";
import type {
  Capability,
  Device,
  DeviceState,
  LightState,
  SensorState,
  SwitchState,
} from "$lib/gql/graphql";

export type { Capability, Device, DeviceState, LightState, SensorState, SwitchState };

interface DeviceMap {
  [id: string]: Device;
}

function createDeviceStore() {
  const { subscribe, set, update } = writable<DeviceMap>({});

  return {
    subscribe,

    hydrate(devices: Device[]) {
      const map: DeviceMap = {};
      for (const device of devices) {
        map[device.id] = device;
      }
      set(map);
    },

    updateState(deviceId: string, state: DeviceState) {
      update((devices) => {
        const device = devices[deviceId];
        if (!device) return devices;
        return { ...devices, [deviceId]: { ...device, state } };
      });
    },

    updateAvailability(deviceId: string, available: boolean) {
      update((devices) => {
        const device = devices[deviceId];
        if (!device) return devices;
        return { ...devices, [deviceId]: { ...device, available } };
      });
    },

    addDevice(device: Device) {
      update((devices) => ({ ...devices, [device.id]: device }));
    },

    updateName(deviceId: string, name: string) {
      update((devices) => {
        const device = devices[deviceId];
        if (!device) return devices;
        return { ...devices, [deviceId]: { ...device, name } };
      });
    },

    removeDevice(deviceId: string) {
      update((devices) => {
        const { [deviceId]: _, ...rest } = devices;
        return rest;
      });
    },
  };
}

export const deviceStore = createDeviceStore();

export function isLightState(state: DeviceState | null | undefined): state is LightState {
  return state?.__typename === "LightState";
}

export function isSensorState(state: DeviceState | null | undefined): state is SensorState {
  return state?.__typename === "SensorState";
}

export function isSwitchState(state: DeviceState | null | undefined): state is SwitchState {
  return state?.__typename === "SwitchState";
}
