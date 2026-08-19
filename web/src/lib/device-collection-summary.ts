import { isLightControlDevice, type Device } from "$lib/stores/devices";
import { ContactRole } from "$lib/gql/graphql";
import { formatContactSummary, summarizeContacts } from "$lib/contact-summary";

/** Formats the live light and contact state shown beneath a room or apartment name. */
export function deviceCollectionSummary(devices: Device[]): string | undefined {
  const parts: string[] = [];

  const lights = devices.filter(isLightControlDevice);
  if (lights.length > 0) {
    const on = lights.filter((device) => device.state?.on).length;
    parts.push(on > 0 ? "On" : "Off");
    parts.push(`${on} of ${lights.length} light${lights.length === 1 ? "" : "s"}`);
  }

  for (const role of [ContactRole.Door, ContactRole.Window]) {
    const summary = summarizeContacts(devices, role);
    if (summary) parts.push(formatContactSummary(summary));
  }

  return parts.length > 0 ? parts.join(" · ") : undefined;
}
