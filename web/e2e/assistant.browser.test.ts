import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { chromium, type Browser, type BrowserContext, type Page } from "playwright-core";
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { getContext } from "./setup.js";

let browser: Browser;
let context: BrowserContext;
let page: Page;
let fixtureDir = "";
const errors: string[] = [];
async function api(query: string, variables: Record<string, unknown> = {}) {
  const { graphqlUrl, token } = getContext();
  const r = await fetch(graphqlUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ query, variables }),
  });
  const result = await r.json();
  if (result.errors) throw new Error(JSON.stringify(result.errors));
  return result.data;
}
async function config(enabled: boolean) {
  const current = await api(`query { claudeConfig { revision } }`);
  await api(`mutation($input:ClaudeConfigInput!, $revision:Int!){updateClaudeConfig(input:$input, expectedRevision:$revision){enabled}}`, {
    revision: current.claudeConfig?.revision ?? 0,
    input: { token: "fixture-token", enabled, model: "fable" },
  });
}
async function newChat() {
  const previous = page.url();
  await page.getByRole("button", { name: "New chat", exact: true }).first().click();
  await expect.poll(() => page.url()).not.toBe(previous);
  await expect
    .poll(() => page.getByRole("button", { name: "New chat", exact: true }).first().isEnabled())
    .toBe(true);
  await page.getByRole("textbox", { name: "Ask Hive…" }).waitFor();
}
async function send(text: string) {
  await page.getByRole("textbox", { name: "Ask Hive…" }).fill(text);
  await page.getByRole("button", { name: "Send message" }).click();
}
beforeAll(async () => {
  const { app, appUrl, token } = getContext();
  const version = await app.exec(["claude", "--version"]);
  expect(version.exitCode).toBe(0);
  expect(version.output).toContain("2.1.296");
  const catalog = await api(`mutation { discoverClaudeModels(token:"container-catalog-check") { id name } }`);
  expect(catalog.discoverClaudeModels.length).toBeGreaterThan(0);
  expect(catalog.discoverClaudeModels.every((model: { id: string; name: string }) => model.id && model.name)).toBe(true);
  fixtureDir = mkdtempSync(resolve(tmpdir(), "hive-claude-fixture-"));
  const binary = resolve(fixtureDir, "claude");
  execFileSync("go", ["build", "-tags=e2e", "-o", binary, "./web/e2e/fixtures/claude"], {
    cwd: resolve(import.meta.dirname, "../.."),
    env: { ...process.env, CGO_ENABLED: "0" },
  });
  await app.exec(["mv", "/usr/local/bin/claude", "/usr/local/bin/claude-real"]);
  await app.copyFilesToContainer([{ source: binary, target: "/usr/local/bin/claude" }]);
  await app.exec(["chmod", "755", "/usr/local/bin/claude"]);
  browser = await chromium.launch({ channel: "chrome", headless: true });
  context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    serviceWorkers: "block",
  });
  await context.addInitScript((token) => {
    localStorage.setItem("hive.token", token);
  }, token);
  page = await context.newPage();
  page.setDefaultTimeout(12000);
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(appUrl, { waitUntil: "domcontentloaded" });
});
afterEach(async ({ task }) => {
  if (task.result?.state === "fail" && page && !page.isClosed()) {
    await page.screenshot({
      path: `/tmp/hive-assistant-failed-${task.name.replace(/[^a-z0-9]+/gi, "-")}.png`,
    });
  }
});
afterAll(async () => {
  await context?.close();
  await browser?.close();
  if (fixtureDir) rmSync(fixtureDir, { recursive: true, force: true });
  expect(errors).toEqual([]);
});

