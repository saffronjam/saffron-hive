import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { chromium, type Browser, type BrowserContext, type Page } from "playwright-core";
import { graphql } from "$lib/gql";
import { Language, SceneLightOverrideKind, SceneTargetType } from "$lib/gql/graphql";
import { getContext } from "./setup.js";

const BOOTSTRAP_STATE = graphql(`
  query LocaleBootstrapState {
    me {
      language
    }
    settings {
      key
      value
    }
    devices {
      id
      friendlyName
    }
  }
`);

const UPDATE_LANGUAGE = graphql(`
  mutation LocaleBootstrapUpdateLanguage($language: Language!) {
    updateCurrentUser(input: { language: $language }) {
      language
    }
  }
`);

const UPDATE_SETTING = graphql(`
  mutation LocaleBootstrapUpdateSetting($key: String!, $value: String!) {
    updateSetting(key: $key, value: $value) {
      key
      value
    }
  }
`);

const CREATE_ROOM = graphql(`
  mutation LocaleBootstrapCreateRoom($name: String!) {
    createRoom(input: { name: $name }) {
      id
    }
  }
`);

const DELETE_ROOM = graphql(`
  mutation LocaleBootstrapDeleteRoom($id: ID!) {
    deleteRoom(id: $id)
  }
`);

const ADD_ROOM_MEMBER = graphql(`
  mutation LocaleBootstrapAddRoomMember($input: AddRoomMemberInput!) {
    addRoomMember(input: $input) {
      id
    }
  }
`);

const CREATE_SCENE = graphql(`
  mutation LocaleBootstrapCreateScene($input: CreateSceneInput!) {
    createScene(input: $input) {
      id
    }
  }
`);

const DELETE_SCENE = graphql(`
  mutation LocaleBootstrapDeleteScene($id: ID!) {
    deleteScene(id: $id)
  }
`);

interface LocaleProbeWindow extends Window {
  __firstStandardRoomName?: string;
}

let browser: Browser;
let browserContext: BrowserContext;
let page: Page;
let roomId: string | null = null;
let sceneId: string | null = null;
let originalLanguage = Language.En;
let originalContentLanguage = "en";
let originalTranslateStandardRoomNames = "false";

beforeAll(async () => {
  const { graphqlClient, appUrl, token } = getContext();
  const state = await graphqlClient
    .query(BOOTSTRAP_STATE, {}, { requestPolicy: "network-only" })
    .toPromise();
  if (state.error || !state.data?.me) throw state.error ?? new Error("Locale state unavailable");
  originalLanguage = state.data.me.language ?? Language.En;
  for (const setting of state.data.settings) {
    if (setting.key === "i18n.default_content_language") {
      originalContentLanguage = setting.value;
    } else if (setting.key === "i18n.translate_standard_room_names") {
      originalTranslateStandardRoomNames = setting.value;
    }
  }

  const updates = await Promise.all([
    graphqlClient.mutation(UPDATE_LANGUAGE, { language: Language.Sv }).toPromise(),
    graphqlClient
      .mutation(UPDATE_SETTING, { key: "i18n.default_content_language", value: "en" })
      .toPromise(),
    graphqlClient
      .mutation(UPDATE_SETTING, { key: "i18n.translate_standard_room_names", value: "true" })
      .toPromise(),
  ]);
  const updateError = updates.find((result) => result.error)?.error;
  if (updateError) throw updateError;

  const created = await graphqlClient.mutation(CREATE_ROOM, { name: "Kitchen" }).toPromise();
  if (created.error || !created.data) throw created.error ?? new Error("Room was not created");
  roomId = created.data.createRoom.id;
  const light = state.data.devices.find((device) => device.friendlyName === "Living Room Light");
  if (!light) throw new Error("Light fixture missing");
  const member = await graphqlClient
    .mutation(ADD_ROOM_MEMBER, {
      input: { roomId, memberType: "device", memberId: light.id },
    })
    .toPromise();
  if (member.error) throw member.error;
  const scene = await graphqlClient
    .mutation(CREATE_SCENE, {
      input: {
        name: "Stämning 🫠",
        definition: {
          targets: [{ targetType: SceneTargetType.Room, targetId: roomId }],
          lighting: {
            overrides: [
              { deviceId: light.id, kind: SceneLightOverrideKind.State, state: { on: true } },
            ],
          },
          supportingStates: [],
        },
      },
    })
    .toPromise();
  if (scene.error || !scene.data) throw scene.error ?? new Error("Scene fixture missing");
  sceneId = scene.data.createScene.id;

  browser = await chromium.launch({ channel: "chrome", headless: true });
  browserContext = await browser.newContext({ serviceWorkers: "block" });
  await browserContext.route("**/graphql", async (route) => {
    const body = route.request().postDataJSON() as { operationName?: string } | null;
    if (body?.operationName === "LocalizedNamesBootstrap") {
      await new Promise((resolve) => setTimeout(resolve, 300));
    }
    await route.continue();
  });
  await browserContext.addInitScript((authToken) => {
    localStorage.setItem("hive.token", authToken);
    localStorage.removeItem("saffron-hive-language");

    const inspect = () => {
      const probe = window as LocaleProbeWindow;
      if (probe.__firstStandardRoomName) return;
      for (const element of document.querySelectorAll("main *")) {
        const text = element.textContent?.trim();
        if (text === "Kitchen" || text === "Kök") {
          probe.__firstStandardRoomName = text;
          return;
        }
      }
    };
    const start = () => {
      new MutationObserver(inspect).observe(document.body, {
        childList: true,
        subtree: true,
        characterData: true,
      });
      inspect();
    };
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", start, { once: true });
    } else {
      start();
    }
  }, token);
  page = await browserContext.newPage();
  page.setDefaultTimeout(10_000);
  await page.goto(appUrl, { waitUntil: "domcontentloaded" });
}, 120_000);

