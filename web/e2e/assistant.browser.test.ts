import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { chromium, type Browser, type BrowserContext, type Page } from "playwright-core";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { getContext, publishDeviceState, publishAvailability } from "./setup.js";

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
      path: resolve(`../tmp/hive-assistant-failed-${task.name.replace(/[^a-z0-9]+/gi, "-")}.png`),
    });
    const cancel = page.getByRole("dialog").getByRole("button", {name:"Cancel",exact:true});
    if (await cancel.isVisible()) await cancel.click();
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
    expect(await page.locator('a[href="/assistant"]:visible').count()).toBe(0);
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
    await expect.poll(() => page.locator('a[href="/assistant"]:visible').count()).toBe(0);
    await config(true);
    await expect.poll(() => page.locator('a[href="/assistant"]:visible').count()).toBe(1);
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
  it("fits long chat names on mobile and exposes Chat when enabled", async () => {
    const title = "Night light scene and automation for the corridor and another time window with a long conversation title";
    await page.getByRole("button", { name: "Rename chat", exact: true }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByRole("textbox", { name: "Rename chat" }).fill(title);
    await dialog.getByRole("button", { name: "Save", exact: true }).click();
    await dialog.waitFor({ state: "hidden" });
    const bar = page.locator(".mobile-navigation");
    const history = page.getByLabel("Your chats", { exact: true });
    await expect.poll(() => history.textContent()).toContain(title);
    for (const width of [320, 390]) {
      await page.setViewportSize({ width, height: 844 });
      const trigger = (await history.boundingBox())!;
      const rename = (await page.getByRole("button", { name: "Rename chat", exact: true }).boundingBox())!;
      const remove = (await page.getByRole("button", { name: "Delete chat", exact: true }).boundingBox())!;
      expect(trigger.x + trigger.width).toBeLessThanOrEqual(rename.x);
      expect(rename.x + rename.width).toBeLessThanOrEqual(remove.x);
      expect(remove.x + remove.width).toBeLessThanOrEqual(width - 16);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      expect(await page.getByText("Only you can see these chats.", { exact: true }).count()).toBe(0);
      expect(await bar.locator("[aria-current]").innerText()).toBe("Chat");
      await history.click();
      const list = page.locator('[data-slot="select-content"]');
      await list.waitFor();
      const bounds = (await list.boundingBox())!;
      expect(bounds.x).toBeGreaterThanOrEqual(0);
      expect(bounds.x + bounds.width).toBeLessThanOrEqual(width);
      await page.getByRole("option").filter({ hasText: title }).click();
    }
    mkdirSync(resolve("../tmp/mobile-polish"), { recursive: true });
    for (const theme of ["dark", "light"]) {
      await page.evaluate(theme => document.documentElement.classList.toggle("dark", theme === "dark"), theme);
      await page.screenshot({ path: resolve(`../tmp/mobile-polish/assistant-${theme}.png`), animations: "disabled" });
    }
    await bar.getByRole("link", { name: "Menu", exact: true }).click();
    const menu = page.getByRole("navigation", { name: "Menu", exact: true });
    expect(await menu.getByRole("link", { name: "Assistant", exact: true }).count()).toBe(0);
    await menu.getByRole("link", { name: "Devices", exact: true }).click();
    await expect.poll(() => new URL(page.url()).pathname).toBe("/devices");
    expect(await bar.locator("[aria-current]").innerText()).toBe("Menu");
    await bar.getByRole("link", { name: "Chat", exact: true }).click();
    await history.waitFor();
    await config(false);
    await page.reload();
    await bar.getByRole("link", { name: "Devices", exact: true }).waitFor();
    await config(true);
    await page.reload();
    await bar.getByRole("link", { name: "Chat", exact: true }).waitFor();
    await page.setViewportSize({ width: 1440, height: 1000 });
  });
  it("keeps the composer compact until text needs multiple lines", async () => {
    const prompt = page.getByRole("textbox", { name: "Ask Hive…", exact: true });
    const composer = page.locator("form").filter({ has: prompt });
    mkdirSync(resolve("../tmp/composer"), { recursive: true });
    for (const width of [320, 390, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await prompt.fill("test");
      await expect.poll(async () => (await composer.boundingBox())!.height).toBeLessThan(65);
      const attach = (await page.getByRole("button", { name: "Attach images", exact: true }).boundingBox())!;
      const input = (await prompt.boundingBox())!;
      expect(attach.x + attach.width).toBeLessThanOrEqual(input.x);
      await prompt.press("Shift+Enter");
      await prompt.press("a");
      await expect.poll(async () => (await composer.boundingBox())!.height).toBeGreaterThan(90);
      const expanded = (await composer.boundingBox())!;
      const expandedInput = (await prompt.boundingBox())!;
      const expandedAttach = (await page.getByRole("button", { name: "Attach images", exact: true }).boundingBox())!;
      expect(expandedInput.x).toBeLessThan(expanded.x + 20);
      expect(expandedAttach.y).toBeGreaterThanOrEqual(expandedInput.y + expandedInput.height);
      expect(await prompt.inputValue()).toBe("test\na");
      for (const theme of ["dark", "light"]) {
        await page.evaluate(theme => document.documentElement.classList.toggle("dark", theme === "dark"), theme);
        await composer.screenshot({ path: resolve(`../tmp/composer/expanded-${width}-${theme}.png`), animations: "disabled" });
      }
      await prompt.fill("A long message that wraps across multiple lines. ".repeat(8));
      await expect.poll(async () => (await composer.boundingBox())!.height).toBeGreaterThan(90);
      expect((await prompt.boundingBox())!.x).toBeLessThan(expanded.x + 20);
      await prompt.fill("");
      await expect.poll(async () => (await composer.boundingBox())!.height).toBeLessThan(65);
      await composer.screenshot({ path: resolve(`../tmp/composer/compact-${width}.png`), animations: "disabled" });
    }
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
    await page.getByText(/^Warm light in the hallway\./).waitFor();
    const example=page.locator("em").filter({hasText:'"When motion is detected in the hallway, turn the lights on."'});
    await example.waitFor();
    expect(await example.locator("strong").textContent()).toBe("motion");
    expect(await example.evaluate(element=>getComputedStyle(element).fontStyle)).toBe("italic");
    for (const theme of ["dark","light"]) {
      await page.evaluate(theme=>document.documentElement.classList.toggle("dark",theme==="dark"),theme);
      await page.screenshot({animations:"disabled",path:resolve(`../tmp/hive-chat-emphasis-${theme}.png`)});
    }
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
    for (const [width,height] of [[1933,1069],[1440,900],[390,844],[320,568],[844,390]]) {
      await page.setViewportSize({width,height});
      const layout=await page.evaluate(() => {
        const scroller=document.querySelector<HTMLElement>(".overflow-y-auto.scroll-smooth")!;
        const chain=[];
        for(let node:HTMLElement|null=scroller;node;node=node.parentElement) {
          const style=getComputedStyle(node);
          chain.push({tag:node.tagName,class:node.className,rect:node.getBoundingClientRect().height,scroll:node.scrollHeight,client:node.clientHeight,minHeight:style.minHeight,height:style.height,overflow:style.overflowY,display:style.display,flex:style.flex});
        }
        return {pageHeight:document.scrollingElement!.scrollHeight,viewport:window.innerHeight,scrollHeight:scroller.scrollHeight,chatHeight:scroller.clientHeight,chain};
      });
      writeFileSync(resolve(`../tmp/chat-scroll-${width}-${height}.json`),JSON.stringify(layout,null,2));
      expect(layout.pageHeight).toBeLessThanOrEqual(height+1);
      expect(layout.scrollHeight).toBeGreaterThan(layout.chatHeight);
      const historyBox=(await page.getByLabel("Your chats",{exact:true}).boundingBox())!;
      const composerBox=(await page.locator("form").filter({has:page.getByRole("textbox",{name:"Ask Hive…",exact:true})}).boundingBox())!;
      const scroller=page.locator(".overflow-y-auto.scroll-smooth");
      await scroller.evaluate(element => {element.scrollTop=0;});
      await scroller.hover();
      await page.mouse.wheel(0,450);
      await expect.poll(() => scroller.evaluate(element => element.scrollTop)).toBeGreaterThan(0);
      expect(await page.evaluate(() => window.scrollY)).toBe(0);
      expect((await page.getByLabel("Your chats",{exact:true}).boundingBox())!.y).toBe(historyBox.y);
      expect((await page.locator("form").filter({has:page.getByRole("textbox",{name:"Ask Hive…",exact:true})}).boundingBox())!.y).toBe(composerBox.y);
    }
    await page.setViewportSize({width:320,height:568});
    const draft=page.getByRole("textbox",{name:"Ask Hive…",exact:true});
    await draft.fill(Array.from({length:40},(_,i)=>`Draft line ${i+1}`).join("\n"));
    await expect.poll(() => draft.evaluate(element => element.scrollHeight > element.clientHeight)).toBe(true);
    expect(await page.evaluate(() => document.scrollingElement!.scrollHeight)).toBeLessThanOrEqual(569);
    expect(await page.getByRole("button",{name:"Send message",exact:true}).isVisible()).toBe(true);
    await draft.fill("");
    await page.setViewportSize({width:1440,height:1000});
    await page.screenshot({ animations: "disabled", path: resolve("../tmp/hive-chat-initial-scroll.png") });
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
  it("opens created scenes and automations from completed and reopened action cards", async () => {
    await newChat();
    await send("Create a lighting setup");
    await page.getByText("Created the lighting setup.", { exact: true }).waitFor();
    const scene = page.getByRole("link", { name: "Assistant linked scene", exact: true });
    const automation = page.getByRole("link", { name: "Assistant linked automation", exact: true });
    expect(await scene.getAttribute("href")).toMatch(/^\/scenes\/[^/]+$/);
    expect(await automation.getAttribute("href")).toMatch(/^\/automations\/[^/]+$/);
    await scene.click();
    await page.waitForURL(url => url.pathname.startsWith("/scenes/"));
    await expect.poll(() => page.getByRole("textbox", { name: "Scene name", exact: true }).inputValue()).toBe("Assistant linked scene");
    await expect.poll(() => page.getByRole("button", { name: "Save", exact: true }).isDisabled()).toBe(true);
    await page.goBack();
    await page.reload();
    await automation.waitFor();
    await automation.click();
    await page.waitForURL(url => url.pathname.startsWith("/automations/"));
    await expect.poll(() => page.getByPlaceholder("Automation name").inputValue()).toBe("Assistant linked automation");
    await expect.poll(() => page.getByRole("button", { name: "Save", exact: true }).isDisabled()).toBe(true);
    await page.goBack();
    await scene.waitFor();
  });
  it("reopens chat editing after every dismissal", async () => {
    const rename = page.getByRole("button", { name: "Rename chat", exact: true });
    const history = await page.getByLabel("Your chats", { exact: true }).textContent();
    for (const dismissal of ["cancel", "escape", "outside", "cancel"]) {
      await rename.click();
      const dialog = page.getByRole("dialog");
      await dialog.getByRole("textbox", { name: "Rename chat", exact: true }).fill("Discard this title");
      if (dismissal === "cancel") await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
      else if (dismissal === "escape") await page.keyboard.press("Escape");
      else {
        await dialog.evaluate(async element => { await Promise.all(element.getAnimations({ subtree: true }).map(animation => animation.finished.catch(() => {}))); });
        await page.locator('[data-slot="dialog-overlay"]').click({position:{x:5,y:5}});
      }
      await expect.poll(() => dialog.isVisible(), {message:`Dismiss using ${dismissal}`}).toBe(false);
      expect(await page.getByLabel("Your chats", { exact: true }).textContent()).toBe(history);
    }
  });
  it("completes imperative commands with only action cards, including follow-ups and reopening", async () => {
    await newChat();
    for (const [index,command] of ["Turn the test light off","Actually, turn it on"].entries()) {
      await send(command);
      const id=new URL(page.url()).searchParams.get("chat");
      await expect.poll(async () => {
        const data=await api(`query($id:ID!){assistantConversation(id:$id){runs{state} messages{role text}}}`,{id});
        const chat=data.assistantConversation;
        return {states:chat.runs.map((run:{state:string})=>run.state),answers:chat.messages.filter((message:{role:string,text:string})=>message.role==="assistant").map((message:{text:string})=>message.text)};
      }).toEqual({states:Array(index+1).fill("COMPLETED"),answers:Array(index+1).fill("")});
      expect(await page.locator("[data-action-id]").count()).toBe(index+1);
      expect(await page.getByText("Set target state",{exact:true}).count()).toBe(index+1);
      expect(await page.locator("[data-entity-kind]").count()).toBe(0);
      expect(await page.locator("section > div").count()).toBe(2*(index+1));
    }
    await page.reload();
    await page.getByText("Set target state",{exact:true}).first().waitFor();
    expect(await page.locator("section > div").count()).toBe(4);
    await page.screenshot({animations:"disabled",path:resolve("../tmp/hive-chat-actions-only.png")});
  });
  it("shows live controls for existing entities and preserves them in saved chats", async () => {
    const lightId = "0x00158d0001a2b3c4";
    const structure = await api(`mutation { room:createRoom(input:{name:"Chat controls room"}){id} group:createGroup(input:{name:"Chat controls group"}){id} effect:createEffect(input:{name:"Chat controls effect",kind:TIMELINE,loop:false,durationMs:0,tracks:[]}){id} }`);
    await api(`mutation($room:ID!,$group:ID!,$light:ID!){addRoomMember(input:{roomId:$room,memberType:"device",memberId:$light}){id} addGroupMember(input:{groupId:$group,memberType:"device",memberId:$light}){id}}`, {room:structure.room.id,group:structure.group.id,light:lightId});
    const scene = await api(`mutation($input:CreateSceneInput!){createScene(input:$input){id}}`,{input:{name:"Chat controls scene",definition:{targets:[{targetType:"device",targetId:lightId}],lighting:{overrides:[{deviceId:lightId,kind:"state",state:{on:true,brightness:100}}]},supportingStates:[]}}});
    const automation = await api(`mutation($input:CreateAutomationInput!){createAutomation(input:$input){id}}`,{input:{name:"Chat controls automation",enabled:false,nodes:[{id:"t1",type:"trigger",config:{trigger:{mode:"custom",eventType:"device.state_changed",customExpr:"true"}}},{id:"a1",type:"action",config:{action:{actionType:"set_device_state",targetType:"device",targetId:lightId,payload:{on:false}}}}],edges:[{fromNodeId:"t1",toNodeId:"a1"}]}});
    await publishAvailability("Living Room Light",true);
    await publishDeviceState("Living Room Light",{state:"OFF",brightness:100,color_temp:300});
    await newChat();
    await send("Show existing home controls");
    await page.getByText("These controls show current Hive state.", {exact:true}).waitFor();
    for (const kind of ["device","room","group","scene","automation","effect"])
      await page.locator(`[data-entity-kind="${kind}"] h3 a`).waitFor();
    const light = page.locator(`[data-entity-id="${lightId}"]`);
    await light.getByRole("switch").click();
    await expect.poll(() => light.getByRole("switch").getAttribute("aria-checked")).toBe("true");
    await publishDeviceState("Living Room Light",{state:"ON",brightness:100});
    await expect.poll(() => light.textContent()).toContain("On");
    const room = page.locator('[data-entity-kind="room"]');
    await room.getByRole("switch").click();
    await expect.poll(() => room.getByRole("switch").getAttribute("aria-checked")).toBe("false");
    await publishDeviceState("Living Room Light",{state:"OFF",brightness:100});
    const group = page.locator('[data-entity-kind="group"]');
    await group.getByRole("switch").click();
    await expect.poll(() => group.getByRole("switch").getAttribute("aria-checked")).toBe("true");
    const sceneCard = page.locator('[data-entity-kind="scene"]');
    await sceneCard.getByRole("button",{name:"Apply",exact:true}).click();
    await sceneCard.getByRole("button",{name:"Stop",exact:true}).waitFor();
    await sceneCard.getByRole("button",{name:"Stop",exact:true}).click();
    await sceneCard.getByRole("button",{name:"Apply",exact:true}).waitFor();
    const automationCard = page.locator('[data-entity-kind="automation"]');
    await automationCard.getByRole("switch").click();
    await expect.poll(async () => (await api(`query($id:ID!){automation(id:$id){enabled}}`,{id:automation.createAutomation.id})).automation.enabled).toBe(true);
    await automationCard.getByRole("switch").click();
    await page.locator('[data-entity-kind="effect"]').getByRole("button",{name:"Run effect",exact:true}).click();
    await page.getByRole("dialog").waitFor();
    await page.keyboard.press("Escape");
    await publishAvailability("Living Room Light",false);
    await expect.poll(() => light.textContent()).toContain("Offline");
    expect(await light.getByRole("switch").isDisabled()).toBe(true);
    await publishAvailability("Living Room Light",true);
    const chatUrl=page.url();
    await page.reload();
    await light.getByRole("switch").waitFor();
    await page.getByRole("link",{name:"Missing item",exact:true}).waitFor();
    mkdirSync(resolve("../tmp/chat-entities"),{recursive:true});
    for (const width of [390,1440]) {
      await page.setViewportSize({width,height:1000});
      for (const theme of ["dark","light"]) {
        await page.evaluate(theme => document.documentElement.classList.toggle("dark",theme==="dark"),theme);
        await light.scrollIntoViewIfNeeded();
        await page.screenshot({path:resolve(`../tmp/chat-entities/${width}-${theme}.png`),animations:"disabled"});
      }
    }
    await room.getByRole("link").click();
    await page.waitForURL(url => url.pathname==="/rooms" && url.searchParams.get("edit")===structure.room.id);
    await page.goto(chatUrl);
    await page.locator('[data-entity-kind="scene"] h3 a').waitFor();
    expect(scene.createScene.id).toBeTruthy();
  });
  it("saves collaborative controls without AI work and uses their snapshot on Send", async () => {
    await newChat();
    await send("Design a scene with controls");
    await page.getByText("Adjust the controls, then send a message when you are ready.",{exact:true}).waitFor();
    const form=page.getByRole("group",{name:"Chat controls",exact:true});
    await form.waitFor();
    expect(await form.locator("h3").count()).toBe(0);
    expect(await form.locator("[data-chat-section] h2").allTextContents()).toEqual(["Scene","Light","Movement","Inspiration"]);
    expect(await page.locator(".overflow-y-auto.scroll-smooth table").count()).toBe(0);
    const id=new URL(page.url()).searchParams.get("chat");
    const read=async () => (await api(`query($id:ID!){assistantConversation(id:$id){runs{id state} forms{id fields{key revision value{text number boolean attachmentId}}}}}`,{id})).assistantConversation;
    await expect.poll(async () => (await read()).runs.every((r:{state:string})=>r.state==="COMPLETED")).toBe(true);
    const runs=(await read()).runs.length;
    await form.getByRole("textbox",{name:"Scene name",exact:true}).fill("Chat chosen scene");
    const brightness=form.getByRole("slider",{name:"Brightness",exact:true});
    await brightness.focus();
    await brightness.press("Home");
    await brightness.press("ArrowRight");
    await brightness.press("ArrowRight");
    await form.getByRole("textbox",{name:"Pace in seconds",exact:true}).fill("42");
    const colorButton = form.getByRole("button",{name:"Accent colour",exact:true});
    await colorButton.click();
    const colorPicker = page.getByRole("dialog",{name:"Accent colour",exact:true});
    const wheel = colorPicker.getByRole("slider",{name:"Hue and saturation",exact:true});
    const wheelBox = (await wheel.boundingBox())!;
    await wheel.click({position:{x:wheelBox.width*0.75,y:wheelBox.height/2}});
    await page.keyboard.press("Escape");
    await expect.poll(async () => (await read()).forms[0].fields.find((f:{key:string})=>f.key==="scene.color").value.text).not.toBe("#ff9933");
    const selectedColor = (await read()).forms[0].fields.find((f:{key:string})=>f.key==="scene.color").value.text;
    expect(selectedColor).toMatch(/^#[0-9a-f]{6}$/);
    const swatchColor = await colorButton.locator("span").evaluate(element => getComputedStyle(element).backgroundColor);
    await form.getByLabel("Mood",{exact:true}).click();
    await page.getByRole("option",{name:"Ocean drift",exact:true}).click();
    await form.getByRole("switch").click();
    await form.locator('input[type="file"]').setInputFiles({name:"reference.png",mimeType:"image/png",buffer:await page.screenshot()});
    await form.getByRole("img",{name:"Reference image",exact:true}).waitFor();
    await expect.poll(async () => (await read()).forms[0].fields.find((f:{key:string})=>f.key==="scene.name").value.text).toBe("Chat chosen scene");
    expect((await read()).runs.length).toBe(runs);
    await page.reload();
    await expect.poll(() => form.getByRole("textbox",{name:"Scene name",exact:true}).inputValue()).toBe("Chat chosen scene");
    expect(await form.getByRole("slider").getAttribute("aria-valuenow")).toBe("2");
    expect(await form.getByRole("textbox",{name:"Pace in seconds",exact:true}).inputValue()).toBe("42");
    expect(await colorButton.locator("span").evaluate(element => getComputedStyle(element).backgroundColor)).toBe(swatchColor);
    expect((await read()).forms[0].fields.find((f:{key:string})=>f.key==="scene.color").value.text).toBe(selectedColor);
    expect(await form.getByRole("switch").getAttribute("aria-checked")).toBe("false");
    mkdirSync(resolve("../tmp/chat-controls"),{recursive:true});
    for (const width of [320,390,768,1440]) {
      await page.setViewportSize({width,height:1000});
      await expect.poll(async () => (await form.boundingBox())!.width).toBeLessThanOrEqual(512);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
      expect(await page.evaluate(() => document.scrollingElement!.scrollHeight)).toBeLessThanOrEqual(1001);
      const nameBox = (await form.locator('[data-chat-field="scene.name"]').boundingBox())!;
      const moodBox = (await form.locator('[data-chat-field="scene.mood"]').boundingBox())!;
      if (width === 1440) {
        expect(Math.abs(nameBox.y-moodBox.y)).toBeLessThan(2);
        expect(moodBox.x).toBeGreaterThan(nameBox.x+nameBox.width);
      } else if (width <= 390) {
        expect(moodBox.y).toBeGreaterThanOrEqual(nameBox.y+nameBox.height);
      }
      expect(await form.locator('input[type="color"]').count()).toBe(0);
      for (const theme of ["dark","light"]) {
        await page.evaluate(theme => document.documentElement.classList.toggle("dark",theme==="dark"),theme);
        await colorButton.click();
        await wheel.waitFor();
        const popup = (await colorPicker.boundingBox())!;
        expect(popup.x).toBeGreaterThanOrEqual(0);
        expect(popup.x+popup.width).toBeLessThanOrEqual(width);
        await page.screenshot({path:resolve(`../tmp/chat-controls/${width}-${theme}-picker.png`),animations:"disabled"});
        await page.keyboard.press("Escape");
        const scroller = page.locator(".overflow-y-auto.scroll-smooth");
        await scroller.evaluate(element => { element.scrollTop = 0; });
        await page.screenshot({path:resolve(`../tmp/chat-controls/${width}-${theme}-top.png`),animations:"disabled"});
        await scroller.evaluate(element => { element.scrollTop = element.scrollHeight; });
        await form.getByRole("img",{name:"Reference image",exact:true}).scrollIntoViewIfNeeded();
        await page.screenshot({path:resolve(`../tmp/chat-controls/${width}-${theme}-bottom.png`),animations:"disabled"});
      }
    }
    await page.route("**/graphql", route => {
      if (route.request().postData()?.includes("AssistantChatUpdateField")) return route.fulfill({status:503,contentType:"application/json",body:JSON.stringify({errors:[{message:"Save temporarily unavailable"}]})});
      return route.continue();
    });
    await form.getByRole("textbox",{name:"Scene name",exact:true}).fill("Unsaved choice");
    await form.getByRole("alert").waitFor();
    await send("Use my submitted controls");
    await expect.poll(() => page.locator("form").filter({has:page.getByRole("textbox",{name:"Ask Hive…",exact:true})}).getByRole("alert").count()).toBe(1);
    expect((await read()).runs.length).toBe(runs);
    await page.unroute("**/graphql");
    await form.getByRole("textbox",{name:"Scene name",exact:true}).fill("Final chat choice");
    await send("Use my submitted controls");
    await page.getByText("Saved Final chat choice with brightness 2 from your submitted controls.",{exact:true}).waitFor();
    await page.getByRole("link",{name:"Final chat choice",exact:true}).waitFor();
    const data=await api(`query{scenes{id name lighting{overrides{state{brightness}}}}}`);
    expect(data.scenes.find((s:{name:string})=>s.name==="Final chat choice").lighting.overrides[0].state.brightness).toBe(2);
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
