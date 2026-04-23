import { describe, it, expect } from "vitest";
import { graphql } from "$lib/gql";
import { getContext, publishDeviceState, getSensorStateFixture } from "./setup.js";

const DEVICES_QUERY = graphql(`
  query E2EStateHistoryDevices {
    devices {
      id
      name
      type
    }
  }
`);

const STATE_HISTORY_QUERY = graphql(`
  query E2EStateHistory($filter: StateHistoryFilter!) {
    stateHistory(filter: $filter) {
      deviceId
      field
      points {
        at
        value
      }
    }
  }
`);

describe("state history", () => {
  it("records a sample per scalar field after a publish", async () => {
    const { graphqlClient } = getContext();

    const devicesResult = await graphqlClient.query(DEVICES_QUERY, {}).toPromise();
    expect(devicesResult.data).toBeDefined();

    const sensor = devicesResult.data!.devices.find((d) => d.type === "sensor");
    expect(sensor).toBeDefined();

    const sensorState = getSensorStateFixture();
    await publishDeviceState(sensor!.name, sensorState);

    await new Promise((r) => setTimeout(r, 2000));

    const result = await graphqlClient
      .query(STATE_HISTORY_QUERY, {
        filter: { deviceIds: [sensor!.id] },
      })
      .toPromise();

    expect(result.error).toBeUndefined();
    expect(result.data).toBeDefined();
    const fields = new Set(result.data!.stateHistory.map((s) => s.field));
    expect(fields.size).toBeGreaterThanOrEqual(1);
  });

  it("returns empty for a device with no recorded samples", async () => {
    const { graphqlClient } = getContext();

    const result = await graphqlClient
      .query(STATE_HISTORY_QUERY, {
        filter: { deviceIds: ["not-a-real-device-id"] },
      })
      .toPromise();

    expect(result.error).toBeUndefined();
    expect(result.data).toBeDefined();
    expect(result.data!.stateHistory).toHaveLength(0);
  });
});
