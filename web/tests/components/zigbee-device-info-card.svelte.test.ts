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

afterEach(() => {
  if (component) void unmount(component);
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
    expect(host.textContent).not.toContain("100%");
    expect(host.textContent).toContain("Details");
  });
});
