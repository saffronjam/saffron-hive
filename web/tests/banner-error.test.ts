import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { BannerError } from "$lib/stores/banner-error.svelte";

describe("BannerError", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("starts with a null message", () => {
    const b = new BannerError();
    expect(b.message).toBeNull();
  });

  it("setWithAutoDismiss sets the message immediately", () => {
    const b = new BannerError();
    b.setWithAutoDismiss("boom");
    expect(b.message).toBe("boom");
  });

  it("auto-dismisses after the default 5000 ms", () => {
    const b = new BannerError();
    b.setWithAutoDismiss("boom");
    vi.advanceTimersByTime(4999);
    expect(b.message).toBe("boom");
    vi.advanceTimersByTime(1);
    expect(b.message).toBeNull();
  });

  it("honours a custom dismiss delay", () => {
    const b = new BannerError();
    b.setWithAutoDismiss("boom", 100);
    vi.advanceTimersByTime(99);
    expect(b.message).toBe("boom");
    vi.advanceTimersByTime(1);
    expect(b.message).toBeNull();
  });

  it("does not clear a newer message when an older timer fires", () => {
    const b = new BannerError();
    b.setWithAutoDismiss("first", 1000);
    vi.advanceTimersByTime(500);
    b.setWithAutoDismiss("second", 1000);
    vi.advanceTimersByTime(500);
    expect(b.message).toBe("second");
    vi.advanceTimersByTime(500);
    expect(b.message).toBeNull();
  });

  it("clear() nulls the message synchronously", () => {
    const b = new BannerError();
    b.setWithAutoDismiss("boom", 1000);
    b.clear();
    expect(b.message).toBeNull();
  });
});
