import { writable } from "svelte/store";
import { toast } from "svelte-sonner";
import { deviceDisplayName } from "$lib/utils";
import { clearSnapshot, loadSnapshot, saveSnapshot } from "$lib/entity-cache";
import type { Client } from "@urql/svelte";
import { graphql } from "$lib/gql";
import { m } from "$lib/i18n/messages";
import { locale } from "$lib/i18n/locale.svelte";
import {
  ControlledLoadRole,
  type Capability,
  type Color,
  type Device,
  type DeviceConfigurationEntry,
  type DeviceState,
} from "$lib/gql/graphql";

export type { Capability, Device, DeviceConfigurationEntry, DeviceState };

export function isHiveVisibleDevice(device: Pick<Device, "deleted">): boolean {
  return !device.deleted;
}

export function isRuntimeEnabledDevice(device: Pick<Device, "disabled" | "deleted">): boolean {
  return !device.disabled && !device.deleted;
}

export function isLightControlDevice(device: Device): boolean {
  return device.type === "light" || device.roles.controlledLoad === ControlledLoadRole.Light;
}

export function isApplianceDevice(device: Device): boolean {
  return device.type === "climate" || device.roles.controlledLoad === ControlledLoadRole.Appliance;
}

/**
 * Whether a device needs a display colour picked for it: it lights a room but
 * reports no colour of its own, so the map has nothing to draw but a default.
 */
export function needsDisplayColor(device: Device): boolean {
  return (
    isLightControlDevice(device) &&
    !deviceHasCapability(device, "color") &&
    !deviceHasCapability(device, "color_temp")
  );
}

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
    a.targetTemperature === b.targetTemperature &&
    a.hvacMode === b.hvacMode &&
    a.fanMode === b.fanMode &&
    a.swing === b.swing &&
    a.transition === b.transition &&
    a.temperature === b.temperature &&
    a.humidity === b.humidity &&
    a.pressure === b.pressure &&
    a.illuminance === b.illuminance &&
    a.occupancy === b.occupancy &&
    a.contact === b.contact &&
    a.orientation === b.orientation &&
    a.devicePosture === b.devicePosture &&
    a.linkQuality === b.linkQuality &&
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
      displayColor
      displayBrightness
      source
      type
      roles {
        controlledLoad
        contact
      }
      capabilities {
        name
        type
        label
        description
        category
        values
        valueMin
        valueMax
        unit
        reportsValue
        canSet
        canGet
      }
      available
      disabled
      deleted
      friendlyName
      seen
      lastSeen
      state {
        on
        brightness
        colorTemp
        targetTemperature
        hvacMode
        fanMode
        swing
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
        occupancy
        contact
        orientation
        devicePosture
        linkQuality
        battery
        power
        voltage
        current
        energy
      }
      configuration {
        capability
        booleanValue
        numberValue
        stringValue
      }
    }
  }
`);

const DEVICE_STATE_CHANGED = graphql(`
  subscription DeviceStoreStateChanged {
    deviceStateChanged {
      deviceId
      state {
        on
        brightness
        colorTemp
        targetTemperature
        hvacMode
        fanMode
        swing
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
        occupancy
        contact
        orientation
        devicePosture
        linkQuality
        battery
        power
        voltage
        current
        energy
      }
    }
  }
