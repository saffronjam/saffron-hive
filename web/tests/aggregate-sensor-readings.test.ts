import { describe, it, expect } from "vitest";
import { aggregateSensorReadings } from "$lib/device-tint";
import type { Device, DeviceState } from "$lib/stores/devices";
import { ContactRole } from "$lib/gql/graphql";
import { DoorOpen, Magnet, PanelTopOpen } from "@lucide/svelte";

function emptyState(): DeviceState {
  return {
    on: null,
    brightness: null,
    colorTemp: null,
    color: null,
    transition: null,
    temperature: null,
    humidity: null,
    pressure: null,
    illuminance: null,
    battery: null,
    power: null,
    voltage: null,
    current: null,
    energy: null,
  };
}

function sensor(
  partial: Partial<DeviceState>,
  id = "s",
  available = true,
  contactRole: ContactRole = ContactRole.General,
): Device {
  return {
    id,
    name: id,
    source: "zigbee2mqtt",
    type: "sensor",
    capabilities:
      partial.contact === undefined
        ? []
        : [{ name: "contact", type: "binary", reportsValue: true }],
    roles: {
      controlledLoad: null,
      contact: partial.contact === undefined ? null : contactRole,
    },
    available,
    lastSeen: null,
    state: { ...emptyState(), ...partial },
  } as unknown as Device;
}

describe("aggregateSensorReadings", () => {
  it("returns empty list for no devices", () => {
    expect(aggregateSensorReadings([])).toEqual([]);
  });

  it("returns empty list when no fields are reported", () => {
    expect(aggregateSensorReadings([sensor({})])).toEqual([]);
  });

  it("formats a single sensor's readings in Celsius by default", () => {
    const r = aggregateSensorReadings([sensor({ temperature: 23.34, humidity: 17.4 })]);
    expect(r).toEqual([
      {
        field: "temperature",
        label: "Temperature",
        value: "23.3",
        unit: "°C",
        icon: expect.anything(),
      },
      { field: "humidity", label: "Humidity", value: "17", unit: "%", icon: expect.anything() },
    ]);
  });

  it("converts temperature to Fahrenheit when the unit pref is set", () => {
    const r = aggregateSensorReadings(
      [sensor({ temperature: 23.34, humidity: 17.4 })],
      "fahrenheit",
    );
    expect(r).toEqual([
      {
        field: "temperature",
        label: "Temperature",
        value: "74.0",
        unit: "°F",
        icon: expect.anything(),
      },
      { field: "humidity", label: "Humidity", value: "17", unit: "%", icon: expect.anything() },
    ]);
  });

  it("averages each field across devices that report it", () => {
    const r = aggregateSensorReadings([
      sensor({ temperature: 20, humidity: 50 }, "a"),
      sensor({ temperature: 24, humidity: 60 }, "b"),
      sensor({ humidity: 70 }, "c"),
    ]);
    const map = Object.fromEntries(r.map((x) => [x.label, x.value]));
    expect(map["Temperature"]).toBe("22.0");
    expect(map["Humidity"]).toBe("60");
  });

  it("omits fields with no contributing sensors", () => {
    const r = aggregateSensorReadings([sensor({ temperature: 20 })]);
    const labels = r.map((x) => x.label);
    expect(labels).toEqual(["Temperature"]);
  });

  it("includes pressure and illuminance when present", () => {
    const r = aggregateSensorReadings([sensor({ pressure: 1013.25, illuminance: 320.6 })]);
    const map = Object.fromEntries(r.map((x) => [x.label, x.value]));
    expect(map["Pressure"]).toBe("1013");
    expect(map["Illuminance"]).toBe("321");
  });

  it("ignores battery readings (per-device, not a room-level metric)", () => {
    const r = aggregateSensorReadings([sensor({ battery: 87.4 })]);
    expect(r).toEqual([]);
  });

  it("renders a single contact as open or closed", () => {
    expect(
      aggregateSensorReadings([sensor({ contact: false })], "celsius", {
        includeGeneralContact: true,
      })[0],
    ).toMatchObject({
      field: "contact",
      label: "Contact",
      value: "Open",
    });
    expect(
      aggregateSensorReadings(
        [sensor({ contact: true }, "door", true, ContactRole.Door)],
        "celsius",
        { includeGeneralContact: true },
      )[0],
    ).toMatchObject({
      field: "contact",
      label: "Door",
      value: "Closed",
    });
  });

  it("uses an icon matching each contact role", () => {
    const readings = aggregateSensorReadings(
      [
        sensor({ contact: false }, "general", true, ContactRole.General),
        sensor({ contact: false }, "door", true, ContactRole.Door),
        sensor({ contact: false }, "window", true, ContactRole.Window),
      ],
      "celsius",
      { includeGeneralContact: true },
    );

    expect(readings.map((reading) => reading.icon)).toEqual([Magnet, DoorOpen, PanelTopOpen]);
  });

  it("excludes general contacts from collection readings", () => {
    expect(aggregateSensorReadings([sensor({ contact: false })])).toEqual([]);
  });

  it("summarizes contact collections without treating unknown devices as closed", () => {
    const open = aggregateSensorReadings([
      sensor({ contact: true }, "closed", true, ContactRole.Door),
      sensor({ contact: false }, "open", true, ContactRole.Door),
      sensor({ contact: true }, "offline", false, ContactRole.Door),
    ])[0];
    expect(open.value).toBe("1 of 3 doors open, 1 unknown");

    const incomplete = aggregateSensorReadings([
      sensor({ contact: true }, "closed", true, ContactRole.Door),
      sensor({ contact: true }, "offline", false, ContactRole.Door),
    ])[0];
    expect(incomplete.value).toBe("0 of 2 doors open, 1 unknown");

    const allClosed = aggregateSensorReadings([
      sensor({ contact: true }, "a", true, ContactRole.Door),
      sensor({ contact: true }, "b", true, ContactRole.Door),
    ])[0];
    expect(allClosed.value).toBe("0 of 2 doors open");
  });
});
