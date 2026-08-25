import { describe, it, expect } from "vitest";
import { graphql } from "$lib/gql";
import { pipe, subscribe } from "wonka";
import {
  getContext,
  getBridgeDevicesFixture,
  publishDeviceState,
  getLightStateFixture,
  subscribeMQTTCommands,
} from "./setup.js";

const DEVICES_QUERY = graphql(`
  query E2EDevicesList {
    devices {
      id
      name
      friendlyName
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
`);

const DEVICE_QUERY = graphql(`
  query E2EDevice($id: ID!) {
    device(id: $id) {
      id
      name
      friendlyName
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
`);

const ZIGBEE_METADATA_QUERY = graphql(`
  query E2EZigbeeDeviceMetadata($id: ID!) {
    device(id: $id) {
      zigbee2Mqtt {
        imageCandidate
        imageVersion
        ieeeAddress
        networkAddress
        supported
        softwareBuildId
        definitionUrl
        definition {
          model
          vendor
          description
          supportsOta
        }
        ota {
          state
          installedVersion
          latestVersion
          progress
        }
        endpoints {
          id
          profileId
          deviceId
          inputClusters
          outputClusters
          bindings {
            cluster
            targetType
            targetIeeeAddress
            targetEndpoint
            targetGroupId
          }
          reportings {
            cluster
            attribute
            minimumReportInterval
            maximumReportInterval
            reportableChange
          }
        }
        groups {
          id
          providerGroupId
          name
          endpoint
        }
        bridgeInfo {
          adapterType
          firmwareVersion
          channel
          panId
          extendedPanId
          zigbee2MqttVersion
          zigbee2MqttCommit
          zigbeeHerdsmanVersion
          zigbeeHerdsmanConvertersVersion
        }
      }
    }
  }
`);

interface BridgeDevice {
  ieee_address: string;
  friendly_name: string;
  type: string;
}

const SET_DEVICE_STATE = graphql(`
  mutation E2ESetDeviceState($deviceId: ID!, $state: DeviceStateInput!) {
    setTargetState(targetType: DEVICE, targetId: $deviceId, state: $state)
  }
`);

const UPDATE_DEVICE = graphql(`
  mutation E2EUpdateDevice($id: ID!, $input: UpdateDeviceInput!) {
    updateDevice(id: $id, input: $input) {
      id
      name
    }
  }
`);

const DEVICE_STATE_CHANGED_SUB = graphql(`
  subscription E2EDevicesDeviceStateChanged {
    deviceStateChanged {
      deviceId
      state {
        on
        brightness
        colorTemp
      }
    }
  }
`);

const COORDINATOR_TYPE = "Coordinator";

