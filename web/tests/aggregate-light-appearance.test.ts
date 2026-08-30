import { describe, expect, it } from "vitest";
import {
  aggregateLightAppearance,
  brightnessToTintStrength,
  rememberedLightPalette,
} from "$lib/device-tint";
import { ControlledLoadRole } from "$lib/gql/graphql";
import type { Device, DeviceState } from "$lib/stores/devices";

function emptyState(): DeviceState {
  return {
    on: null,
    brightness: null,
    colorTemp: null,
    color: null,
    transition: null,
    temperature: null,
    humidity: null,
    pressure: null,
    illuminance: null,
    battery: null,
    power: null,
    voltage: null,
    current: null,
    energy: null,
  };
}

interface DeviceOptions {
  id?: string;
  controlledLoad?: ControlledLoadRole | null;
  available?: boolean;
  disabled?: boolean;
  displayColor?: string | null;
  displayBrightness?: number | null;
}

function device(type: string, partial: Partial<DeviceState>, options: DeviceOptions = {}): Device {
  const id = options.id ?? type;
  return {
    id,
    name: id,
    friendlyName: id,
    source: "zigbee2mqtt",
    type,
    roles: { controlledLoad: options.controlledLoad ?? null, contact: null },
    capabilities: [],
    available: options.available ?? true,
    disabled: options.disabled ?? false,
    displayColor: options.displayColor ?? null,
    displayBrightness: options.displayBrightness ?? null,
    lastSeen: null,
    state: { ...emptyState(), ...partial },
  } as unknown as Device;
}

