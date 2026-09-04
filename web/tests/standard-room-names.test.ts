import { describe, expect, it } from "vitest";
import { standardRoomName, standardRoomSearchNames } from "$lib/i18n/standard-room-names";

describe("standard room names", () => {
  it("translates recognized names across every supported source language", () => {
    expect(standardRoomName("Kitchen", "en", "ru")).toBe("Кухня");
    expect(standardRoomName("vardagsrum", "sv", "en")).toBe("Living room");
    expect(standardRoomName("спальня", "ru", "sv")).toBe("Sovrum");
  });

  it("preserves numbered room suffixes", () => {
    expect(standardRoomName("Gaming room 2", "en", "ru")).toBe("Игровая 2");
    expect(standardRoomName("Sovrum #3", "sv", "en")).toBe("Bedroom 3");
  });

  it("uses source-language-specific meanings for ambiguous names", () => {
    expect(standardRoomName("Hall", "en", "ru")).toBe("Коридор");
    expect(standardRoomName("Hall", "sv", "ru")).toBe("Прихожая");
  });

  it("does not guess at custom or partial names", () => {
    expect(standardRoomName("Kitchen lights", "en", "ru")).toBeNull();
    expect(standardRoomName("Alice's room", "en", "ru")).toBeNull();
  });

  it("returns cross-language aliases for search", () => {
    const names = standardRoomSearchNames("Living room", "en");
    expect(names).toContain("Зал");
    expect(names).toContain("гостиная");
    expect(names).toContain("Vardagsrum");
    expect(names).toContain("lounge");
  });
});
