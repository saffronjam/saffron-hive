/**
 * Sensor display formatters. Backend always stores temperature in Celsius and
 * humidity in % relative humidity; conversion happens at render time based on
 * the user's profile preference. Pure functions — pass the unit in, callers
 * read it from the `me` store.
 */

export type TemperatureUnit = "celsius" | "fahrenheit";

export interface FormattedReading {
  value: string;
  unit: string;
}

/** Convert Celsius to Fahrenheit. */
export function celsiusToFahrenheit(c: number): number {
  return c * 1.8 + 32;
}

/** Symbol for the user's chosen temperature unit. */
export function temperatureUnitLabel(unit: TemperatureUnit): "°C" | "°F" {
  return unit === "fahrenheit" ? "°F" : "°C";
}

/**
 * Format a Celsius reading for display in the user's chosen unit, with one
 * decimal place. Returns the value and the matching unit symbol separately so
 * callers can lay them out independently.
 */
export function formatTemperature(celsius: number, unit: TemperatureUnit): FormattedReading {
  const value = unit === "fahrenheit" ? celsiusToFahrenheit(celsius) : celsius;
  return { value: value.toFixed(1), unit: temperatureUnitLabel(unit) };
}

/** Convert a Celsius reading into the user's chosen unit (no formatting). */
export function temperatureValue(celsius: number, unit: TemperatureUnit): number {
  return unit === "fahrenheit" ? celsiusToFahrenheit(celsius) : celsius;
}

/** Format a humidity reading. % RH is the only supported unit; no conversion. */
export function formatHumidity(percent: number): FormattedReading {
  return { value: percent.toFixed(0), unit: "%" };
}