describe("aggregateLightAppearance", () => {
  it("has no appearance for an empty collection", () => {
    expect(aggregateLightAppearance([])).toEqual({
      colors: [],
      dominantColor: null,
      tintStrength: 0,
      outputRatio: null,
      active: false,
      hasDimmable: false,
    });
  });

  it("counts off lights as capacity without contributing color or output", () => {
    const appearance = aggregateLightAppearance([
      device("light", { on: true, brightness: 254 }, { id: "on" }),
      device("light", { on: false, brightness: 254 }, { id: "off" }),
    ]);
    expect(appearance.colors).toHaveLength(1);
    expect(appearance.outputRatio).toBe(0.5);
    expect(appearance.active).toBe(true);
  });

  it("renders an all-off collection as neutral", () => {
    const appearance = aggregateLightAppearance([
      device("light", {
        on: false,
        brightness: 254,
        color: { r: 0, g: 0, b: 255, x: 0, y: 0 },
      }),
    ]);
    expect(appearance.colors).toEqual([]);
    expect(appearance.dominantColor).toBeNull();
    expect(appearance.tintStrength).toBe(0);
    expect(appearance.outputRatio).toBe(0);
    expect(appearance.active).toBe(false);
  });

  it("uses fixed-light display metadata for visual output", () => {
    const appearance = aggregateLightAppearance([
      device(
        "plug",
        { on: true },
        {
          controlledLoad: ControlledLoadRole.Light,
          displayColor: "#7489ff",
          displayBrightness: 70,
        },
      ),
    ]);
    expect(appearance.colors).toEqual(["rgb(116, 137, 255)"]);
    expect(appearance.outputRatio).toBe(1);
    expect(appearance.tintStrength).toBe(brightnessToTintStrength(70));
  });

  it("excludes unavailable, disabled, and unknown lights from the aggregate", () => {
    const appearance = aggregateLightAppearance([
      device(
        "light",
        { on: true, brightness: 254, color: { r: 0, g: 0, b: 255, x: 0, y: 0 } },
        { id: "offline", available: false },
      ),
      device(
        "light",
        { on: true, brightness: 254, color: { r: 0, g: 255, b: 0, x: 0, y: 0 } },
        { id: "disabled", disabled: true },
      ),
      device("light", { on: null, brightness: 254 }, { id: "unknown" }),
      device(
        "light",
        { on: true, brightness: 254, color: { r: 255, g: 0, b: 0, x: 0, y: 0 } },
        { id: "online" },
      ),
    ]);
    expect(appearance.colors).toEqual(["rgb(255, 67, 51)"]);
    expect(appearance.outputRatio).toBe(1);
  });

  it("keeps a distinct minority hue and is independent of device order", () => {
    const warm = Array.from({ length: 24 }, (_, index) =>
      device("light", { on: true, brightness: 254, colorTemp: 500 }, { id: `warm-${index}` }),
    );
    const blue = device(
      "light",
      { on: true, brightness: 254, color: { r: 0, g: 0, b: 255, x: 0, y: 0 } },
      { id: "blue" },
    );
    const forward = aggregateLightAppearance([...warm, blue]);
    const reverse = aggregateLightAppearance([blue, ...warm.toReversed()]);
    expect(forward.colors).toEqual(reverse.colors);
    expect(forward.colors).toContain("rgb(55, 138, 255)");
    expect(forward.colors).toHaveLength(3);
  });

  it("keeps a stable slot for each emitting light", () => {
    const appearance = aggregateLightAppearance([
      device(
        "light",
        { on: true, brightness: 254, color: { r: 255, g: 138, b: 54, x: 0, y: 0 } },
        { id: "warm-a" },
      ),
      device(
        "light",
        { on: true, brightness: 254, color: { r: 250, g: 145, b: 60, x: 0, y: 0 } },
        { id: "warm-b" },
      ),
    ]);
    expect(appearance.colors).toHaveLength(2);
  });

  it("omits a secondary hue below one percent of active output", () => {
    const appearance = aggregateLightAppearance([
      device(
        "light",
        { on: true, brightness: 254, color: { r: 255, g: 138, b: 54, x: 0, y: 0 } },
        { id: "warm" },
      ),
      device(
        "light",
        { on: true, brightness: 1, color: { r: 0, g: 0, b: 255, x: 0, y: 0 } },
        { id: "blue" },
      ),
    ]);
    expect(appearance.colors).toEqual(["rgb(245, 129, 42)"]);
  });

  it("selects at most three deterministic colors", () => {
    const colors = [
      { r: 255, g: 0, b: 0 },
      { r: 0, g: 255, b: 0 },
      { r: 0, g: 0, b: 255 },
      { r: 255, g: 0, b: 255 },
    ].map((color, index) =>
      device(
        "light",
        { on: true, brightness: 254, color: { ...color, x: 0, y: 0 } },
        { id: `color-${index}` },
      ),
    );
    expect(aggregateLightAppearance(colors).colors).toEqual(
      aggregateLightAppearance(colors.toReversed()).colors,
    );
    expect(aggregateLightAppearance(colors).colors).toHaveLength(3);
  });

  it("applies a brightness preview to every available dimmable light", () => {
    const devices = [
      device(
        "light",
        { on: false, brightness: 254, color: { r: 255, g: 0, b: 0, x: 0, y: 0 } },
        { id: "red" },
      ),
      device(
        "light",
        { on: false, brightness: 254, color: { r: 0, g: 0, b: 255, x: 0, y: 0 } },
        { id: "blue" },
      ),
    ];
    const appearance = aggregateLightAppearance(devices, { brightnessPreview: 127 });
    expect(appearance.active).toBe(true);
    expect(appearance.colors).toHaveLength(2);
    expect(appearance.outputRatio).toBe(0.5);
  });
});

describe("rememberedLightPalette", () => {
  it("keeps configured colors available to controls while lights are off", () => {
    expect(
      rememberedLightPalette([
        device(
          "plug",
          { on: false },
          {
            available: false,
            controlledLoad: ControlledLoadRole.Light,
            displayColor: "#7489ff",
          },
        ),
      ]),
    ).toEqual(["rgb(116, 137, 255)"]);
  });
});
