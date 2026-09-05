import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { chromium, type Browser, type BrowserContext, type Page } from "playwright-core";
import { graphql } from "$lib/gql";
import { Language } from "$lib/gql/graphql";
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

interface LocaleProbeWindow extends Window {
  __firstStandardRoomName?: string;
}

let browser: Browser;
let browserContext: BrowserContext;
let page: Page;
let roomId: string | null = null;
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
  await page.goto(appUrl, { waitUntil: "domcontentloaded" });
}, 120_000);

afterAll(async () => {
  await browserContext?.close();
  await browser?.close();

  const { graphqlClient } = getContext();
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
});
