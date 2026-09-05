import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { chromium, type Browser, type BrowserContext, type Page } from "playwright-core";
import { graphql } from "$lib/gql";
import { Language } from "$lib/gql/graphql";
import { getContext, getSensorStateFixture, publishDeviceState } from "./setup.js";

const UI_TIMEOUT = 10_000;

const CREATE_GUEST = graphql(`
  mutation BrowserGuestCreate($input: CreateGuestInput!) {
    createGuest(input: $input) {
      id
    }
  }
`);

const DELETE_GUEST = graphql(`
  mutation BrowserGuestDelete($id: ID!) {
    deleteGuest(id: $id)
  }
`);

let browser: Browser;
let context: BrowserContext;
let page: Page;
let guestId = "";
let releaseDashboardData: (() => void) | null = null;

interface GuestProbeWindow extends Window {
  __guestLoginFormSeen?: boolean;
}

beforeAll(async () => {
  const { graphqlClient, appUrl } = getContext();
  await publishDeviceState("Living Room Sensor", getSensorStateFixture());
  const created = await graphqlClient
    .mutation(CREATE_GUEST, {
      input: { name: "Browser Guest", durationMinutes: 60, language: Language.Sv },
    })
    .toPromise();
  if (created.error || !created.data) throw created.error ?? new Error("guest was not created");
  guestId = created.data.createGuest.id;

  browser = await chromium.launch({ channel: "chrome", headless: true });
  context = await browser.newContext({ serviceWorkers: "block" });
  const dashboardDataGate = new Promise<void>((resolve) => {
    releaseDashboardData = resolve;
  });
  await context.route("**/*", async (route) => {
    const request = route.request();
    if (new URL(request.url()).pathname !== "/graphql") {
      await route.continue();
      return;
    }
    const requestText = `${request.url()} ${request.postData() ?? ""}`;
    if (requestText.includes("DevicesInit")) await dashboardDataGate;
    await route.continue();
  });
  await context.addInitScript(() => {
    const probe = window as GuestProbeWindow;
    probe.__guestLoginFormSeen = false;
    const inspect = () => {
      if (document.querySelector("#guest-name")) probe.__guestLoginFormSeen = true;
    };
    new MutationObserver(inspect).observe(document.documentElement, {
      childList: true,
      subtree: true,
    });
  });
  page = await context.newPage();
  await page.goto(`${appUrl}/login?mode=guest&name=Browser%20Guest&auto=1`, {
    waitUntil: "domcontentloaded",
  });
}, 120_000);

afterAll(async () => {
  releaseDashboardData?.();
  await context?.close();
  await browser?.close();
  if (guestId) {
    await getContext().graphqlClient.mutation(DELETE_GUEST, { id: guestId }).toPromise();
  }
});

describe("guest dashboard shell", () => {
  it("signs in from a shared link, uses its saved language, and exits when revoked", async () => {
    const { appUrl, graphqlClient } = getContext();
    await expect
      .poll(() => page.locator('[aria-label="Laddar…"]').count(), { timeout: UI_TIMEOUT })
      .toBe(1);
    expect(
      await page.evaluate(() => (window as GuestProbeWindow).__guestLoginFormSeen ?? false),
    ).toBe(false);
    releaseDashboardData?.();
    releaseDashboardData = null;

    await expect.poll(() => new URL(page.url()).pathname).toBe("/");
    await expect
      .poll(() => page.locator("main").getByRole("button", { name: "Logga ut" }).count())
      .toBe(1);
    expect(await page.locator("header").count()).toBe(0);
    expect(await page.getByRole("link", { name: "Devices" }).count()).toBe(0);

    const sensorReadouts = page.locator("[data-card-click-ignore]");
    await expect.poll(() => sensorReadouts.count()).toBeGreaterThan(0);
    await sensorReadouts.first().click();
    expect(await page.locator('[data-slot="popover-content"]').count()).toBe(0);
    expect(await page.locator('[data-slot="sheet-content"]').count()).toBe(0);

    const language = page.locator('[aria-label="Språk"]');
    await language.click();
    await expect
      .poll(() => page.getByRole("option", { name: "English", exact: true }).count())
      .toBe(1);
    await expect
      .poll(() => page.getByRole("option", { name: "Svenska", exact: true }).count())
      .toBe(1);
    await expect
      .poll(() => page.getByRole("option", { name: "Русский", exact: true }).count())
      .toBe(1);
    const languageUpdated = page.waitForResponse(
      (response) =>
        `${response.url()} ${response.request().postData() ?? ""}`.includes(
          "LayoutUpdateCurrentGuestLanguage",
        ),
      { timeout: UI_TIMEOUT },
    );
    await page.getByRole("option", { name: "English", exact: true }).click();
    await languageUpdated;
    await expect
      .poll(() => page.locator("main").getByRole("button", { name: "Log out" }).count())
      .toBe(1);
    await page.reload({ waitUntil: "domcontentloaded" });
    await expect
      .poll(() => page.locator("main").getByRole("button", { name: "Log out" }).count(), {
        timeout: UI_TIMEOUT,
      })
      .toBe(1);

    await page.goto(`${appUrl}/users`, { waitUntil: "domcontentloaded" });
    await expect.poll(() => new URL(page.url()).pathname, { timeout: UI_TIMEOUT }).toBe("/");

    const revoked = await graphqlClient.mutation(DELETE_GUEST, { id: guestId }).toPromise();
    expect(revoked.data?.deleteGuest).toBe(true);
    guestId = "";

    await expect.poll(() => new URL(page.url()).pathname, { timeout: UI_TIMEOUT }).toBe("/login");
    expect(new URL(page.url()).searchParams.get("mode")).toBe("guest");
    await expect
      .poll(() => page.getByText("This guest access has expired or was removed.").count(), {
        timeout: UI_TIMEOUT,
      })
      .toBe(1);
  });
});