describe("Claude assistant journeys with an isolated CLI fixture", () => {
  it("shows the sidebar only when configured and enabled", async () => {
    await expect
      .poll(() => page.getByRole("link", { name: "Assistant", exact: true }).count())
      .toBe(0);
    await page.goto(`${getContext().appUrl}/integrations`);
    await page.getByRole("button", { name: "Add integration", exact: true }).first().click();
    await page.getByRole("dialog").waitFor();
    await page
      .getByRole("dialog")
      .getByRole("button", { name: /Claude/ })
      .click();
    expect(await page.locator('a[href="/assistant"]').count()).toBe(0);
    await page.getByLabel("Setup token", { exact: true }).fill("fixture-token");
    await page.getByLabel("Setup token", { exact: true }).blur();
    const modelSelect = page.getByLabel("Assistant model", { exact: true });
    await expect.poll(() => modelSelect.textContent()).toContain("Default");
    await page.getByLabel("Setup token", { exact: true }).fill("");
    await page.getByLabel("Setup token", { exact: true }).blur();
    expect(await modelSelect.isDisabled()).toBe(true);
    expect(await modelSelect.textContent()).toContain("Default");
    await page.screenshot({ animations: "disabled", path: "/tmp/hive-claude-model-label.png" });
    await page.getByLabel("Setup token", { exact: true }).fill("fixture-token");
    await page.getByLabel("Setup token", { exact: true }).blur();
    await page.getByLabel("Assistant model", { exact: true }).click();
    await page.getByRole("option", { name: "Fable", exact: true }).click();
    expect(await page.getByRole("option", { name: "Hidden", exact: true }).count()).toBe(0);
    await page.screenshot({ animations: "disabled", path: "/tmp/hive-claude-integration.png" });
    await page.getByRole("button", { name: "Test connection" }).click();
    await page.getByText("Connected successfully", { exact: true }).waitFor();
    await page.getByRole("button", { name: "Save", exact: true }).click();
    await page.getByRole("link", { name: "Assistant", exact: true }).first().waitFor();
    await config(false);
    await expect.poll(() => page.locator('a[href="/assistant"]').count()).toBe(0);
    await config(true);
    await expect.poll(() => page.locator('a[href="/assistant"]').count()).toBe(1);
  });
  it("streams, persists and supports mobile history", async () => {
    await page.goto(`${getContext().appUrl}/assistant`);
    await newChat();
    await send("Check the lights");
    await page.getByText("Your lights are ready.", { exact: true }).waitFor();
    const url = page.url();
    await page.goto(`${getContext().appUrl}/rooms`);
    await page.goto(url);
    await page.getByText("Your lights are ready.", { exact: true }).waitFor();
    await page.screenshot({ animations: "disabled", path: "/tmp/hive-assistant-desktop.png" });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({ animations: "disabled", path: "/tmp/hive-assistant-mobile.png" });
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
    await page.setViewportSize({ width: 1440, height: 1000 });
  });
  it("names chats automatically, restores cleared overrides and localizes unnamed chats", async () => {
    await newChat();
    const history = page.getByLabel("Your chats", { exact: true });
    expect(await history.textContent()).toContain("New chat");
    await page.getByRole("button", { name: "Rename chat", exact: true }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByRole("textbox", { name: "Rename chat" }).fill("My hallway");
    await dialog.getByRole("button", { name: "Save", exact: true }).click();
    await expect.poll(() => history.textContent()).toContain("My hallway");
    await send("Check the hallway lights");
    await page.getByText("Your lights are ready.", { exact: true }).waitFor();
    expect(await history.textContent()).toContain("My hallway");
    await page.getByRole("button", { name: "Rename chat", exact: true }).click();
    const input = dialog.getByRole("textbox", { name: "Rename chat" });
    expect(await input.getAttribute("placeholder")).toBe("Home lighting");
    await input.fill("");
    await page.screenshot({ animations: "disabled", path: "/tmp/hive-chat-name-dark.png" });
    await page.evaluate(() => document.documentElement.classList.remove("dark"));
    await page.screenshot({ animations: "disabled", path: "/tmp/hive-chat-name-light.png" });
    await dialog.getByRole("button", { name: "Save", exact: true }).click();
    await expect.poll(() => history.textContent()).toContain("Home lighting");
    await page.reload();
    await expect.poll(() => history.textContent()).toContain("Home lighting");
    await newChat();
    await send("Check the lights");
    await expect.poll(() => history.textContent()).toContain("Home lighting");
    await page.getByText("Your lights are ready.", { exact: true }).waitFor();
    await newChat();
    await api(`mutation($revision:Int!) {updateCurrentUser(input:{language:SV,expectedRevision:$revision}) {id}}`, {revision:(await api(`query { me { revision } }`)).me.revision});
    await page.reload();
    await expect.poll(() => page.getByLabel("Dina chattar", { exact: true }).textContent()).toContain("Ny chatt");
    await api(`mutation($revision:Int!) {updateCurrentUser(input:{language:EN,expectedRevision:$revision}) {id}}`, {revision:(await api(`query { me { revision } }`)).me.revision});
    await page.reload();
    await expect.poll(() => history.textContent()).toContain("New chat");
  });
  it("renders message headings and compact ages beside chat names", async () => {
    await newChat();
    await send("Show formatted headings");
    await page.getByRole("heading", { level: 2, name: "Night light is ready" }).waitFor();
    await page.getByRole("heading", { level: 3, name: "Details" }).waitFor();
    await page.getByText("Warm light in the hallway.", { exact: true }).waitFor();
    await page.getByLabel("Your chats", { exact: true }).click();
    try {
    const current = page.getByRole("option", { selected: true });
    await current.locator("time").waitFor();
    expect(await current.locator("time").textContent()).toBe("Just now");
    const boxes = await current.evaluate((el) => {
      const name = el.querySelector(".truncate")!.getBoundingClientRect();
      const time = el.querySelector("time")!.getBoundingClientRect();
      return { gap: time.left - name.right, right: time.right, rowRight: el.getBoundingClientRect().right };
    });
    expect(boxes.gap).toBeGreaterThan(0);
    expect(boxes.gap).toBeLessThan(16);
    expect(boxes.right).toBeLessThan(boxes.rowRight);
    await page.screenshot({ animations: "disabled", path: "/tmp/hive-chat-headings-ages-dark.png" });
    await page.evaluate(() => document.documentElement.classList.remove("dark"));
    await page.screenshot({ animations: "disabled", path: "/tmp/hive-chat-headings-ages-light.png" });
    } finally {
      await page.keyboard.press("Escape");
    }
  });
  it("opens long conversations at the bottom on their first rendered frame", async () => {
    await newChat();
    await send(Array.from({ length: 60 }, (_, i) => `Check the lights in room ${i + 1}.`).join("\n\n"));
    await page.getByText("Your lights are ready.", { exact: true }).waitFor();
    const url = page.url();
    await page.goto(`${getContext().appUrl}/rooms`);
    await page.addInitScript(() => {
      const state = window as typeof window & { firstChatScrollGap?: number };
      function check() {
        const scroller = document.querySelector<HTMLElement>(".overflow-y-auto.scroll-smooth");
        if (scroller && scroller.scrollHeight > scroller.clientHeight) {
          state.firstChatScrollGap = scroller.scrollHeight - scroller.clientHeight - scroller.scrollTop;
        } else requestAnimationFrame(check);
      }
      requestAnimationFrame(check);
    });
    await page.goto(url);
    await expect.poll(() => page.evaluate(() => (window as typeof window & { firstChatScrollGap?: number }).firstChatScrollGap)).toBeDefined();
    expect(await page.evaluate(() => (window as typeof window & { firstChatScrollGap?: number }).firstChatScrollGap)).toBeLessThanOrEqual(1);
    await page.screenshot({ animations: "disabled", path: "/tmp/hive-chat-initial-scroll.png" });
  });
  it("creates an entity through MCP and updates another open page", async () => {
    const rooms = await context.newPage();
    await rooms.goto(`${getContext().appUrl}/rooms`);
    await newChat();
    await send("Create a room");
    await page.getByText("Assistant created room", { exact: true }).first().waitFor();
    await rooms.getByText("Assistant created room", { exact: true }).first().waitFor();
    await rooms.close();
  });
  it("requires a fixed acknowledgement before bulk deletion and resumes once", async () => {
    for (const name of ["Assistant test one", "Assistant test two"])
      await api(`mutation($input:CreateRoomInput!){createRoom(input:$input){id}}`, {
        input: { name },
      });
    await newChat();
    await send("Delete both test rooms");
    const confirm = page.getByRole("button", { name: "Batch delete rooms", exact: true });
    await confirm.waitFor();
    expect(await confirm.isDisabled()).toBe(true);
    expect(
      (await api(`query{rooms{id name}}`)).rooms.filter((r: { name: string }) =>
        r.name.startsWith("Assistant test "),
      ).length,
    ).toBe(2);
    await page.screenshot({ animations: "disabled", path: "/tmp/hive-assistant-confirmation.png" });
    await page
      .getByRole("checkbox", { name: "I understand the consequences and want to continue." })
      .click();
    await confirm.click();
    await page
      .getByText("The operation is recorded. Your home is up to date.", { exact: true })
      .waitFor();
    expect(
      (await api(`query{rooms{id name}}`)).rooms.filter((r: { name: string }) =>
        r.name.startsWith("Assistant test "),
      ).length,
    ).toBe(0);
  });
  it("collects a password privately and accepts image attachments", async () => {
    await newChat();
    await send("Create an account");
    await page.getByLabel("Password", { exact: true }).fill("private-e2e-password");
    await page.getByRole("button", { name: "Create user", exact: true }).click();
    await page
      .getByText("The operation is recorded. Your home is up to date.", { exact: true })
      .waitFor();
    const id = new URL(page.url()).searchParams.get("chat");
    const chat = await api(
      `query($id:ID!){assistantConversation(id:$id){messages{text} actions{result}}}`,
      { id },
    );
    expect(JSON.stringify(chat)).not.toContain("private-e2e-password");
    await newChat();
    await page.locator('input[type="file"]').setInputFiles({
      name: "photo.png",
      mimeType: "image/png",
      buffer: await page.screenshot(),
    });
    await send("Check this photo");
    await page.getByText("I received your photo.", { exact: true }).waitFor();
    await page.getByRole("img", { name: "photo.png" }).waitFor();
  });
  it("continues after navigation and stops explicitly", async () => {
    await newChat();
    await send("Wait until stopped");
    await page.getByRole("button", { name: "Stop", exact: true }).waitFor();
    const url = page.url();
    await page.goto(`${getContext().appUrl}/rooms`);
    await page.goto(url);
    await page.getByRole("button", { name: "Stop", exact: true }).click();
    await page.getByText("Stopped", { exact: true }).waitFor();
  });
  it("keeps model failures stable and retries without an empty popup", async () => {
    const intercept = async (route: import("playwright-core").Route) => {
      if (route.request().postData()?.includes("ClaudeIntegrationModels")) {
        await route.fulfill({ json: { errors: [{ message: "Catalog unavailable" }] } });
      } else await route.continue();
    };
    await page.route("**/graphql", intercept);
    await page.goto(`${getContext().appUrl}/integrations/claude`);
    await page.getByText("Could not load Claude models. Try again.", { exact: true }).waitFor();
    expect(await page.getByLabel("Assistant model", { exact: true }).isDisabled()).toBe(true);
    await page.getByLabel("Assistant model", { exact: true }).click({ force: true });
    expect(await page.getByRole("listbox").count()).toBe(0);
    expect(
      await page.getByRole("button", { name: "Test connection", exact: true }).isEnabled(),
    ).toBe(true);
    await page.screenshot({ animations: "disabled", path: "/tmp/hive-claude-model-failure.png" });
    await page.unroute("**/graphql", intercept);
    await page.getByRole("button", { name: "Try again", exact: true }).click();
    await expect
      .poll(() => page.getByLabel("Assistant model", { exact: true }).isEnabled())
      .toBe(true);
    await page.getByRole("button", { name: "Test connection", exact: true }).click();
    await page.getByText("Connected successfully", { exact: true }).waitFor();
    await page.screenshot({ animations: "disabled", path: "/tmp/hive-claude-integration.png" });
  });
  it("fits the Swedish header label when font metrics change", async () => {
    await api(`mutation($revision:Int!) {updateCurrentUser(input:{language:SV,expectedRevision:$revision}) {id}}`, {revision:(await api(`query { me { revision } }`)).me.revision});
    await page.goto(`${getContext().appUrl}/integrations`);
    const button = page.getByRole("button", { name: "Lägg till integration", exact: true }).first();
    await button.waitFor();
    await page.evaluate(() => document.fonts.ready.then(() => undefined));
    await button.evaluate((el) => {
      el.style.fontFamily = "monospace";
    });
    await expect
      .poll(() =>
        button.evaluate((el) => {
          const label = el.querySelector(".animate-fade-in");
          return (
            !!label &&
            !!label.parentElement &&
            label.getBoundingClientRect().width <= label.parentElement.getBoundingClientRect().width
          );
        }),
      )
      .toBe(true);
    await button.evaluate((el) => {
      el.style.fontFamily = "";
    });
    await button.screenshot({
      animations: "disabled",
      path: "/tmp/hive-integration-button-swedish.png",
    });
    await api(`mutation($revision:Int!) {updateCurrentUser(input:{language:EN,expectedRevision:$revision}) {id}}`, {revision:(await api(`query { me { revision } }`)).me.revision});
  });
});
