import { describe, it, expect } from "vitest";
import { gql } from "@urql/core";
import { pipe, subscribe } from "wonka";
import {
  getContext,
  getBridgeDevicesFixture,
  publishDeviceState,
  getLightStateFixture,
} from "./setup.js";

const DEVICES_QUERY = gql`
  query Devices {
    devices {
      id
      name
      source
      type
      available
      state {
        ... on LightState {
          on
          brightness
          colorTemp
        }
        ... on SensorState {
          temperature
          humidity
          battery
        }
        ... on SwitchState {
          action
        }
      }
    }
  }
`;

const DEVICE_QUERY = gql`
  query Device($id: ID!) {
    device(id: $id) {
      id
      name
      source
      type
      available
      state {
        ... on LightState {
          on
          brightness
          colorTemp
        }
        ... on SensorState {
          temperature
          humidity
          battery
        }
        ... on SwitchState {
          action
        }
      }
    }
  }
`;

interface BridgeDevice {
  friendly_name: string;
  type: string;
}

interface DeviceFields {
  id: string;
  name: string;
  source: string;
  type: string;
  available: boolean;
  state: {
    on?: boolean;
    brightness?: number;
    colorTemp?: number;
    temperature?: number;
    humidity?: number;
    battery?: number;
    action?: string;
  } | null;
}

interface DevicesQueryResult {
  devices: DeviceFields[];
}

interface DeviceQueryResult {
  device: DeviceFields | null;
}

const COORDINATOR_TYPE = "Coordinator";

describe("devices", () => {
  it("should return all non-coordinator devices", async () => {
    const { graphqlClient } = getContext();
    const fixtures = getBridgeDevicesFixture() as BridgeDevice[];
    const expectedCount = fixtures.filter(
      (d) => d.type !== COORDINATOR_TYPE,
    ).length;

    const result = await graphqlClient
      .query<DevicesQueryResult>(DEVICES_QUERY, {})
      .toPromise();

    expect(result.error).toBeUndefined();
    expect(result.data).toBeDefined();
    expect(result.data!.devices).toHaveLength(expectedCount);
  });

  it("should have correct device fields matching fixtures", async () => {
    const { graphqlClient } = getContext();
    const fixtures = getBridgeDevicesFixture() as BridgeDevice[];

    const result = await graphqlClient
      .query<DevicesQueryResult>(DEVICES_QUERY, {})
      .toPromise();

    expect(result.data).toBeDefined();

    const deviceNames = result.data!.devices.map((d) => d.name);
    for (const fixture of fixtures) {
      if (fixture.type === COORDINATOR_TYPE) continue;
      expect(deviceNames).toContain(fixture.friendly_name);
    }

    for (const device of result.data!.devices) {
      expect(device.id).toBeTruthy();
      expect(device.name).toBeTruthy();
      expect(device.source).toBe("zigbee");
      expect(typeof device.available).toBe("boolean");
    }
  });

  it("should query a single device by ID", async () => {
    const { graphqlClient } = getContext();

    const listResult = await graphqlClient
      .query<DevicesQueryResult>(DEVICES_QUERY, {})
      .toPromise();

    expect(listResult.data).toBeDefined();
    const firstDevice = listResult.data!.devices[0];

    const result = await graphqlClient
      .query<DeviceQueryResult>(DEVICE_QUERY, { id: firstDevice.id })
      .toPromise();

    expect(result.error).toBeUndefined();
    expect(result.data).toBeDefined();
    expect(result.data!.device).toBeDefined();
    expect(result.data!.device!.id).toBe(firstDevice.id);
    expect(result.data!.device!.name).toBe(firstDevice.name);
  });

  it("should reflect state changes after MQTT publish", async () => {
    const { graphqlClient } = getContext();
    const lightState = getLightStateFixture();

    await publishDeviceState("Living Room Light", lightState);
    await new Promise((r) => setTimeout(r, 1000));

    const result = await graphqlClient
      .query<DevicesQueryResult>(DEVICES_QUERY, {})
      .toPromise();

    expect(result.data).toBeDefined();
    const light = result.data!.devices.find(
      (d) => d.name === "Living Room Light",
    );
    expect(light).toBeDefined();
    expect(light!.state).toBeDefined();
  });

  it("should deliver state changes via subscription", async () => {
    const { graphqlClient } = getContext();

    const SUBSCRIPTION = gql`
      subscription DeviceStateChanged {
        deviceStateChanged {
          deviceId
          state {
            ... on LightState {
              on
              brightness
              colorTemp
            }
          }
        }
      }
    `;

    interface StateChangedEvent {
      deviceStateChanged: {
        deviceId: string;
        state: {
          on?: boolean;
          brightness?: number;
          colorTemp?: number;
        };
      };
    }

    const received = new Promise<StateChangedEvent>((resolve, reject) => {
      const timeout = setTimeout(
        () => reject(new Error("Subscription timed out")),
        10_000,
      );

      const { unsubscribe } = pipe(
        graphqlClient.subscription<StateChangedEvent>(SUBSCRIPTION, {}),
        subscribe((result) => {
          if (result.data) {
            clearTimeout(timeout);
            unsubscribe();
            resolve(result.data);
          }
        }),
      );
    });

    await new Promise((r) => setTimeout(r, 500));
    await publishDeviceState("Living Room Light", {
      state: "ON",
      brightness: 150,
      color_temp: 300,
    });

    const event = await received;
    expect(event.deviceStateChanged).toBeDefined();
    expect(event.deviceStateChanged.deviceId).toBeTruthy();
  });
});
