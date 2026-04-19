import { isLightState, isSensorState, isSwitchState, type DeviceState } from "$lib/stores/devices";

/** Short one-line summary of a device's current state (e.g. "On - 75%", "21.4°C / 48% RH"). */
export function stateSummary(state: DeviceState | null): string {
  if (isLightState(state)) {
    if (state.on === false) return "Off";
    if (state.brightness != null) {
      return `On - ${Math.round((state.brightness / 254) * 100)}%`;
    }
    return state.on ? "On" : "Unknown";
  }
  if (isSensorState(state)) {
    const parts: string[] = [];
    if (state.temperature != null) parts.push(`${state.temperature.toFixed(1)}\u00b0C`);
    if (state.humidity != null) parts.push(`${state.humidity.toFixed(0)}% RH`);
    if (parts.length > 0) return parts.join(" / ");
    if (state.battery != null) return `Battery ${state.battery}%`;
    return "No data";
  }
  if (isSwitchState(state)) {
    return state.action ? `Last: ${state.action}` : "No action";
  }
  return "Unknown";
}
