import { writable } from "svelte/store";
import type { Client } from "@urql/svelte";
import { graphql } from "$lib/gql";
import type { Capability, Device, DeviceState } from "$lib/gql/graphql";

export type { Capability, Device, DeviceState };

interface DeviceMap {
  [id: string]: Device;
}

const DEVICES_QUERY = graphql(`
  query DevicesInit {
    devices {
      id
      name
      source
      type
      capabilities {
        name
        type
        values
        valueMin
        valueMax
        unit
        access
      }
      available
      lastSeen
      state {
        on
        brightness
        colorTemp
        color {
          r
          g
          b
          x
          y
        }
        transition
        temperature
        humidity
        pressure
        illuminance
        battery
        power
        voltage
        current
        energy
      }
    }
  }
`);

const DEVICE_STATE_CHANGED = graphql(`
  subscription DeviceStateChanged {
    deviceStateChanged {
      deviceId
      state {
        on
        brightness
        colorTemp
        color {
          r
          g
          b
          x
          y
        }
        transition
        temperature
        humidity
        pressure
        illuminance
        battery
        power
        voltage
        current
        energy
      }
    }
  }
`);

const DEVICE_AVAILABILITY_CHANGED = graphql(`
  subscription DeviceAvailabilityChanged {
    deviceAvailabilityChanged {
      deviceId
      available
    }
  }
`);

const DEVICE_ADDED = graphql(`
  subscription DeviceAdded {
    deviceAdded {
      id
      name
      source
      type
      capabilities {
        name
        type
        values
        valueMin
        valueMax
        unit
        access
      }
      available
      lastSeen
      state {
        on
        brightness
        colorTemp
        color {
          r
          g
          b
          x
          y
        }
        transition
        temperature
        humidity
        pressure
        illuminance
        battery
        power
        voltage
        current
        energy
      }
    }
  }
`);

const DEVICE_REMOVED = graphql(`
  subscription DeviceRemoved {
    deviceRemoved
  }
`);

export const devicesHydrated = writable(false);

function createDeviceStore() {
  const { subscribe, set, update } = writable<DeviceMap>({});
  let started = false;
  let unsubFns: Array<() => void> = [];

  function hydrate(devices: Device[]) {
    const map: DeviceMap = {};
    for (const device of devices) {
      map[device.id] = device;
    }
    set(map);
  }

  function updateState(deviceId: string, state: DeviceState) {
    update((devices) => {
      const device = devices[deviceId];
      if (!device) return devices;
      return { ...devices, [deviceId]: { ...device, state } };
    });
  }

  function updateAvailability(deviceId: string, available: boolean) {
    update((devices) => {
      const device = devices[deviceId];
      if (!device) return devices;
      return { ...devices, [deviceId]: { ...device, available } };
    });
  }

  function addDevice(device: Device) {
    update((devices) => ({ ...devices, [device.id]: device }));
  }

  function updateName(deviceId: string, name: string) {
    update((devices) => {
      const device = devices[deviceId];
      if (!device) return devices;
      return { ...devices, [deviceId]: { ...device, name } };
    });
  }

  function removeDevice(deviceId: string) {
    update((devices) => {
      const { [deviceId]: _, ...rest } = devices;
      return rest;
    });
  }

  return {
    subscribe,
    hydrate,
    updateState,
    updateAvailability,
    addDevice,
    updateName,
    removeDevice,

    async start(client: Client) {
      if (started) return;
      started = true;

      const res = await client.query(DEVICES_QUERY, {}).toPromise();
      if (res.data?.devices) {
        hydrate(res.data.devices as Device[]);
      }
      devicesHydrated.set(true);

      const s1 = client.subscription(DEVICE_STATE_CHANGED, {}).subscribe((r) => {
        if (!r.data) return;
        const { deviceId, state } = r.data.deviceStateChanged;
        updateState(deviceId, state as DeviceState);
      });
      const s2 = client.subscription(DEVICE_AVAILABILITY_CHANGED, {}).subscribe((r) => {
        if (!r.data) return;
        const { deviceId, available } = r.data.deviceAvailabilityChanged;
        updateAvailability(deviceId, available);
      });
      const s3 = client.subscription(DEVICE_ADDED, {}).subscribe((r) => {
        if (!r.data) return;
        addDevice(r.data.deviceAdded as Device);
      });
      const s4 = client.subscription(DEVICE_REMOVED, {}).subscribe((r) => {
        if (!r.data) return;
        removeDevice(r.data.deviceRemoved);
      });
      unsubFns = [s1.unsubscribe, s2.unsubscribe, s3.unsubscribe, s4.unsubscribe];
    },

    stop() {
      for (const u of unsubFns) u();
      unsubFns = [];
      started = false;
      set({});
      devicesHydrated.set(false);
    },
  };
}

export const deviceStore = createDeviceStore();

export function deviceHasCapability(device: Device, name: string): boolean {
  return device.capabilities.some((c) => c.name === name);
}

export interface SceneCapabilities {
  hasOnOff: boolean;
  hasBrightness: boolean;
  hasColor: boolean;
  hasColorTemp: boolean;
}

function hasWritableCapability(device: Device, name: string): boolean {
  return device.capabilities.some((c) => c.name === name && (c.access & 2) !== 0);
}

export function deviceSceneCapabilities(device: Device): SceneCapabilities {
  return {
    hasOnOff: hasWritableCapability(device, "on_off") || hasWritableCapability(device, "state"),
    hasBrightness: hasWritableCapability(device, "brightness"),
    hasColor: hasWritableCapability(device, "color"),
    hasColorTemp: hasWritableCapability(device, "color_temp"),
  };
}

export function isSceneTarget(device: Device): boolean {
  const c = deviceSceneCapabilities(device);
  return c.hasOnOff || c.hasBrightness || c.hasColor || c.hasColorTemp;
}
