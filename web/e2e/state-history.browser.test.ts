import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { chromium, type Browser, type BrowserContext, type Page } from "playwright-core";
import { graphql } from "$lib/gql";
import { getContext, publishDeviceState } from "./setup.js";
import { browserDiagnostics } from "./browser-diagnostics.js";

const CREATE_ROOM = graphql(`
  mutation HistoryBrowserCreateRoom {
    createRoom(input: { name: "History cache room" }) {
      id
    }
  }
`);

const ADD_SENSOR = graphql(`
  mutation HistoryBrowserAddSensor($roomId: ID!) {
    addRoomMember(
      input: { roomId: $roomId, memberType: "device", memberId: "0x00158d0004d5e6f7" }
    ) {
      id
    }
  }
`);

const DELETE_ROOM = graphql(`
  mutation HistoryBrowserDeleteRoom($id: ID!) {
    deleteRoom(id: $id)
  }
`);

const diagnostics = browserDiagnostics("state-history");

let browser: Browser;
let browserContext: BrowserContext;
let page: Page;
let roomId: string | undefined;
let historyRequests = 0;
let historyResponses = 0;
const releases: (() => void)[] = [];

beforeAll(async () => {
  const { graphqlClient, appUrl, token } = getContext();
  const room = await graphqlClient.mutation(CREATE_ROOM, {}).toPromise();
  if (room.error || !room.data) throw room.error ?? new Error("Room creation failed");
  roomId = room.data.createRoom.id;
  const member = await graphqlClient.mutation(ADD_SENSOR, { roomId }).toPromise();
  if (member.error) throw member.error;
  await publishDeviceState("Living Room Sensor", { temperature: 19, humidity: 45 });

  browser = await chromium.launch({ channel: "chrome", headless: true });
  browserContext = await browser.newContext({
    viewport: { width: 1600, height: 900 },
    serviceWorkers: "block",
  });
  await browserContext.addInitScript(
    (authToken) => localStorage.setItem("hive.token", authToken),
    token,
  );
  await browserContext.route("**/graphql*", async (route) => {
    const request = route.request();
    const operation =
      request.method() === "GET"
        ? new URL(request.url()).searchParams.get("operationName")
        : (request.postDataJSON() as { operationName?: string } | null)?.operationName;
    if (operation !== "AggregatedStateHistory") {
      await route.continue();
      return;
    }
    historyRequests++;
    const ready = new Promise<void>((resolve) => releases.push(resolve));
    const response = await route.fetch();
    await ready;
    await route.fulfill({ response });
    historyResponses++;
  });
  page = await browserContext.newPage();
  await diagnostics.start(page);
  await page.goto(appUrl, { waitUntil: "domcontentloaded" });
});

afterEach(async ({ task }) => {
  if (task.result?.state === "fail") await diagnostics.capture(task.name);
});

afterAll(async () => {
  for (const release of releases.splice(0)) release();
  await browserContext?.close();
  await browser?.close();
  if (roomId) await getContext().graphqlClient.mutation(DELETE_ROOM, { id: roomId }).toPromise();
});

