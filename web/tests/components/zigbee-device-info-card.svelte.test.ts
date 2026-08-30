import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mount, unmount } from "svelte";
import ZigbeeDeviceInfoCard from "$lib/components/zigbee-device-info-card.svelte";
import ZigbeeDetailsCard from "$lib/components/zigbee-details-card.svelte";
import type { Device, Zigbee2MqttDeviceMetadata } from "$lib/gql/graphql";

vi.mock("$lib/stores/me.svelte", () => ({
  me: { user: { timeFormat: "24h" } },
}));

let component: ReturnType<typeof mount> | null = null;
let host: HTMLDivElement;

beforeEach(() => {
  host = document.createElement("div");
  document.body.appendChild(host);
});

afterEach(async () => {
  if (component) await unmount(component);
  component = null;
  host.remove();
  vi.restoreAllMocks();
});

describe("ZigbeeDeviceInfoCard", () => {
  it("reserves the image column while Zigbee metadata loads", () => {
    const device: Device = {
      id: "0x123",
      name: "Hallway switch",
      friendlyName: "Hallway switch",
      source: "zigbee2mqtt",
      type: "button",
      available: true,
      disabled: false,
      deleted: false,
      seen: true,
      roles: {},
      capabilities: [],
      configuration: [],
      state: {},
    };

    component = mount(ZigbeeDeviceInfoCard, {
      target: host,
      props: { device },
    });

    expect(host.querySelector('[data-image-column="true"]')).not.toBeNull();
  });

  it("renders compact device status", () => {
    const device: Device = {
      id: "0x123",
      name: "Hallway switch",
      friendlyName: "Hallway switch",
      source: "zigbee2mqtt",
      type: "button",
      available: true,
      disabled: false,
      deleted: false,
      seen: true,
      roles: {},
      capabilities: [],
      configuration: [],
      state: { battery: 92, linkQuality: 180 },
    };
    const metadata: Zigbee2MqttDeviceMetadata = {
      imageCandidate: false,
      endpoints: [],
      groups: [],
      ota: {},
    };

    component = mount(ZigbeeDeviceInfoCard, {
      target: host,
      props: { device, metadata },
    });

    expect(host.textContent).toContain("92%");
    expect(host.textContent).not.toContain("Update");
  });

  it("renders normalized Zigbee status labels", () => {
    const device: Device = {
      id: "0x123",
      name: null,
      friendlyName: "Bedroom sensor",
      source: "zigbee2mqtt",
      type: "sensor",
      available: true,
      disabled: false,
      deleted: false,
      seen: true,
      roles: {},
      capabilities: [],
      configuration: [],
      state: { battery: 100 },
    };
    const metadata: Zigbee2MqttDeviceMetadata = {
      imageCandidate: false,
      endpoints: [],
      groups: [],
      supported: true,
      interviewState: "SUCCESSFUL",
      definition: { supportsOta: true },
      ota: { installedVersion: "-1" },
    };

    component = mount(ZigbeeDetailsCard, {
      target: host,
      props: { device, metadata },
    });

    expect(host.textContent).toContain("Zigbee");
    expect(host.textContent).toContain("Successful");
    expect(host.textContent).not.toContain("SUCCESSFUL");
    expect(host.textContent).toContain("Supported · Unknown version");
    expect(host.textContent).not.toContain("Supported · -1");
    expect(Array.from(host.querySelectorAll("dt"), (element) => element.textContent)).not.toContain(
      "Support",
    );
    expect(host.textContent).not.toContain("100%");
    expect(host.textContent).toContain("Details");
  });

  it("identifies unsupported Zigbee devices", () => {
    const device: Device = {
      id: "0x123",
      name: null,
      friendlyName: "Unsupported device",
      source: "zigbee2mqtt",
      type: "unknown",
      available: true,
      disabled: false,
      deleted: false,
      seen: true,
      roles: {},
      capabilities: [],
      configuration: [],
      state: {},
    };
    const metadata: Zigbee2MqttDeviceMetadata = {
      imageCandidate: false,
      endpoints: [],
      groups: [],
      supported: false,
      ota: {},
    };

    component = mount(ZigbeeDetailsCard, {
      target: host,
      props: { device, metadata },
    });

    expect(host.textContent).toContain("Support");
    expect(host.textContent).toContain("Unsupported");
  });

  it("renders battery type as plain text below the power source", () => {
    const device: Device = {
      id: "0x123",
      name: null,
      friendlyName: "Bedroom sensor",
      source: "zigbee2mqtt",
      type: "sensor",
      available: true,
      disabled: false,
      deleted: false,
      seen: true,
      roles: {},
      capabilities: [],
      configuration: [],
      state: {},
    };
    const metadata: Zigbee2MqttDeviceMetadata = {
      imageCandidate: false,
      powerSource: "Battery",
      endpoints: [],
      groups: [],
      ota: {},
    };

    component = mount(ZigbeeDetailsCard, {
      target: host,
      props: { device, metadata, batteryType: "CR2477" },
    });

    const labels = Array.from(host.querySelectorAll("dt"));
    const powerSource = labels.find((label) => label.textContent === "Power source");
    const batteryType = labels.find((label) => label.textContent === "Battery type");
    expect(powerSource).not.toBeUndefined();
    expect(batteryType).not.toBeUndefined();
    expect(labels.indexOf(batteryType!)).toBe(labels.indexOf(powerSource!) + 1);
    const value = batteryType?.parentElement?.querySelector("dd");
    expect(value?.textContent).toBe("CR2477");
    expect(value?.childElementCount).toBe(0);
  });

  it("omits battery type when documentation has no confident value", () => {
    const device: Device = {
      id: "0x123",
      name: null,
      friendlyName: "Bedroom sensor",
      source: "zigbee2mqtt",
      type: "sensor",
      available: true,
      disabled: false,
      deleted: false,
      seen: true,
      roles: {},
      capabilities: [],
      configuration: [],
      state: {},
    };
    const metadata: Zigbee2MqttDeviceMetadata = {
      imageCandidate: false,
      powerSource: "Battery",
      endpoints: [],
      groups: [],
      ota: {},
    };

    component = mount(ZigbeeDetailsCard, {
      target: host,
      props: { device, metadata, batteryType: null },
    });

    expect(host.textContent).not.toContain("Battery type");
  });

  it("renders coordinator bridge diagnostics", () => {
    const device: Device = {
      id: "0x00124b0000000000",
      name: null,
      friendlyName: "Coordinator",
      source: "zigbee2mqtt",
      type: "hub",
      available: true,
      disabled: false,
      deleted: false,
      seen: true,
      roles: {},
      capabilities: [],
      configuration: [],
      state: {},
    };
    const metadata: Zigbee2MqttDeviceMetadata = {
      imageCandidate: false,
      endpoints: [],
      groups: [],
      ota: {},
      bridgeInfo: {
        adapterType: "ZStack3x0",
        firmwareVersion: "20240710",
        channel: 20,
        panId: 6754,
        extendedPanId: "0x00124b000000abcd",
        zigbee2MqttVersion: "2.7.2",
        zigbee2MqttCommit: "unknown",
        zigbeeHerdsmanVersion: "6.1.4",
        zigbeeHerdsmanConvertersVersion: "25.30.0",
      },
    };

    component = mount(ZigbeeDetailsCard, {
      target: host,
      props: { device, metadata },
    });

    expect(host.textContent).toContain("Coordinator");
    expect(host.textContent).toContain("ZStack3x0");
    expect(host.textContent).toContain("0x1A62 · 6754");
    expect(host.textContent).toContain("0x00124b000000abcd");
    expect(host.textContent).toContain("zigbee-herdsman");
    expect(Array.from(host.querySelectorAll("dt"), (element) => element.textContent)).not.toContain(
      "Commit",
    );
    expect(host.textContent).not.toContain("unknown");
  });
});
