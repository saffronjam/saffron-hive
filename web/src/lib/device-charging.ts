import type { Device, DeviceAttributeValue, DeviceState } from "$lib/gql/graphql";

export type ChargeState = "charging" | "charged" | null;
type ChargingDevice = {
  available?: Device["available"];
  state?: Pick<DeviceState, "battery" | "cleaningStatus"> | null;
  attributes?: Pick<DeviceAttributeValue, "capability" | "booleanValue">[];
};

/** Derives charging feedback only from reported charging or docked state. */
export function deviceChargeState(device?: ChargingDevice): ChargeState {
  if (!device || device.available === false) return null;
  const charging = device.attributes?.find(
    (value) => value.capability === "charging",
  )?.booleanValue;
  if (!(charging ?? device.state?.cleaningStatus === "docked")) return null;
  return device.state?.battery != null && device.state.battery >= 100 ? "charged" : "charging";
}
