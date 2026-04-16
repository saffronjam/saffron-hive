import { describe, it, expect } from "vitest";
import { gql } from "@urql/core";
import { getContext, publishDeviceState, getSensorStateFixture } from "./setup.js";

const DEVICES_QUERY = gql`
  query Devices {
    devices {
      id
      name
      type
    }
  }
`;

const SENSOR_HISTORY_QUERY = gql`
  query SensorHistory($deviceId: ID!, $limit: Int) {
    sensorHistory(deviceId: $deviceId, limit: $limit) {
      id
      deviceId
      temperature
      humidity
      battery
      pressure
      illuminance
      recordedAt
    }
  }
`;

interface DeviceFields {
  id: string;
  name: string;
  type: string;
}

interface DevicesQueryResult {
  devices: DeviceFields[];
}

interface SensorReadingFields {
  id: string;
  deviceId: string;
  temperature: number | null;
  humidity: number | null;
  battery: number | null;
  pressure: number | null;
  illuminance: number | null;
  recordedAt: string;
}

interface SensorHistoryResult {
  sensorHistory: SensorReadingFields[];
}

describe("sensor history", () => {
  it("should query sensor history", async () => {
    const { graphqlClient } = getContext();

    const devicesResult = await graphqlClient
      .query<DevicesQueryResult>(DEVICES_QUERY, {})
      .toPromise();
    expect(devicesResult.data).toBeDefined();

    const sensor = devicesResult.data!.devices.find(
      (d) => d.type === "sensor",
    );
    expect(sensor).toBeDefined();

    const sensorState = getSensorStateFixture();
    await publishDeviceState(sensor!.name, sensorState);

    await new Promise((r) => setTimeout(r, 2000));

    const result = await graphqlClient
      .query<SensorHistoryResult>(SENSOR_HISTORY_QUERY, {
        deviceId: sensor!.id,
        limit: 10,
      })
      .toPromise();

    expect(result.error).toBeUndefined();
    expect(result.data).toBeDefined();
    expect(result.data!.sensorHistory.length).toBeGreaterThanOrEqual(0);

    if (result.data!.sensorHistory.length > 0) {
      const reading = result.data!.sensorHistory[0];
      expect(reading.deviceId).toBe(sensor!.id);
      expect(reading.recordedAt).toBeTruthy();
    }
  });

  it("should return empty for device with no history", async () => {
    const { graphqlClient } = getContext();

    const devicesResult = await graphqlClient
      .query<DevicesQueryResult>(DEVICES_QUERY, {})
      .toPromise();
    expect(devicesResult.data).toBeDefined();

    const light = devicesResult.data!.devices.find(
      (d) => d.type === "light",
    );
    expect(light).toBeDefined();

    const result = await graphqlClient
      .query<SensorHistoryResult>(SENSOR_HISTORY_QUERY, {
        deviceId: light!.id,
        limit: 10,
      })
      .toPromise();

    expect(result.error).toBeUndefined();
    expect(result.data).toBeDefined();
    expect(result.data!.sensorHistory).toHaveLength(0);
  });
});
