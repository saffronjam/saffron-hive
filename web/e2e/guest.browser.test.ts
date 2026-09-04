import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { chromium, type Browser, type BrowserContext, type Page } from "playwright-core";
import { graphql } from "$lib/gql";
import { getContext } from "./setup.js";

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

beforeAll(async () => {
  const { graphqlClient, appUrl } = getContext();
  const created = await graphqlClient
    .mutation(CREATE_GUEST, { input: { name: "Browser Guest", durationMinutes: 60 } })
    .toPromise();
  if (created.error || !created.data) throw created.error ?? new Error("guest was not created");
  guestId = created.data.createGuest.id;

  browser = await chromium.launch({ channel: "chrome", headless: true });
  context = await browser.newContext({ serviceWorkers: "block" });
  page = await context.newPage();
  await page.goto(`${appUrl}/login?mode=guest`, { waitUntil: "domcontentloaded" });
}, 120_000);

afterAll(async () => {
  await context?.close();
  await browser?.close();
  if (guestId) {
    await getContext().graphqlClient.mutation(DELETE_GUEST, { id: guestId }).toPromise();
  }
});

describe("guest dashboard shell", () => {
  it("signs in by name, blocks navigation, and exits when revoked", async () => {
    const { appUrl, graphqlClient } = getContext();
    await page.getByLabel("Name").fill("browser GUEST");
    await page.getByRole("button", { name: "Continue" }).click();

    await expect.poll(() => new URL(page.url()).pathname).toBe("/");
    await expect
      .poll(() => page.locator("main").getByRole("button", { name: "Log out" }).count())
      .toBe(1);
    expect(await page.locator("header").count()).toBe(0);
    expect(await page.getByRole("link", { name: "Devices" }).count()).toBe(0);

    await page.goto(`${appUrl}/users`, { waitUntil: "domcontentloaded" });
    await expect.poll(() => new URL(page.url()).pathname).toBe("/");

    const revoked = await graphqlClient.mutation(DELETE_GUEST, { id: guestId }).toPromise();
    expect(revoked.data?.deleteGuest).toBe(true);
    guestId = "";

    await expect.poll(() => new URL(page.url()).pathname).toBe("/login");
    expect(new URL(page.url()).searchParams.get("mode")).toBe("guest");
    await expect
      .poll(() => page.getByText("This guest access has expired or was removed.").count())
      .toBe(1);
  });
});
