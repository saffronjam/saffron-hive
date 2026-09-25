import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import {
  chromium,
  type Browser,
  type BrowserContext,
  type Page,
  type WebSocketRoute,
} from "playwright-core";
import { graphql } from "$lib/gql";
import {
  DashboardBrowserCreateRoomDocument,
  DashboardBrowserAddMemberDocument,
  DashboardBrowserDeleteRoomDocument,
} from "$lib/gql/graphql";
import { getContext, publishDeviceState } from "./setup.js";
import { browserDiagnostics } from "./browser-diagnostics.js";

const DEVICE_ID = "0x00158d0001a2b3c4";
const UI_TIMEOUT = 30_000;

const DEVICE_STATE_QUERY = graphql(`
  query E2EWebSocketRecoveryDeviceState($id: ID!) {
    device(id: $id) {
      state {
        brightness
      }
    }
  }
`);

const LOGS_QUERY = graphql(`
  query E2EWebSocketRecoveryLogs {
    logs(limit: 1000) {
      message
      attrs
    }
  }
`);

interface ConnectionRecord {
  id: number;
  acknowledged: boolean;
  probes: number;
  probeResponses: number;
  recoveryReason?: string;
  previousCloseCode?: number;
}

const diagnostics = browserDiagnostics("websocket-recovery");

let browser: Browser;
let browserContext: BrowserContext;
let page: Page;
let connectionCount = 0;
let blockedConnection = 0;
let droppedNextConnection = 0;
let recoveryRoomID: string;
const connections: ConnectionRecord[] = [];
const sockets = new Map<number, WebSocketRoute>();

function textMessage(message: string | Buffer): string {
  return typeof message === "string" ? message : message.toString("utf8");
}

function routeSocket(socket: WebSocketRoute) {
  const id = ++connectionCount;
  const record: ConnectionRecord = { id, acknowledged: false, probes: 0, probeResponses: 0 };
  connections.push(record);
  sockets.set(id, socket);
  const server = socket.connectToServer();

  socket.onMessage((message) => {
    try {
      const parsed = JSON.parse(textMessage(message)) as {
        type?: string;
        payload?: { recoveryReason?: string; previousCloseCode?: number; hiveProbe?: number };
      };
      if (parsed.type === "ping" && parsed.payload?.hiveProbe !== undefined) record.probes++;
      if (parsed.type === "connection_init") {
        record.recoveryReason = parsed.payload?.recoveryReason;
        record.previousCloseCode = parsed.payload?.previousCloseCode;
      }
    } catch {
      // GraphQL WebSocket control messages are JSON; binary application frames
      // still pass through untouched if a transport adds them.
    }
    server.send(message);
  });
  server.onMessage((message) => {
    if (blockedConnection === id) return;
    let messageType: string | undefined;
    try {
      const parsed = JSON.parse(textMessage(message)) as {
        type?: string;
        payload?: { hiveProbe?: number };
      };
      if (parsed.type === "pong" && parsed.payload?.hiveProbe !== undefined)
        record.probeResponses++;
      messageType = parsed.type;
      if (parsed.type === "connection_ack") record.acknowledged = true;
    } catch {
      // Forward non-JSON frames without interpreting them.
    }
    if ((droppedNextConnection === id || droppedNextConnection === -1) && messageType === "next")
      return;
    socket.send(message);
  });
}

async function waitForBackendBrightness(expected: number) {
  const { graphqlClient } = getContext();
  await expect
    .poll(
      async () => {
        const result = await graphqlClient
          .query(DEVICE_STATE_QUERY, { id: DEVICE_ID }, { requestPolicy: "network-only" })
          .toPromise();
        return result.data?.device?.state?.brightness ?? null;
      },
      { timeout: 10_000 },
    )
    .toBe(expected);
}

async function brightnessValue(): Promise<number | null> {
  const slider = page
    .getByLabel("Living Room Light brightness", { exact: true })
    .locator('[role="slider"]');
  if ((await slider.count()) !== 1) return null;
  const value = await slider.getAttribute("aria-valuenow");
  return value === null ? null : Number(value);
}

