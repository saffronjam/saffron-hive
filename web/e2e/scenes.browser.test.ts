import { Buffer } from "node:buffer";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { chromium, type Browser, type BrowserContext, type Page } from "playwright-core";
import { graphql } from "$lib/gql";
import { getContext } from "./setup.js";

const FIXTURE_DATA = graphql(`
  query BrowserSceneFixtures {
    devices {
      id
      friendlyName
      type
    }
    vibePresets {
      id
      title
    }
  }
`);

const CREATE_STRUCTURE = graphql(`
  mutation BrowserSceneCreateStructure($room: CreateRoomInput!, $group: CreateGroupInput!) {
    room: createRoom(input: $room) {
      id
    }
    group: createGroup(input: $group) {
      id
    }
  }
`);

const ADD_ROOM_MEMBER = graphql(`
  mutation BrowserSceneAddRoomMember($input: AddRoomMemberInput!) {
    addRoomMember(input: $input) {
      id
    }
  }
`);

const ADD_GROUP_MEMBER = graphql(`
  mutation BrowserSceneAddGroupMember($input: AddGroupMemberInput!) {
    addGroupMember(input: $input) {
      id
    }
  }
`);

const DELETE_SCENE_FIXTURES = graphql(`
  mutation BrowserSceneDeleteFixtures($roomId: ID!, $groupId: ID!) {
    deleteRoom(id: $roomId)
    deleteGroup(id: $groupId)
  }
`);

const DELETE_SCENE = graphql(`
  mutation BrowserSceneDelete($id: ID!) {
    deleteScene(id: $id)
  }
`);

const ROOM_NAME = "Browser Vibe Room";
const GROUP_NAME = "Browser Vibe Group";
const VALID_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "base64",
);

let browser: Browser;
let browserContext: BrowserContext;
let page: Page;
let roomId = "";
let groupId = "";
let presetTitle = "";
const sceneIds: string[] = [];

async function openCreation(): Promise<void> {
  const { appUrl } = getContext();
  await page.goto(`${appUrl}/scenes/new`, { waitUntil: "domcontentloaded" });
  await page.getByRole("heading", { name: "Create a scene" }).waitFor();
}

