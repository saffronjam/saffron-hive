import { describe, it, expect } from "vitest";
import { stateSummary } from "$lib/device-state";
import type { DeviceState } from "$lib/stores/devices";

function empty(): DeviceState {
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

function state(partial: Partial<DeviceState>): DeviceState {
  return { ...empty(), ...partial };
}

describe("stateSummary", () => {
  it("returns 'Unknown' for null state", () => {
    expect(stateSummary(null, "light")).toBe("Unknown");
  });

  describe("light", () => {
    it("returns 'Off' when on is false", () => {
      expect(stateSummary(state({ on: false, brightness: 200 }), "light")).toBe("Off");
    });

    it("returns 'On - <percent>' when on with brightness", () => {
      expect(stateSummary(state({ on: true, brightness: 127 }), "light")).toBe("On - 50%");
    });

    it("rounds brightness percentage", () => {
      expect(stateSummary(state({ on: true, brightness: 254 }), "light")).toBe("On - 100%");
      expect(stateSummary(state({ on: true, brightness: 1 }), "light")).toBe("On - 0%");
    });

    it("returns 'On' when on without brightness", () => {
      expect(stateSummary(state({ on: true }), "light")).toBe("On");
    });

    it("returns 'Unknown' when on is null and no brightness", () => {
      expect(stateSummary(state({}), "light")).toBe("Unknown");
    });
  });

  describe("plug", () => {
    it("returns 'On - <power>W' when metered plug is on", () => {
      expect(stateSummary(state({ on: true, power: 42.5 }), "plug")).toBe("On - 43W");
    });

    it("includes the live power reading even when the plug is off", () => {
      expect(stateSummary(state({ on: false, power: 0 }), "plug")).toBe("Off - 0W");
    });

    it("returns plain On/Off for bare plug without metering", () => {
      expect(stateSummary(state({ on: true }), "plug")).toBe("On");
      expect(stateSummary(state({ on: false }), "plug")).toBe("Off");
    });

    it("never renders as a button press for plug type", () => {
      const summary = stateSummary(state({ on: true, power: 12.5, voltage: 230.1 }), "plug");
      expect(summary).not.toMatch(/pressed/i);
    });
  });

  describe("sensor", () => {
    it("formats temperature and humidity", () => {
      expect(stateSummary(state({ temperature: 21.37, humidity: 48 }), "sensor")).toBe(
        "21.4\u00b0C / 48% RH",
      );
    });

    it("formats only temperature when humidity missing", () => {
      expect(stateSummary(state({ temperature: 19 }), "sensor")).toBe("19.0\u00b0C");
    });

    it("falls back to battery when no temperature or humidity", () => {
      expect(stateSummary(state({ battery: 72 }), "sensor")).toBe("Battery 72%");
    });

    it("returns 'No data' when sensor has nothing", () => {
      expect(stateSummary(state({}), "sensor")).toBe("No data");
    });
  });

  describe("button", () => {
    it("returns '—' because presses are transient events surfaced elsewhere", () => {
      expect(stateSummary(state({}), "button")).toBe("—");
    });
  });
});
