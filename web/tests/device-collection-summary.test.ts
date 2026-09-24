import { describe, expect, it } from "vitest";
import { contactCollectionSummary } from "$lib/device-collection-summary";
import type { Device } from "$lib/stores/devices";
import { ContactRole } from "$lib/gql/graphql";

function device(options: {
  id: string;
  light?: boolean;
  on?: boolean;
  contact?: boolean | null;
  contactRole?: ContactRole;
  available?: boolean;
}): Device {
  return {
    id: options.id,
    name: options.id,
    source: "zigbee2mqtt",
    type: options.light ? "light" : "sensor",
    capabilities: options.light
      ? [{ name: "on", type: "binary", reportsValue: true }]
      : options.contact !== undefined
        ? [{ name: "contact", type: "binary", reportsValue: true }]
        : [],
    roles: {
      controlledLoad: null,
      contact: options.contact === undefined ? null : (options.contactRole ?? ContactRole.General),
    },
    available: options.available ?? true,
    state: {
      on: options.on ?? null,
      contact: options.contact ?? null,
    },
  } as unknown as Device;
}

describe("contactCollectionSummary", () => {
  it("returns no summary for an empty collection", () => {
    expect(contactCollectionSummary([])).toBeUndefined();
  });

  it("returns no summary for lights regardless of their power state", () => {
    expect(
      contactCollectionSummary([
        device({ id: "one", light: true, on: true }),
        device({ id: "two", light: true, on: false }),
      ]),
    ).toBeUndefined();

    expect(
      contactCollectionSummary([device({ id: "one", light: true, on: false })]),
    ).toBeUndefined();
  });

  it("excludes general contacts", () => {
    expect(contactCollectionSummary([device({ id: "contact", contact: false })])).toBeUndefined();
  });

  it("describes a single door directly", () => {
    expect(
      contactCollectionSummary([
        device({ id: "door", contact: false, contactRole: ContactRole.Door }),
      ]),
    ).toBe("Door open");
    expect(
      contactCollectionSummary([
        device({ id: "door", contact: true, contactRole: ContactRole.Door }),
      ]),
    ).toBe("Door closed");
    expect(
      contactCollectionSummary([
        device({
          id: "door",
          contact: false,
          contactRole: ContactRole.Door,
          available: false,
        }),
      ]),
    ).toBe("Door unknown");
  });

  it("counts open doors when a collection has more than one", () => {
    expect(
      contactCollectionSummary([
        device({ id: "light", light: true, on: false }),
        device({ id: "open", contact: false, contactRole: ContactRole.Door }),
        device({ id: "closed", contact: true, contactRole: ContactRole.Door }),
        device({
          id: "offline",
          contact: false,
          contactRole: ContactRole.Door,
          available: false,
        }),
      ]),
    ).toBe("1 door open, 1 unknown");
  });

  it("describes closed contact collections without a ratio", () => {
    expect(
      contactCollectionSummary([
        device({ id: "one", contact: true, contactRole: ContactRole.Door }),
        device({ id: "two", contact: true, contactRole: ContactRole.Door }),
      ]),
    ).toBe("No open door");
  });

  it("counts doors and windows separately", () => {
    expect(
      contactCollectionSummary([
        device({ id: "door", contact: false, contactRole: ContactRole.Door }),
        device({ id: "window", contact: true, contactRole: ContactRole.Window }),
      ]),
    ).toBe("Door open · Window closed");
  });
  it("shows only doors and windows", () => {
    expect(
      contactCollectionSummary([
        device({ id: "light", light: true, on: true }),
        device({ id: "door", contact: false, contactRole: ContactRole.Door }),
        device({ id: "window", contact: true, contactRole: ContactRole.Window }),
      ]),
    ).toBe("Door open · Window closed");
  });
});
