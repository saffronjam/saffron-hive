import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { chromium, type Browser, type BrowserContext, type Page } from "playwright-core";
import { graphql } from "$lib/gql";
import { getContext } from "./setup.js";

let browser: Browser;
let browserContext: BrowserContext;
let page: Page;

const ZIGBEE_METADATA_READY_QUERY = graphql(`
  query E2EZigbeeMetadataReady($id: ID!) {
    device(id: $id) {
      zigbee2Mqtt {
        ieeeAddress
      }
    }
  }
`);

beforeAll(async () => {
  const { token } = getContext();
  browser = await chromium.launch({ channel: "chrome", headless: true });
  browserContext = await browser.newContext({ serviceWorkers: "block" });
  await browserContext.addInitScript((authToken) => {
    localStorage.setItem("hive.token", authToken);
  }, token);
  page = await browserContext.newPage();
}, 120_000);

afterAll(async () => {
  await browserContext?.close();
  await browser?.close();
});

describe("Zigbee device metadata", () => {
  it("renders identity and deep diagnostics across device shapes and viewports", async () => {
    const { appUrl, graphqlClient } = getContext();
    const externalImageRequests: string[] = [];
    page.on("request", (request) => {
      if (request.url().includes("zigbee2mqtt.io/images"))
        externalImageRequests.push(request.url());
    });
    await expect
      .poll(
        async () => {
          const result = await graphqlClient
            .query(
              ZIGBEE_METADATA_READY_QUERY,
              { id: "0x54ef44100166fcae" },
              { requestPolicy: "network-only" },
            )
            .toPromise();
          return result.data?.device?.zigbee2Mqtt?.ieeeAddress ?? null;
        },
        { timeout: 15_000 },
      )
      .toBe("0x54ef44100166fcae");
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(`${appUrl}/devices/0x54ef44100166fcae`, { waitUntil: "domcontentloaded" });
    await expect
      .poll(() => page.getByText("Zigbee", { exact: true }).count(), { timeout: 10_000 })
      .toBe(1);
    await expect
      .poll(() => page.getByText("Successful", { exact: true }).count(), { timeout: 10_000 })
      .toBe(1);
    await expect
      .poll(() => page.getByText("2019www.", { exact: true }).count(), { timeout: 10_000 })
      .toBe(1);
    await expect
      .poll(() => page.getByText("0x0A96 · 2710", { exact: true }).count(), { timeout: 10_000 })
      .toBe(1);
    const definitionLink = page.getByRole("link", { name: /MCCGQ12LM/ });
    expect(await definitionLink.getAttribute("href")).toBe(
      "https://www.zigbee2mqtt.io/devices/MCCGQ12LM.html",
    );
    expect(await definitionLink.getAttribute("target")).toBe("_blank");
    await expect
      .poll(() => page.getByAltText("Door sensor T1 device").count(), { timeout: 10_000 })
      .toBe(1);
    expect(externalImageRequests).toEqual([]);

    await page.setViewportSize({ width: 390, height: 844 });
    await page.evaluate(() => document.documentElement.classList.add("dark"));
    await page.goto(`${appUrl}/devices/0x54ef4410015e4b68`, { waitUntil: "domcontentloaded" });
    await expect
      .poll(() => page.getByText("Zigbee", { exact: true }).count(), { timeout: 10_000 })
      .toBe(1);
    await page.getByRole("button", { name: "Bindings" }).click();
    await expect
      .poll(() => page.getByText("genGroups", { exact: true }).count(), { timeout: 10_000 })
      .toBe(1);
    await page.getByRole("button", { name: "Reporting" }).click();
    await expect
      .poll(() => page.getByText("onOff", { exact: true }).count(), { timeout: 10_000 })
      .toBe(1);
    await page.getByRole("button", { name: "Groups" }).click();
    await expect
      .poll(() => page.getByText("Not in a Zigbee group.", { exact: true }).count(), {
        timeout: 10_000,
      })
      .toBe(1);
    const hasViewportOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(hasViewportOverflow).toBe(false);

    await page.evaluate(() => document.documentElement.classList.remove("dark"));
    await page.goto(`${appUrl}/devices/0x00124b0000000001`, { waitUntil: "domcontentloaded" });
    await expect
      .poll(() => page.getByText("Unsupported", { exact: true }).count(), { timeout: 10_000 })
      .toBeGreaterThan(0);
    await expect
      .poll(() => page.getByText("No endpoints reported.", { exact: true }).count(), {
        timeout: 10_000,
      })
      .toBe(1);
  });
});
