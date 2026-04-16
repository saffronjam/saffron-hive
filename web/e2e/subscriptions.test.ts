import { describe, it, expect } from "vitest";
import { gql } from "@urql/core";
import { pipe, subscribe } from "wonka";
import { getContext, publishDeviceState, publishAvailability } from "./setup.js";

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

function subscribeAndWait<T>(
  graphqlClient: ReturnType<typeof getContext>["graphqlClient"],
  subscription: ReturnType<typeof gql>,
  timeoutMs: number,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timeout = setTimeout(
      () => reject(new Error("Subscription timed out")),
      timeoutMs,
    );

    const { unsubscribe } = pipe(
      graphqlClient.subscription<T>(subscription, {}),
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
});