afterAll(async () => {
  await browserContext?.close();
  await browser?.close();

  const { graphqlClient } = getContext();
  if (sceneId) await graphqlClient.mutation(DELETE_SCENE, { id: sceneId }).toPromise();
  if (roomId) await graphqlClient.mutation(DELETE_ROOM, { id: roomId }).toPromise();
  await Promise.all([
    graphqlClient.mutation(UPDATE_LANGUAGE, { language: originalLanguage }).toPromise(),
    graphqlClient
      .mutation(UPDATE_SETTING, {
        key: "i18n.default_content_language",
        value: originalContentLanguage,
      })
      .toPromise(),
    graphqlClient
      .mutation(UPDATE_SETTING, {
        key: "i18n.translate_standard_room_names",
        value: originalTranslateStandardRoomNames,
      })
      .toPromise(),
  ]);
});

describe("locale bootstrap", () => {
  it("renders a standard room name in the profile language on its first frame", async () => {
    await expect
      .poll(() =>
        page.evaluate(() => (window as LocaleProbeWindow).__firstStandardRoomName ?? null),
      )
      .not.toBeNull();
    expect(await page.evaluate(() => (window as LocaleProbeWindow).__firstStandardRoomName)).toBe(
      "Kök",
    );
  });

  it("translates read-only scene room labels and keeps the room editor source name", async () => {
    const { appUrl, graphqlClient } = getContext();
    await page.goto(`${appUrl}/rooms?edit=${roomId}`, { waitUntil: "domcontentloaded" });
    await page.locator("#room-name").waitFor();
    expect(await page.locator("#room-name").inputValue()).toBe("Kitchen");
    await page.goto(`${appUrl}/scenes`, { waitUntil: "domcontentloaded" });
    await page.getByRole("heading", { name: "Stämning 🫠", exact: true }).waitFor();
    await page.getByText("· Kök", { exact: true }).waitFor();
    await page.evaluate(() => document.fonts.ready);
    const cdp = await page.context().newCDPSession(page);
    await cdp.send("DOM.enable");
    await cdp.send("CSS.enable");
    await page.getByRole("heading", { name: "Stämning 🫠", exact: true }).evaluate((element) => {
      element.id = "scene-emoji-name";
    });
    const { root } = await cdp.send("DOM.getDocument");
    const { nodeId } = await cdp.send("DOM.querySelector", {
      nodeId: root.nodeId,
      selector: "#scene-emoji-name",
    });
    const { fonts } = await cdp.send("CSS.getPlatformFontsForNode", { nodeId });
    expect(fonts.some((font) => /emoji/i.test(font.familyName) && font.glyphCount > 0)).toBe(true);
    await cdp.detach();
    const paintedEmoji = await page.locator("#scene-emoji-name").evaluate((element) => {
      const canvas = document.createElement("canvas");
      canvas.width = 64;
      canvas.height = 64;
      const context = canvas.getContext("2d")!;
      context.font = `32px ${getComputedStyle(element).fontFamily}`;
      context.fillText("🫠", 0, 40);
      return context
        .getImageData(0, 0, 64, 64)
        .data.some((value, index) => index % 4 === 3 && value > 0);
    });
    expect(paintedEmoji).toBe(true);
    for (const dark of [true, false]) {
      await page.evaluate(
        (value) => document.documentElement.classList.toggle("dark", value),
        dark,
      );
      await page.screenshot({
        path: `/tmp/hive-swedish-scenes-${dark ? "dark" : "light"}.png`,
        animations: "disabled",
      });
    }
    await page.getByRole("button", { name: "Tabellvy", exact: true }).click();
    const row = page.getByRole("row").filter({ hasText: "Stämning 🫠" });
    await row.getByRole("link", { name: "Kök", exact: true }).waitFor();
    const changed = await graphqlClient
      .mutation(UPDATE_SETTING, {
        key: "i18n.translate_standard_room_names",
        value: "false",
      })
      .toPromise();
    expect(changed.error).toBeUndefined();
    await page.reload();
    await row.getByRole("link", { name: "Kitchen", exact: true }).waitFor();
    await page.getByRole("button", { name: "Kortvy", exact: true }).click();
    await page.getByText("· Kitchen", { exact: true }).waitFor();
  });
});
