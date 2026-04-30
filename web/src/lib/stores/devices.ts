import { writable } from "svelte/store";
import type { Client } from "@urql/svelte";
import { graphql } from "$lib/gql";
import type { Capability, Color, Device, DeviceState } from "$lib/gql/graphql";

export type { Capability, Device, DeviceState };

function colorsEqual(a: Color | null | undefined, b: Color | null | undefined): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  return a.r === b.r && a.g === b.g && a.b === b.b && a.x === b.x && a.y === b.y;
}

function statesEqual(
  a: DeviceState | null | undefined,
  b: DeviceState | null | undefined,
): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  return (
    a.on === b.on &&
    a.brightness === b.brightness &&
    a.colorTemp === b.colorTemp &&
    a.transition === b.transition &&
    a.temperature === b.temperature &&
    a.humidity === b.humidity &&
    a.pressure === b.pressure &&
    a.illuminance === b.illuminance &&
    a.battery === b.battery &&
    a.power === b.power &&
    a.voltage === b.voltage &&
    a.current === b.current &&
    a.energy === b.energy &&
    colorsEqual(a.color, b.color)
  );
}

interface DeviceMap {
  [id: string]: Device;
}

const DEVICES_QUERY = graphql(`
  query DevicesInit {
    devices {
      id
      name
      icon
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
  const { subscribe, set } = writable<DeviceMap>({});
  let current: DeviceMap = {};
  subscribe((v) => {
    current = v;
  });
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
    const device = current[deviceId];
    if (!device) return;
    if (statesEqual(device.state, state)) return;
    set({ ...current, [deviceId]: { ...device, state } });
  }

  function updateAvailability(deviceId: string, available: boolean) {
    const device = current[deviceId];
    if (!device) return;
    if (device.available === available) return;
    set({ ...current, [deviceId]: { ...device, available } });
  }

  function addDevice(device: Device) {
    set({ ...current, [device.id]: device });
  }

  function updateName(deviceId: string, name: string) {
    const device = current[deviceId];
    if (!device) return;
    if (device.name === name) return;
    set({ ...current, [deviceId]: { ...device, name } });
  }

  function removeDevice(deviceId: string) {
    if (!(deviceId in current)) return;
    const { [deviceId]: _, ...rest } = current;
    set(rest);
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

/**
 * Whether the device supports a given native effect program. Mirrors the
 * server-side `nativeEffectOptions` derivation: a device supports `name` iff
 * its `effect` capability's `values` list contains the name.
 */
export function deviceSupportsNativeEffect(device: Device, name: string): boolean {
  for (const c of device.capabilities) {
    if (c.name !== "effect") continue;
    if (!c.values) return false;
    return c.values.includes(name);
  }
  return false;
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