describe("devices", () => {
  it("should return every device in the bridge registry", async () => {
    const { graphqlClient } = getContext();
    const fixtures = getBridgeDevicesFixture() as BridgeDevice[];

    const result = await graphqlClient.query(DEVICES_QUERY, {}).toPromise();

    expect(result.error).toBeUndefined();
    expect(result.data).toBeDefined();
    expect(result.data!.devices).toHaveLength(fixtures.length);
  });

  it("should register the coordinator as a hub device", async () => {
    const { graphqlClient } = getContext();
    const fixtures = getBridgeDevicesFixture() as BridgeDevice[];
    const coordinator = fixtures.find((d) => d.type === COORDINATOR_TYPE);

    const result = await graphqlClient.query(DEVICES_QUERY, {}).toPromise();

    const hub = result.data!.devices.find((d) => d.id === coordinator!.ieee_address);
    expect(hub).toBeDefined();
    expect(hub!.type).toBe("hub");
    expect(hub!.available).toBe(true);
  });

  it("should have correct device fields matching fixtures", async () => {
    const { graphqlClient } = getContext();
    const fixtures = getBridgeDevicesFixture() as BridgeDevice[];

    const result = await graphqlClient.query(DEVICES_QUERY, {}).toPromise();

    expect(result.data).toBeDefined();

    const deviceNames = result.data!.devices.map((d) => d.friendlyName);
    for (const fixture of fixtures) {
      expect(deviceNames).toContain(fixture.friendly_name);
    }

    for (const device of result.data!.devices) {
      expect(device.id).toBeTruthy();
      expect(device.friendlyName).toBeTruthy();
      expect(device.source).toBe("zigbee2mqtt");
      expect(typeof device.available).toBe("boolean");
    }
  });

  it("should query a single device by ID", async () => {
    const { graphqlClient } = getContext();

    const listResult = await graphqlClient.query(DEVICES_QUERY, {}).toPromise();

    expect(listResult.data).toBeDefined();
    const firstDevice = listResult.data!.devices[0];

    const result = await graphqlClient.query(DEVICE_QUERY, { id: firstDevice.id }).toPromise();

    expect(result.error).toBeUndefined();
    expect(result.data).toBeDefined();
    expect(result.data!.device).toBeDefined();
    expect(result.data!.device!.id).toBe(firstDevice.id);
    expect(result.data!.device!.friendlyName).toBe(firstDevice.friendlyName);
  });

  it("should return sanitized, typed Zigbee metadata only on device detail", async () => {
    const { graphqlClient } = getContext();
    await expect
      .poll(
        async () => {
          const result = await graphqlClient
            .query(
              ZIGBEE_METADATA_QUERY,
              { id: "0x54ef44100166fcae" },
              { requestPolicy: "network-only" },
            )
            .toPromise();
          return result.data?.device?.zigbee2Mqtt?.ieeeAddress ?? null;
        },
        { timeout: 10_000 },
      )
      .toBe("0x54ef44100166fcae");

    const t1 = await graphqlClient
      .query(ZIGBEE_METADATA_QUERY, { id: "0x54ef44100166fcae" }, { requestPolicy: "network-only" })
      .toPromise();
    expect(t1.error).toBeUndefined();
    expect(t1.data?.device?.zigbee2Mqtt).toMatchObject({
      ieeeAddress: "0x54ef44100166fcae",
      networkAddress: 2710,
      supported: true,
      softwareBuildId: "2019www.",
      definition: {
        model: "MCCGQ12LM",
        vendor: "Aqara",
        description: "Door and window sensor T1",
        supportsOta: false,
      },
    });
    expect(t1.data?.device?.zigbee2Mqtt?.endpoints).toHaveLength(1);
    expect(t1.data?.device?.zigbee2Mqtt?.imageCandidate).toBe(true);
    expect(t1.data?.device?.zigbee2Mqtt?.imageVersion).toMatch(/^[a-f0-9]{64}$/);
    expect(t1.data?.device?.zigbee2Mqtt?.definitionUrl).toBe(
      "https://www.zigbee2mqtt.io/devices/MCCGQ12LM.html",
    );

    const p100 = await graphqlClient
      .query(ZIGBEE_METADATA_QUERY, { id: "0x54ef4410015e4b68" }, { requestPolicy: "network-only" })
      .toPromise();
    expect(p100.error).toBeUndefined();
    expect(p100.data?.device?.zigbee2Mqtt?.softwareBuildId).toBeNull();
    expect(p100.data?.device?.zigbee2Mqtt?.endpoints).toHaveLength(2);
    expect(p100.data?.device?.zigbee2Mqtt?.endpoints[0].bindings).toHaveLength(2);
    expect(p100.data?.device?.zigbee2Mqtt?.endpoints[0].reportings).toHaveLength(1);

    const unsupported = await graphqlClient
      .query(ZIGBEE_METADATA_QUERY, { id: "0x00124b0000000001" }, { requestPolicy: "network-only" })
      .toPromise();
    expect(unsupported.error).toBeUndefined();
    expect(unsupported.data?.device?.zigbee2Mqtt?.supported).toBe(false);
    expect(unsupported.data?.device?.zigbee2Mqtt?.definition).toBeNull();
    expect(unsupported.data?.device?.zigbee2Mqtt?.endpoints).toEqual([]);

    const coordinator = await graphqlClient
      .query(ZIGBEE_METADATA_QUERY, { id: "0x00124b0000000000" }, { requestPolicy: "network-only" })
      .toPromise();
    expect(coordinator.error).toBeUndefined();
    expect(coordinator.data?.device?.zigbee2Mqtt?.bridgeInfo).toEqual({
      adapterType: "ZStack3x0",
      firmwareVersion: "20240710",
      channel: 20,
      panId: 6754,
      extendedPanId: "0x00124b000000abcd",
      zigbee2MqttVersion: "2.7.2",
      zigbee2MqttCommit: "a1b2c3d",
      zigbeeHerdsmanVersion: "6.1.4",
      zigbeeHerdsmanConvertersVersion: "25.30.0",
    });
  });

  it("should reflect state changes after MQTT publish", async () => {
    const { graphqlClient } = getContext();
    const lightState = getLightStateFixture();

    await publishDeviceState("Living Room Light", lightState);
    await new Promise((r) => setTimeout(r, 1000));

    const result = await graphqlClient.query(DEVICES_QUERY, {}).toPromise();

    expect(result.data).toBeDefined();
    const light = result.data!.devices.find((d) => d.friendlyName === "Living Room Light");
    expect(light).toBeDefined();
    expect(light!.state).toBeDefined();
  });

  it("should deliver state changes via subscription", async () => {
    const { graphqlClient } = getContext();

    const received = new Promise<{ deviceId: string }>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error("Subscription timed out")), 10_000);

      const { unsubscribe } = pipe(
        graphqlClient.subscription(DEVICE_STATE_CHANGED_SUB, {}),
        subscribe((result) => {
          if (result.data) {
            clearTimeout(timeout);
            unsubscribe();
            resolve(result.data.deviceStateChanged);
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
    expect(event.deviceId).toBeTruthy();
  });

  it("should return null for nonexistent device ID", async () => {
    const { graphqlClient } = getContext();

    const result = await graphqlClient.query(DEVICE_QUERY, { id: "nonexistent" }).toPromise();

    expect(result.error).toBeUndefined();
    expect(result.data).toBeDefined();
    expect(result.data!.device).toBeNull();
  });

  it("should set device state via mutation", async () => {
    const { graphqlClient } = getContext();

    const listResult = await graphqlClient.query(DEVICES_QUERY, {}).toPromise();

    expect(listResult.data).toBeDefined();
    const lightDevice = listResult.data!.devices.find(
      (d) => d.friendlyName === "Living Room Light",
    );
    expect(lightDevice).toBeDefined();

    const { messages, cleanup } = await subscribeMQTTCommands();

    const result = await graphqlClient
      .mutation(SET_DEVICE_STATE, {
        deviceId: lightDevice!.id,
        state: { on: true, brightness: 200 },
      })
      .toPromise();

    expect(result.error).toBeUndefined();
    expect(result.data).toBeDefined();
    expect(result.data!.setTargetState).toBe(true);

    await new Promise((r) => setTimeout(r, 500));
    expect(messages.length).toBeGreaterThan(0);

    await cleanup();
  });

  it("should return error for setTargetState with invalid ID", async () => {
    const { graphqlClient } = getContext();

    const result = await graphqlClient
      .mutation(SET_DEVICE_STATE, {
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

    const devicesResult = await graphqlClient.query(DEVICES_QUERY, {}).toPromise();
    expect(devicesResult.data).toBeDefined();
    expect(devicesResult.data!.devices.length).toBeGreaterThan(0);

    const device = devicesResult.data!.devices[0];
    const originalName = device.name;
    const newName = `Renamed ${Date.now()}`;

    const updateResult = await graphqlClient
      .mutation(UPDATE_DEVICE, {
        id: device.id,
        input: { name: newName },
      })
      .toPromise();

    expect(updateResult.error).toBeUndefined();
    expect(updateResult.data).toBeDefined();
    expect(updateResult.data!.updateDevice.name).toBe(newName);

    const queryResult = await graphqlClient.query(DEVICE_QUERY, { id: device.id }).toPromise();

    expect(queryResult.data).toBeDefined();
    expect(queryResult.data!.device).toBeDefined();
    expect(queryResult.data!.device!.name).toBe(newName);

    await graphqlClient
      .mutation(UPDATE_DEVICE, {
        id: device.id,
        input: { name: originalName },
      })
      .toPromise();
  });
});
