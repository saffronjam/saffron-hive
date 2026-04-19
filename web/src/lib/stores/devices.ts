import { writable } from "svelte/store";

interface Color {
  r: number;
  g: number;
  b: number;
  x: number;
  y: number;
}

export interface LightState {
  __typename: "LightState";
  on: boolean | null;
  brightness: number | null;
  colorTemp: number | null;
  color: Color | null;
  transition: number | null;
}

export interface SensorState {
  __typename: "SensorState";
  temperature: number | null;
  humidity: number | null;
  battery: number | null;
  pressure: number | null;
  illuminance: number | null;
}

export interface SwitchState {
  __typename: "SwitchState";
  action: string | null;
}

export type DeviceState = LightState | SensorState | SwitchState;

export interface Capability {
  name: string;
  type: string;
  values: string[] | null;
  valueMin: number | null;
  valueMax: number | null;
  unit: string | null;
  access: number;
}

export interface Device {
  id: string;
  name: string;
  source: string;
  type: string;
  capabilities: Capability[];
  available: boolean;
  lastSeen: string;
  state: DeviceState | null;
}

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

export function isLightState(state: DeviceState | null): state is LightState {
  return state?.__typename === "LightState";
}

export function isSensorState(state: DeviceState | null): state is SensorState {
  return state?.__typename === "SensorState";
}

export function isSwitchState(state: DeviceState | null): state is SwitchState {
  return state?.__typename === "SwitchState";
}