async function addDrawerTarget(name: string): Promise<void> {
  await page.getByRole("button", { name: "Add target" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByText(name, { exact: true }).click();
  await dialog.getByRole("button", { name: "Add 1 item" }).click();
}

async function finishCreation(name: string): Promise<string> {
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.locator("#scene-name").fill(name);
  const request = page.waitForRequest(
    (candidate) =>
      candidate.url().endsWith("/graphql") &&
      (candidate.postData() ?? "").includes("ScenesStoreCreate"),
    { timeout: 5_000 },
  );
  const response = page.waitForResponse(
    (candidate) =>
      candidate.url().endsWith("/graphql") &&
      (candidate.request().postData() ?? "").includes("ScenesStoreCreate"),
    { timeout: 10_000 },
  );
  await page.getByRole("button", { name: "Create scene" }).click();
  try {
    await request;
  } catch {
    throw new Error(`Scene ${JSON.stringify(name)} did not issue its create mutation.`);
  }
  try {
    const result = await response;
    const body = await result.text();
    if (!result.ok() || body.includes('"errors"')) {
      throw new Error(`Scene ${JSON.stringify(name)} create response: ${body}`);
    }
  } catch (caught) {
    if (caught instanceof Error && caught.message.includes("create response:")) throw caught;
    throw new Error(`Scene ${JSON.stringify(name)} create mutation did not return.`);
  }
  try {
    await page.waitForURL(
      (url) => url.pathname.startsWith("/scenes/") && url.pathname !== "/scenes/new",
      { timeout: 10_000 },
    );
  } catch {
    throw new Error(
      `Scene ${JSON.stringify(name)} did not save:\n${await page.locator("main").last().innerText()}`,
    );
  }
  await page.getByRole("textbox", { name: "Scene name" }).waitFor();
  const id = new URL(page.url()).pathname.split("/").at(-1);
  if (!id) throw new Error("created Scene URL has no id");
  sceneIds.push(id);
  return id;
}

async function selectGuidedRounds(count: 3 | 5): Promise<void> {
  for (let round = 1; round <= count; round++) {
    const choices = page.locator(`[aria-label="Guided vibe choices ${round}"] button`);
    try {
      await expect.poll(() => choices.count(), { timeout: 10_000 }).toBe(5);
    } catch {
      throw new Error(
        `Guided round ${round} did not load:\n${await page.locator("main").last().innerText()}`,
      );
    }
    await choices.first().press("Enter");
  }
  if (count === 5) {
    await page.getByRole("heading", { name: "Choose where it lives" }).waitFor();
    return;
  }
  const use = page.getByRole("button", { name: "Use this vibe" });
  await use.waitFor();
  await expect.poll(() => use.isEnabled()).toBe(true);
  await use.click();
  await page.getByRole("heading", { name: "Choose where it lives" }).waitFor();
}

async function selectGuidedRoundsByClick(count: 3 | 5): Promise<void> {
  for (let round = 1; round <= count; round++) {
    const choices = page.locator(`[aria-label="Guided vibe choices ${round}"] button`);
    await expect.poll(() => choices.count(), { timeout: 10_000 }).toBe(5);
    await choices.first().click();
  }
  if (count === 5) {
    await page.getByRole("heading", { name: "Choose where it lives" }).waitFor();
    return;
  }
  const use = page.getByRole("button", { name: "Use this vibe" });
  await use.waitFor();
  await expect.poll(() => use.isEnabled()).toBe(true);
  await use.click();
  await page.getByRole("heading", { name: "Choose where it lives" }).waitFor();
}

async function setCapabilitySelector(): Promise<void> {
  await page.getByRole("button", { name: "Add Selector" }).click();
  let input = page.getByPlaceholder("Add a rule…");
  await input.fill("Room");
  await input.press("Enter");
  input = page.getByPlaceholder("is / is not…");
  await input.fill("is");
  await input.press("Enter");
  input = page.getByPlaceholder("value…");
  await input.fill(ROOM_NAME);
  await input.press("Enter");
  input = page.getByPlaceholder("and / or…");
  await input.fill("and");
  await input.press("Enter");
  input = page.getByPlaceholder("field…");
  await input.fill("Can set");
  await input.press("Enter");
  input = page.getByPlaceholder("includes…");
  await input.fill("includes");
  await input.press("Enter");
  input = page.getByPlaceholder("value…");
  await input.fill("Full colour");
  await input.press("Enter");
}

beforeAll(async () => {
  const { graphqlClient, appUrl, token } = getContext();
  const fixtures = await graphqlClient
    .query(FIXTURE_DATA, {}, { requestPolicy: "network-only" })
    .toPromise();
  if (fixtures.error || !fixtures.data)
    throw fixtures.error ?? new Error("Scene fixtures unavailable");
  const bedroom = fixtures.data.devices.find((device) => device.friendlyName === "Bedroom Light");
  const living = fixtures.data.devices.find(
    (device) => device.friendlyName === "Living Room Light",
  );
  if (!bedroom || !living) throw new Error("Scene browser lights unavailable");
  presetTitle = fixtures.data.vibePresets[0]?.title ?? "";
  if (!presetTitle) throw new Error("Vibe catalogue is empty");

  const structure = await graphqlClient
    .mutation(CREATE_STRUCTURE, { room: { name: ROOM_NAME }, group: { name: GROUP_NAME } })
    .toPromise();
  if (structure.error || !structure.data)
    throw structure.error ?? new Error("Scene structure unavailable");
  roomId = structure.data.room.id;
  groupId = structure.data.group.id;
  const roomMember = await graphqlClient
    .mutation(ADD_ROOM_MEMBER, { input: { roomId, memberType: "device", memberId: bedroom.id } })
    .toPromise();
  const groupMember = await graphqlClient
    .mutation(ADD_GROUP_MEMBER, { input: { groupId, memberType: "device", memberId: living.id } })
    .toPromise();
  if (roomMember.error || groupMember.error) throw roomMember.error ?? groupMember.error;

  browser = await chromium.launch({ channel: "chrome", headless: true });
  browserContext = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    serviceWorkers: "block",
  });
  await browserContext.addInitScript((authToken) => {
    localStorage.setItem("hive.token", authToken);
  }, token);
  page = await browserContext.newPage();
  await page.goto(appUrl, { waitUntil: "domcontentloaded" });
}, 120_000);

afterAll(async () => {
  await browserContext?.close();
  await browser?.close();
  const { graphqlClient } = getContext();
  for (const id of sceneIds) await graphqlClient.mutation(DELETE_SCENE, { id }).toPromise();
  if (roomId && groupId) {
    await graphqlClient.mutation(DELETE_SCENE_FIXTURES, { roomId, groupId }).toPromise();
  }
});

