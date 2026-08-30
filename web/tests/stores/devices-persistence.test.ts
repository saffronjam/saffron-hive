import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { get } from "svelte/store";
import { createDeviceStore, deviceStore, devicesHydrated } from "$lib/stores/devices";
import { cacheKey, saveSnapshot } from "$lib/entity-cache";

const SNAPSHOT = "devices";
const VERSION = 4;

function makeDevice(id: string, name: string) {
  return {
    id,
    name,
    icon: null,
    displayColor: null,
    displayBrightness: null,
    source: "zigbee2mqtt",
    type: "light",
    roles: { controlledLoad: null, contact: null },
    capabilities: [],
    available: true,
    disabled: false,
    deleted: false,
    friendlyName: name,
    seen: true,
    lastSeen: "2026-01-01T00:00:00Z",
    state: null,
  };
}

beforeEach(() => {
  // clear() also cancels any write still pending on a real timer, which would
  // otherwise swallow the scheduling the fake-timer tests below rely on.
  deviceStore.clear();
  localStorage.clear();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("deviceStore boot hydration", () => {
  // The device list is the largest payload in the app; without this it is the
  // one page that still waits on the network before it can render anything.
  it("restores a snapshot synchronously, so the list paints on the first frame", () => {
    saveSnapshot(localStorage, SNAPSHOT, VERSION, [
      makeDevice("d1", "Kitchen Light"),
      makeDevice("d2", "Hall Light"),
    ]);

    const fresh = createDeviceStore();

    expect(get(fresh.devicesHydrated)).toBe(true);
    expect(Object.keys(get(fresh.deviceStore)).sort()).toEqual(["d1", "d2"]);
    expect(get(fresh.deviceStore).d1.name).toBe("Kitchen Light");
  });

  it("stays unhydrated with no snapshot, so an empty list is never mistaken for loaded", () => {
    const fresh = createDeviceStore();

    expect(get(fresh.devicesHydrated)).toBe(false);
    expect(Object.keys(get(fresh.deviceStore))).toEqual([]);
  });
});

describe("deviceStore snapshot writes", () => {
  it("writes a snapshot after the debounce settles", () => {
    vi.useFakeTimers();

    deviceStore.hydrate([makeDevice("d1", "Kitchen Light")] as never);
    expect(localStorage.getItem(cacheKey(SNAPSHOT))).toBeNull();

    vi.advanceTimersByTime(250);

    const raw = localStorage.getItem(cacheKey(SNAPSHOT));
    expect(raw).not.toBeNull();
    expect(JSON.parse(raw!).items).toHaveLength(1);
  });

  it("keeps the snapshot when the store stops, so the next boot still paints", () => {
    deviceStore.hydrate([makeDevice("d1", "Kitchen Light")] as never);

    deviceStore.stop();

    const raw = localStorage.getItem(cacheKey(SNAPSHOT));
    expect(raw).not.toBeNull();
    expect(JSON.parse(raw!).items).toHaveLength(1);
    expect(get(devicesHydrated)).toBe(false);
  });

  it("drops the snapshot on clear, so one session's devices cannot outlive it", () => {
    vi.useFakeTimers();
    deviceStore.hydrate([makeDevice("d1", "Kitchen Light")] as never);
    vi.advanceTimersByTime(250);

    deviceStore.clear();
    vi.advanceTimersByTime(500);

    expect(localStorage.getItem(cacheKey(SNAPSHOT))).toBeNull();
    expect(get(devicesHydrated)).toBe(false);
    expect(Object.keys(get(deviceStore))).toEqual([]);
  });
});
