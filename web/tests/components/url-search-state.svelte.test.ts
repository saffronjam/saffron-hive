import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { flushSync, mount, unmount } from "svelte";
import Harness from "./url-search-state-harness.svelte";
import { gotoCalls, resetMockNavigation, runAfterNavigate } from "../mocks/app-navigation";
import { resetMockPage, setMockPageUrl } from "../mocks/app-state.svelte";

type HarnessInstance = {
  value(): { chips: Array<{ keyword: string; value: string }>; freeText: string };
  set(next: { chips: Array<{ keyword: string; value: string }>; freeText: string }): void;
  setActive(next: boolean): void;
};

let host: HTMLDivElement;
let instance: HarnessInstance | null = null;

beforeEach(() => {
  resetMockPage();
  resetMockNavigation();
  host = document.createElement("div");
  document.body.appendChild(host);
});

afterEach(() => {
  if (instance) void unmount(instance);
  instance = null;
  host.remove();
});

function mountHarness(url: string): HarnessInstance {
  setMockPageUrl(url);
  instance = mount(Harness, { target: host }) as HarnessInstance;
  flushSync();
  return instance;
}

describe("createUrlSearchState", () => {
  it("hydrates synchronously and navigates with history replacement on edits", () => {
    const harness = mountHarness(
      "https://hive.test/devices?edit=d1&q=bedroom&filter=room%3ALiving%20Room",
    );
    expect(harness.value()).toEqual({
      freeText: "bedroom",
      chips: [{ keyword: "room", value: "Living Room" }],
    });
    expect(host.textContent).toContain("Room: Living Room");
    expect(host.textContent).toContain("bedroom");

    harness.set({
      freeText: "hall",
      chips: [{ keyword: "room", value: "Hallway" }],
    });
    flushSync();

    expect(gotoCalls).toHaveLength(1);
    expect(gotoCalls[0].url.searchParams.get("edit")).toBe("d1");
    expect(gotoCalls[0].url.searchParams.get("q")).toBe("hall");
    expect(gotoCalls[0].url.searchParams.getAll("filter")).toEqual(["room:Hallway"]);
    expect(gotoCalls[0].options).toEqual({
      replaceState: true,
      keepFocus: true,
      noScroll: true,
    });
  });

  it("routes searchbar typing through the controller", () => {
    const harness = mountHarness("https://hive.test/devices");
    const input = host.querySelector("input");
    expect(input).not.toBeNull();
    input!.value = "instant";
    input!.dispatchEvent(new Event("input", { bubbles: true }));
    flushSync();
    expect(harness.value().freeText).toBe("instant");
    expect(gotoCalls).toHaveLength(1);
    expect(gotoCalls[0].url.searchParams.get("q")).toBe("instant");
  });

  it("clears an empty active filter with Backspace", () => {
    const harness = mountHarness("https://hive.test/devices");
    const input = host.querySelector("input");
    expect(input).not.toBeNull();

    input!.value = "room:";
    input!.dispatchEvent(new Event("input", { bubbles: true }));
    flushSync();
    expect(host.textContent).toContain("Room:");

    input!.value = "";
    input!.dispatchEvent(new KeyboardEvent("keydown", { key: "Backspace", bubbles: true }));
    flushSync();

    expect(harness.value()).toEqual({ chips: [], freeText: "" });
    expect(host.querySelector("input")?.value).toBe("");
    expect(host.textContent).not.toContain("Room:");
  });

  it("adopts URL-originated Back and Forward updates without writing back", () => {
    const harness = mountHarness("https://hive.test/devices?q=first");
    setMockPageUrl("https://hive.test/devices?q=second&filter=room%3AKitchen");
    runAfterNavigate();
    flushSync();
    expect(harness.value()).toEqual({
      freeText: "second",
      chips: [{ keyword: "room", value: "Kitchen" }],
    });
    expect(host.textContent).toContain("second");
    expect(gotoCalls).toHaveLength(0);
  });

  it("keeps its own state and does not touch the route while inactive", () => {
    const harness = mountHarness("https://hive.test/devices?q=devices");
    harness.setActive(false);
    flushSync();
    setMockPageUrl("https://hive.test/rooms?q=rooms");
    flushSync();
    expect(harness.value().freeText).toBe("devices");

    harness.set({ freeText: "hidden edit", chips: [] });
    flushSync();
    expect(harness.value().freeText).toBe("hidden edit");
    expect(gotoCalls).toHaveLength(0);
  });
});
