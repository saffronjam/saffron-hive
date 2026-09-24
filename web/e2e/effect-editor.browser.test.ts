import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import {
  chromium,
  type Browser,
  type BrowserContext,
  type Page,
} from "playwright-core";
import { graphql } from "$lib/gql";
import { EffectKind, Language } from "$lib/gql/graphql";
import { getContext } from "./setup.js";

const CREATE_EFFECT = graphql(`
  mutation BrowserEditorCreateEffect($input: CreateEffectInput!) {
    createEffect(input: $input) {
      id
    }
  }
`);

const DELETE_EFFECT = graphql(`
  mutation BrowserEditorDeleteEffect($id: ID!) {
    deleteEffect(id: $id)
  }
`);

const SET_LANGUAGE = graphql(`
  mutation BrowserEditorSetLanguage($language: Language!) {
    updateCurrentUser(input: { language: $language }) {
      language
    }
  }
`);

let browser: Browser;
let context: BrowserContext;
let page: Page;
let effectId: string | null = null;
let pageErrors: string[] = [];

beforeAll(async () => {
  browser = await chromium.launch({ channel: "chrome", headless: true });
});

beforeEach(async () => {
  pageErrors = [];
  const { graphqlClient, token, appUrl } = getContext();
  await graphqlClient.mutation(SET_LANGUAGE, { language: Language.En }).toPromise();
  const created = await graphqlClient
    .mutation(CREATE_EFFECT, {
      input: {
        name: "Timeline menu test",
        kind: EffectKind.Timeline,
        loop: false,
        durationMs: 0,
        tracks: [],
      },
    })
    .toPromise();
  if (created.error || !created.data) throw created.error ?? new Error("Effect fixture missing");
  effectId = created.data.createEffect.id;
  context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    serviceWorkers: "block",
  });
  await context.addInitScript((authToken) => {
    localStorage.setItem("hive.token", authToken);
  }, token);
  page = await context.newPage();
  page.setDefaultTimeout(10_000);
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("dialog", (dialog) => void dialog.accept());
  await page.goto(`${appUrl}/effects/${effectId}`, { waitUntil: "domcontentloaded" });
  await page.getByRole("region", { name: "Effect timeline" }).waitFor();
});

afterEach(async () => {
  await context?.close();
  const { graphqlClient } = getContext();
  if (effectId) await graphqlClient.mutation(DELETE_EFFECT, { id: effectId }).toPromise();
  effectId = null;
  await graphqlClient.mutation(SET_LANGUAGE, { language: Language.En }).toPromise();
  expect(pageErrors).toEqual([]);
});

afterAll(async () => {
  await browser?.close();
});

describe("effect table actions", () => {
  it("highlights table actions and gives each a pointer cursor", async () => {
    await page.goto(`${getContext().appUrl}/effects`, { waitUntil: "domcontentloaded" });
    await page.getByRole("button", { name: "Table view", exact: true }).click();
    const row = page.getByRole("row").filter({ hasText: "Timeline menu test" });
    for (const label of ["Run effect", "Edit effect", "Delete effect"]) {
      const action = row.getByLabel(label, { exact: true });
      const background = await action.evaluate(
        (element) => getComputedStyle(element).backgroundColor,
      );
      expect(await action.evaluate((element) => getComputedStyle(element).cursor)).toBe("pointer");
      await action.hover();
      await expect
        .poll(() => action.evaluate((element) => getComputedStyle(element).backgroundColor))
        .not.toBe(background);
      await page.mouse.move(0, 0);
    }
  });
});
