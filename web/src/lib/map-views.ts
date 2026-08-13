import type { Device } from "$lib/gql/graphql";
import { isLightControlDevice } from "$lib/stores/devices";

/** The live map's render dimensions: what the plan's field and markers show. */
export type MapViewId = "light" | "temperature" | "connectivity";

export const MAP_VIEW_IDS: MapViewId[] = ["light", "temperature", "connectivity"];

/**
 * How strongly a temperature sensor's field renders. Temperature sources go
 * through the same cached unit fields as lamps, so their absolute brightness
 * scales with the lamp gain baked into those fields.
 */
export const TEMP_SOURCE_INTENSITY = 0.9;

/** What the view policy knows beyond the devices themselves. */
export interface MapViewContext {
  /** Integration providers with a stored mesh snapshot. */
  topologyProviders: ReadonlySet<string>;
}

export const EMPTY_MAP_VIEW_CONTEXT: MapViewContext = { topologyProviders: new Set() };

/**
 * Whether a device belongs to a view — the per-view whitelist. Light and
 * temperature exclude buttons (a press has no persistent state worth drawing
 * on the plan), but connectivity keeps them: a button is a real mesh node.
 */
export function supportsMapView(view: MapViewId, device: Device, ctx: MapViewContext): boolean {
  switch (view) {
    case "light":
      return device.type !== "button" && isLightControlDevice(device);
    case "temperature":
      return device.type !== "button" && device.state?.temperature != null;
    case "connectivity":
      return ctx.topologyProviders.has(device.source);
  }
}

/** A placement renders in a view when at least one of its devices belongs. */
export function placementVisibleInView(
  view: MapViewId,
  devices: Device[],
  ctx: MapViewContext,
): boolean {
  return devices.some((d) => supportsMapView(view, d, ctx));
}

/**
 * The views worth offering: each needs at least one placed device in it.
 * Connectivity therefore appears only once its provider has completed a scan.
 */
export function availableMapViews(devices: Device[], ctx: MapViewContext): MapViewId[] {
  return MAP_VIEW_IDS.filter((view) => devices.some((d) => supportsMapView(view, d, ctx)));
}

/**
 * The view to actually render. Light is the universal fallback — a stored
 * choice whose devices went away is overridden, not erased, so it revives
 * when its devices return.
 */
export function resolveMapView(stored: MapViewId, available: MapViewId[]): MapViewId {
  return available.includes(stored) ? stored : "light";
}