describe("advanced Scene browser journeys", () => {
  it("maps wizard steps onto browser back and forward history", async () => {
    await openCreation();
    await page.getByRole("button", { name: /Gallery/ }).click();
    expect(
      await page
        .locator("main h1")
        .evaluateAll(
          (headings) =>
            headings.filter((heading) =>
              ["Create a scene", "Choose the look"].includes(heading.textContent?.trim() ?? ""),
            ).length,
        ),
    ).toBe(1);
    await page.getByRole("heading", { name: "Choose the look" }).waitFor();

    await page.evaluate(() => history.back());
    await page.getByRole("heading", { name: "Create a scene" }).waitFor();
    await page.evaluate(() => history.forward());
    await page.getByRole("heading", { name: "Choose the look" }).waitFor();

    await page.getByRole("button", { name: "Back", exact: true }).click();
    await page.getByRole("heading", { name: "Create a scene" }).waitFor();
  });

  it("creates, adjusts, reloads, applies, and stops a Gallery Vibe with a capability Selector", async () => {
    await openCreation();
    await page.getByRole("button", { name: /Gallery/ }).click();
    const preset = page.getByRole("button", { name: new RegExp(presetTitle) });
    await preset.waitFor();
    let previewRequests = 0;
    const countPreviewRequest = (request: import("playwright-core").Request) => {
      if ((request.postData() ?? "").includes("SceneCreateVibePreview")) previewRequests++;
    };
    page.on("request", countPreviewRequest);
    await preset.click();
    await expect.poll(() => page.locator(".vibe-choice.selected").count()).toBe(1);
    expect(previewRequests).toBe(0);
    page.off("request", countPreviewRequest);
    const lookContinue = page.getByRole("button", { name: "Continue", exact: true });
    await expect.poll(() => lookContinue.isEnabled()).toBe(true);
    await lookContinue.click();

    await setCapabilitySelector();
    await expect.poll(() => page.getByText("Selector", { exact: true }).count()).toBeGreaterThan(0);
    await page.getByRole("button", { name: "Continue", exact: true }).click();
    const previewElement = page.locator(".vibe-preview").last();
    const brightnessBefore = await previewElement.evaluate((element) =>
      element.getAttribute("style"),
    );
    await page.locator("#scene-vibe-brightness").getByRole("slider").focus();
    await page.keyboard.press("ArrowLeft");
    await expect
      .poll(() => previewElement.evaluate((element) => element.getAttribute("style")))
      .not.toBe(brightnessBefore);
    await page.locator("#scene-vibe-movement").getByRole("slider").focus();
    await page.keyboard.press("ArrowRight");
    await page.locator("#scene-vibe-pace").getByRole("slider").focus();
    await page.keyboard.press("ArrowLeft");
    await page.getByRole("button", { name: "Shuffle", exact: true }).click();
    await finishCreation("Browser Gallery Vibe");

    const movementSlider = page.locator("#scene-vibe-movement").getByRole("slider");
    const movementBox = await page.locator("#scene-vibe-movement").boundingBox();
    if (!movementBox) throw new Error("Movement slider has no bounds");
    const movementBefore = await movementSlider.getAttribute("aria-valuenow");
    await page.mouse.move(
      movementBox.x + movementBox.width * 0.5,
      movementBox.y + movementBox.height / 2,
    );
    await page.mouse.down();
    await page.mouse.move(
      movementBox.x + movementBox.width * 0.25,
      movementBox.y + movementBox.height / 2,
      { steps: 5 },
    );
    await page.mouse.up();
    const movementAfter = await movementSlider.getAttribute("aria-valuenow");
    expect(movementAfter).not.toBe(movementBefore);
    await page.mouse.move(
      movementBox.x + movementBox.width * 0.9,
      movementBox.y + movementBox.height / 2,
    );
    await page.waitForTimeout(100);
    expect(await movementSlider.getAttribute("aria-valuenow")).toBe(movementAfter);

    const brightnessSlider = page.locator("#scene-vibe-brightness").getByRole("slider");
    const brightnessBox = await page.locator("#scene-vibe-brightness").boundingBox();
    if (!brightnessBox) throw new Error("Brightness slider has no bounds");
    const brightnessBeforeEdit = await brightnessSlider.getAttribute("aria-valuenow");
    await page.mouse.move(
      brightnessBox.x + brightnessBox.width * 0.5,
      brightnessBox.y + brightnessBox.height / 2,
    );
    await page.mouse.down();
    await page.mouse.move(
      brightnessBox.x + brightnessBox.width * 0.35,
      brightnessBox.y + brightnessBox.height / 2,
      { steps: 5 },
    );
    await page.mouse.up();
    expect(await brightnessSlider.getAttribute("aria-valuenow")).not.toBe(brightnessBeforeEdit);

    const save = page.getByRole("button", { name: "Save", exact: true });
    await expect.poll(() => save.isEnabled()).toBe(true);
    await save.click();
    await expect.poll(() => save.isDisabled()).toBe(true);

    await page.getByRole("button", { name: "Apply", exact: true }).click();
    await page.getByRole("button", { name: "Stop", exact: true }).waitFor();
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.getByRole("button", { name: "Stop", exact: true }).waitFor();
    await page.getByRole("button", { name: "Stop", exact: true }).click();
    await page.getByRole("button", { name: "Apply", exact: true }).waitFor();

    await page.getByRole("button", { name: "Cancel", exact: true }).click();
    const sceneActions = page.getByRole("button", { name: "Browser Gallery Vibe actions" });
    await sceneActions.waitFor();
    await sceneActions.click();
    await page.getByRole("menuitem", { name: "Edit", exact: true }).click();
    await page.getByRole("heading", { name: "Lighting" }).waitFor();
    expect(await page.getByText("Loading scene…", { exact: true }).count()).toBe(0);
    expect(await sceneActions.isVisible()).toBe(false);

    const targetSection = page
      .getByRole("tab", { name: "Targets", exact: true })
      .locator("xpath=ancestor::section[1]");
    await targetSection.getByRole("button", { name: "Add", exact: true }).click();
    await page.getByRole("menuitem", { name: "Simple", exact: true }).click();
    const targetDrawer = page.getByRole("dialog");
    await targetDrawer.getByText(ROOM_NAME, { exact: true }).click();
    await targetDrawer.getByRole("button", { name: "Add 1 item" }).click();
    const removeRoom = targetSection.getByRole("button", {
      name: `Remove ${ROOM_NAME}`,
      exact: true,
    });
    await removeRoom.waitFor();
    await removeRoom.click();
    await expect.poll(() => removeRoom.count()).toBe(0);
    await expect
      .poll(() => page.getByRole("button", { name: "Save", exact: true }).isDisabled())
      .toBe(true);
  }, 90_000);

  it("uploads a private photo as Whites only against a group on mobile dark reduced-motion UI", async () => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
    await openCreation();
    await page.getByRole("button", { name: /Photo/ }).click();
    await page.getByRole("button", { name: "Whites only" }).click();
    const file = page.locator('input[type="file"]');
    await file.setInputFiles({
      name: "broken.png",
      mimeType: "image/png",
      buffer: Buffer.from("broken"),
    });
    await page.getByText("Hive could not decode this image.").waitFor();
    await file.setInputFiles({
      name: "private-colours.png",
      mimeType: "image/png",
      buffer: VALID_PNG,
    });
    const continueButton = page.getByRole("button", { name: "Continue", exact: true });
    try {
      await expect.poll(() => continueButton.isEnabled(), { timeout: 10_000 }).toBe(true);
    } catch {
      throw new Error(
        `Photo preview did not complete:\n${await page.locator("main").last().innerText()}`,
      );
    }
    await continueButton.click();
    await addDrawerTarget(GROUP_NAME);
    await page.getByRole("button", { name: "Continue", exact: true }).click();
    await finishCreation("Browser Photo Whites");
    await expect.poll(() => page.getByText("White", { exact: true }).count()).toBeGreaterThan(0);
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.emulateMedia({ colorScheme: "light", reducedMotion: "no-preference" });
  }, 90_000);

  it("finishes a keyboard-only Guided Vibe after three choices", async () => {
    await openCreation();
    await page.getByRole("button", { name: /Guided/ }).focus();
    await page.keyboard.press("Enter");
    await selectGuidedRounds(3);
    await addDrawerTarget("Bedroom Light");
    await page.getByRole("button", { name: "Continue", exact: true }).click();
    await finishCreation("Browser Guided Three");
    await expect.poll(() => page.getByText("Guided", { exact: true }).count()).toBeGreaterThan(0);
  }, 90_000);

  it("refines a Guided Vibe through all five choices", async () => {
    await openCreation();
    await page.getByRole("button", { name: /Guided/ }).click();
    await page.getByRole("button", { name: "Whites" }).click();
    await selectGuidedRoundsByClick(5);
    await addDrawerTarget("Living Room Light");
    await page.getByRole("button", { name: "Continue", exact: true }).click();
    await finishCreation("Browser Guided Five");
    await expect.poll(() => page.getByText("White", { exact: true }).count()).toBeGreaterThan(0);
  }, 90_000);

  it("creates Individual lights with captured state and an explicit supporting appliance plug", async () => {
    await openCreation();
    await page.getByRole("button", { name: /Individual lights/ }).click();
    await addDrawerTarget("Bedroom Light");
    await page.getByRole("button", { name: "Add", exact: true }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByText("Lava Lamp", { exact: true }).click();
    await dialog.getByRole("button", { name: "Add 1 item" }).click();
    await page.getByRole("button", { name: "Continue", exact: true }).click();
    await finishCreation("Browser Individual Scene");
    await expect
      .poll(() => page.getByText("Lava Lamp", { exact: true }).count())
      .toBeGreaterThan(0);
    await expect
      .poll(() => page.getByText("Lava Lamp", { exact: true }).count())
      .toBeGreaterThan(0);
  }, 90_000);
});