`);

const DEVICE_CONFIGURATION_CHANGED = graphql(`
  subscription DeviceStoreConfigurationChanged {
    deviceConfigurationChanged {
      deviceId
      values {
        capability
        booleanValue
        numberValue
        stringValue
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
      friendlyName
      seen
      disabled
      deleted
      source
      type
      roles {
        controlledLoad
        contact
      }
      capabilities {
        name
        type
        label
        description
        category
        values
        valueMin
        valueMax
        unit
        reportsValue
        canSet
        canGet
      }
      available
      lastSeen
      state {
        on
        brightness
        colorTemp
        targetTemperature
        hvacMode
        fanMode
        swing
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
        occupancy
        contact
        orientation
        devicePosture
        linkQuality
        battery
        power
        voltage
        current
        energy
      }
      configuration {
        capability
        booleanValue
        numberValue
        stringValue
      }
    }
  }
`);

const DEVICE_REMOVED = graphql(`
  subscription DeviceRemoved {
    deviceRemoved
  }
`);

const DEVICE_UPDATED = graphql(`
  subscription DeviceStoreUpdated {
    deviceUpdated {
      id
      name
      icon
      displayColor
      displayBrightness
      source
      type
      roles {
        controlledLoad
        contact
      }
      capabilities {
        name
        type
        label
        description
        category
        values
        valueMin
        valueMax
        unit
        reportsValue
        canSet
        canGet
      }
      available
      disabled
      deleted
      friendlyName
      seen
      lastSeen
      state {
        on
        brightness
        colorTemp
        targetTemperature
        hvacMode
        fanMode
        swing
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
        occupancy
        contact
        orientation
        devicePosture
        linkQuality
        battery
        power
        voltage
        current
        energy
      }
      configuration {
        capability
        booleanValue
        numberValue
        stringValue
      }
    }
  }
`);

/** Cache name and schema version for the disk snapshot. Bump on any change to `DEVICES_QUERY`. */
const SNAPSHOT_NAME = "devices";
const SNAPSHOT_VERSION = 4;
const PERSIST_DEBOUNCE_MS = 250;

function storage(): Storage | null {
  return typeof window === "undefined" ? null : window.localStorage;
}

function toMap(devices: Device[]): DeviceMap {
  const map: DeviceMap = {};
  for (const device of devices) {
    map[device.id] = device;
  }
  return map;
}

/**
 * True once the device list is safe to render. A restored snapshot counts, so
 * the list paints on the first frame after a cold start and the network
 * reconcile corrects it a moment later.
 */
export function createDeviceStore() {
  const restoredDevices = loadSnapshot<Device>(storage(), SNAPSHOT_NAME, SNAPSHOT_VERSION);
  const devicesHydrated = writable(restoredDevices !== null);
  let current: DeviceMap = restoredDevices ? toMap(restoredDevices) : {};
  let started = false;
  let unsubFns: Array<() => void> = [];
  let persistTimer: ReturnType<typeof setTimeout> | null = null;
  let persistSuspended = false;

  const { subscribe, set } = writable<DeviceMap>(current);
  // Subscribing emits synchronously, so everything `persist` touches must
  // already be initialized above this line. That first emit carries the value
  // just restored from disk, so it is not worth writing straight back.
  persistSuspended = true;
  subscribe((v) => {
    current = v;
    persist();
  });
  persistSuspended = false;

  function persist() {
    if (persistSuspended || persistTimer !== null) return;
    persistTimer = setTimeout(() => {
      persistTimer = null;
      saveSnapshot(storage(), SNAPSHOT_NAME, SNAPSHOT_VERSION, Object.values(current));
    }, PERSIST_DEBOUNCE_MS);
  }

  function cancelPendingPersist() {
    if (persistTimer === null) return;
    clearTimeout(persistTimer);
    persistTimer = null;
  }

  /** Empties the map without letting the write-through schedule a blank snapshot. */
  function emptyWithoutPersisting() {
    cancelPendingPersist();
    persistSuspended = true;
    set({});
    persistSuspended = false;
  }

  function hydrate(devices: Device[]) {
    set(toMap(devices));
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

  function updateConfiguration(deviceId: string, values: DeviceConfigurationEntry[]) {
    const device = current[deviceId];
    if (!device || values.length === 0) return;
    const byCapability = new Map(device.configuration.map((value) => [value.capability, value]));
    for (const value of values) byCapability.set(value.capability, value);
    const configuration = [...byCapability.values()].sort((a, b) =>
      a.capability.localeCompare(b.capability),
    );
    set({ ...current, [deviceId]: { ...device, configuration } });
  }

  /**
   * Adds a device the server just announced. Returns true only the first time a
   * given device is seen, so the caller can tell a genuine discovery from a
   * replay after a reconnect and toast accordingly.
   */
  function addDevice(device: Device): boolean {
    const existing = current[device.id];
    if (!existing) {
      set({ ...current, [device.id]: device });
      return true;
    }
    set({
      ...current,
      [device.id]: {
        ...device,
        name: existing.name,
        icon: existing.icon ?? null,
        displayColor: existing.displayColor ?? null,
        displayBrightness: existing.displayBrightness ?? null,
        roles: existing.roles,
        disabled: existing.disabled,
        deleted: existing.deleted,
        seen: existing.seen,
      },
    });
    return false;
  }

  function markSeen(deviceIds: string[]) {
    if (deviceIds.length === 0) return;
    const next = { ...current };
    for (const id of deviceIds) {
      const device = next[id];
      if (device && !device.seen) next[id] = { ...device, seen: true };
    }
    set(next);
  }

  function updateName(deviceId: string, name: string | null) {
    const device = current[deviceId];
    if (!device) return;
    if ((device.name ?? null) === name) return;
    set({ ...current, [deviceId]: { ...device, name } });
  }

  function updateIcon(deviceId: string, icon: string | null) {
    const device = current[deviceId];
    if (!device) return;
    if ((device.icon ?? null) === icon) return;
    set({ ...current, [deviceId]: { ...device, icon } });
  }

  function updateDisplayColor(deviceId: string, displayColor: string | null) {
    const device = current[deviceId];
    if (!device) return;
    if ((device.displayColor ?? null) === displayColor) return;
    set({ ...current, [deviceId]: { ...device, displayColor } });
  }

  function updateDisplayBrightness(deviceId: string, displayBrightness: number | null) {
    const device = current[deviceId];
    if (!device) return;
    if ((device.displayBrightness ?? null) === displayBrightness) return;
    set({ ...current, [deviceId]: { ...device, displayBrightness } });
  }

  function updateRoles(deviceId: string, roles: Device["roles"]) {
    const device = current[deviceId];
    if (!device) return;
    if (
      device.roles.controlledLoad === roles.controlledLoad &&
      device.roles.contact === roles.contact
    )
      return;
    set({ ...current, [deviceId]: { ...device, roles } });
  }

  function updateDisabled(deviceId: string, disabled: boolean) {
    const device = current[deviceId];
    if (!device) return;
    if (device.disabled === disabled) return;
    set({ ...current, [deviceId]: { ...device, disabled } });
  }

  function updateDeleted(deviceId: string, deleted: boolean) {
    const device = current[deviceId];
    if (!device) return;
    const disabled = deleted ? true : device.disabled;
    if (device.deleted === deleted && device.disabled === disabled) return;
    set({ ...current, [deviceId]: { ...device, deleted, disabled } });
  }

  /**
   * Replaces a device outright. Rides the deviceUpdated subscription, whose
   * payload is the authoritative row after a metadata change — including one
   * made in another tab.
   */
  function replaceDevice(device: Device) {
    set({ ...current, [device.id]: device });
  }

  function removeDevice(deviceId: string) {
    if (!(deviceId in current)) return;
    const { [deviceId]: _, ...rest } = current;
    set(rest);
  }

  async function refresh(client: Client) {
    const result = await client
      .query(DEVICES_QUERY, {}, { requestPolicy: "network-only" })
      .toPromise();
    if (!result.data?.devices) return;
    hydrate(result.data.devices as Device[]);
    devicesHydrated.set(true);
  }

  const deviceStore = {
    subscribe,
    hydrate,
    updateState,
    updateAvailability,
    updateConfiguration,
    addDevice,
    updateName,
    updateIcon,
    updateDisplayColor,
    updateDisplayBrightness,
    updateRoles,
    updateDisabled,
    updateDeleted,
    markSeen,
    removeDevice,
    refresh,

    async start(client: Client) {
      if (started) return;
      started = true;

      await refresh(client);

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
      const configurationSub = client
        .subscription(DEVICE_CONFIGURATION_CHANGED, {})
        .subscribe((r) => {
          if (!r.data) return;
          const { deviceId, values } = r.data.deviceConfigurationChanged;
          updateConfiguration(deviceId, values as DeviceConfigurationEntry[]);
        });
      const s3 = client.subscription(DEVICE_ADDED, {}).subscribe((r) => {
        if (!r.data) return;
        const device = r.data.deviceAdded as Device;
        if (addDevice(device)) {
          toast.info(m.activity_device_added_generic({}, locale.messageOptions()), {
            description: deviceDisplayName(device),
          });
        }
      });
      const s4 = client.subscription(DEVICE_REMOVED, {}).subscribe((r) => {
        if (!r.data) return;
        removeDevice(r.data.deviceRemoved);
      });
      const s5 = client.subscription(DEVICE_UPDATED, {}).subscribe((r) => {
        if (!r.data) return;
        replaceDevice(r.data.deviceUpdated as Device);
      });
      unsubFns = [
        s1.unsubscribe,
        s2.unsubscribe,
        configurationSub.unsubscribe,
        s3.unsubscribe,
        s4.unsubscribe,
        s5.unsubscribe,
      ];
    },

    stop() {
      for (const u of unsubFns) u();
      unsubFns = [];
      started = false;
      cancelPendingPersist();
      saveSnapshot(storage(), SNAPSHOT_NAME, SNAPSHOT_VERSION, Object.values(current));
      emptyWithoutPersisting();
      devicesHydrated.set(false);
    },

    /** Drops in-memory and on-disk data. Used when a session ends. */
    clear() {
      emptyWithoutPersisting();
      devicesHydrated.set(false);
      clearSnapshot(storage(), SNAPSHOT_NAME);
    },
  };

  return { deviceStore, devicesHydrated };
}

export const { deviceStore, devicesHydrated } = createDeviceStore();

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
  return device.capabilities.some((c) => c.name === name && c.canSet);
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
