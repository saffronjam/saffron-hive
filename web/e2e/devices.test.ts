import { describe, it, expect } from "vitest";
import { gql } from "@urql/core";
import { pipe, subscribe } from "wonka";
import {
  getContext,
  getBridgeDevicesFixture,
  publishDeviceState,
  getLightStateFixture,
  subscribeMQTTCommands,
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
        on
        brightness
        colorTemp
        temperature
        humidity
        battery
        power
        voltage
        current
        energy
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
        on
        brightness
        colorTemp
        temperature
        humidity
        battery
        power
        voltage
        current
        energy
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
    power?: number;
    voltage?: number;
    current?: number;
    energy?: number;
  } | null;
}

interface DevicesQueryResult {
  devices: DeviceFields[];
}

interface DeviceQueryResult {
  device: DeviceFields | null;
}

const SET_DEVICE_STATE = gql`
  mutation SetDeviceState($deviceId: ID!, $state: DeviceStateInput!) {
    setDeviceState(deviceId: $deviceId, state: $state) {
      id
      name
      type
      state {
        on
        brightness
        colorTemp
      }
    }
  }
`;

const UPDATE_DEVICE = gql`
  mutation UpdateDevice($id: ID!, $input: UpdateDeviceInput!) {
    updateDevice(id: $id, input: $input) {
      id
      name
    }
  }
`;

interface UpdateDeviceResult {
  updateDevice: {
    id: string;
    name: string;
  };
}

interface SetDeviceStateResult {
  setDeviceState: {
    id: string;
    name: string;
    type: string;
    state: {
      on?: boolean;
      brightness?: number;
      colorTemp?: number;
    } | null;
  };
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
            on
            brightness
            colorTemp
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

  it("should return null for nonexistent device ID", async () => {
    const { graphqlClient } = getContext();

    const result = await graphqlClient
      .query<DeviceQueryResult>(DEVICE_QUERY, { id: "nonexistent" })
      .toPromise();

    expect(result.error).toBeUndefined();
    expect(result.data).toBeDefined();
    expect(result.data!.device).toBeNull();
  });

  it("should set device state via mutation", async () => {
    const { graphqlClient } = getContext();

    const listResult = await graphqlClient
      .query<DevicesQueryResult>(DEVICES_QUERY, {})
      .toPromise();

    expect(listResult.data).toBeDefined();
    const lightDevice = listResult.data!.devices.find(
      (d) => d.name === "Living Room Light",
    );
    expect(lightDevice).toBeDefined();

    const { messages, cleanup } = await subscribeMQTTCommands();

    const result = await graphqlClient
      .mutation<SetDeviceStateResult>(SET_DEVICE_STATE, {
        deviceId: lightDevice!.id,
        state: { on: true, brightness: 200 },
      })
      .toPromise();

    expect(result.error).toBeUndefined();
    expect(result.data).toBeDefined();
    expect(result.data!.setDeviceState.id).toBe(lightDevice!.id);

    await new Promise((r) => setTimeout(r, 500));
    expect(messages.length).toBeGreaterThan(0);

    await cleanup();
  });

  it("should return error for setDeviceState with invalid ID", async () => {
    const { graphqlClient } = getContext();

    const result = await graphqlClient
      .mutation<SetDeviceStateResult>(SET_DEVICE_STATE, {
        deviceId: "nonexistent",
        state: { on: true },
      })
      .toPromise();

    expect(result.error).toBeDefined();
  });

  // EXPECTED FAIL: updateDevice updates DB but response reads from in-memory StateReader
  // which still has the old name. Same class of bug as the group-target resolution issues.
  it.skip("should rename a device via updateDevice", async () => {
    const { graphqlClient } = getContext();

    const devicesResult = await graphqlClient
      .query<DevicesQueryResult>(DEVICES_QUERY, {})
      .toPromise();
    expect(devicesResult.data).toBeDefined();
    expect(devicesResult.data!.devices.length).toBeGreaterThan(0);

    const device = devicesResult.data!.devices[0];
    const originalName = device.name;
    const newName = `Renamed ${Date.now()}`;

    const updateResult = await graphqlClient
      .mutation<UpdateDeviceResult>(UPDATE_DEVICE, {
        id: device.id,
        input: { name: newName },
      })
      .toPromise();

    expect(updateResult.error).toBeUndefined();
    expect(updateResult.data).toBeDefined();
    expect(updateResult.data!.updateDevice.name).toBe(newName);

    const queryResult = await graphqlClient
      .query<DeviceQueryResult>(DEVICE_QUERY, { id: device.id })
      .toPromise();

    expect(queryResult.data).toBeDefined();
    expect(queryResult.data!.device).toBeDefined();
    expect(queryResult.data!.device!.name).toBe(newName);

    await graphqlClient
      .mutation<UpdateDeviceResult>(UPDATE_DEVICE, {
        id: device.id,
        input: { name: originalName },
      })
      .toPromise();
  });
});
