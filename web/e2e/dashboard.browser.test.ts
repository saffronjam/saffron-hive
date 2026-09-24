import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { chromium, type Browser, type BrowserContext, type Page } from "playwright-core";
import { graphql } from "$lib/gql";
import { SceneLightOverrideKind, SceneTargetType } from "$lib/gql/graphql";
import { getContext, publishDeviceState } from "./setup.js";

const CREATE_ROOM = graphql(`
  mutation DashboardBrowserCreateRoom($name: String!) {
    createRoom(input: { name: $name }) {
      id
    }
  }
`);
const ADD_MEMBER = graphql(`
  mutation DashboardBrowserAddMember($input: AddRoomMemberInput!) {
    addRoomMember(input: $input) {
      id
    }
  }
`);
const CREATE_SCENE = graphql(`
  mutation DashboardBrowserCreateScene($input: CreateSceneInput!) {
    createScene(input: $input) {
      id
    }
  }
`);
const DELETE_ROOM = graphql(`
  mutation DashboardBrowserDeleteRoom($id: ID!) {
    deleteRoom(id: $id)
  }
`);
const DELETE_SCENE = graphql(`
  mutation DashboardBrowserDeleteScene($id: ID!) {
    deleteScene(id: $id)
  }
`);

let browser: Browser;
let context: BrowserContext;
let page: Page;
const roomIds: string[] = [];
const sceneIds: string[] = [];
const lightId = "0x00158d0001a2b3c4";
const errors: string[] = [];
const commands: unknown[] = [];
const reportedPower = new Map<string, boolean | null | undefined>();
const panel = () => page.locator("[data-dashboard-panel]");
const navigator = () => page.locator("[data-dashboard-workstation] nav");

beforeAll(async () => {
  const { graphqlClient, appUrl, token } = getContext();
  for (let index = 0; index < 16; index++) {
    const result = await graphqlClient
      .mutation(CREATE_ROOM, { name: `Workspace room ${String(index + 1).padStart(2, "0")}` })
      .toPromise();
    if (!result.data || result.error) throw result.error ?? new Error("Room creation failed");
    roomIds.push(result.data.createRoom.id);
  }
  for (const memberId of [lightId, "0x00158d0004d5e6f7"]) {
    const result = await graphqlClient
      .mutation(ADD_MEMBER, { input: { roomId: roomIds[0], memberType: "device", memberId } })
      .toPromise();
    if (result.error) throw result.error;
  }
  for (let index = 0; index < 30; index++) {
    const result = await graphqlClient
      .mutation(CREATE_SCENE, {
        input: {
          name: `Workspace scene ${String(index + 1).padStart(2, "0")}`,
          definition: {
            targets: [{ targetType: SceneTargetType.Device, targetId: lightId }],
            lighting: {
              overrides: [
                {
                  deviceId: lightId,
                  kind: SceneLightOverrideKind.State,
                  state: { on: true, brightness: 123 },
                },
              ],
            },
            supportingStates: [],
          },
        },
      })
      .toPromise();
    if (!result.data || result.error) throw result.error ?? new Error("Scene creation failed");
    sceneIds.push(result.data.createScene.id);
  }
  await publishDeviceState("Living Room Light", { state: "ON", brightness: 100 });
  await publishDeviceState("Living Room Sensor", { temperature: 21, humidity: 44 });
  browser = await chromium.launch({ channel: "chrome", headless: true });
  context = await browser.newContext({
    viewport: { width: 1600, height: 800 },
    serviceWorkers: "block",
  });
  await context.addInitScript((authToken) => localStorage.setItem("hive.token", authToken), token);
  page = await context.newPage();
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("websocket", (socket) => {
    socket.on("framereceived", ({ payload }) => {
      const text = payload.toString();
      if (!text.includes("deviceStateChanged")) return;
      const frame = JSON.parse(text) as {
        payload?: {
          data?: { deviceStateChanged?: { deviceId: string; state: { on?: boolean | null } } };
        };
      };
      const update = frame.payload?.data?.deviceStateChanged;
      if (update) reportedPower.set(update.deviceId, update.state.on);
    });
  });
  page.on("request", (request) => {
    if (request.method() !== "POST" || !request.url().includes("/graphql")) return;
    const body = request.postDataJSON() as { query?: string; variables?: unknown };
    if (body.query?.includes("setTargetState")) commands.push(body.variables);
  });
  await page.goto(appUrl, { waitUntil: "domcontentloaded" });
}, 120_000);

