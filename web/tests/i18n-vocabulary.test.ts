import { beforeEach, describe, expect, it } from "vitest";
import { setLanguage } from "$lib/i18n/locale.svelte";
import { historyFieldLabel, identifierLabel } from "$lib/i18n/vocabulary";

describe("localized identifier vocabulary", () => {
  beforeEach(() => setLanguage("en"));

  it("localizes known device capabilities without exposing wire identifiers", () => {
    setLanguage("ru");
    expect(historyFieldLabel("color")).toBe("Цвет");
    expect(historyFieldLabel("color_temp")).toBe("Цветовая температура");
    expect(historyFieldLabel("power_on_behavior")).toBe("Поведение при включении");
    expect(historyFieldLabel("effect")).toBe("Эффект");
    expect(identifierLabel("tilt")).toBe("Наклон");
  });

  it("humanizes unknown provider capabilities", () => {
    expect(historyFieldLabel("startup_current_level")).toBe("Startup current level");
    expect(identifierLabel("color_loop")).toBe("Color loop");
  });
});
