import { writable } from "svelte/store";
import type { Capability, Device, DeviceState } from "$lib/gql/graphql";

export type { Capability, Device, DeviceState };

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

export function deviceHasCapability(device: Device, name: string): boolean {
  return device.capabilities.some((c) => c.name === name);
}
