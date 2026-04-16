import { describe, it, expect, beforeEach, vi } from "vitest";

const STORAGE_KEY = "saffron-hive-theme";

beforeEach(() => {
  localStorage.clear();
  document.documentElement.classList.remove("dark");
  vi.stubGlobal(
    "matchMedia",
    vi.fn((query: string) => ({
      matches: query === "(prefers-color-scheme: dark)",
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
      onchange: null,
    })),
  );
  vi.resetModules();
});

describe("theme store", () => {
  it("defaults to dark when no stored preference and system prefers dark", async () => {
    const { theme } = await import("$lib/stores/theme");
    const { get } = await import("svelte/store");
    expect(get(theme)).toBe("dark");
  });

  it("defaults to light when system prefers light", async () => {
    vi.stubGlobal(
      "matchMedia",
      vi.fn(() => ({
        matches: false,
        media: "",
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
        onchange: null,
      })),
    );
    const { theme } = await import("$lib/stores/theme");
    const { get } = await import("svelte/store");
    expect(get(theme)).toBe("light");
  });

  it("reads stored preference from localStorage", async () => {
    localStorage.setItem(STORAGE_KEY, "light");
    const { theme } = await import("$lib/stores/theme");
    const { get } = await import("svelte/store");
    expect(get(theme)).toBe("light");
  });

  it("setTheme persists to localStorage and applies class", async () => {
    const { theme } = await import("$lib/stores/theme");

    theme.setTheme("light");
    expect(localStorage.getItem(STORAGE_KEY)).toBe("light");
    expect(document.documentElement.classList.contains("dark")).toBe(false);

    theme.setTheme("dark");
    expect(localStorage.getItem(STORAGE_KEY)).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("toggle switches between dark and light", async () => {
    const { theme } = await import("$lib/stores/theme");
    const { get } = await import("svelte/store");

    theme.setTheme("dark");
    theme.toggle();
    expect(get(theme)).toBe("light");
    expect(localStorage.getItem(STORAGE_KEY)).toBe("light");

    theme.toggle();
    expect(get(theme)).toBe("dark");
    expect(localStorage.getItem(STORAGE_KEY)).toBe("dark");
  });
});
