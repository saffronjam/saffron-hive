import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  chromium,
  type Browser,
  type BrowserContext,
  type Page,
  type WebSocketRoute,
} from "playwright-core";
import { graphql } from "$lib/gql";
import { getContext, publishDeviceState } from "./setup.js";

const DEVICE_ID = "0x00158d0001a2b3c4";
const UI_TIMEOUT = 20_000;

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
  recoveryReason?: string;
  previousCloseCode?: number;
}

let browser: Browser;
let browserContext: BrowserContext;
let page: Page;
let connectionCount = 0;
let blockedConnection = 0;
const connections: ConnectionRecord[] = [];

function textMessage(message: string | Buffer): string {
  return typeof message === "string" ? message : message.toString("utf8");
}

function routeSocket(socket: WebSocketRoute) {
  const id = ++connectionCount;
  const record: ConnectionRecord = { id, acknowledged: false };
  connections.push(record);
  const server = socket.connectToServer();

  socket.onMessage((message) => {
    try {
      const parsed = JSON.parse(textMessage(message)) as {
        type?: string;
        payload?: { recoveryReason?: string; previousCloseCode?: number };
      };
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
    try {
      const parsed = JSON.parse(textMessage(message)) as { type?: string };
      if (parsed.type === "connection_ack") record.acknowledged = true;
    } catch {
      // Forward non-JSON frames without interpreting them.
    }
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
  const { token } = getContext();
  browser = await chromium.launch({ channel: "chrome", headless: true });
  browserContext = await browser.newContext({ serviceWorkers: "block" });
  await browserContext.addInitScript((authToken) => {
    localStorage.setItem("hive.token", authToken);
  }, token);
  await browserContext.routeWebSocket(/\/graphql$/, routeSocket);
  page = await browserContext.newPage();
  await page.setViewportSize({ width: 1280, height: 900 });
}, 120_000);

afterAll(async () => {
  await browserContext?.close();
  await browser?.close();
});

describe("browser WebSocket recovery", () => {
  it("detects a black-holed connection and reconciles missed state without a reload", async () => {
    const { appUrl } = getContext();
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
            result.data?.logs.find((entry) => entry.message === "GraphQL WebSocket recovered")
              ?.attrs ?? null
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

  it("replaces the socket immediately when the app returns to the foreground", async () => {
    const { appUrl } = getContext();
    blockedConnection = 0;
    await publishDeviceState("Living Room Light", { state: "ON", brightness: 61 });
    await waitForBackendBrightness(61);
    await page.goto(`${appUrl}/devices`, { waitUntil: "domcontentloaded" });
    await expect.poll(brightnessValue, { timeout: UI_TIMEOUT }).toBe(61);
    await expect
      .poll(() => connections.find((connection) => connection.id === connectionCount)?.acknowledged)
      .toBe(true);

    await page.evaluate(() => {
      Object.defineProperty(document, "visibilityState", {
        configurable: true,
        value: "hidden",
      });
      document.dispatchEvent(new Event("visibilitychange"));
    });

    const staleConnection = connectionCount;
    blockedConnection = staleConnection;
    await publishDeviceState("Living Room Light", { state: "ON", brightness: 209 });
    await waitForBackendBrightness(209);
    expect(await brightnessValue()).toBe(61);

    const recoveryStartedAt = Date.now();
    await page.evaluate(() => {
      Object.defineProperty(document, "visibilityState", {
        configurable: true,
        value: "visible",
      });
      document.dispatchEvent(new Event("visibilitychange"));
    });
    await expect
      .poll(() => connectionCount, { timeout: 2_500, interval: 50 })
      .toBeGreaterThan(staleConnection);
    expect(Date.now() - recoveryStartedAt).toBeLessThan(2_500);
    await expect.poll(brightnessValue, { timeout: UI_TIMEOUT }).toBe(209);

    const recovered = connections.find((connection) => connection.id > staleConnection);
    expect(recovered?.recoveryReason).toBe("foreground");
  });
});
