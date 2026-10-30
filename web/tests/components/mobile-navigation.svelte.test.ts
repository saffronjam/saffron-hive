import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { flushSync, mount, unmount } from "svelte";
import type { AfterNavigate, BeforeNavigate } from "@sveltejs/kit";
import MobileNavigation from "$lib/components/mobile-navigation.svelte";
import { resetMockPage, setMockPageUrl } from "../mocks/app-state.svelte";

const navigation = vi.hoisted(() => ({
  after: undefined as ((nav: Pick<AfterNavigate, "to" | "type">) => void) | undefined,
  before: undefined as
    | ((nav: Pick<BeforeNavigate, "to" | "type" | "complete">) => void)
    | undefined,
}));
vi.mock("$app/navigation", () => ({
  afterNavigate: (callback: typeof navigation.after) => {
    navigation.after = callback;
  },
  beforeNavigate: (callback: typeof navigation.before) => {
    navigation.before = callback;
  },
}));

let component: ReturnType<typeof mount>;
let host: HTMLDivElement;
const selected = () => host.querySelector("a[aria-current]")?.getAttribute("href");
function tap(href: string, options: MouseEventInit = {}) {
  host
    .querySelector(`a[href="${href}"]`)!
    .dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, ...options }));
  flushSync();
}
function start(path: "/" | "/devices" | "/menu", type: "link" | "popstate" = "link") {
  const deferred = Promise.withResolvers<void>();
  void deferred.promise.catch(() => undefined);
  const to = {
    url: new URL(path, "https://hive.test"),
    params: {},
    route: { id: path },
    scroll: null,
  };
  navigation.before!({ to, type, complete: deferred.promise });
  return { ...deferred, to };
}

const preventNavigation = (event: MouseEvent) => event.preventDefault();

beforeEach(() => {
  resetMockPage();
  host = document.createElement("div");
  document.body.append(host);
  component = mount(MobileNavigation, { target: host });
  flushSync();
  document.addEventListener("click", preventNavigation);
});
afterEach(async () => {
  await unmount(component);
  host.remove();
  document.removeEventListener("click", preventNavigation);
  vi.unstubAllGlobals();
});

describe("mobile navigation intent", () => {
  it("selects the destination before the route finishes", async () => {
    tap("/devices");
    const request = start("/devices");
    expect(selected()).toBe("/devices");
    expect(host.querySelector('a[href="/devices"]')?.getAttribute("aria-current")).toBe("location");
    setMockPageUrl("https://hive.test/devices");
    request.resolve();
    await vi.waitFor(() => {
      flushSync();
      expect(host.querySelector('a[href="/devices"]')?.getAttribute("aria-current")).toBe("page");
    });
  });

  it("keeps the most recent tap selected when an earlier navigation settles", async () => {
    tap("/devices");
    const first = start("/devices");
    tap("/menu");
    const latest = start("/menu");
    first.reject(new Error("navigation aborted"));
    await Promise.resolve();
    flushSync();
    expect(selected()).toBe("/menu");
    latest.reject(new Error("navigation cancelled"));
    await vi.waitFor(() => {
      flushSync();
      expect(selected()).toBe("/");
    });
  });

  it("reconciles rejected navigation and browser history with the actual page", async () => {
    tap("/devices");
    const blocked = start("/devices");
    blocked.reject(new Error("navigation cancelled"));
    await vi.waitFor(() => {
      flushSync();
      expect(selected()).toBe("/");
    });
    tap("/menu");
    start("/devices", "popstate").resolve();
    setMockPageUrl("https://hive.test/devices/one");
    flushSync();
    expect(selected()).toBe("/devices");
  });

  it("follows completed and history navigations while a request is pending", () => {
    tap("/devices");
    tap("/menu");
    setMockPageUrl("https://hive.test/menu");
    navigation.after!({ to: start("/menu").to, type: "link" });
    setMockPageUrl("https://hive.test/");
    flushSync();
    expect(selected()).toBe("/");
    tap("/devices");
    navigation.after!({ to: start("/").to, type: "popstate" });
    flushSync();
    expect(selected()).toBe("/");
  });

  it("leaves modified clicks to the browser", () => {
    for (const options of [
      { metaKey: true },
      { ctrlKey: true },
      { shiftKey: true },
      { altKey: true },
      { button: 1 },
    ]) {
      tap("/devices", options);
      expect(selected()).toBe("/");
    }
  });
});
