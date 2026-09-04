import { beforeEach, describe, expect, it } from "vitest";
import {
  allLocalizedNames,
  compareLocalizedNames,
  localizedName,
  localizedNameMatches,
  type LocalizedNameSet,
} from "$lib/i18n/names";
import { setLanguage } from "$lib/i18n/locale.svelte";
import { deviceSourceName, groupSourceName } from "$lib/utils";
import { localizedNamesStore } from "$lib/stores/localized-names.svelte";

const names: LocalizedNameSet = {
  entityType: "room",
  entityId: "room-1",
  sourceLanguage: "en",
  translations: { sv: "Kök", ru: "Кухня" },
};

describe("localized entity names", () => {
  beforeEach(() => {
    setLanguage("en");
    localizedNamesStore.clear();
  });

  it("resolves translations and deterministic fallbacks", () => {
    expect(localizedName(names, "sv", "Kitchen")).toBe("Kök");
    expect(localizedName(names, "en", "Kitchen")).toBe("Kitchen");
    expect(localizedName({ ...names, translations: {} }, "ru", "Kitchen")).toBe("Kitchen");
    expect(localizedName(undefined, "ru", null, "Provider kitchen")).toBe("Provider kitchen");
  });

  it("searches every language without changing the displayed locale", () => {
    expect(localizedNameMatches("kitchen", names, "Kitchen")).toBe(true);
    expect(localizedNameMatches("kök", names, "Kitchen")).toBe(true);
    expect(localizedNameMatches("кух", names, "Kitchen")).toBe(true);
    expect(allLocalizedNames(names, "Kitchen")).toEqual(["Kitchen", "Kök", "Кухня"]);
  });

  it("uses the active locale collator with an ID tiebreaker", () => {
    setLanguage("sv");
    expect(compareLocalizedNames("A", "A", "room-1", "room-2")).toBeLessThan(0);
  });

  it("keeps automation source names independent of the active locale", () => {
    const device = { id: "device-1", name: "Kitchen lamp", friendlyName: "Provider lamp" };
    const group = { id: "group-1", name: "Ceiling lights", friendlyName: "Provider group" };

    setLanguage("ru");
    expect(deviceSourceName(device)).toBe("Kitchen lamp");
    expect(groupSourceName(group)).toBe("Ceiling lights");

    setLanguage("sv");
    expect(deviceSourceName(device)).toBe("Kitchen lamp");
    expect(groupSourceName(group)).toBe("Ceiling lights");
  });

  it("translates recognized room names only when the setting is enabled", () => {
    setLanguage("ru");
    expect(localizedNamesStore.display("room", "room-1", "Kitchen")).toBe("Kitchen");

    localizedNamesStore.setTranslateStandardRoomNames(true);
    expect(localizedNamesStore.display("room", "room-1", "Kitchen")).toBe("Кухня");
    expect(localizedNamesStore.display("room", "room-2", "Bedroom 2")).toBe("Спальня 2");
    expect(localizedNamesStore.display("room", "room-3", "Alice's corner")).toBe("Alice's corner");
    expect(localizedNamesStore.display("device", "device-1", "Kitchen")).toBe("Kitchen");
  });

  it("makes every standard room alias searchable", () => {
    localizedNamesStore.setTranslateStandardRoomNames(true);
    expect(localizedNamesStore.matches("room", "room-1", "гостин", "Living room")).toBe(true);
    expect(localizedNamesStore.matches("room", "room-1", "vardags", "Living room")).toBe(true);
  });
});
