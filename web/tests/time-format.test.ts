import { describe, it, expect } from "vitest";
import { formatRelative, formatTime, formatTooltip, parseSince } from "$lib/time-format";

const sample = new Date(2026, 4, 2, 14, 32, 9); // 2026-05-02 14:32:09 local
const morning = new Date(2026, 4, 2, 9, 7, 4); // 09:07:04 local
const midnight = new Date(2026, 4, 2, 0, 0, 0); // 00:00:00 local
const noon = new Date(2026, 4, 2, 12, 0, 0); // 12:00:00 local

describe("formatTime", () => {
  it("renders zero-padded 24h clock", () => {
    expect(formatTime(sample, "24h")).toBe("14:32:09");
    expect(formatTime(morning, "24h")).toBe("09:07:04");
  });

  it("renders 12h clock with AM/PM", () => {
    expect(formatTime(sample, "12h")).toBe("02:32:09 PM");
    expect(formatTime(morning, "12h")).toBe("09:07:04 AM");
    expect(formatTime(midnight, "12h")).toBe("12:00:00 AM");
    expect(formatTime(noon, "12h")).toBe("12:00:00 PM");
  });
});

describe("formatTooltip", () => {
  it("renders YYYY-MM-DD HH:mm:ss in 24h mode", () => {
    expect(formatTooltip(sample, "24h")).toBe("2026-05-02 14:32:09");
  });

  it("renders YYYY-MM-DD hh:mm:ss AM/PM in 12h mode", () => {
    expect(formatTooltip(sample, "12h")).toBe("2026-05-02 02:32:09 PM");
  });
});

describe("formatRelative", () => {
  it('returns "Just now" within a minute', () => {
    const now = new Date(2026, 4, 2, 14, 32, 30);
    const past = new Date(2026, 4, 2, 14, 32, 0);
    expect(formatRelative(past, now, "24h")).toBe("Just now");
  });

  it('returns "Xm ago" inside the hour', () => {
    const now = new Date(2026, 4, 2, 14, 45, 0);
    const past = new Date(2026, 4, 2, 14, 33, 0);
    expect(formatRelative(past, now, "24h")).toBe("12m ago");
  });

  it('returns "Xh ago" inside the day', () => {
    const now = new Date(2026, 4, 2, 14, 0, 0);
    const past = new Date(2026, 4, 2, 11, 0, 0);
    expect(formatRelative(past, now, "24h")).toBe("3h ago");
  });

  it("falls through to formatTime past a day", () => {
    const now = new Date(2026, 4, 4, 14, 32, 9);
    expect(formatRelative(sample, now, "24h")).toBe("14:32:09");
    expect(formatRelative(sample, now, "12h")).toBe("02:32:09 PM");
  });
});

describe("parseSince", () => {
  it("parses common units", () => {
    const now = Date.now();
    const ten = parseSince("10s")!.getTime();
    expect(now - ten).toBeGreaterThanOrEqual(9000);
    expect(now - ten).toBeLessThanOrEqual(11000);
    expect(parseSince("garbage")).toBeNull();
  });
});
