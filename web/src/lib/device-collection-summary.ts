import type { Device } from "$lib/stores/devices";
import { ContactRole } from "$lib/gql/graphql";
import { formatContactSummary, summarizeContacts } from "$lib/contact-summary";

/** Formats the live door and window state in a device collection. */
export function contactCollectionSummary(devices: Device[]): string | undefined {
  const parts: string[] = [];
  for (const role of [ContactRole.Door, ContactRole.Window]) {
    const summary = summarizeContacts(devices, role);
    if (summary) parts.push(formatContactSummary(summary));
  }
  return parts.length > 0 ? parts.join(" · ") : undefined;
}
