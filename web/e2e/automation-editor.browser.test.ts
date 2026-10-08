import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { chromium, type Browser, type BrowserContext, type Page } from "playwright-core";
import { graphql } from "$lib/gql";
import { Language } from "$lib/gql/graphql";
import { getContext } from "./setup.js";

const CREATE_AUTOMATION = graphql(`
  mutation BrowserAutomationEditorCreate($input: CreateAutomationInput!) {
    createAutomation(input: $input) {
      id
    }
  }
`);

const AUTOMATION_CONFIG = graphql(`
  query BrowserAutomationEditorConfig($id: ID!) {
    automation(id: $id) {
      definitions
      nodes {
        id
        type
        config
      }
    }
  }
`);

const DELETE_AUTOMATION = graphql(`
  mutation BrowserAutomationEditorDelete($id: ID!) {
    deleteAutomation(id: $id)
  }
`);

const SET_LANGUAGE = graphql(`
  mutation BrowserAutomationEditorSetLanguage($language: Language!) {
    updateCurrentUser(input: { language: $language }) {
      language
    }
  }
`);

let browser: Browser;
let context: BrowserContext;
let page: Page;
let automationId: string | null = null;
const triggerId = "t1";
const actionId = "a1";
let pageErrors: string[] = [];

beforeAll(async () => {
  browser = await chromium.launch({ channel: "chrome", headless: true });
});

beforeEach(async () => {
  pageErrors = [];
  const { graphqlClient, token, appUrl } = getContext();
  await graphqlClient.mutation(SET_LANGUAGE, { language: Language.En }).toPromise();
  const created = await graphqlClient
    .mutation(CREATE_AUTOMATION, {
      input: {
        name: "Compact node editor",
        enabled: false,
        nodes: [
          {
            id: triggerId,
            type: "trigger",
            config: JSON.stringify({ kind: "schedule", cron_expr: "0 13 7 * * TUE" }),
          },
          {
            id: actionId,
            type: "action",
            config: JSON.stringify({
              action_type: "toggle_device_state",
              target_type: "device",
              target_id: "0x00158d0001a2b3c4",
              payload: "",
            }),
          },
        ],
        edges: [{ fromNodeId: triggerId, toNodeId: actionId }],
      },
    })
    .toPromise();
  if (created.error || !created.data) throw created.error ?? new Error("Automation fixture missing");
  automationId = created.data.createAutomation.id;
  context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, serviceWorkers: "block" });
  await context.addInitScript((authToken) => localStorage.setItem("hive.token", authToken), token);
  page = await context.newPage();
  page.setDefaultTimeout(10_000);
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.goto(`${appUrl}/automations/${automationId}`, { waitUntil: "domcontentloaded" });
  await page.locator(".svelte-flow__node").nth(1).waitFor();
});

afterEach(async () => {
  await context?.close();
  const { graphqlClient } = getContext();
  if (automationId) await graphqlClient.mutation(DELETE_AUTOMATION, { id: automationId }).toPromise();
  automationId = null;
  expect(pageErrors).toEqual([]);
});

afterAll(async () => {
  await browser?.close();
});

function node(id: string) {
  return page.locator(`.svelte-flow__node[data-id="${id}"]`);
}

const panel = () => page.locator("[data-node-panel]");

async function nodeHeights(): Promise<number[]> {
  return page.locator(".svelte-flow__node").evaluateAll((nodes) =>
    nodes.map((element) => Math.round(element.getBoundingClientRect().height)),
  );
}

/** A point on empty canvas below the graph, clear of the panel and controls. */
async function emptyCanvasPoint(): Promise<{ x: number; y: number }> {
  const pane = await page.locator(".svelte-flow__pane").boundingBox();
  if (!pane) throw new Error("canvas pane missing");
  return { x: pane.x + pane.width * 0.35, y: pane.y + pane.height - 60 };
}

