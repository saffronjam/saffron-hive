import { isLightControlDevice, type Device } from "$lib/stores/devices";
import { ContactRole } from "$lib/gql/graphql";
import { formatContactSummary, summarizeContacts } from "$lib/contact-summary";
import { m } from "$lib/i18n/messages";
import { locale } from "$lib/i18n/locale.svelte";

/** Formats the live door and window state in a device collection. */
export function contactCollectionSummary(devices: Device[]): string | undefined {
  const parts: string[] = [];
  for (const role of [ContactRole.Door, ContactRole.Window]) {
    const summary = summarizeContacts(devices, role);
    if (summary) parts.push(formatContactSummary(summary));
  }
  return parts.length > 0 ? parts.join(" · ") : undefined;
}

/** Formats the live light and contact state shown beneath a room or apartment name. */
export function deviceCollectionSummary(devices: Device[]): string | undefined {
  const parts: string[] = [];

  const lights = devices.filter(isLightControlDevice);
  if (lights.length > 0) {
    const on = lights.filter((device) => device.state?.on).length;
    const options = locale.messageOptions();
    parts.push(on > 0 ? m.state_on({}, options) : m.state_off({}, options));
    parts.push(m.lights_on_count({ on, total: lights.length }, options));
  }

  const contacts = contactCollectionSummary(devices);
  if (contacts) parts.push(contacts);

  return parts.length > 0 ? parts.join(" · ") : undefined;
}
