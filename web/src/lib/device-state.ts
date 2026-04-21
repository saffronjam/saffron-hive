import type { DeviceState } from "$lib/stores/devices";

/** Short one-line summary of a device's current state. Dispatch is keyed on
 * device type; a button has no persistent state and shows "No action" until
 * a press arrives via the deviceActionFired subscription. */
export function stateSummary(state: DeviceState | null | undefined, type: string): string {
  if (!state) return "Unknown";

  if (type === "light") {
    if (state.on === false) return "Off";
    if (state.brightness != null) {
      return `On - ${Math.round((state.brightness / 254) * 100)}%`;
    }
    return state.on ? "On" : "Unknown";
  }

  if (type === "plug") {
    const onText = state.on === false ? "Off" : state.on ? "On" : "Unknown";
    if (state.power != null) return `${onText} - ${state.power.toFixed(0)}W`;
    return onText;
  }

  if (type === "sensor") {
    const parts: string[] = [];
    if (state.temperature != null) parts.push(`${state.temperature.toFixed(1)}\u00b0C`);
    if (state.humidity != null) parts.push(`${state.humidity.toFixed(0)}% RH`);
    if (parts.length > 0) return parts.join(" / ");
    if (state.battery != null) return `Battery ${state.battery}%`;
    return "No data";
  }

  if (type === "button") {
    return "No action";
  }

  return "Unknown";
}
