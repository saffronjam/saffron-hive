import { describe, it, expect } from "vitest";
import { gql } from "@urql/core";
import { pipe, subscribe } from "wonka";
import {
  getContext,
  publishDeviceState,
  publishAvailability,
  publishBridgeDevices,
  getBridgeDevicesFixture,
} from "./setup.js";

const DEVICE_STATE_CHANGED = gql`
  subscription DeviceStateChanged {
    deviceStateChanged {
      deviceId
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

const DEVICE_AVAILABILITY_CHANGED = gql`
  subscription DeviceAvailabilityChanged {
    deviceAvailabilityChanged {
      deviceId
      available
    }
  }
`;

interface LightStateFields {
  on?: boolean;
  brightness?: number;
  colorTemp?: number;
}

interface SensorStateFields {
  temperature?: number;
  humidity?: number;
  battery?: number;
}

interface SwitchStateFields {
  action?: string;
}

interface DeviceStateChangedEvent {
  deviceStateChanged: {
    deviceId: string;
    state: LightStateFields | SensorStateFields | SwitchStateFields;
  };
}

interface DeviceAvailabilityChangedEvent {
  deviceAvailabilityChanged: {
    deviceId: string;
    available: boolean;
  };
}

const DEVICE_ADDED = gql`
  subscription DeviceAdded {
    deviceAdded {
      id
      name
      type
      source
    }
  }
`;

const DEVICE_REMOVED = gql`
  subscription DeviceRemoved {
    deviceRemoved
  }
`;

const AUTOMATION_NODE_ACTIVATED = gql`
  subscription AutomationNodeActivated($automationId: ID) {
    automationNodeActivated(automationId: $automationId) {
      automationId
      nodeId
      active
    }
  }
`;

const DEVICE_STATE_CHANGED_FILTERED = gql`
  subscription DeviceStateChangedFiltered($deviceId: ID) {
    deviceStateChanged(deviceId: $deviceId) {
      deviceId
      state {
        ... on LightState {
          on
          brightness
        }
        ... on SensorState {
          temperature
          humidity
        }
      }
    }
  }
