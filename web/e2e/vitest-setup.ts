import { beforeAll, afterAll } from "vitest";
import {
  setupE2E,
  teardownE2E,
  publishBridgeDevices,
  getBridgeDevicesFixture,
  waitForDevices,
} from "./setup.js";

beforeAll(async () => {
  await setupE2E();

  const devices = getBridgeDevicesFixture();
  await publishBridgeDevices(devices);

  // Every entry registers, the coordinator included: it becomes a hub device.
  await waitForDevices((devices as unknown[]).length, 15_000);
}, 120_000);

afterAll(async () => {
  await teardownE2E();
});