beforeAll(async () => {
  const { token, graphqlClient } = getContext();
  const room = await graphqlClient
    .mutation(DashboardBrowserCreateRoomDocument, { name: "Recovery room" })
    .toPromise();
  if (!room.data || room.error) throw room.error ?? new Error("Room creation failed");
  recoveryRoomID = room.data.createRoom.id;
  const membership = await graphqlClient
    .mutation(DashboardBrowserAddMemberDocument, {
      input: { roomId: recoveryRoomID, memberType: "device", memberId: DEVICE_ID },
    })
    .toPromise();
  if (membership.error) throw membership.error;
  browser = await chromium.launch({ channel: "chrome", headless: true });
  browserContext = await browser.newContext({ serviceWorkers: "block" });
  await browserContext.addInitScript((authToken) => {
    localStorage.setItem("hive.token", authToken);
  }, token);
  await browserContext.routeWebSocket(/\/graphql$/, routeSocket);
  page = await browserContext.newPage();
  await diagnostics.start(page);
  await page.setViewportSize({ width: 1280, height: 900 });
}, 120_000);

afterEach(async ({ task }) => {
  if (task.result?.state === "fail") await diagnostics.capture(task.name);
});

afterAll(async () => {
  await browserContext?.close();
  await browser?.close();
  if (recoveryRoomID)
    await getContext()
      .graphqlClient.mutation(DashboardBrowserDeleteRoomDocument, { id: recoveryRoomID })
      .toPromise();
});

