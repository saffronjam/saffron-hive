import { describe, it, expect } from "vitest";
import {
  celsiusToFahrenheit,
  formatHumidity,
  formatTemperature,
  temperatureUnitLabel,
  temperatureValue,
} from "$lib/sensor-format";

describe("celsiusToFahrenheit", () => {
  it("converts known anchors", () => {
    expect(celsiusToFahrenheit(0)).toBeCloseTo(32);
    expect(celsiusToFahrenheit(100)).toBeCloseTo(212);
    expect(celsiusToFahrenheit(-40)).toBeCloseTo(-40);
  });
});

describe("temperatureUnitLabel", () => {
  it("emits the right symbol", () => {
    expect(temperatureUnitLabel("celsius")).toBe("°C");
    expect(temperatureUnitLabel("fahrenheit")).toBe("°F");
  });
});

describe("temperatureValue", () => {
  it("passes Celsius through unchanged", () => {
    expect(temperatureValue(23.4, "celsius")).toBeCloseTo(23.4);
  });

  it("converts to Fahrenheit when requested", () => {
    expect(temperatureValue(20, "fahrenheit")).toBeCloseTo(68);
  });
});

describe("formatTemperature", () => {
  it("formats in Celsius with one decimal", () => {
    expect(formatTemperature(23.34, "celsius")).toEqual({ value: "23.3", unit: "°C" });
  });

  it("formats in Fahrenheit with one decimal", () => {
    expect(formatTemperature(23.34, "fahrenheit")).toEqual({ value: "74.0", unit: "°F" });
  });

  it("rounds half-up at one decimal", () => {
    expect(formatTemperature(20, "celsius")).toEqual({ value: "20.0", unit: "°C" });
  });
});

describe("formatHumidity", () => {
  it("formats with no decimals and a percent sign", () => {
    expect(formatHumidity(17.4)).toEqual({ value: "17", unit: "%" });
    expect(formatHumidity(99.6)).toEqual({ value: "100", unit: "%" });
  });
});
