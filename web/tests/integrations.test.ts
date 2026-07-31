import { describe, it, expect } from "vitest";
import { integrationMeta } from "$lib/integrations";

describe("integrationMeta", () => {
  it("describes zigbee2mqtt and keeps its devices on delete", () => {
    const meta = integrationMeta("zigbee2mqtt");
    expect(meta.description).toBe("Zigbee devices via an MQTT bridge");
    expect(meta.keepsDevices).toBe(true);
    expect(meta.icon).toBeDefined();
  });

  it("describes tuya and purges its devices on delete", () => {
    const meta = integrationMeta("tuya");
    expect(meta.description).toBe("Cloud API device adapter");
    expect(meta.keepsDevices).toBe(false);
    expect(meta.icon).toBeDefined();
  });

  it("gives each known provider its own icon", () => {
    expect(integrationMeta("zigbee2mqtt").icon).not.toBe(integrationMeta("tuya").icon);
  });

  // An unknown provider must not inherit another vendor's logo or description.
  it("falls back for an unknown provider", () => {
    const meta = integrationMeta("shelly");
    expect(meta.description).toBe("Device adapter");
    expect(meta.keepsDevices).toBe(false);
    expect(meta.icon).not.toBe(integrationMeta("tuya").icon);
    expect(meta.icon).not.toBe(integrationMeta("zigbee2mqtt").icon);
  });

  it("falls back for an empty provider id", () => {
    expect(integrationMeta("").description).toBe("Device adapter");
  });
});
