import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { haptics } from "$lib/stores/haptics.svelte";

function installVibrate(result = true) {
  const vibrate = vi.fn(() => result);
  Object.defineProperty(navigator, "vibrate", {
    configurable: true,
    value: vibrate,
  });
  return vibrate;
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-08-24T12:00:00Z"));
  Object.defineProperty(document, "visibilityState", {
    configurable: true,
    value: "visible",
  });
  haptics.reset();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("haptics", () => {
  it("maps semantic intents to short pulses", () => {
    const vibrate = installVibrate();

    expect(haptics.play("selection", "touch")).toBe(true);
    vi.advanceTimersByTime(75);
    expect(haptics.play("engage", "pen")).toBe(true);
    vi.advanceTimersByTime(75);
    expect(haptics.play("execute", "touch")).toBe(true);

    expect(vibrate.mock.calls).toEqual([[10], [15], [12]]);
  });

  it("accepts touch and pen pointer events only", () => {
    const vibrate = installVibrate();
    const touch = Object.assign(new Event("click"), { pointerType: "touch" });
    const mouse = Object.assign(new Event("click"), { pointerType: "mouse" });

    expect(haptics.play("selection", mouse)).toBe(false);
    expect(haptics.play("selection", null)).toBe(false);
    expect(haptics.play("selection", touch)).toBe(true);
    expect(vibrate).toHaveBeenCalledOnce();
  });

  it("respects the profile preference and page visibility", () => {
    const vibrate = installVibrate();

    haptics.syncFromProfile(false);
    expect(haptics.play("selection", "touch")).toBe(false);

    haptics.syncFromProfile(true);
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: "hidden",
    });
    expect(haptics.play("selection", "touch")).toBe(false);
    expect(vibrate).not.toHaveBeenCalled();
  });

  it("deduplicates nested feedback", () => {
    const vibrate = installVibrate();

    expect(haptics.play("selection", "touch")).toBe(true);
    expect(haptics.play("execute", "touch")).toBe(false);
    vi.advanceTimersByTime(74);
    expect(haptics.play("execute", "touch")).toBe(false);
    vi.advanceTimersByTime(1);
    expect(haptics.play("execute", "touch")).toBe(true);
    expect(vibrate).toHaveBeenCalledTimes(2);
  });

  it("fails silently when vibration is unavailable or rejected", () => {
    Object.defineProperty(navigator, "vibrate", {
      configurable: true,
      value: undefined,
    });
    expect(haptics.play("selection", "touch")).toBe(false);

    Object.defineProperty(navigator, "vibrate", {
      configurable: true,
      value: vi.fn(() => {
        throw new Error("blocked");
      }),
    });
    expect(haptics.play("selection", "touch")).toBe(false);
  });
});
