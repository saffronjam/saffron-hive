import { ContactRole } from "$lib/gql/graphql";
import type { Device } from "$lib/stores/devices";

export interface ContactSummary {
  role: ContactRole;
  label: string;
  plural: string;
  total: number;
  open: number;
  closed: number;
  unknown: number;
}

const CONTACT_NAMES: Record<ContactRole, Pick<ContactSummary, "label" | "plural">> = {
  [ContactRole.General]: { label: "Contact", plural: "contacts" },
  [ContactRole.Door]: { label: "Door", plural: "doors" },
  [ContactRole.Window]: { label: "Window", plural: "windows" },
};

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
    ...CONTACT_NAMES[role],
    total: matching.length,
    open,
    closed,
    unknown,
  };
}

export function formatContactSummary(summary: ContactSummary): string {
  if (summary.total === 1) {
    const state = summary.open === 1 ? "open" : summary.closed === 1 ? "closed" : "unknown";
    return `${summary.label} ${state}`;
  }
  const unknown = summary.unknown > 0 ? `, ${summary.unknown} unknown` : "";
  if (summary.open === 0) return `No open ${summary.label.toLowerCase()}${unknown}`;
  if (summary.open === 1) return `1 ${summary.label.toLowerCase()} open${unknown}`;
  return `${summary.open} ${summary.plural} open${unknown}`;
}
