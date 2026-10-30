import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { chromium, type Browser, type BrowserContext, type Page } from "playwright-core";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { revision } from "./revision.js";
import { getContext } from "./setup.js";

let browser: Browser;
let context: BrowserContext;
let page: Page;
const errors: string[] = [];
const tabs = () => page.locator(".mobile-navigation");
const menu = () => page.getByRole("navigation", { name: "Menu", exact: true });

beforeAll(async () => {
  browser = await chromium.launch({ channel: "chrome", headless: true });
  context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    serviceWorkers: "block",
  });
  await context.addInitScript(
    (token) => localStorage.setItem("hive.token", token),
    getContext().token,
  );
  page = await context.newPage();
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(getContext().appUrl);
  await tabs().waitFor();
});

afterAll(async () => {
  await context?.close();
  await browser?.close();
});

describe("mobile navigation", () => {
  it("keeps three tabs available across lists, details, Menu and Profile", async () => {
    expect((await tabs().getByRole("link").allTextContents()).map((label) => label.trim())).toEqual(
      ["Dashboard", "Devices", "Menu"],
    );
    await tabs().getByRole("link", { name: "Devices", exact: true }).click();
    await expect.poll(() => new URL(page.url()).pathname).toBe("/devices");
    await page.goto(`${getContext().appUrl}/devices/0x00158d0001a2b3c4`);
    await expect
      .poll(() => tabs().locator('[aria-current="location"]').innerText())
      .toBe("Devices");
    await tabs().getByRole("link", { name: "Menu", exact: true }).click();
    await menu().waitFor();
    expect(await menu().getByRole("link", { name: "Devices", exact: true }).count()).toBe(0);
    expect(await menu().getByRole("link", { name: "Settings", exact: true }).isVisible()).toBe(
      true,
    );
    await menu().getByRole("link", { name: "Scenes", exact: true }).click();
    await expect.poll(() => new URL(page.url()).pathname).toBe("/scenes");
    expect(await tabs().locator('[aria-current="location"]').innerText()).toBe("Menu");
    await page.goBack();
    await menu().waitFor();
    await page.locator('a[href="/profile"]:visible').click();
    await expect.poll(() => new URL(page.url()).pathname).toBe("/profile");
    await page.goBack();
    await menu().waitFor();
    await page.reload();
    await menu().waitFor();
  });

  it("preserves the editor guard when using the bottom tabs", async () => {
    await menu().getByRole("link", { name: "Settings", exact: true }).click();
    const retention = page.locator("#retention-days");
    await retention.waitFor();
    await retention.fill("123");
    await tabs().getByRole("link", { name: "Devices", exact: true }).click();
    await page.getByRole("button", { name: "Stay", exact: true }).click();
    await expect.poll(() => tabs().locator("[aria-current]").innerText()).toBe("Menu");
    expect(await retention.inputValue()).toBe("123");
    await tabs().getByRole("link", { name: "Menu", exact: true }).click();
    await page.getByRole("button", { name: "Discard and leave", exact: true }).click();
    await menu().waitFor();
  });

  it("fits narrow screens and keeps the footer clear of the tabs", async () => {
    for (const width of [320, 390, 767]) {
      await page.setViewportSize({ width, height: 640 });
      await page.getByRole("button", { name: /Log out/ }).scrollIntoViewIfNeeded();
      const logout = await page.getByRole("button", { name: /Log out/ }).boundingBox();
      const bar = await tabs().boundingBox();
      expect(logout!.y + logout!.height).toBeLessThanOrEqual(bar!.y);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await page.evaluate(() => scrollTo(0, 0));
    await mkdir(resolve("../tmp/mobile-navigation"), { recursive: true });
    await page.screenshot({
      path: resolve("../tmp/mobile-navigation/menu-dark.png"),
      fullPage: true,
      animations: "disabled",
    });
    await page.evaluate(() => document.documentElement.classList.remove("dark"));
    await page.screenshot({
      path: resolve("../tmp/mobile-navigation/menu-light.png"),
      fullPage: true,
      animations: "disabled",
    });
    await page.evaluate(() => document.documentElement.classList.add("dark"));
  });

  it("fits translated labels and long profile names", async () => {
    const { graphqlClient } = getContext();
    const original = await graphqlClient
      .query<{ me: { name: string } }>(
        "query { me { name } }",
        {},
        { requestPolicy: "network-only" },
      )
      .toPromise();
    const name = original.data!.me.name;
    try {
      for (const language of ["SV", "RU", "EN"]) {
        const result = await graphqlClient
          .mutation(
            "mutation($input: UpdateCurrentUserInput!) { updateCurrentUser(input: $input) { name language } }",
            {
              input: {
                expectedRevision: await revision(graphqlClient, "me"),
                language,
                name: "A very long display name for a household member",
              },
            },
          )
          .toPromise();
        if (result.error) throw result.error;
        await page.reload();
        await tabs().waitFor();
        await page.setViewportSize({ width: 320, height: 640 });
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
          true,
        );
        for (const tab of await tabs().getByRole("link").all()) {
          expect(await tab.evaluate((node) => node.scrollHeight <= node.clientHeight)).toBe(true);
        }
        await page.screenshot({
          path: resolve(`../tmp/mobile-navigation/menu-${language.toLowerCase()}.png`),
          fullPage: true,
          animations: "disabled",
        });
      }
    } finally {
      await graphqlClient
        .mutation(
          "mutation($input: UpdateCurrentUserInput!) { updateCurrentUser(input: $input) { name } }",
          {
            input: { expectedRevision: await revision(graphqlClient, "me"), language: "EN", name },
          },
        )
        .toPromise();
      await page.reload();
      await menu().waitFor();
    }
  });

  it("uses desktop navigation at the breakpoint and logs out on mobile", async () => {
    for (const width of [768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await expect.poll(() => tabs().isVisible()).toBe(false);
      await expect.poll(() => page.locator('[data-slot="sidebar-trigger"]').isVisible()).toBe(true);
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await expect.poll(() => tabs().isVisible()).toBe(true);
    await page.getByRole("button", { name: /Log out/ }).click();
    await expect.poll(() => new URL(page.url()).pathname).toBe("/login");
    expect(await tabs().count()).toBe(0);
    expect(errors).toEqual([]);
  });
});
