import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { chromium, type Browser, type BrowserContext, type Page } from "playwright-core";
import { graphql } from "$lib/gql";
import {
  getBridgeDevicesFixture,
  getContext,
  publishBridgeDevices,
  publishDeviceState,
  waitForDevices,
} from "./setup.js";

interface BridgeDeviceFixture extends Record<string, unknown> {
  ieee_address: string;
  friendly_name: string;
}

const TASKS = graphql(`
  query E2EMaintenanceTasks {
    maintenanceTasks {
      id
      kind
    }
  }
`);

let browser: Browser;
let browserContext: BrowserContext;
let page: Page;

beforeAll(async () => {
  const { token } = getContext();
  browser = await chromium.launch({ channel: "chrome", headless: true });
  browserContext = await browser.newContext();
  await browserContext.addInitScript((authToken) => {
    localStorage.setItem("hive.token", authToken);
  }, token);
  page = await browserContext.newPage();
  await page.setViewportSize({ width: 1600, height: 900 });
}, 120_000);

afterAll(async () => {
  await browserContext?.close();
  await browser?.close();
});

async function waitForKinds(kinds: string[], timeout = 80_000) {
  const { graphqlClient } = getContext();
  await expect
    .poll(
      async () => {
        const result = await graphqlClient
          .query(TASKS, {}, { requestPolicy: "network-only" })
          .toPromise();
        return [
          ...new Set(
            (result.data?.maintenanceTasks ?? [])
              .map((task) => task.kind)
              .filter((kind) => kinds.includes(kind)),
          ),
        ].sort();
      },
      { timeout },
    )
    .toEqual([...kinds].sort());
}

async function waitForTaskCount(count: number, timeout = 80_000) {
  const { graphqlClient } = getContext();
  await expect
    .poll(
      async () => {
        const result = await graphqlClient
          .query(TASKS, {}, { requestPolicy: "network-only" })
          .toPromise();
        return result.data?.maintenanceTasks.length ?? 0;
      },
      { timeout },
    )
    .toBe(count);
}

async function completeCard(title: string) {
  const card = page
    .getByText(title, { exact: true })
    .locator("xpath=ancestor::*[@data-slot='card']");
  await card.getByRole("button", { name: "Mark all done" }).click();
}

