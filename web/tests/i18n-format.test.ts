import { beforeEach, describe, expect, it } from "vitest";
import {
  collator,
  formatList,
  formatMeasurement,
  formatNumber,
  formatPercent,
  formatShortDuration,
} from "$lib/i18n/format";
import { setLanguage } from "$lib/i18n/locale.svelte";

describe("locale formatting", () => {
  beforeEach(() => setLanguage("en"));

  it("formats numbers, percentages, and measurements in the active locale", () => {
    setLanguage("sv");
    expect(formatNumber(1234.5)).toBe(new Intl.NumberFormat("sv-SE").format(1234.5));
    expect(formatPercent(0.42)).toBe(
      new Intl.NumberFormat("sv-SE", { style: "percent" }).format(0.42),
    );
    expect(formatMeasurement(21.5, "°C")).toBe(
      `${new Intl.NumberFormat("sv-SE").format(21.5)}\u00a0°C`,
    );
  });

  it("formats lists and constructs locale-aware collators", () => {
    setLanguage("ru");
    expect(formatList(["один", "два", "три"])).toBe(
      new Intl.ListFormat("ru-RU").format(["один", "два", "три"]),
    );
    expect(collator().compare("2", "10")).toBeLessThan(0);
  });

  it("formats compact durations with locale-specific units", () => {
    expect(formatShortDuration(0.2, "second", "en")).toBe("0.2 sec");
    expect(formatShortDuration(0.2, "second", "sv")).toBe("0,2 s");
    expect(formatShortDuration(0.2, "second", "ru")).toBe("0,2 с");
  });
});
