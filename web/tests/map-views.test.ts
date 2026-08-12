import { describe, expect, it } from "vitest";
import {
  availableMapViews,
  placementVisibleInView,
  resolveMapView,
  supportsMapView,
} from "$lib/map-views";
import type { Device } from "$lib/gql/graphql";

function device(overrides: Partial<Device>): Device {
  return {
    id: "d",
    type: "light",
    tags: [],
    capabilities: [],
    state: null,
    ...overrides,
  } as Device;
}

const bulb = device({ id: "bulb", type: "light" });
const tempSensor = device({ id: "temp", type: "sensor", state: { temperature: 21.5 } as Device["state"] });
const motionSensor = device({ id: "motion", type: "sensor", state: { occupancy: true } as Device["state"] });
const plug = device({ id: "plug", type: "plug" });
const speaker = device({ id: "speaker", type: "speaker" });
const button = device({ id: "button", type: "button" });
const warmButton = device({ id: "warm-button", type: "button", state: { temperature: 22 } as Device["state"] });

describe("supportsMapView", () => {
  it("keeps only lights in the light view", () => {
    expect(supportsMapView("light", bulb)).toBe(true);
    for (const d of [tempSensor, motionSensor, plug, speaker]) {
      expect(supportsMapView("light", d), d.id).toBe(false);
    }
  });

  it("keeps only temperature-reporting devices in the temperature view", () => {
    expect(supportsMapView("temperature", tempSensor)).toBe(true);
    for (const d of [bulb, motionSensor, plug, speaker]) {
      expect(supportsMapView("temperature", d), d.id).toBe(false);
    }
  });

  it("never shows a button, whatever it reports", () => {
    expect(supportsMapView("light", button)).toBe(false);
    expect(supportsMapView("temperature", warmButton)).toBe(false);
  });
});

describe("placementVisibleInView", () => {
  it("shows a group when at least one member belongs to the view", () => {
    expect(placementVisibleInView("light", [tempSensor, bulb])).toBe(true);
    expect(placementVisibleInView("light", [tempSensor, plug])).toBe(false);
    expect(placementVisibleInView("temperature", [bulb, tempSensor])).toBe(true);
  });
});

describe("availableMapViews", () => {
  it("offers each view only when a placed device supports it", () => {
    expect(availableMapViews([bulb, tempSensor])).toEqual(["light", "temperature"]);
    expect(availableMapViews([bulb, motionSensor])).toEqual(["light"]);
    expect(availableMapViews([tempSensor])).toEqual(["temperature"]);
    expect(availableMapViews([button, plug])).toEqual([]);
  });
});

describe("resolveMapView", () => {
  it("keeps the stored view while its devices exist", () => {
    expect(resolveMapView("temperature", ["light", "temperature"])).toBe("temperature");
  });

  it("falls back to light when the stored view has no devices", () => {
    expect(resolveMapView("temperature", ["light"])).toBe("light");
    expect(resolveMapView("temperature", [])).toBe("light");
  });
});
