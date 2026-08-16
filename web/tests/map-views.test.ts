import { describe, expect, it } from "vitest";
import {
  availableMapViews,
  EMPTY_MAP_VIEW_CONTEXT,
  placementVisibleInView,
  resolveMapView,
  supportsMapView,
  type MapViewContext,
} from "$lib/map-views";
import type { Device } from "$lib/gql/graphql";

function device(overrides: Partial<Device>): Device {
  return {
    id: "d",
    type: "light",
    source: "zigbee2mqtt",
    tags: [],
    capabilities: [],
    state: null,
    ...overrides,
  } as Device;
}

const bulb = device({ id: "bulb", type: "light" });
const tempSensor = device({
  id: "temp",
  type: "sensor",
  state: { temperature: 21.5 } as Device["state"],
});
const motionSensor = device({
  id: "motion",
  type: "sensor",
  state: { occupancy: true } as Device["state"],
});
const plug = device({ id: "plug", type: "plug" });
const speaker = device({ id: "speaker", type: "speaker" });
const button = device({ id: "button", type: "button" });
const warmButton = device({
  id: "warm-button",
  type: "button",
  state: { temperature: 22 } as Device["state"],
});
const hub = device({ id: "hub", type: "hub" });
const cloudPlug = device({ id: "cloud-plug", type: "plug", source: "tuya" });

const noTopology = EMPTY_MAP_VIEW_CONTEXT;
const zigbeeTopology: MapViewContext = { topologyProviders: new Set(["zigbee2mqtt"]) };

describe("supportsMapView", () => {
  it("keeps only lights in the light view", () => {
    expect(supportsMapView("light", bulb, noTopology)).toBe(true);
    for (const d of [tempSensor, motionSensor, plug, speaker]) {
      expect(supportsMapView("light", d, noTopology), d.id).toBe(false);
    }
  });

  it("keeps only temperature-reporting devices in the temperature view", () => {
    expect(supportsMapView("temperature", tempSensor, noTopology)).toBe(true);
    for (const d of [bulb, motionSensor, plug, speaker]) {
      expect(supportsMapView("temperature", d, noTopology), d.id).toBe(false);
    }
  });

  it("hides buttons from the light and temperature views", () => {
    expect(supportsMapView("light", button, noTopology)).toBe(false);
    expect(supportsMapView("temperature", warmButton, noTopology)).toBe(false);
  });

  it("keeps every scanned-provider device in the connectivity view, buttons included", () => {
    for (const d of [bulb, tempSensor, motionSensor, plug, speaker, button, hub]) {
      expect(supportsMapView("connectivity", d, zigbeeTopology), d.id).toBe(true);
    }
  });

  it("hides devices whose provider has no snapshot from the connectivity view", () => {
    expect(supportsMapView("connectivity", cloudPlug, zigbeeTopology)).toBe(false);
    expect(supportsMapView("connectivity", bulb, noTopology)).toBe(false);
  });
});

describe("placementVisibleInView", () => {
  it("shows a group when at least one member belongs to the view", () => {
    expect(placementVisibleInView("light", [tempSensor, bulb], noTopology)).toBe(true);
    expect(placementVisibleInView("light", [tempSensor, plug], noTopology)).toBe(false);
    expect(placementVisibleInView("temperature", [bulb, tempSensor], noTopology)).toBe(true);
    expect(placementVisibleInView("connectivity", [cloudPlug, button], zigbeeTopology)).toBe(true);
  });
});

describe("availableMapViews", () => {
  it("offers each view only when a placed device supports it", () => {
    expect(availableMapViews([bulb, tempSensor], noTopology)).toEqual(["light", "temperature"]);
    expect(availableMapViews([bulb, motionSensor], noTopology)).toEqual(["light"]);
    expect(availableMapViews([tempSensor], noTopology)).toEqual(["temperature"]);
    expect(availableMapViews([button, plug], noTopology)).toEqual([]);
  });

  it("offers connectivity only once a snapshot exists for a placed device", () => {
    expect(availableMapViews([bulb], zigbeeTopology)).toEqual(["light", "connectivity"]);
    expect(availableMapViews([bulb], noTopology)).toEqual(["light"]);
    expect(availableMapViews([cloudPlug], zigbeeTopology)).toEqual([]);
  });
});

describe("resolveMapView", () => {
  it("keeps the stored view while its devices exist", () => {
    expect(resolveMapView("temperature", ["light", "temperature"])).toBe("temperature");
    expect(resolveMapView("connectivity", ["light", "connectivity"])).toBe("connectivity");
  });

  it("falls back to light when the stored view has no devices", () => {
    expect(resolveMapView("temperature", ["light"])).toBe("light");
    expect(resolveMapView("connectivity", ["light", "temperature"])).toBe("light");
    expect(resolveMapView("temperature", [])).toBe("light");
  });
});
