import type { DeviceState } from "$lib/stores/devices";

/** Short one-line summary of a device's current state. Buttons have no
 * persistent state — presses arrive as transient events over the
 * deviceActionFired subscription and are surfaced elsewhere. */
export function stateSummary(state: DeviceState | null | undefined, type: string): string {
  if (type === "button") return "—";
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
    if (state.battery != null) return `Battery ${Math.round(state.battery)}%`;
    return "No data";
  }

  return "Unknown";
}
