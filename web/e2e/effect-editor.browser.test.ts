import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import {
  chromium,
  type Browser,
  type BrowserContext,
  type Locator,
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
    window.addEventListener(
      "contextmenu",
      (event) => {
        setTimeout(() => {
          document.documentElement.dataset.contextPrevented = String(event.defaultPrevented);
        }, 0);
      },
      true,
    );
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

async function rightClick(target: Locator, position?: { x: number; y: number }) {
  await target.click({ button: "right", position });
  await page.getByRole("menu").waitFor();
  expect(await page.getByRole("menu").count()).toBe(1);
  expect(await page.locator("html").getAttribute("data-context-prevented")).toBe("true");
}

async function addTrack() {
  await rightClick(page.getByRole("region", { name: "Effect timeline" }), { x: 150, y: 55 });
  expect((await page.getByRole("menuitem").allTextContents()).map((text) => text.trim())).toEqual([
    "Add track",
  ]);
  await page.getByRole("menuitem", { name: "Add track", exact: true }).click();
  await page.locator("[data-track-uid]").waitFor();
}

async function addColorClip() {
  await addTrack();
  await rightClick(page.locator("[data-track-uid]"), { x: 20, y: 28 });
  expect(await page.getByRole("menuitem", { name: "Paste", exact: true }).isDisabled()).toBe(true);
  await page.getByRole("menuitem", { name: "Color", exact: true }).click();
  await page.locator("[data-clip-uid]").waitFor();
}

describe("effect timeline context menus", () => {
  it("uses the same capability chip in the editor, table and cards", async () => {
    await addColorClip();
    const saved = page.waitForResponse((response) =>
      (response.request().postData() ?? "").includes("EffectEditUpdate"),
    );
    await page.getByRole("button", { name: "Save", exact: true }).click();
    expect((await (await saved).json()).errors).toBeUndefined();
    const { graphqlClient, appUrl } = getContext();
    await graphqlClient.mutation(SET_LANGUAGE, { language: Language.Sv }).toPromise();
    for (const dark of [true, false]) {
      await page.goto(`${appUrl}/effects/${effectId}`, { waitUntil: "domcontentloaded" });
      const editorChip = page.locator('[data-slot="badge"]:visible').filter({ hasText: "Färg" });
      await editorChip.locator("svg").waitFor();
      await page.evaluate(
        (value) => document.documentElement.classList.toggle("dark", value),
        dark,
      );
      const appearance = await editorChip.evaluate(async (element) => {
        await Promise.all(element.getAnimations().map((animation) => animation.finished));
        return {
          color: getComputedStyle(element).color,
          background: getComputedStyle(element).backgroundColor,
          fontSize: getComputedStyle(element).fontSize,
        };
      });
      await page.goto(`${appUrl}/effects`, { waitUntil: "domcontentloaded" });
      await page.getByRole("button", { name: "Tabellvy", exact: true }).click();
      const row = page.getByRole("row").filter({ hasText: "Timeline menu test" });
      const tableChip = row.locator('[data-slot="badge"]').filter({ hasText: "Färg" });
      await tableChip.locator("svg").waitFor();
      await page.evaluate(
        (value) => document.documentElement.classList.toggle("dark", value),
        dark,
      );
      await expect
        .poll(() =>
          tableChip.evaluate((element) => ({
            color: getComputedStyle(element).color,
            background: getComputedStyle(element).backgroundColor,
            fontSize: getComputedStyle(element).fontSize,
          })),
        )
        .toEqual(appearance);
      expect(await page.evaluate(() => document.documentElement.classList.contains("dark"))).toBe(
        dark,
      );
      const chipClasses = await tableChip.getAttribute("class");
      await page.screenshot({
        path: `/tmp/hive-swedish-effects-${dark ? "dark" : "light"}.png`,
        animations: "disabled",
      });
      await page.getByRole("button", { name: "Kortvy", exact: true }).click();
      await row.waitFor({ state: "hidden" });
      const cardChip = page.locator('[data-slot="badge"]:visible').filter({ hasText: "Färg" });
      await cardChip.locator("svg").waitFor();
      expect(await cardChip.getAttribute("class")).toBe(chipClasses);
    }
  });

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

  it("adds tracks, copies and pastes clips at the clicked time, and supports undo and redo", async () => {
    await addColorClip();
    const clips = page.locator("[data-clip-uid]");
    const originalId = await clips.first().getAttribute("data-clip-uid");
    await rightClick(clips.first());
    expect((await page.getByRole("menuitem").allTextContents()).map((text) => text.trim())).toEqual(
      ["Copy", "Delete"],
    );
    await page.getByRole("menuitem", { name: "Copy", exact: true }).click();

    const track = page.locator("[data-track-uid]");
    const clipBox = (await clips.first().boundingBox())!;
    const trackBox = (await track.boundingBox())!;
    const pasteX = clipBox.x + clipBox.width + 100 - trackBox.x;
    await rightClick(track, { x: pasteX, y: 28 });
    expect(await page.getByRole("menuitem", { name: "Paste", exact: true }).isEnabled()).toBe(true);
    await page.getByRole("menuitem", { name: "Paste", exact: true }).click();
    await page.waitForFunction(() => document.querySelectorAll("[data-clip-uid]").length === 2);
    expect(await clips.nth(1).getAttribute("data-clip-uid")).not.toBe(originalId);
    const originalBox = (await clips.first().boundingBox())!;
    expect((await clips.nth(1).boundingBox())!.x).toBeGreaterThan(
      originalBox.x + originalBox.width,
    );

    await rightClick(clips.nth(1));
    await page.getByRole("menuitem", { name: "Delete", exact: true }).click();
    await page.waitForFunction(() => document.querySelectorAll("[data-clip-uid]").length === 1);
    expect(await clips.first().getAttribute("data-clip-uid")).toBe(originalId);
    await page.getByRole("button", { name: "Undo", exact: true }).click();
    await page.waitForFunction(() => document.querySelectorAll("[data-clip-uid]").length === 2);
    await page.getByRole("button", { name: "Redo", exact: true }).click();
    await page.waitForFunction(() => document.querySelectorAll("[data-clip-uid]").length === 1);

    const saved = page.waitForResponse((response) =>
      (response.request().postData() ?? "").includes("EffectEditUpdate"),
    );
    await page.getByRole("button", { name: "Save", exact: true }).click();
    const body = await (await saved).json();
    expect(body.errors).toBeUndefined();
    await page.reload();
    await clips.first().waitFor();
    expect(await clips.count()).toBe(1);
  });

  it("reopens at valid targets and suppresses the browser menu when dismissing elsewhere", async () => {
    await addColorClip();
    await rightClick(page.locator("[data-clip-uid]"));
    const region = page.getByRole("region", { name: "Effect timeline" });
    const bounds = (await region.boundingBox())!;
    await page.mouse.click(bounds.x + 450, bounds.y + 55, { button: "right" });
    await page.getByRole("menuitem", { name: "Brightness", exact: true }).waitFor();
    expect(await page.getByRole("menu").count()).toBe(1);
    expect(await page.locator("html").getAttribute("data-context-prevented")).toBe("true");

    await page.mouse.click(bounds.x + 500, bounds.y + 10, { button: "right" });
    await page.getByRole("menuitem", { name: "Add track", exact: true }).waitFor();
    expect(await page.getByRole("menu").count()).toBe(1);

    const input = (await page.locator("#effect-name").boundingBox())!;
    await page.mouse.click(input.x + 20, input.y + 15, { button: "right" });
    await page.getByRole("menu").waitFor({ state: "hidden" });
    expect(await page.locator("html").getAttribute("data-context-prevented")).toBe("true");

    await page.getByRole("button", { name: "Add clip to Track 1", exact: true }).click();
    await page.getByRole("menuitem", { name: "Paste", exact: true }).waitFor();
    await page.mouse.click(bounds.x + 550, bounds.y + 10, { button: "right" });
    await page.getByRole("menuitem", { name: "Add track", exact: true }).waitFor();
    expect(await page.getByRole("menu").count()).toBe(1);
    await page.keyboard.press("Escape");
    await page.getByRole("menu").waitFor({ state: "hidden" });
  });

  it.each([
    [
      Language.En,
      "Add track",
      "Paste",
      "About default content language",
      "About room name translation",
    ],
    [
      Language.Sv,
      "Lägg till spår",
      "Klistra in",
      "Om standardspråk för innehåll",
      "Om översättning av rumsnamn",
    ],
    [
      Language.Ru,
      "Добавить дорожку",
      "Вставить",
      "О языке содержимого по умолчанию",
      "О переводе названий комнат",
    ],
  ] as const)(
    "renders %s menus and settings help in both themes",
    async (language, add, paste, defaultHelp, roomHelp) => {
      const { graphqlClient, appUrl } = getContext();
      await graphqlClient.mutation(SET_LANGUAGE, { language }).toPromise();
      await page.reload();
      await page.locator('[role="region"]').last().waitFor();
      const timeline = page.locator('[role="region"]').last();
      await rightClick(timeline, { x: 150, y: 55 });
      await page.getByRole("menuitem", { name: add, exact: true }).click();
      await rightClick(page.locator("[data-track-uid]"), { x: 100, y: 28 });
      expect(await page.getByRole("menuitem", { name: paste, exact: true }).isDisabled()).toBe(
        true,
      );
      for (const dark of [true, false]) {
        await page.evaluate(
          (value) => document.documentElement.classList.toggle("dark", value),
          dark,
        );
        await page.screenshot({
          path: `/tmp/hive-effect-menu-${language}-${dark ? "dark" : "light"}.png`,
          animations: "disabled",
        });
      }
      await page.keyboard.press("Escape");
      await page.goto(`${appUrl}/settings`, { waitUntil: "domcontentloaded" });
      await page.locator("#content-language").focus();
      await page.keyboard.press("Shift+Tab");
      expect(
        await page
          .getByRole("button", { name: defaultHelp, exact: true })
          .evaluate((element) => element === document.activeElement),
      ).toBe(true);
      const tooltip = page.locator('[data-slot="tooltip-content"]');
      await tooltip.waitFor();
      expect(await tooltip.innerText()).not.toBe("");
      await page.keyboard.press("Escape");
      const checkbox = page.locator("#translate-standard-room-names");
      const checked = await checkbox.getAttribute("aria-checked");
      await page.getByRole("button", { name: roomHelp, exact: true }).click();
      expect(await checkbox.getAttribute("aria-checked")).toBe(checked);
    },
  );
});