describe("sensor history popover", () => {
  it("fetches once per open, ignores live updates and renders cached data before a delayed refresh", async () => {
    await page
      .locator("[data-dashboard-workstation] nav")
      .getByRole("button", { name: "History cache room" })
      .click();
    const trigger = page
      .locator("[data-dashboard-sensors]")
      .getByRole("button")
      .filter({ hasText: "°C" });
    await trigger.waitFor({ state: "visible" });
    await trigger.click();
    const popover = page.locator('[data-slot="popover-content"]');
    await popover.waitFor({ state: "visible" });
    await expect.poll(() => historyRequests).toBe(1);
    expect(await popover.innerText()).toContain("Loading");

    await publishDeviceState("Living Room Light", { state: "ON", brightness: 31 });
    await publishDeviceState("Living Room Sensor", { temperature: 20, humidity: 46 });
    await expect.poll(() => trigger.innerText()).toContain("20");
    expect(historyRequests).toBe(1);
    releases.shift()!();
    await popover.locator('[data-slot="chart"]').waitFor({ state: "visible" });

    await page.keyboard.press("Escape");
    await popover.waitFor({ state: "hidden" });
    await trigger.click();
    await popover.locator('[data-slot="chart"]').waitFor({ state: "visible" });
    await expect.poll(() => historyRequests).toBe(2);
    expect(await popover.innerText()).not.toContain("Loading");
    await publishDeviceState("Living Room Sensor", { temperature: 21, humidity: 47 });
    await expect.poll(() => trigger.innerText()).toContain("21");
    expect(historyRequests).toBe(2);
    releases.shift()!();
    await expect.poll(() => historyResponses).toBe(2);
  });

  it.each(["light", "dark"] as const)(
    "keeps a held touch tooltip above the finger without a native menu (%s)",
    async (colorScheme) => {
      const { appUrl, token } = getContext();
      const context = await browser.newContext({
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
        colorScheme,
        serviceWorkers: "block",
      });
      try {
        await context.addInitScript(
          (authToken) => localStorage.setItem("hive.token", authToken),
          token,
        );
        const mobilePage = await context.newPage();
        await mobilePage.goto(appUrl, { waitUntil: "domcontentloaded" });
        const card = mobilePage
          .locator('[role="button"]')
          .filter({ has: mobilePage.getByText("History cache room", { exact: true }) });
        await card.locator("button").filter({ hasText: "°C" }).tap();
        const popover = mobilePage.locator('[data-slot="popover-content"]');
        const chart = popover.locator('[data-slot="chart"]');
        await chart.waitFor({ state: "visible" });
        await mobilePage.evaluate((theme) => {
          document.documentElement.classList.toggle("dark", theme === "dark");
        }, colorScheme);
        const plot = chart.locator(".lc-tooltip-context");
        const bounds = await plot.boundingBox();
        if (!bounds) throw new Error("Missing chart bounds");
        await chart.evaluate((node) => {
          document.addEventListener(
            "touchstart",
            (event) => {
              node.setAttribute("data-touch-prevented", String(event.defaultPrevented));
            },
            { once: true },
          );
        });
        const touch = await context.newCDPSession(mobilePage);
        const point = { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height - 10 };
        await touch.send("Input.dispatchTouchEvent", {
          type: "touchStart",
          touchPoints: [{ ...point, id: 1 }],
        });
        const tooltip = chart.locator(".lc-tooltip-root");
        await tooltip.waitFor({ state: "visible" });
        expect(await chart.getAttribute("data-touch-prevented")).toBe("true");
        await mobilePage.waitForTimeout(1200);
        expect(await tooltip.isVisible()).toBe(true);
        expect(
          await chart.evaluate((node) => {
            const event = new MouseEvent("contextmenu", { bubbles: true, cancelable: true });
            node.dispatchEvent(event);
            return event.defaultPrevented;
          }),
        ).toBe(true);
        expect(await tooltip.isVisible()).toBe(true);
        for (const position of [
          point,
          { x: bounds.x + 3, y: bounds.y + 3 },
          { x: bounds.x + bounds.width - 3, y: bounds.y + 3 },
        ]) {
          await touch.send("Input.dispatchTouchEvent", {
            type: "touchMove",
            touchPoints: [{ ...position, id: 1 }],
          });
          await expect
            .poll(async () => {
              const box = await tooltip.boundingBox();
              return (
                !!box &&
                box.y + box.height <= position.y - 23 &&
                box.x >= 0 &&
                box.x + box.width <= 390
              );
            })
            .toBe(true);
        }
        expect(await mobilePage.evaluate(() => window.getSelection()?.toString())).toBe("");
        await touch.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
        await tooltip.waitFor({ state: "hidden" });
        expect(await popover.isVisible()).toBe(true);
      } finally {
        await context.close();
      }
    },
  );
});
