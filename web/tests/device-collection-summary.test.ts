import { describe, expect, it } from "vitest";
import { contactCollectionSummary, deviceCollectionSummary } from "$lib/device-collection-summary";
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

describe("deviceCollectionSummary", () => {
  it("returns no summary for a collection without lights or doors", () => {
    expect(deviceCollectionSummary([])).toBeUndefined();
  });

  it("shows power and the complete light count", () => {
    expect(
      deviceCollectionSummary([
        device({ id: "one", light: true, on: true }),
        device({ id: "two", light: true, on: false }),
      ]),
    ).toBe("On · 1 of 2 lights");

    expect(deviceCollectionSummary([device({ id: "one", light: true, on: false })])).toBe(
      "Off · 0 of 1 light",
    );
  });

  it("excludes general contacts", () => {
    expect(deviceCollectionSummary([device({ id: "contact", contact: false })])).toBeUndefined();
  });

  it("describes a single door directly", () => {
    expect(
      deviceCollectionSummary([
        device({ id: "door", contact: false, contactRole: ContactRole.Door }),
      ]),
    ).toBe("Door open");
    expect(
      deviceCollectionSummary([
        device({ id: "door", contact: true, contactRole: ContactRole.Door }),
      ]),
    ).toBe("Door closed");
    expect(
      deviceCollectionSummary([
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
      deviceCollectionSummary([
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
    ).toBe("Off · 0 of 1 light · 1 door open, 1 unknown");
  });

  it("describes closed contact collections without a ratio", () => {
    expect(
      deviceCollectionSummary([
        device({ id: "one", contact: true, contactRole: ContactRole.Door }),
        device({ id: "two", contact: true, contactRole: ContactRole.Door }),
      ]),
    ).toBe("No open door");
  });

  it("counts doors and windows separately", () => {
    expect(
      deviceCollectionSummary([
        device({ id: "door", contact: false, contactRole: ContactRole.Door }),
        device({ id: "window", contact: true, contactRole: ContactRole.Window }),
      ]),
    ).toBe("Door open · Window closed");
  });
});

describe("contactCollectionSummary", () => {
  it("shows only doors and windows", () => {
    expect(
      contactCollectionSummary([
        device({ id: "light", light: true, on: true }),
        device({ id: "door", contact: false, contactRole: ContactRole.Door }),
        device({ id: "window", contact: true, contactRole: ContactRole.Window }),
      ]),
    ).toBe("Door open · Window closed");
  });

  it("returns no summary without door or window contacts", () => {
    expect(
      contactCollectionSummary([device({ id: "light", light: true, on: true })]),
    ).toBeUndefined();
  });
});
