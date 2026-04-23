import { describe, it, expect } from "vitest";
import { graphql } from "$lib/gql";
import { pipe, subscribe } from "wonka";
import type { ResultOf, TypedDocumentNode } from "@graphql-typed-document-node/core";
import type { AnyVariables, Client } from "@urql/core";
import {
  getContext,
  publishDeviceState,
  publishAvailability,
  publishBridgeDevices,
  getBridgeDevicesFixture,
} from "./setup.js";

const DEVICE_STATE_CHANGED = graphql(`
  subscription E2EDeviceStateChanged {
    deviceStateChanged {
      deviceId
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

const DEVICE_AVAILABILITY_CHANGED = graphql(`
  subscription E2EDeviceAvailabilityChanged {
    deviceAvailabilityChanged {
      deviceId
      available
    }
  }
`);

const DEVICE_ADDED = graphql(`
  subscription E2EDeviceAdded {
    deviceAdded {
      id
      name
      type
      source
    }
  }
`);

const DEVICE_REMOVED = graphql(`
  subscription E2EDeviceRemoved {
    deviceRemoved
  }
`);

const AUTOMATION_NODE_ACTIVATED = graphql(`
  subscription E2EAutomationNodeActivated($automationId: ID) {
    automationNodeActivated(automationId: $automationId) {
      automationId
      nodeId
      active
    }
  }
`);

const DEVICE_STATE_CHANGED_FILTERED = graphql(`
  subscription E2EDeviceStateChangedFiltered($deviceId: ID) {
    deviceStateChanged(deviceId: $deviceId) {
      deviceId
      state {
        on
        brightness
        temperature
        humidity
      }
    }
  }
`);

const DEVICES_QUERY = graphql(`
  query E2ESubscriptionsDevices {
    devices {
      id
      name
      type
    }
  }
`);

const CREATE_AUTOMATION = graphql(`
  mutation E2ESubscriptionsCreateAutomation($input: CreateAutomationInput!) {
    createAutomation(input: $input) {
      id
      name
      nodes {
        id
        type
      }
    }
  }
`);

const DELETE_AUTOMATION = graphql(`
  mutation E2ESubscriptionsDeleteAutomation($id: ID!) {
    deleteAutomation(id: $id)
  }
`);

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

function subscribeAndWait<TData, TVars extends AnyVariables>(
  graphqlClient: Client,
  subscription: TypedDocumentNode<TData, TVars>,
  timeoutMs: number,
  variables: TVars,
): Promise<TData> {
  return new Promise<TData>((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("Subscription timed out")), timeoutMs);

    const { unsubscribe } = pipe(
      graphqlClient.subscription(subscription, variables),
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

    const eventPromise = subscribeAndWait(graphqlClient, DEVICE_STATE_CHANGED, 10_000, {});

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

    const eventPromise = subscribeAndWait(graphqlClient, DEVICE_AVAILABILITY_CHANGED, 10_000, {});

    await new Promise((r) => setTimeout(r, 500));
    await publishAvailability("Living Room Light", false);

    const event = await eventPromise;
    expect(event.deviceAvailabilityChanged).toBeDefined();
    expect(event.deviceAvailabilityChanged.deviceId).toBeTruthy();
    expect(event.deviceAvailabilityChanged.available).toBe(false);
  });

  it("should handle multiple concurrent subscriptions", async () => {
    const { graphqlClient } = getContext();

    const statePromise = subscribeAndWait(graphqlClient, DEVICE_STATE_CHANGED, 10_000, {});

    const availabilityPromise = subscribeAndWait(
      graphqlClient,
      DEVICE_AVAILABILITY_CHANGED,
      10_000,
      {},
    );

    await new Promise((r) => setTimeout(r, 500));

    await publishDeviceState("Bedroom Light", {
      state: "ON",
      brightness: 100,
    });
    await publishAvailability("Bedroom Light", true);

    const [stateEvent, availabilityEvent] = await Promise.all([statePromise, availabilityPromise]);

    expect(stateEvent.deviceStateChanged).toBeDefined();
    expect(availabilityEvent.deviceAvailabilityChanged).toBeDefined();
  });

  it("should receive deviceAdded events", async () => {
    const { graphqlClient } = getContext();

    const eventPromise = subscribeAndWait(graphqlClient, DEVICE_ADDED, 10_000, {});

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

    const eventPromise = subscribeAndWait(graphqlClient, DEVICE_REMOVED, 10_000, {});

    await new Promise((r) => setTimeout(r, 500));

    const reducedDevices = fixtures.filter((d) => d.friendly_name !== "Office Button");
    await publishBridgeDevices(reducedDevices);

    const event = await eventPromise;
    expect(event.deviceRemoved).toBeTruthy();

    await publishBridgeDevices(fixtures);
    await new Promise((r) => setTimeout(r, 1000));
  });

  it.skip("should receive automationNodeActivated events", async () => {
    const { graphqlClient } = getContext();

    const devicesResult = await graphqlClient.query(DEVICES_QUERY, {}).toPromise();
    expect(devicesResult.data).toBeDefined();

    const sensor = devicesResult.data!.devices.find((d) => d.type === "sensor");
    expect(sensor).toBeDefined();
    const light = devicesResult.data!.devices.find((d) => d.type === "light");
    expect(light).toBeDefined();

    const triggerConfig = JSON.stringify({
      kind: "event",
      event_type: "device.state_changed",
      filter_expr: "true",
      cooldown_ms: 5000,
    });
    const actionConfig = JSON.stringify({
      action_type: "set_device_state",
      target_type: "device",
      target_id: light!.id,
      payload: JSON.stringify({ on: true }),
    });

    const automation = await graphqlClient
      .mutation(CREATE_AUTOMATION, {
        input: {
          name: "Node Activation Test",
          enabled: true,
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

    const eventPromise = subscribeAndWait(graphqlClient, AUTOMATION_NODE_ACTIVATED, 10_000, {
      automationId,
    });

    await new Promise((r) => setTimeout(r, 500));

    await publishDeviceState(sensor!.name, {
      temperature: 30,
      humidity: 50,
    });

    const event = await eventPromise;
    expect(event.automationNodeActivated).toBeDefined();
    expect(event.automationNodeActivated.automationId).toBe(automationId);

    await graphqlClient.mutation(DELETE_AUTOMATION, { id: automationId }).toPromise();
  });

  it("should filter deviceStateChanged by deviceId", async () => {
    const { graphqlClient } = getContext();

    const devicesResult = await graphqlClient.query(DEVICES_QUERY, {}).toPromise();
    expect(devicesResult.data).toBeDefined();

    const lights = devicesResult.data!.devices.filter((d) => d.type === "light");
    expect(lights.length).toBeGreaterThanOrEqual(2);

    const targetLight = lights.find((l) => l.name === "Living Room Light")!;
    const _otherLight = lights.find((l) => l.name === "Bedroom Light")!;

    const received: ResultOf<typeof DEVICE_STATE_CHANGED_FILTERED>[] = [];

    const eventPromise = new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => resolve(), 3000);

      const { unsubscribe } = pipe(
        graphqlClient.subscription(DEVICE_STATE_CHANGED_FILTERED, {
          deviceId: targetLight.id,
        }),
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
