import { vi } from "vitest";

declare const jsdom: { window: Window };
Object.defineProperty(globalThis, "localStorage", { configurable: true, value: jsdom.window.localStorage });
Object.defineProperty(globalThis, "sessionStorage", { configurable: true, value: jsdom.window.sessionStorage });

Object.defineProperty(window, "matchMedia", {
  configurable: true,
  writable: true,
  value: vi.fn((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

Object.defineProperty(window, "scrollTo", {
  configurable: true,
  writable: true,
  value: vi.fn(),
});
