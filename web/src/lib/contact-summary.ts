import { ContactRole } from "$lib/gql/graphql";
import type { Device } from "$lib/stores/devices";
import { m } from "$lib/i18n/messages";
import { locale } from "$lib/i18n/locale.svelte";

export interface ContactSummary {
  role: ContactRole;
  label: string;
  total: number;
  open: number;
  closed: number;
  unknown: number;
}

function roleKey(role: ContactRole): "contact" | "door" | "window" {
  if (role === ContactRole.Door) return "door";
  if (role === ContactRole.Window) return "window";
  return "contact";
}

export function summarizeContacts(devices: Device[], role: ContactRole): ContactSummary | null {
  const matching = devices.filter((device) => device.roles.contact === role);
  if (matching.length === 0) return null;

  let open = 0;
  let closed = 0;
  let unknown = 0;
  for (const device of matching) {
    if (!device.available || device.state?.contact == null) unknown++;
    else if (device.state.contact) closed++;
    else open++;
  }

  return {
    role,
    label: m.contact_name({ role: roleKey(role) }, locale.messageOptions()),
    total: matching.length,
    open,
    closed,
    unknown,
  };
}

export function formatContactSummary(summary: ContactSummary): string {
  const options = locale.messageOptions();
  const role = roleKey(summary.role);
  if (summary.total === 1) {
    const state = summary.open === 1 ? "open" : summary.closed === 1 ? "closed" : "unknown";
    return m.contact_summary_single({ role, state }, options);
  }
  return m.contact_summary_multiple(
    { role, open: String(summary.open), unknown: String(summary.unknown) },
    options,
  );
}
