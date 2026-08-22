import { describe, expect, it } from "vitest";
import {
  emptySearchState,
  matchChipKeyword,
  stateToTokens,
  tokensToState,
  type SearchState,
} from "$lib/components/hive-searchbar";
import { searchStateFromUrl, urlWithSearchState } from "$lib/search-state.svelte";

const KEYWORDS = ["type", "room"] as const;

describe("matchChipKeyword", () => {
  it("matches configured keywords and splits on the first colon", () => {
    expect(matchChipKeyword("type:light", KEYWORDS)).toBe("type");
    expect(matchChipKeyword("type:a:b", KEYWORDS)).toBe("type");
  });

  it("rejects missing, empty, unknown, and case-mismatched keywords", () => {
    expect(matchChipKeyword("type", KEYWORDS)).toBeNull();
    expect(matchChipKeyword(":light", KEYWORDS)).toBeNull();
    expect(matchChipKeyword("kind:light", KEYWORDS)).toBeNull();
    expect(matchChipKeyword("Type:light", KEYWORDS)).toBeNull();
  });
});

describe("search URL representation", () => {
  it("preserves free text and repeated filters losslessly", () => {
    const url = new URL(
      "https://hive.test/devices?q=bedroom%20lamp&filter=type%3Alight&filter=room%3ALiving%20Room&filter=type%3Alight",
    );
    expect(searchStateFromUrl(url)).toEqual({
      freeText: "bedroom lamp",
      chips: [
        { keyword: "type", value: "light" },
        { keyword: "room", value: "Living Room" },
        { keyword: "type", value: "light" },
      ],
    });
  });

  it("splits each decoded filter only at its first colon", () => {
    const url = new URL("https://hive.test/devices?filter=type%3Azigbee%3Arouter%3Av2");
    expect(searchStateFromUrl(url).chips).toEqual([{ keyword: "type", value: "zigbee:router:v2" }]);
  });

  it("ignores malformed empty-keyword filters", () => {
    const url = new URL("https://hive.test/devices?filter=&filter=%3Avalue&filter=missing-colon");
    expect(searchStateFromUrl(url)).toEqual(emptySearchState());
  });

  it("replaces search keys while preserving unrelated parameters", () => {
    const url = new URL(
      "https://hive.test/rooms?edit=room-1&tab=members&q=old&filter=type%3Asensor",
    );
    const next = urlWithSearchState(url, {
      freeText: "Hall: upstairs",
      chips: [
        { keyword: "device", value: "Door Sensor: North" },
        { keyword: "device", value: "Door Sensor: North" },
      ],
    });
    expect(next.pathname).toBe("/rooms");
    expect(next.searchParams.get("edit")).toBe("room-1");
    expect(next.searchParams.get("tab")).toBe("members");
    expect(next.searchParams.get("q")).toBe("Hall: upstairs");
    expect(next.searchParams.getAll("filter")).toEqual([
      "device:Door Sensor: North",
      "device:Door Sensor: North",
    ]);
  });

  it("removes empty search parameters", () => {
    const url = new URL("https://hive.test/groups?q=old&filter=type%3Alight&edit=g1");
    const next = urlWithSearchState(url, emptySearchState());
    expect(next.searchParams.has("q")).toBe(false);
    expect(next.searchParams.has("filter")).toBe(false);
    expect(next.searchParams.get("edit")).toBe("g1");
  });
});

describe("searchbar tokens", () => {
  it("preserves multiword values, punctuation, order, and duplicates", () => {
    const state: SearchState = {
      chips: [
        { keyword: "device", value: "Bedside Lamp: left" },
        { keyword: "device", value: "Bedside Lamp: left" },
      ],
      freeText: "living room",
    };
    const tokens = stateToTokens(state);
    expect(tokens).toEqual([
      "device:Bedside Lamp: left",
      "device:Bedside Lamp: left",
      "living room",
      "",
    ]);
    expect(tokensToState(tokens, ["device"])).toEqual(state);
  });

  it("joins committed free-text fragments and keeps the trailing live token", () => {
    expect(tokensToState(["bedroom", "lamp", ""], KEYWORDS)).toEqual({
      chips: [],
      freeText: "bedroom lamp",
    });
    expect(stateToTokens(emptySearchState())).toEqual([""]);
  });
});
