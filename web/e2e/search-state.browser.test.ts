import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  chromium,
  type Browser,
  type BrowserContext,
  type Page,
  type Route,
} from "playwright-core";
import { graphql } from "$lib/gql";
import { AlarmKind, AlarmSeverity, EffectKind } from "$lib/gql/graphql";
import { getContext, publishDeviceState } from "./setup.js";

const CREATE_SEARCH_FIXTURES = graphql(`
  mutation BrowserSearchCreateFixtures(
    $room: CreateRoomInput!
    $group: CreateGroupInput!
    $scene: CreateSceneInput!
    $automation: CreateAutomationInput!
    $effect: CreateEffectInput!
    $alarm: RaiseAlarmInput!
  ) {
    room: createRoom(input: $room) {
      id
    }
    group: createGroup(input: $group) {
      id
    }
    scene: createScene(input: $scene) {
      id
    }
    automation: createAutomation(input: $automation) {
      id
    }
    effect: createEffect(input: $effect) {
      id
    }
    alarm: raiseAlarm(input: $alarm) {
      id
    }
  }
`);

const DELETE_SEARCH_FIXTURES = graphql(`
  mutation BrowserSearchDeleteFixtures(
    $roomId: ID!
    $groupId: ID!
    $sceneId: ID!
    $automationId: ID!
    $effectId: ID!
    $alarmId: ID!
  ) {
    deleteRoom(id: $roomId)
    deleteGroup(id: $groupId)
    deleteScene(id: $sceneId)
    deleteAutomation(id: $automationId)
    deleteEffect(id: $effectId)
    deleteAlarm(alarmId: $alarmId)
  }
`);

const SEARCH_MAINTENANCE_TASKS = graphql(`
  query BrowserSearchMaintenanceTasks {
    maintenanceTasks {
      kind
    }
  }
`);

interface FixtureIds {
  roomId: string;
  groupId: string;
  sceneId: string;
  automationId: string;
  effectId: string;
  alarmId: string;
}

interface SearchRoute {
  pathname: string;
  query: string;
  filter?: string;
  visibleText: string;
  operation: string;
}

let browser: Browser;
let browserContext: BrowserContext;
let browserPage: Page;
let fixtureIds: FixtureIds | null = null;