`;

interface DeviceAddedEvent {
  deviceAdded: {
    id: string;
    name: string;
    type: string;
    source: string;
  };
}

interface DeviceRemovedEvent {
  deviceRemoved: string;
}

interface AutomationNodeActivatedEvent {
  automationNodeActivated: {
    automationId: string;
    nodeId: string;
    active: boolean;
  };
}

interface BridgeDevice {
  ieee_address: string;
  friendly_name: string;
  type: string;
  supported: boolean;
  definition: {
    model: string;
    vendor: string;
    description: string;
  };
  features: Array<{
    type: string;
    name: string;
    property: string;
    features: unknown[];
  }>;
}

function subscribeAndWait<T>(
  graphqlClient: ReturnType<typeof getContext>["graphqlClient"],
  subscription: ReturnType<typeof gql>,
  timeoutMs: number,
  variables?: Record<string, unknown>,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timeout = setTimeout(
      () => reject(new Error("Subscription timed out")),
      timeoutMs,
    );

    const { unsubscribe } = pipe(
      graphqlClient.subscription<T>(subscription, variables ?? {}),
      subscribe((result) => {
        if (result.data) {
          clearTimeout(timeout);
          unsubscribe();
          resolve(result.data);
        }
        if (result.error) {
          clearTimeout(timeout);
          unsubscribe();
          reject(result.error);
        }
      }),
    );
  });
}

describe("subscriptions", () => {
  it("should receive deviceStateChanged events", async () => {
    const { graphqlClient } = getContext();

    const eventPromise = subscribeAndWait<DeviceStateChangedEvent>(
      graphqlClient,
      DEVICE_STATE_CHANGED,
      10_000,
    );

    await new Promise((r) => setTimeout(r, 500));
    await publishDeviceState("Living Room Light", {
      state: "ON",
      brightness: 180,
      color_temp: 320,
    });

    const event = await eventPromise;
    expect(event.deviceStateChanged).toBeDefined();
    expect(event.deviceStateChanged.deviceId).toBeTruthy();
    expect(event.deviceStateChanged.state).toBeDefined();
  });

  it("should receive deviceAvailabilityChanged events", async () => {
    const { graphqlClient } = getContext();

    const eventPromise = subscribeAndWait<DeviceAvailabilityChangedEvent>(
      graphqlClient,
      DEVICE_AVAILABILITY_CHANGED,
      10_000,
    );

    await new Promise((r) => setTimeout(r, 500));
    await publishAvailability("Living Room Light", false);

    const event = await eventPromise;
    expect(event.deviceAvailabilityChanged).toBeDefined();
    expect(event.deviceAvailabilityChanged.deviceId).toBeTruthy();
    expect(event.deviceAvailabilityChanged.available).toBe(false);
  });

  it("should handle multiple concurrent subscriptions", async () => {
    const { graphqlClient } = getContext();

    const statePromise = subscribeAndWait<DeviceStateChangedEvent>(
      graphqlClient,
      DEVICE_STATE_CHANGED,
      10_000,
    );

    const availabilityPromise =
      subscribeAndWait<DeviceAvailabilityChangedEvent>(
        graphqlClient,
        DEVICE_AVAILABILITY_CHANGED,
        10_000,
      );

    await new Promise((r) => setTimeout(r, 500));

    await publishDeviceState("Bedroom Light", {
      state: "ON",
      brightness: 100,
    });
    await publishAvailability("Bedroom Light", true);

    const [stateEvent, availabilityEvent] = await Promise.all([
      statePromise,
      availabilityPromise,
    ]);

    expect(stateEvent.deviceStateChanged).toBeDefined();
    expect(availabilityEvent.deviceAvailabilityChanged).toBeDefined();
  });

  it("should receive deviceAdded events", async () => {
    const { graphqlClient } = getContext();

    const eventPromise = subscribeAndWait<DeviceAddedEvent>(
      graphqlClient,
      DEVICE_ADDED,
      10_000,
    );

    await new Promise((r) => setTimeout(r, 500));

    const fixtures = getBridgeDevicesFixture() as BridgeDevice[];
    const newDevice: BridgeDevice = {
      ieee_address: "0x00158d0009a9b9c9",
      friendly_name: "New Test Light",
      type: "Router",
      supported: true,
      definition: {
        model: "LED1545G12",
        vendor: "IKEA",
        description: "Test light",
      },
      features: [
        {
          type: "light",
          name: "light",
          property: "light",
          features: [
            { type: "binary", name: "state", property: "state", features: [] },
            {
              type: "numeric",
              name: "brightness",
              property: "brightness",
              features: [],
            },
          ],
        },
      ],
    };
    await publishBridgeDevices([...fixtures, newDevice]);

    const event = await eventPromise;
    expect(event.deviceAdded).toBeDefined();
    expect(event.deviceAdded.name).toBe("New Test Light");
    expect(event.deviceAdded.source).toBe("zigbee");

    await publishBridgeDevices(fixtures);
    await new Promise((r) => setTimeout(r, 1000));
  });

  it("should receive deviceRemoved events", async () => {
    const { graphqlClient } = getContext();

    const fixtures = getBridgeDevicesFixture() as BridgeDevice[];

    const eventPromise = subscribeAndWait<DeviceRemovedEvent>(
      graphqlClient,
      DEVICE_REMOVED,
      10_000,
    );

    await new Promise((r) => setTimeout(r, 500));

    const reducedDevices = fixtures.filter(
      (d) => d.friendly_name !== "Office Switch",
    );
    await publishBridgeDevices(reducedDevices);

    const event = await eventPromise;
    expect(event.deviceRemoved).toBeTruthy();

    await publishBridgeDevices(fixtures);
    await new Promise((r) => setTimeout(r, 1000));
  });

  it.skip("should receive automationNodeActivated events", async () => {
    const { graphqlClient } = getContext();

    const DEVICES_QUERY = gql`
      query Devices {
        devices {
          id
          name
          type
        }
      }
    `;
    interface DevicesResult {
      devices: Array<{ id: string; name: string; type: string }>;
    }

    const devicesResult = await graphqlClient
      .query<DevicesResult>(DEVICES_QUERY, {})
      .toPromise();
    expect(devicesResult.data).toBeDefined();

    const sensor = devicesResult.data!.devices.find(
      (d) => d.type === "sensor",
    );
    expect(sensor).toBeDefined();
    const light = devicesResult.data!.devices.find(
      (d) => d.type === "light",
    );
    expect(light).toBeDefined();

    const CREATE_AUTOMATION = gql`
      mutation CreateAutomation($input: CreateAutomationInput!) {
        createAutomation(input: $input) {
          id
          name
          nodes {
            id
            type
          }
        }
      }
    `;
    interface CreateAutomationResult {
      createAutomation: {
        id: string;
        name: string;
        nodes: Array<{ id: string; type: string }>;
      };
    }

    const triggerConfig = JSON.stringify({
      deviceId: sensor!.id,
      field: "temperature",
      operator: ">",
      value: 20,
    });
    const actionConfig = JSON.stringify({
      type: "set_device_state",
      targetType: "device",
      targetId: light!.id,
      payload: { on: true },
    });

    const automation = await graphqlClient
      .mutation<CreateAutomationResult>(CREATE_AUTOMATION, {
        input: {
          name: "Node Activation Test",
          enabled: true,
          cooldownSeconds: 5,
          nodes: [
            { id: "trigger-1", type: "trigger", config: triggerConfig },
            { id: "action-1", type: "action", config: actionConfig },
          ],
          edges: [{ fromNodeId: "trigger-1", toNodeId: "action-1" }],
        },
      })
      .toPromise();
    expect(automation.data).toBeDefined();
    const automationId = automation.data!.createAutomation.id;

    const eventPromise = subscribeAndWait<AutomationNodeActivatedEvent>(
      graphqlClient,
      AUTOMATION_NODE_ACTIVATED,
      10_000,
      { automationId },
    );

    await new Promise((r) => setTimeout(r, 500));

    await publishDeviceState(sensor!.name, {
      temperature: 30,
      humidity: 50,
    });

    const event = await eventPromise;
    expect(event.automationNodeActivated).toBeDefined();
    expect(event.automationNodeActivated.automationId).toBe(automationId);

    const DELETE_AUTOMATION = gql`
      mutation DeleteAutomation($id: ID!) {
        deleteAutomation(id: $id)
      }
    `;
    await graphqlClient
      .mutation<{ deleteAutomation: boolean }>(DELETE_AUTOMATION, {
        id: automationId,
      })
      .toPromise();
  });

  it("should filter deviceStateChanged by deviceId", async () => {
    const { graphqlClient } = getContext();

    const DEVICES_QUERY = gql`
      query Devices {
        devices {
          id
          name
          type
        }
      }
    `;
    interface DevicesResult {
      devices: Array<{ id: string; name: string; type: string }>;
    }

    const devicesResult = await graphqlClient
      .query<DevicesResult>(DEVICES_QUERY, {})
      .toPromise();
    expect(devicesResult.data).toBeDefined();

    const lights = devicesResult.data!.devices.filter(
      (d) => d.type === "light",
    );
    expect(lights.length).toBeGreaterThanOrEqual(2);

    const targetLight = lights.find((l) => l.name === "Living Room Light")!;
    const _otherLight = lights.find((l) => l.name === "Bedroom Light")!;

    const received: DeviceStateChangedEvent[] = [];

    const eventPromise = new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => resolve(), 3000);

      const { unsubscribe } = pipe(
        graphqlClient.subscription<DeviceStateChangedEvent>(
          DEVICE_STATE_CHANGED_FILTERED,
          { deviceId: targetLight.id },
        ),
        subscribe((result) => {
          if (result.data) {
            received.push(result.data);
          }
          if (result.error) {
            clearTimeout(timeout);
            unsubscribe();
            reject(result.error);
          }
        }),
      );

      setTimeout(() => {
        clearTimeout(timeout);
        unsubscribe();
        resolve();
      }, 3000);
    });

    await new Promise((r) => setTimeout(r, 500));

    await publishDeviceState("Bedroom Light", {
      state: "ON",
      brightness: 50,
    });

    await new Promise((r) => setTimeout(r, 500));

    await publishDeviceState("Living Room Light", {
      state: "ON",
      brightness: 200,
      color_temp: 350,
    });

    await eventPromise;

    expect(received.length).toBeGreaterThanOrEqual(1);
    for (const event of received) {
      expect(event.deviceStateChanged.deviceId).toBe(targetLight.id);
    }
  });
});
