import { beforeEach, describe, expect, it } from "vitest";
import { languageName } from "$lib/i18n/messages";
import {
  locale,
  normalizeLanguage,
  resolveInitialLanguage,
  setLanguage,
} from "$lib/i18n/locale.svelte";

describe("locale", () => {
  beforeEach(() => {
    localStorage.clear();
    setLanguage("en");
  });

  it("normalizes supported regional language tags", () => {
    expect(normalizeLanguage("sv-SE")).toBe("sv");
    expect(normalizeLanguage("ru_RU")).toBe("ru");
    expect(normalizeLanguage("EN-us")).toBe("en");
    expect(normalizeLanguage("de-DE")).toBeNull();
    expect(normalizeLanguage(null)).toBeNull();
  });

  it("prefers a cached language, then browser preferences, then English", () => {
    expect(resolveInitialLanguage("ru", ["sv-SE"])).toBe("ru");
    expect(resolveInitialLanguage("invalid", ["de-DE", "sv-SE"])).toBe("sv");
    expect(resolveInitialLanguage(null, ["de-DE", "ru-RU"])).toBe("ru");
    expect(resolveInitialLanguage(null, ["de-DE"])).toBe("en");
  });

  it("switches without navigation and updates document state", () => {
    const location = window.location.href;
    setLanguage("sv");

    expect(locale.currentLanguage).toBe("sv");
    expect(locale.intlLocale).toBe("sv-SE");
    expect(locale.messageOptions()).toEqual({ locale: "sv" });
    expect(document.documentElement.lang).toBe("sv");
    expect(localStorage.getItem("saffron-hive-language")).toBe("sv");
    expect(window.location.href).toBe(location);
  });

  it("synchronizes the authenticated preference into the local mirror", () => {
    locale.syncFromProfile("ru");

    expect(locale.currentLanguage).toBe("ru");
    expect(document.documentElement.lang).toBe("ru");
    expect(localStorage.getItem("saffron-hive-language")).toBe("ru");
  });

  it("renders language names in an explicitly selected locale", () => {
    expect(languageName("sv", "en")).toBe("Swedish");
    expect(languageName("sv", "sv")).toBe("Svenska");
    expect(languageName("ru", "ru")).toBe("Русский");
  });
});
