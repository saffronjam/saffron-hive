import { describe, it, expect } from "vitest";
import { stateSummary } from "$lib/device-state";
import type { LightState, SensorState, SwitchState } from "$lib/stores/devices";

function light(partial: Partial<Omit<LightState, "__typename">>): LightState {
  return {
    __typename: "LightState",
    on: null,
    brightness: null,
    colorTemp: null,
    color: null,
    transition: null,
    ...partial,
  };
}

function sensor(partial: Partial<Omit<SensorState, "__typename">>): SensorState {
  return {
    __typename: "SensorState",
    temperature: null,
    humidity: null,
    battery: null,
    pressure: null,
    illuminance: null,
    ...partial,
  };
}

function sw(action: string | null): SwitchState {
  return { __typename: "SwitchState", action };
}

describe("stateSummary", () => {
  it("returns 'Unknown' for null state", () => {
    expect(stateSummary(null)).toBe("Unknown");
  });

  describe("light", () => {
    it("returns 'Off' when on is false", () => {
      expect(stateSummary(light({ on: false, brightness: 200 }))).toBe("Off");
    });

    it("returns 'On - <percent>' when on with brightness", () => {
      expect(stateSummary(light({ on: true, brightness: 127 }))).toBe("On - 50%");
    });

    it("rounds brightness percentage", () => {
      expect(stateSummary(light({ on: true, brightness: 254 }))).toBe("On - 100%");
      expect(stateSummary(light({ on: true, brightness: 1 }))).toBe("On - 0%");
    });

    it("returns 'On' when on without brightness", () => {
      expect(stateSummary(light({ on: true }))).toBe("On");
    });

    it("returns 'Unknown' when on is null and no brightness", () => {
      expect(stateSummary(light({}))).toBe("Unknown");
    });
  });

  describe("sensor", () => {
    it("formats temperature and humidity", () => {
      expect(stateSummary(sensor({ temperature: 21.37, humidity: 48 }))).toBe(
        "21.4\u00b0C / 48% RH",
      );
    });

    it("formats only temperature when humidity missing", () => {
      expect(stateSummary(sensor({ temperature: 19 }))).toBe("19.0\u00b0C");
    });

    it("falls back to battery when no temperature or humidity", () => {
      expect(stateSummary(sensor({ battery: 72 }))).toBe("Battery 72%");
    });

    it("returns 'No data' when sensor has nothing", () => {
      expect(stateSummary(sensor({}))).toBe("No data");
    });
  });

  describe("switch", () => {
    it("returns 'Last: <action>' when action present", () => {
      expect(stateSummary(sw("single"))).toBe("Last: single");
    });

    it("returns 'No action' when action is null", () => {
      expect(stateSummary(sw(null))).toBe("No action");
    });
  });
});