describe("automation editor nodes", () => {
  it("shows compact summaries and edits in a panel that a canvas click closes", async () => {
    expect(await nodeHeights()).toEqual([72, 72]);
    expect(await node(triggerId).textContent()).toContain("07:13");
    expect(await page.locator('.svelte-flow__node [data-slot="select-trigger"]').count()).toBe(0);

    await node(triggerId).dblclick();
    await panel().waitFor();
    expect(await panel().locator('[data-slot="select-trigger"]').count()).toBeGreaterThan(0);

    const start = await emptyCanvasPoint();
    await page.mouse.move(start.x, start.y);
    await page.mouse.down();
    await page.mouse.move(start.x + 80, start.y - 40, { steps: 8 });
    await page.mouse.up();
    expect(await panel().count()).toBe(1);
    // The pan library swallows a click that lands right after a pan ends.
    await page.waitForTimeout(500);

    const point = await emptyCanvasPoint();
    await page.mouse.click(point.x, point.y);
    await panel().waitFor({ state: "detached" });

    await node(actionId).dblclick();
    await panel().waitFor();
    await page.keyboard.press("Escape");
    await panel().waitFor({ state: "detached" });
  });

  it("keeps node sizes in Live and opens the panel read-only", async () => {
    await page.getByRole("button", { name: "Live", exact: true }).click();
    expect(await nodeHeights()).toEqual([72, 72]);

    await node(triggerId).dblclick();
    await panel().waitFor();
    const triggers = panel().locator('[data-slot="select-trigger"]');
    expect(await triggers.count()).toBeGreaterThan(0);
    expect(await triggers.first().isDisabled()).toBe(true);
  });

  it("shows the automation by name in the Code view and completes keys by display name", async () => {
    await page.getByRole("button", { name: "Code", exact: true }).click();
    const editor = page.locator(".cm-content");
    await editor.waitFor();
    const printed = await editor.innerText();
    expect(printed).toContain('"toggle"');
    expect(printed).not.toContain("0x00158d0001a2b3c4");
    const deviceName = /"toggle": \{ "device": "([^"]+)"/.exec(printed)?.[1];
    expect(deviceName).toBeTruthy();

    await editor.click();
    await page.keyboard.press("Control+a");
    await page.keyboard.press("Delete");
    await page.keyboard.insertText(`{
  "name": "Compact node editor",
  "define": { "night": { "time": { "between": ["22:00", "06:00"] } } },
  "rules": [
    {
      "when": { "schedule": { "at": "07:13", "days": ["tue"] } },
      "if": "$night",
      "do": { "to`);
    await page.keyboard.type("g");
    const option = page.locator(".cm-tooltip-autocomplete li", { hasText: "Toggle state" });
    await option.waitFor();
    // The completion list ignores Enter for a moment after it opens.
    await page.waitForTimeout(200);
    await page.keyboard.press("Enter");
    await page.keyboard.insertText(`"device": ${JSON.stringify(deviceName)}`);
    await page.keyboard.press("Control+End");
    await page.keyboard.insertText(" }\n    }\n  ]\n}");
    expect(await editor.innerText()).toContain('"toggle": { "device"');

    await page.getByRole("button", { name: "Visual", exact: true }).click();
    await page.locator(".svelte-flow__node", { hasText: "$night" }).waitFor();
    await page.getByRole("button", { name: "Save", exact: true }).click();

    const { graphqlClient } = getContext();
    let saved: { definitions: string; nodes: { type: string; config: string }[] } | null = null;
    for (let attempt = 0; attempt < 20 && !saved?.definitions.includes("night"); attempt++) {
      await page.waitForTimeout(200);
      const result = await graphqlClient
        .query(AUTOMATION_CONFIG, { id: automationId! }, { requestPolicy: "network-only" })
        .toPromise();
      saved = result.data?.automation ?? null;
    }
    expect(JSON.parse(saved!.definitions)).toEqual({
      night: { kind: "condition", expr: 'time.between("22:00", "06:00")' },
    });
    const configs = saved!.nodes.map((node) => JSON.parse(node.config));
    expect(configs).toContainEqual({ use: "night" });
    expect(configs).toContainEqual(
      expect.objectContaining({ action_type: "toggle_device_state", target_id: "0x00158d0001a2b3c4" }),
    );

    await page.reload({ waitUntil: "domcontentloaded" });
    await page.locator(".svelte-flow__node").nth(1).waitFor();
    await page.getByRole("button", { name: "Code", exact: true }).click();
    await editor.waitFor();
    const reopened = await editor.innerText();
    expect(reopened).toContain('"night": { "time": { "between": ["22:00", "06:00"] } }');
    expect(reopened).toContain('"if": "$night"');
  });
});
