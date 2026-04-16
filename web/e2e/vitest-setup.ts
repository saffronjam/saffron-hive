import { beforeAll, afterAll } from "vitest";
import {
  setupE2E,
  teardownE2E,
  publishBridgeDevices,
  getBridgeDevicesFixture,
  waitForDevices,
} from "./setup.js";

const COORDINATOR_TYPE = "Coordinator";

beforeAll(async () => {
  await setupE2E();

  const devices = getBridgeDevicesFixture();
  await publishBridgeDevices(devices);

  const nonCoordinatorCount = (devices as Array<{ type: string }>).filter(
    (d) => d.type !== COORDINATOR_TYPE,
  ).length;

  await waitForDevices(nonCoordinatorCount, 15_000);
}, 120_000);

afterAll(async () => {
  await teardownE2E();
});