afterAll(async () => {
  await context?.close();
  await browser?.close();
  const { graphqlClient } = getContext();
  for (const id of sceneIds) await graphqlClient.mutation(DELETE_SCENE, { id }).toPromise();
  for (const id of roomIds) await graphqlClient.mutation(DELETE_ROOM, { id }).toPromise();
});

describe("adaptive dashboard", () => {
  it("starts on Apartment and separates navigation from lighting controls", async () => {
    await panel().waitFor();
    expect(await navigator().locator('[aria-current="true"]').innerText()).toContain("Apartment");
    await expect
      .poll(() =>
        navigator()
          .getByRole("button", { name: /Workspace room 01/ })
          .evaluate((node) => getComputedStyle(node.parentElement!).opacity),
      )
      .toBe("0.75");
    expect(
      await navigator()
        .locator('[aria-current="true"]')
        .evaluate((node) => getComputedStyle(node.parentElement!).opacity),
    ).toBe("1");
    expect(
      await navigator()
        .locator('[aria-current="true"]')
        .evaluate((node) => getComputedStyle(node).filter),
    ).toBe("none");
    expect(await navigator().getByRole("slider").count()).toBe(0);
    expect(await navigator().innerText()).not.toContain("°C");
    expect(await navigator().locator('[class*="tint-fill-horizontal"]').count()).toBe(0);
    expect(
      await panel()
        .getByText(/Workspace scene/)
        .count(),
    ).toBe(0);
    expect(await panel().locator("[data-dashboard-sensors]").innerText()).toContain("Temperature");
    const historyLength = await page.evaluate(() => history.length);
    await navigator()
      .getByRole("button", { name: /Workspace room 01/ })
      .click();
    await expect.poll(() => panel().getAttribute("aria-label")).toBe("Workspace room 01");
    await expect
      .poll(() =>
        navigator()
          .getByRole("button", { name: /Workspace room 01/ })
          .evaluate((node) => getComputedStyle(node.parentElement!).opacity),
      )
      .toBe("1");
    await expect
      .poll(() =>
        navigator()
          .getByRole("button", { name: "Apartment", exact: true })
          .evaluate((node) => getComputedStyle(node.parentElement!).opacity),
      )
      .toBe("0.75");
    expect(await panel().getByRole("switch").count()).toBe(2);
    expect(await panel().getByRole("region", { name: "Scenes" }).count()).toBe(1);
    expect(commands).toHaveLength(0);
    expect(await page.evaluate(() => history.length)).toBe(historyLength);
    const toggleResponse = page.waitForResponse(
      (response) => response.request().postData()?.includes("setTargetState") ?? false,
    );
    await panel().getByRole("switch").first().click();
    await expect.poll(() => commands.length).toBe(1);
    expect(commands[0]).toEqual({
      target: { type: "DEVICE_SET", deviceIds: [lightId] },
      state: { on: false },
    });
    await (await toggleResponse).finished();
    await publishDeviceState("Living Room Light", { state: "OFF", brightness: 100 });
    await expect.poll(() => reportedPower.get(lightId)).toBe(false);
    await page.evaluate(
      () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve())),
    );
    await expect
      .poll(() => panel().getByRole("switch").first().getAttribute("aria-checked"))
      .toBe("false");
  });

  it("animates the room slider on live member updates without sending commands", async () => {
    const slider = panel().getByRole("slider").first();
    await publishDeviceState("Living Room Light", { state: "ON", brightness: 40 });
    await expect.poll(() => slider.getAttribute("aria-valuenow")).toBe("40");
    await expect.poll(() => slider.evaluate((node) => node.getAnimations().length)).toBe(0);
    const thumb = await slider.elementHandle();
    if (!thumb) throw new Error("Room brightness handle missing");
    await thumb.evaluate((node) => {
      node.addEventListener("transitionrun", (event) => {
        if (event instanceof TransitionEvent && event.propertyName === "left") {
          node.setAttribute("data-live-transition", "true");
        }
      });
    });
    const commandCount = commands.length;
    await publishDeviceState("Living Room Light", { state: "ON", brightness: 220 });
    await expect.poll(() => slider.getAttribute("aria-valuenow")).toBe("220");
    expect(await thumb.evaluate((node) => node.isConnected)).toBe(true);
    await expect.poll(() => slider.getAttribute("data-live-transition")).toBe("true");
    expect(commands).toHaveLength(commandCount);
    await thumb.dispose();
  });

  it("scrolls both panes independently and resets only the selected panel", async () => {
    await navigator().evaluate((node) => {
      node.scrollTop = 100;
    });
    await panel().evaluate((node) => {
      node.scrollTop = 200;
    });
    expect(await panel().evaluate((node) => node.scrollTop)).toBeGreaterThan(0);
    expect(await navigator().evaluate((node) => node.scrollTop)).toBe(100);
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
    await navigator()
      .getByRole("button", { name: /Workspace room 02/ })
      .click();
    await expect.poll(() => panel().getAttribute("aria-label")).toBe("Workspace room 02");
    expect(await panel().evaluate((node) => node.scrollTop)).toBe(0);
    expect(await navigator().evaluate((node) => node.scrollTop)).toBe(100);
    expect(await panel().getByRole("switch").count()).toBe(0);
    expect(await panel().getByText("Lights", { exact: true }).count()).toBe(0);
    expect(await panel().getByText("No lights in this room.", { exact: true }).count()).toBe(0);
  });

  it("carries the selected room across widths and Back closes the compact drawer", async () => {
    await navigator()
      .getByRole("button", { name: /Workspace room 01/ })
      .click();
    await page.setViewportSize({ width: 390, height: 844 });
    const drawer = page.locator('[data-slot="sheet-content"]');
    await drawer.waitFor();
    expect(await drawer.innerText()).toContain("Workspace room 01");
    expect(await drawer.getByRole("slider").count()).toBe(0);
    await page.setViewportSize({ width: 1600, height: 800 });
    await panel().waitFor();
    await drawer.waitFor({ state: "hidden" });
    expect(await panel().getAttribute("aria-label")).toBe("Workspace room 01");
    await page.setViewportSize({ width: 390, height: 844 });
    await drawer.waitFor();
    await page.goBack();
    await drawer.waitFor({ state: "hidden" });
    expect(new URL(page.url()).pathname).toBe("/");
    await page.setViewportSize({ width: 1600, height: 800 });
    await panel().waitFor();
    expect(await navigator().locator('[aria-current="true"]').innerText()).toContain("Apartment");
  });

  it("uses available content width and renders both themes without overflow", async () => {
    await page.setViewportSize({ width: 1200, height: 800 });
    await panel().waitFor({ state: "hidden" });
    expect(await page.locator('[role="button"].opacity-75').count()).toBe(0);
    expect(
      await page
        .getByRole("button", { name: /Workspace room 02/ })
        .evaluate((node) => getComputedStyle(node).opacity),
    ).toBe("1");
    await page.locator('[data-sidebar="trigger"]').click();
    await panel().waitFor();
    for (const dark of [false, true]) {
      await page.evaluate(
        (value) => document.documentElement.classList.toggle("dark", value),
        dark,
      );
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
      ).toBe(true);
      await page.screenshot({
        path: `/tmp/hive-workstation-${dark ? "dark" : "light"}.png`,
        animations: "disabled",
      });
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await panel().waitFor({ state: "hidden" });
    await page.screenshot({ path: "/tmp/hive-workstation-mobile.png" });
    expect(errors).toEqual([]);
  });

  it("keeps room selection on page navigation and supports keyboard selection", async () => {
    await page.setViewportSize({ width: 1600, height: 800 });
    await page.goto(`${getContext().appUrl}/rooms`, { waitUntil: "domcontentloaded" });
    await page.getByRole("link", { name: "Dashboard", exact: true }).click();
    await panel().waitFor();
    await navigator().getByRole("button", { name: "Workspace room 01", exact: true }).focus();
    await page.keyboard.press("Enter");
    await expect.poll(() => panel().getAttribute("aria-label")).toBe("Workspace room 01");
    await page.screenshot({ path: "/tmp/hive-workstation-room.png", animations: "disabled" });
    await page.getByRole("link", { name: "Devices", exact: true }).click();
    await expect.poll(() => new URL(page.url()).pathname).toBe("/devices");
    await page.goBack();
    await panel().waitFor();
    expect(await panel().getAttribute("aria-label")).toBe("Workspace room 01");
    await navigator().getByRole("button", { name: "Workspace room 02", exact: true }).click();
    await page.goBack();
    await expect.poll(() => new URL(page.url()).pathname).toBe("/rooms");
    expect(await page.locator("[data-dashboard-workstation]").count()).toBe(0);
    expect(errors).toEqual([]);
  });

  it("holds Apartment off through staggered reports and resumes confirmed live state", async () => {
    await page.getByRole("link", { name: "Dashboard", exact: true }).click();
    await panel().waitFor();
    await navigator().getByRole("button", { name: "Apartment", exact: true }).click();
    const slider = panel().getByRole("slider").first();
    const toggle = panel().getByRole("switch").first();
    await publishDeviceState("Living Room Light", { state: "ON", brightness: 40 });
    await publishDeviceState("Bedroom Light", { state: "ON", brightness: 120 });
    await publishDeviceState("Kitchen Light", { state: "ON", brightness: 230 });
    await expect.poll(() => slider.getAttribute("aria-valuenow")).toBe("130");

    await toggle.click();
    await expect.poll(() => toggle.getAttribute("aria-checked")).toBe("false");
    await expect.poll(() => slider.getAttribute("aria-valuenow")).toBe("0");
    const observed = await slider.evaluateHandle((node) => {
      const samples: string[] = [];
      const observer = new MutationObserver(() =>
        samples.push(node.getAttribute("aria-valuenow") ?? ""),
      );
      observer.observe(node, { attributes: true, attributeFilter: ["aria-valuenow"] });
      return { samples, observer };
    });
    await publishDeviceState("Living Room Light", { state: "OFF", brightness: 40 });
    await publishDeviceState("Bedroom Light", { state: "ON", brightness: 20 });
    await page.waitForTimeout(2_000);
    expect(await toggle.getAttribute("aria-checked")).toBe("false");
    expect(await slider.getAttribute("aria-valuenow")).toBe("0");
    expect(
      await observed.evaluate(({ samples }) => samples.every((sample) => sample === "0")),
    ).toBe(true);
    await observed.evaluate(({ observer }) => observer.disconnect());
    await observed.dispose();

    await publishDeviceState("Bedroom Light", { state: "OFF", brightness: 20 });
    await publishDeviceState("Kitchen Light", { state: "OFF", brightness: 230 });
    await publishDeviceState("Living Room Light", { state: "OFF", brightness: 41 });
    await expect.poll(() => reportedPower.get("0x00158d0002b3c4d5")).toBe(false);
    await expect.poll(() => reportedPower.get("0x00158d0003c4d5e6")).toBe(false);
    await publishDeviceState("Bedroom Light", { state: "ON", brightness: 170 });
    await expect.poll(() => slider.getAttribute("aria-valuenow")).toBe("170");
    expect(await toggle.getAttribute("aria-checked")).toBe("true");
    expect(errors).toEqual([]);
  });
});
