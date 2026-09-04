import type { DeviceState } from "$lib/stores/devices";
import { m } from "$lib/i18n/messages";
import { locale } from "$lib/i18n/locale.svelte";
import { formatNumber, formatPercent } from "$lib/i18n/format";
import { formatTemperature } from "$lib/sensor-format";

/** Short one-line summary of a device's current state. Buttons have no
 * persistent state — presses arrive as transient events over the
 * deviceActionFired subscription and are surfaced elsewhere. */
export function stateSummary(state: DeviceState | null | undefined, type: string): string {
  if (type === "button") return "—";
  const options = locale.messageOptions();
  if (!state) return m.state_unknown({}, options);

  if (type === "light") {
    if (state.on === false) return m.state_off({}, options);
    if (state.brightness != null) {
      return m.state_light_on_brightness(
        { percent: formatPercent(state.brightness / 254) },
        options,
      );
    }
    return state.on ? m.state_on({}, options) : m.state_unknown({}, options);
  }

  if (type === "plug") {
    const onText =
      state.on === false
        ? m.state_off({}, options)
        : state.on
          ? m.state_on({}, options)
          : m.state_unknown({}, options);
    if (state.power != null) {
      return m.state_plug_power(
        { state: onText, power: `${formatNumber(state.power, { maximumFractionDigits: 0 })}W` },
        options,
      );
    }
    return onText;
  }

  if (type === "sensor") {
    const parts: string[] = [];
    if (state.contact != null) {
      parts.push(state.contact ? m.state_closed({}, options) : m.state_open({}, options));
    }
    if (state.temperature != null) {
      const temperature = formatTemperature(state.temperature, "celsius");
      parts.push(`${temperature.value}${temperature.unit}`);
    }
    if (state.humidity != null) parts.push(`${formatPercent(state.humidity / 100)} RH`);
    if (parts.length > 0) return parts.join(" / ");
    if (state.occupancy != null) {
      return state.occupancy
        ? m.state_motion_detected({}, options)
        : m.state_no_motion({}, options);
    }
    if (state.battery != null) {
      return m.state_battery({ percent: formatPercent(state.battery / 100) }, options);
    }
    return m.state_no_data({}, options);
  }

  if (type === "climate") {
    if (state.on === false) return m.state_off({}, options);

    const parts: string[] = [];
    if (state.temperature != null) {
      const temperature = formatTemperature(state.temperature, "celsius");
      parts.push(`${temperature.value}${temperature.unit}`);
    }
    if (state.targetTemperature != null) {
      const target = formatTemperature(state.targetTemperature, "celsius");
      parts.push(m.state_climate_target({ temperature: `${target.value}${target.unit}` }, options));
    }
    if (state.hvacMode) parts.push(formatMode(state.hvacMode));
    if (parts.length > 0) return parts.join(" / ");
    if (state.on) return m.state_on({}, options);
    return m.state_no_data({}, options);
  }

  return m.state_unknown({}, options);
}

function formatMode(value: string): string {
  const words = value.replaceAll("_", " ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}