describe("browser WebSocket recovery", () => {
  it("refreshes missed state after a normal socket closure", async () => {
    const { appUrl } = getContext();
    await publishDeviceState("Living Room Light", { state: "ON", brightness: 75 });
    await waitForBackendBrightness(75);
    await page.goto(`${appUrl}/devices`, { waitUntil: "domcontentloaded" });
    await expect.poll(brightnessValue, { timeout: UI_TIMEOUT }).toBe(75);
    await expect.poll(() => connections.at(-1)?.acknowledged).toBe(true);
    const staleConnection = connectionCount;
    droppedNextConnection = staleConnection;
    await publishDeviceState("Living Room Light", { state: "ON", brightness: 175 });
    await waitForBackendBrightness(175);
    expect(await brightnessValue()).toBe(75);
    await sockets.get(staleConnection)!.close({ code: 1000, reason: "Normal closure" });
    await expect
      .poll(() => connectionCount, { timeout: UI_TIMEOUT })
      .toBeGreaterThan(staleConnection);
    await expect.poll(brightnessValue, { timeout: UI_TIMEOUT }).toBe(175);
    expect(connections.at(-1)?.previousCloseCode).toBe(1000);
  });

  it("detects a black-holed connection and reconciles missed state without a reload", async () => {
    const { appUrl } = getContext();
    droppedNextConnection = 0;
    await publishDeviceState("Living Room Light", { state: "ON", brightness: 41 });
    await waitForBackendBrightness(41);
    await page.goto(`${appUrl}/devices`, { waitUntil: "domcontentloaded" });
    await expect.poll(brightnessValue, { timeout: UI_TIMEOUT }).toBe(41);
    await expect.poll(() => connectionCount, { timeout: UI_TIMEOUT }).toBeGreaterThan(0);
    await expect
      .poll(() => connections.find((connection) => connection.id === connectionCount)?.acknowledged)
      .toBe(true);

    const staleConnection = connectionCount;
    blockedConnection = staleConnection;
    await publishDeviceState("Living Room Light", { state: "ON", brightness: 207 });
    await waitForBackendBrightness(207);
    expect(await brightnessValue()).toBe(41);

    const recoveryStartedAt = Date.now();
    await expect
      .poll(() => connectionCount, { timeout: 7_000, interval: 100 })
      .toBeGreaterThan(staleConnection);
    expect(Date.now() - recoveryStartedAt).toBeLessThan(7_000);
    await expect.poll(brightnessValue, { timeout: UI_TIMEOUT }).toBe(207);

    const recovered = connections.find((connection) => connection.id > staleConnection);
    expect(recovered).toMatchObject({
      recoveryReason: "heartbeat_timeout",
      previousCloseCode: 4499,
    });

    const { graphqlClient } = getContext();
    await expect
      .poll(
        async () => {
          const result = await graphqlClient
            .query(LOGS_QUERY, {}, { requestPolicy: "network-only" })
            .toPromise();
          return (
            result.data?.logs.find(
              (entry) =>
                entry.message === "GraphQL WebSocket recovered" &&
                entry.attrs.includes("heartbeat_timeout"),
            )?.attrs ?? null
          );
        },
        { timeout: UI_TIMEOUT },
      )
      .toContain("heartbeat_timeout");

    await page.goto(`${appUrl}/logs`, { waitUntil: "domcontentloaded" });
    await expect
      .poll(() => page.getByText("GraphQL WebSocket recovered", { exact: false }).count(), {
        timeout: UI_TIMEOUT,
      })
      .toBeGreaterThan(0);
    await expect
      .poll(() => page.getByText(/reason=heartbeat_timeout/).count(), { timeout: UI_TIMEOUT })
      .toBeGreaterThan(0);
  });

  it("reconciles missed state on repeated returns while retaining a responsive socket", async () => {
    const { appUrl } = getContext();
    blockedConnection = 0;
    droppedNextConnection = 0;
    await publishDeviceState("Living Room Light", { state: "ON", brightness: 61 });
    await waitForBackendBrightness(61);
    await page.goto(`${appUrl}/devices`, { waitUntil: "domcontentloaded" });
    await expect.poll(brightnessValue, { timeout: UI_TIMEOUT }).toBe(61);
    await expect
      .poll(() => connections.find((connection) => connection.id === connectionCount)?.acknowledged)
      .toBe(true);

    const staleConnection = connectionCount;
    droppedNextConnection = staleConnection;
    await publishDeviceState("Living Room Light", { state: "ON", brightness: 209 });
    await waitForBackendBrightness(209);
    expect(await brightnessValue()).toBe(61);

    await new Promise((resolve) => setTimeout(resolve, 4_000));
    expect(connectionCount).toBe(staleConnection);
    expect(await brightnessValue()).toBe(61);

    const record = connections.find((connection) => connection.id === staleConnection)!;
    for (let visit = 0; visit < 3; visit++) {
      const replies = record.probeResponses;
      await page.evaluate(() => window.dispatchEvent(new Event("focus")));
      await expect.poll(() => record.probeResponses, { timeout: 2_500 }).toBeGreaterThan(replies);
      await expect.poll(brightnessValue, { timeout: UI_TIMEOUT }).toBe(209);
      expect(connectionCount).toBe(staleConnection);
      await page.waitForTimeout(300);
    }
    await page.waitForTimeout(2_500);
    expect(connectionCount).toBe(staleConnection);
    droppedNextConnection = 0;
    await publishDeviceState("Living Room Light", { state: "ON", brightness: 210 });
    await expect.poll(brightnessValue, { timeout: UI_TIMEOUT }).toBe(210);
  });

  it("replaces an unresponsive socket when the app returns", async () => {
    const { appUrl } = getContext();
    blockedConnection = 0;
    droppedNextConnection = 0;
    await publishDeviceState("Living Room Light", { state: "ON", brightness: 80 });
    await waitForBackendBrightness(80);
    await page.goto(`${appUrl}/devices`, { waitUntil: "domcontentloaded" });
    await expect.poll(brightnessValue, { timeout: UI_TIMEOUT }).toBe(80);
    await expect.poll(() => connections.at(-1)?.acknowledged).toBe(true);
    await page.waitForTimeout(300);
    const staleConnection = connectionCount;
    blockedConnection = staleConnection;
    await page.evaluate(() => window.dispatchEvent(new Event("focus")));
    await expect
      .poll(() => connections.find((record) => record.id === staleConnection)?.probes)
      .toBeGreaterThan(0);
    await publishDeviceState("Living Room Light", { state: "ON", brightness: 180 });
    await expect.poll(() => connectionCount, { timeout: 4_000 }).toBeGreaterThan(staleConnection);
    expect(connections.at(-1)).toMatchObject({
      recoveryReason: "foreground",
      previousCloseCode: 4499,
    });
    await expect.poll(brightnessValue, { timeout: UI_TIMEOUT }).toBe(180);
  });

  it("keeps the mobile Apartment off while confirmations and recovery snapshots are delayed", async () => {
    const { appUrl } = getContext();
    blockedConnection = 0;
    droppedNextConnection = 0;
    for (const name of ["Bedroom Light", "Kitchen Light", "Living Room Light"]) {
      await publishDeviceState(name, { state: "ON", brightness: 124, color_temp: 300 });
    }
    await waitForBackendBrightness(124);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(appUrl, { waitUntil: "domcontentloaded" });
    const apartment = page.getByRole("button", { name: "Apartment", exact: true });
    const fill = () =>
      apartment.evaluate((node) =>
        parseFloat((node as HTMLElement).style.getPropertyValue("--brightness-fill")),
      );
    await expect.poll(fill, { timeout: UI_TIMEOUT }).toBeGreaterThan(0);
    await expect.poll(() => connections.at(-1)?.acknowledged).toBe(true);

    let releaseSnapshots!: () => void;
    const snapshotsBlocked = new Promise<void>((resolve) => {
      releaseSnapshots = resolve;
    });
    let snapshots = 0;
    const graphqlRoute = /\/graphql(?:\?|$)/;
    await page.route(graphqlRoute, async (route) => {
      const query =
        route.request().postData() ?? new URL(route.request().url()).searchParams.get("query");
      if (!query?.includes("query DevicesInit")) return route.continue();
      const response = await route.fetch();
      snapshots++;
      await snapshotsBlocked;
      await route.fulfill({ response });
    });
    droppedNextConnection = -1;
    await page.evaluate(() => window.dispatchEvent(new Event("focus")));
    await expect.poll(() => snapshots, { timeout: UI_TIMEOUT }).toBeGreaterThan(0);
    const commandResponse = page.waitForResponse(
      (response) => response.request().postData()?.includes("GroupCommandsSetTargetState") ?? false,
    );
    await apartment.click();
    const command = await (await commandResponse).json();
    expect(command.data?.setTargetState).toBe(true);
    await expect.poll(fill).toBe(0);
    const observed = await apartment.evaluateHandle((node) => {
      const samples: number[] = [];
      const observer = new MutationObserver(() =>
        samples.push(parseFloat((node as HTMLElement).style.getPropertyValue("--brightness-fill"))),
      );
      observer.observe(node, { attributes: true, attributeFilter: ["style"] });
      return { samples, observer };
    });
    try {
      for (const name of ["Bedroom Light", "Kitchen Light", "Living Room Light"]) {
        await publishDeviceState(name, { state: "OFF", brightness: 125 });
      }
      await waitForBackendBrightness(125);
      await page.waitForTimeout(12_000);
      expect(await fill()).toBe(0);
      await page.screenshot({ path: "/tmp/hive-mobile-pending-off.png" });
      releaseSnapshots();
      await expect.poll(() => snapshots, { timeout: UI_TIMEOUT }).toBeGreaterThan(1);
      droppedNextConnection = 0;
      const staleConnection = connectionCount;
      await sockets.get(staleConnection)!.close({ code: 1000, reason: "Normal closure" });
      await expect
        .poll(() => connectionCount, { timeout: UI_TIMEOUT })
        .toBeGreaterThan(staleConnection);
      await page.waitForTimeout(1_000);
      expect(await fill()).toBe(0);
      expect(await observed.evaluate(({ samples }) => samples.every((value) => value === 0))).toBe(
        true,
      );
      await page.screenshot({ path: "/tmp/hive-mobile-confirmed-off.png" });
      await publishDeviceState("Living Room Light", { state: "ON", brightness: 126 });
      await expect.poll(fill, { timeout: UI_TIMEOUT }).toBeGreaterThan(0);
    } finally {
      releaseSnapshots();
      droppedNextConnection = 0;
      await observed.evaluate(({ observer }) => observer.disconnect());
      await observed.dispose();
      await page.unroute(graphqlRoute);
    }
  });

  it.each(["compact", "desktop"])(
    "reconciles repeated %s brightness drags with missed updates without revisiting the tab",
    async (presentation) => {
      const { appUrl } = getContext();
      droppedNextConnection = 0;
      blockedConnection = 0;
      await publishDeviceState("Living Room Light", { state: "ON", brightness: 50 });
      await waitForBackendBrightness(50);
      await page.setViewportSize({ width: presentation === "compact" ? 900 : 1600, height: 900 });
      await page.goto(appUrl, { waitUntil: "domcontentloaded" });
      await page.getByRole("button", { name: "Recovery room", exact: true }).click();
      const panel =
        presentation === "compact"
          ? page.getByRole("dialog")
          : page.locator("[data-dashboard-panel]");
      const control =
        presentation === "compact"
          ? panel.locator(".dashboard-drag-lift").filter({ hasText: "Living Room Light" })
          : panel.getByRole("slider").first();
      const value = () =>
        control.evaluate(
          (node, compact) =>
            compact
              ? Math.round(
                  (parseFloat((node as HTMLElement).style.getPropertyValue("--brightness-fill")) *
                    254) /
                    100,
                )
              : Number(node.getAttribute("aria-valuenow")),
          presentation === "compact",
        );
      await expect.poll(value, { timeout: UI_TIMEOUT }).toBe(50);
      await expect.poll(() => connections.at(-1)?.acknowledged).toBe(true);
      const initialConnection = connectionCount;
      droppedNextConnection = -1;
      const commands: number[] = [];
      let snapshots = 0;
      const graphqlRoute = /\/graphql(?:\?|$)/;
      await page.route(graphqlRoute, async (route) => {
        const body = route.request().postData();
        const query = body ?? new URL(route.request().url()).searchParams.get("query");
        if (body && query?.includes("GroupCommandsSetTargetState")) {
          const input = JSON.parse(body) as { variables: { state: { brightness?: number } } };
          if (input.variables.state.brightness !== undefined)
            commands.push(input.variables.state.brightness);
        }
        if (query?.includes("query DevicesInit")) snapshots++;
        await route.continue();
      });
      try {
        for (const direction of [1, -1]) {
          const previous = await value();
          const bounds = await control.boundingBox();
          if (!bounds) throw new Error("Brightness control missing");
          const startX = bounds.x + bounds.width / 2;
          const y = bounds.y + bounds.height / 2;
          const distance = presentation === "compact" ? bounds.width * 0.35 : 120;
          await page.mouse.move(startX, y);
          await page.mouse.down();
          for (let step = 1; step <= 12; step++) {
            await page.mouse.move(startX + (direction * distance * step) / 12, y);
            await page.waitForTimeout(35);
          }
          await page.mouse.up();
          const requested = await value();
          expect(requested).not.toBe(previous);
          await expect.poll(() => commands.at(-1)).toBe(requested);
          const observed = await control.evaluateHandle((node, compact) => {
            const samples: number[] = [];
            const observer = new MutationObserver(() =>
              samples.push(
                compact
                  ? Math.round(
                      (parseFloat(
                        (node as HTMLElement).style.getPropertyValue("--brightness-fill"),
                      ) *
                        254) /
                        100,
                    )
                  : Number(node.getAttribute("aria-valuenow")),
              ),
            );
            observer.observe(node, {
              attributes: true,
              attributeFilter: compact ? ["style"] : ["aria-valuenow"],
            });
            return { samples, observer };
          }, presentation === "compact");
          try {
            const actual = Math.max(1, requested - 2);
            await publishDeviceState("Living Room Light", { state: "ON", brightness: actual });
            await waitForBackendBrightness(actual);
            await page.waitForTimeout(2_000);
            expect(await value()).toBe(requested);
            const beforeRefresh = snapshots;
            await page.screenshot({ path: `/tmp/hive-brightness-${presentation}-pending.png` });
            await expect
              .poll(() => snapshots, { timeout: UI_TIMEOUT })
              .toBeGreaterThan(beforeRefresh);
            await expect.poll(value, { timeout: UI_TIMEOUT }).toBe(actual);
            expect(
              await observed.evaluate(
                ({ samples }, old) => samples.every((sample) => sample !== old),
                previous,
              ),
            ).toBe(true);
          } finally {
            await observed.evaluate(({ observer }) => observer.disconnect());
            await observed.dispose();
          }
        }
        expect(connectionCount).toBe(initialConnection);
        droppedNextConnection = 0;
        await publishDeviceState("Living Room Light", { state: "ON", brightness: 80 });
        await expect.poll(value, { timeout: UI_TIMEOUT }).toBe(80);
        await page.screenshot({ path: `/tmp/hive-brightness-${presentation}-confirmed.png` });
      } finally {
        droppedNextConnection = 0;
        await page.unroute(graphqlRoute);
        if (presentation === "compact") {
          await page.keyboard.press("Escape");
          await page.getByRole("dialog").waitFor({ state: "hidden" });
        }
      }
    },
  );

  it("keeps expected socket shutdowns out of transport failure logs", async () => {
    const { graphqlClient } = getContext();
    const result = await graphqlClient
      .query(LOGS_QUERY, {}, { requestPolicy: "network-only" })
      .toPromise();
    expect(result.error).toBeUndefined();
    expect(
      result.data?.logs.filter((entry) => entry.message === "GraphQL WebSocket transport failed"),
    ).toEqual([]);
  });
});