describe("Maintenance", () => {
  it("persists completions and returns stronger or fresh conditions", async () => {
    const bridgeDevices = getBridgeDevicesFixture();
    const otaTemplate = bridgeDevices.find(
      (device): device is BridgeDeviceFixture =>
        typeof device === "object" &&
        device !== null &&
        "friendly_name" in device &&
        device.friendly_name === "Multi-state sensor P100",
    );
    if (!otaTemplate) {
      throw new Error("OTA-capable bridge fixture is missing");
    }
    const otaDeviceNames = Array.from({ length: 5 }, (_, index) => `OTA test device ${index + 1}`);
    const otaDevices = otaDeviceNames.map((friendlyName, index) => ({
      ...otaTemplate,
      ieee_address: `0x00158d00000001${String(index + 1).padStart(2, "0")}`,
      friendly_name: friendlyName,
      network_address: 4000 + index,
    }));
    await publishBridgeDevices([...bridgeDevices, ...otaDevices]);
    await waitForDevices(bridgeDevices.length + otaDevices.length, 20_000);

    await publishDeviceState("Door sensor T1", { battery: 25 });
    await publishDeviceState("Multi-state sensor P100", {
      device_posture: "abnormal",
      update: { state: "available", installed_version: 1, latest_version: 2 },
    });
    await Promise.all(
      otaDeviceNames.map((friendlyName) =>
        publishDeviceState(friendlyName, {
          update: { state: "available", installed_version: 1, latest_version: 2 },
        }),
      ),
    );
    await waitForKinds(["BATTERY", "FIRMWARE", "POSTURE"]);
    await waitForTaskCount(8);

    const { appUrl } = getContext();
    await page.goto(`${appUrl}/devices/0x54ef4410015e4b68`, {
      waitUntil: "domcontentloaded",
    });
    const updateLink = page.getByRole("link", { name: "Update" });
    await expect.poll(() => updateLink.count(), { timeout: 30_000 }).toBe(1);
    expect(await updateLink.getAttribute("href")).toBe(
      "https://z2m.example.com/#/device/0/0x54ef4410015e4b68/info",
    );
    expect(await updateLink.getAttribute("target")).toBe("_blank");

    await page.goto(`${appUrl}/maintenance`, { waitUntil: "domcontentloaded" });
    await expect.poll(() => page.getByText("Replace batteries", { exact: true }).count()).toBe(1);
    await expect.poll(() => page.getByText("Updates", { exact: true }).count()).toBe(1);
    await expect
      .poll(() => page.getByText("Correct sensor placement", { exact: true }).count())
      .toBe(1);
    await expect.poll(() => page.getByLabel("8 maintenance tasks").count()).toBe(1);
    const batteryCard = page
      .getByText("Replace batteries", { exact: true })
      .locator("xpath=ancestor::*[@data-slot='card']");
    const firmwareCard = page
      .getByText("Updates", { exact: true })
      .locator("xpath=ancestor::*[@data-slot='card']");
    const postureCard = page
      .getByText("Correct sensor placement", { exact: true })
      .locator("xpath=ancestor::*[@data-slot='card']");
    const [batteryBox, firmwareBox, postureBox] = await Promise.all([
      batteryCard.boundingBox(),
      firmwareCard.boundingBox(),
      postureCard.boundingBox(),
    ]);
    expect(batteryBox).not.toBeNull();
    expect(firmwareBox).not.toBeNull();
    expect(postureBox).not.toBeNull();
    expect(Math.abs(batteryBox!.x - postureBox!.x)).toBeLessThan(2);
    expect(Math.abs(batteryBox!.x - firmwareBox!.x)).toBeGreaterThan(100);
    expect(postureBox!.y).toBeGreaterThanOrEqual(batteryBox!.y + batteryBox!.height);
    expect(postureBox!.y).toBeLessThan(firmwareBox!.y + firmwareBox!.height);

    const otaLink = firmwareCard.locator(
      'a[href="https://z2m.example.com/#/device/0/0x54ef4410015e4b68/info"]',
    );
    expect(await otaLink.getAttribute("href")).toBe(
      "https://z2m.example.com/#/device/0/0x54ef4410015e4b68/info",
    );
    expect(await otaLink.getAttribute("target")).toBe("_blank");

    await page.goto(`${appUrl}/maintenance?filter=maintenance%3APOSTURE`, {
      waitUntil: "domcontentloaded",
    });
    await expect
      .poll(() => page.getByText("Correct sensor placement", { exact: true }).count())
      .toBe(1);
    expect(await page.getByText("Updates", { exact: true }).count()).toBe(0);
    expect(new URL(page.url()).searchParams.getAll("filter")).toEqual(["maintenance:POSTURE"]);
    await page.getByRole("button", { name: "Clear search" }).click();
    await expect.poll(() => page.getByText("Updates", { exact: true }).count()).toBe(1);

    await completeCard("Replace batteries");
    await completeCard("Updates");
    await completeCard("Correct sensor placement");
    await expect
      .poll(() => page.getByText("Nothing needs maintenance.", { exact: true }).count())
      .toBe(1);
    await page.reload({ waitUntil: "domcontentloaded" });
    await expect
      .poll(() => page.getByText("Nothing needs maintenance.", { exact: true }).count())
      .toBe(1);

    await publishDeviceState("Door sensor T1", { battery: 20 });
    await publishDeviceState("Multi-state sensor P100", {
      device_posture: "normal",
      update: { state: "available", installed_version: 1, latest_version: 3 },
    });
    await new Promise((resolve) => setTimeout(resolve, 750));
    await publishDeviceState("Multi-state sensor P100", { device_posture: "abnormal" });
    await waitForKinds(["BATTERY", "FIRMWARE", "POSTURE"], 20_000);
    await expect.poll(() => page.getByLabel("3 maintenance tasks").count()).toBe(1);
  }, 120_000);
});