beforeAll(async () => {
  const { graphqlClient, appUrl, token } = getContext();
  const created = await graphqlClient
    .mutation(CREATE_SEARCH_FIXTURES, {
      room: { name: "Plan 02 Room" },
      group: { name: "Plan 02 Group" },
      scene: { name: "Plan 02 Scene", actions: [] },
      automation: { name: "Plan 02 Automation", enabled: false, nodes: [], edges: [] },
      effect: {
        name: "Plan 02 Effect",
        kind: EffectKind.Timeline,
        loop: false,
        durationMs: 0,
        tracks: [],
      },
      alarm: {
        alarmId: "plan-02-maintenance",
        severity: AlarmSeverity.High,
        kind: AlarmKind.OneShot,
        message: "Plan 02 battery replacement",
        source: "browser-test",
      },
    })
    .toPromise();
  if (created.error || !created.data) {
    throw created.error ?? new Error("search fixtures were not created");
  }
  fixtureIds = {
    roomId: created.data.room.id,
    groupId: created.data.group.id,
    sceneId: created.data.scene.id,
    automationId: created.data.automation.id,
    effectId: created.data.effect.id,
    alarmId: created.data.alarm.id,
  };

  await publishDeviceState("Living Room Light", { state: "ON", brightness: 123 });
  await publishDeviceState("Door sensor T1", { battery: 25 });
  const maintenanceDeadline = Date.now() + 80_000;
  let batteryTaskReady = false;
  while (Date.now() < maintenanceDeadline) {
    const result = await graphqlClient
      .query(SEARCH_MAINTENANCE_TASKS, {}, { requestPolicy: "network-only" })
      .toPromise();
    batteryTaskReady =
      result.data?.maintenanceTasks.some((task) => task.kind === "BATTERY") ?? false;
    if (batteryTaskReady) break;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  if (!batteryTaskReady) throw new Error("battery maintenance task was not ready");

  browser = await chromium.launch({ channel: "chrome", headless: true });
  browserContext = await browser.newContext({ serviceWorkers: "block" });
  await browserContext.addInitScript((authToken) => {
    localStorage.setItem("hive.token", authToken);
  }, token);
  browserPage = await browserContext.newPage();
  await browserPage.goto(appUrl, { waitUntil: "domcontentloaded" });
}, 120_000);

afterAll(async () => {
  await browserContext?.close();
  await browser?.close();
  if (!fixtureIds) return;
  const { graphqlClient } = getContext();
  await graphqlClient.mutation(DELETE_SEARCH_FIXTURES, fixtureIds).toPromise();
});

async function waitForFilteredRow(page: Page, text: string): Promise<void> {
  const matches = page.getByText(text, { exact: true });
  const deadline = Date.now() + 10_000;
  while (Date.now() < deadline) {
    if ((await matches.count()) >= 2) return;
    await page.waitForTimeout(50);
  }
  throw new Error(`filtered row ${JSON.stringify(text)} was not visible`);
}

function assertSearchUrl(page: Page, route: SearchRoute): void {
  const url = new URL(page.url());
  expect(url.pathname).toBe(route.pathname);
  expect(url.searchParams.get("q")).toBe(route.query);
  expect(url.searchParams.getAll("filter")).toEqual(route.filter ? [route.filter] : []);
  if (route.pathname === "/integrations") expect(url.searchParams.get("add")).toBe("1");
}

async function delayOperation(
  page: Page,
  operation: string,
): Promise<{
  seen: Promise<void>;
  release: () => void;
  requests: string[];
}> {
  let releaseRequest = () => {};
  let markSeen = () => {};
  const released = new Promise<void>((resolve) => {
    releaseRequest = resolve;
  });
  const seen = new Promise<void>((resolve) => {
    markSeen = resolve;
  });
  let held = false;
  const requests: string[] = [];
  const handler = async (route: Route) => {
    if (new URL(route.request().url()).pathname !== "/graphql") {
      await route.continue();
      return;
    }
    let operationName = "";
    let requestText = `${route.request().url()} ${route.request().postData() ?? ""}`;
    try {
      const body = route.request().postDataJSON() as { operationName?: string; query?: string };
      operationName = body.operationName ?? "";
      requestText = body.query ?? requestText;
    } catch {
      requestText += new URL(route.request().url()).searchParams.get("query") ?? "";
    }
    requests.push(`${operationName} ${requestText.slice(0, 200)}`);
    if (!held && (operationName === operation || requestText.includes(operation))) {
      held = true;
      markSeen();
      await released;
    }
    await route.continue();
  };
  await page.context().route("**/*", handler);
  return { seen, release: releaseRequest, requests };
}

describe("URL-backed search restoration", () => {
  it("keeps editor header actions after cancelling navigation", async () => {
    const { appUrl } = getContext();
    await browserPage.goto(`${appUrl}/rooms?edit=${fixtureIds!.roomId}`, {
      waitUntil: "domcontentloaded",
    });
    await browserPage.locator("#room-name").fill("Plan 02 Room changed");
    await expect.poll(() => browserPage.getByRole("button", { name: "Save" }).count()).toBe(1);

    await browserPage.getByRole("link", { name: "Devices" }).click();
    await expect
      .poll(() => browserPage.getByText("Unsaved changes", { exact: true }).count())
      .toBe(1);
    await browserPage.getByRole("button", { name: "Stay" }).click();

    expect(new URL(browserPage.url()).pathname).toBe("/rooms");
    expect(new URL(browserPage.url()).searchParams.get("edit")).toBe(fixtureIds!.roomId);
    await expect.poll(() => browserPage.getByRole("button", { name: "Save" }).count()).toBe(1);

    await browserPage.getByRole("link", { name: "Devices" }).click();
    await browserPage.getByRole("button", { name: "Discard and leave" }).click();
    await browserPage.waitForURL("**/devices");
  });

  it("restores the searchbar when browser history moves forward to a cached list", async () => {
    const { appUrl } = getContext();
    await browserPage.goto(`${appUrl}/profile`, { waitUntil: "domcontentloaded" });
    await browserPage.goto(`${appUrl}/devices?q=Living+Room+Light`, {
      waitUntil: "domcontentloaded",
    });
    await waitForFilteredRow(browserPage, "Living Room Light");

    await browserPage.goBack({ waitUntil: "domcontentloaded" });
    expect(new URL(browserPage.url()).pathname).toBe("/profile");
    await browserPage.goForward({ waitUntil: "domcontentloaded" });

    await waitForFilteredRow(browserPage, "Living Room Light");
    const searchText = await browserPage
      .locator("main input[type=text]")
      .first()
      .evaluate((input) => input.closest('[role="presentation"]')?.textContent ?? "");
    expect(searchText).toContain("Living Room Light");
    await expect.poll(() => browserPage.getByText("Door sensor T1", { exact: true }).count()).toBe(0);
    expect(new URL(browserPage.url()).searchParams.get("q")).toBe("Living Room Light");
  });

  it("restores every search surface across navigation and reload", async () => {
    const { appUrl } = getContext();
    const routes: SearchRoute[] = [
      {
        pathname: "/devices",
        query: "Living Room Light",
        filter: "type:light",
        visibleText: "Living Room Light",
        operation: "DevicesInit",
      },
      {
        pathname: "/rooms",
        query: "Plan 02 Room",
        filter: "empty:yes",
        visibleText: "Plan 02 Room",
        operation: "RoomsStore",
      },
      {
        pathname: "/groups",
        query: "Plan 02 Group",
        filter: "empty:yes",
        visibleText: "Plan 02 Group",
        operation: "GroupsStore",
      },
      {
        pathname: "/scenes",
        query: "Plan 02 Scene",
        filter: "empty:yes",
        visibleText: "Plan 02 Scene",
        operation: "ScenesStore",
      },
      {
        pathname: "/automations",
        query: "Plan 02 Automation",
        filter: "enabled:no",
        visibleText: "Plan 02 Automation",
        operation: "AutomationsStore",
      },
      {
        pathname: "/effects",
        query: "Plan 02 Effect",
        filter: "kind:timeline",
        visibleText: "Plan 02 Effect",
        operation: "EffectsStore",
      },
      {
        pathname: "/alarms",
        query: "Plan 02 battery replacement",
        filter: "severity:HIGH",
        visibleText: "Plan 02 battery replacement",
        operation: "ActiveAlarms",
      },
      {
        pathname: "/maintenance",
        query: "Door sensor T1",
        filter: "maintenance:BATTERY",
        visibleText: "Door sensor T1",
        operation: "MaintenanceTasks",
      },
      {
        pathname: "/activity",
        query: "Living Room Light",
        filter: "type:device.state_changed",
        visibleText: "Living Room Light",
        operation: "Activity",
      },
      {
        pathname: "/users",
        query: "e2e",
        visibleText: "e2e",
        operation: "UsersList",
      },
      {
        pathname: "/integrations",
        query: "Tuya",
        visibleText: "Tuya",
        operation: "IntegrationsPage",
      },
    ];

    for (const route of routes) {
      const url = new URL(route.pathname, appUrl);
      url.searchParams.set("q", route.query);
      if (route.filter) url.searchParams.append("filter", route.filter);
      if (route.pathname === "/integrations") url.searchParams.set("add", "1");
      await browserPage.goto(url.toString(), { waitUntil: "domcontentloaded" });
      await waitForFilteredRow(browserPage, route.visibleText);
      assertSearchUrl(browserPage, route);

      if (route.pathname === "/rooms" || route.pathname === "/groups") {
        const kind = route.pathname === "/rooms" ? "room" : "group";
        const editUrl = new URL(browserPage.url());
        editUrl.searchParams.set(
          "edit",
          kind === "room" ? fixtureIds!.roomId : fixtureIds!.groupId,
        );
        await browserPage.goto(editUrl.toString(), { waitUntil: "domcontentloaded" });
        expect(new URL(browserPage.url()).searchParams.get("edit")).toBe(
          kind === "room" ? fixtureIds!.roomId : fixtureIds!.groupId,
        );
        assertSearchUrl(browserPage, route);
        await browserPage.goBack({ waitUntil: "domcontentloaded" });
      } else if (route.pathname === "/integrations") {
        await browserPage.locator("button").filter({ hasText: "Tuya" }).last().click();
        await browserPage.waitForURL("**/integrations/tuya");
        await browserPage.goBack({ waitUntil: "domcontentloaded" });
      } else {
        await browserPage.goto(`${appUrl}/profile`, { waitUntil: "domcontentloaded" });
        await browserPage.goBack({ waitUntil: "domcontentloaded" });
      }
      await waitForFilteredRow(browserPage, route.visibleText);
      assertSearchUrl(browserPage, route);

      await browserPage.waitForTimeout(350);
      const delayed = await delayOperation(browserPage, route.operation);
      await browserPage.reload({ waitUntil: "domcontentloaded" });
      await Promise.race([
        delayed.seen,
        new Promise<never>((_, reject) =>
          setTimeout(
            () =>
              reject(
                new Error(
                  `${route.operation} did not revalidate; requests: ${delayed.requests.join(" | ")}`,
                ),
              ),
            10_000,
          ),
        ),
      ]);
      await waitForFilteredRow(browserPage, route.visibleText);
      assertSearchUrl(browserPage, route);
      delayed.release();
      await browserPage.context().unrouteAll({ behavior: "wait" });
    }

    const cachedKeys = await browserPage.evaluate(() =>
      Object.keys(sessionStorage).filter((key) => key.startsWith("hive:session-cache:")),
    );
    expect(cachedKeys.length).toBeGreaterThan(0);
    await browserPage.getByRole("button", { name: "Close" }).click();
    await browserPage.waitForFunction(() => !new URL(window.location.href).searchParams.has("add"));
    expect(new URL(browserPage.url()).searchParams.get("q")).toBe("Tuya");
    await browserPage.getByText(/^Log out \(/).click();
    await browserPage.waitForURL("**/login");
    const remainingKeys = await browserPage.evaluate(() =>
      Object.keys(sessionStorage).filter((key) => key.startsWith("hive:session-cache:")),
    );
    expect(remainingKeys).toEqual([]);
  }, 180_000);
});
