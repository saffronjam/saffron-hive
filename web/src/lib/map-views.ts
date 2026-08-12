import type { Device } from "$lib/gql/graphql";
import { isLightControlDevice } from "$lib/stores/devices";

/** The live map's render dimensions: what the plan's field and markers show. */
export type MapViewId = "light" | "temperature";

export const MAP_VIEW_IDS: MapViewId[] = ["light", "temperature"];

/**
 * How strongly a temperature sensor's field renders. Temperature sources go
 * through the same cached unit fields as lamps, so their absolute brightness
 * scales with the lamp gain baked into those fields.
 */
export const TEMP_SOURCE_INTENSITY = 0.9;

/**
 * Whether a device belongs to a view — the per-view whitelist. Buttons pass
 * no view: a press has no persistent state worth drawing on the plan.
 */
export function supportsMapView(view: MapViewId, device: Device): boolean {
  if (device.type === "button") return false;
  switch (view) {
    case "light":
      return isLightControlDevice(device);
    case "temperature":
      return device.state?.temperature != null;
  }
}

/** A placement renders in a view when at least one of its devices belongs. */
export function placementVisibleInView(view: MapViewId, devices: Device[]): boolean {
  return devices.some((d) => supportsMapView(view, d));
}

/** The views worth offering: each needs at least one placed device in it. */
export function availableMapViews(devices: Device[]): MapViewId[] {
  return MAP_VIEW_IDS.filter((view) => devices.some((d) => supportsMapView(view, d)));
}

/**
 * The view to actually render. Light is the universal fallback — a stored
 * choice whose devices went away is overridden, not erased, so it revives
 * when its devices return.
 */
export function resolveMapView(stored: MapViewId, available: MapViewId[]): MapViewId {
  return available.includes(stored) ? stored : "light";
}
