import { describe, expect, it } from "vitest";
import { booleanStepPath, buildDiscreteTimeline } from "$lib/state-history-discrete";

describe("discrete state history", () => {
  const from = new Date("2026-08-18T00:00:00Z");
  const to = new Date("2026-08-18T10:00:00Z");

  it("keeps time before the first sample explicitly unknown", () => {
    const timeline = buildDiscreteTimeline(
      [
        { at: "2026-08-18T08:00:00Z", value: false },
        { at: "2026-08-18T09:00:00Z", value: true },
      ],
      from,
      to,
    );

    expect(timeline.unknownWidth).toBe(80);
    expect(timeline.segments).toMatchObject([
      { left: 80, width: 10, value: false },
      { left: 90, width: 10, value: true },
    ]);
    expect(timeline.currentValue).toBe(true);
  });

  it("uses a pre-range sample as the baseline", () => {
    const timeline = buildDiscreteTimeline(
      [
        { at: "2026-08-17T23:00:00Z", value: true },
        { at: "2026-08-18T03:00:00Z", value: false },
      ],
      from,
      to,
    );

    expect(timeline.unknownWidth).toBe(0);
    expect(timeline.segments).toMatchObject([
      { left: 0, width: 30, value: true },
      { left: 30, width: 70, value: false },
    ]);
  });

  it("draws boolean values as a high-low step signal", () => {
    const timeline = buildDiscreteTimeline(
      [
        { at: "2026-08-18T00:00:00Z", value: true },
        { at: "2026-08-18T03:00:00Z", value: false },
        { at: "2026-08-18T07:00:00Z", value: true },
      ],
      from,
      to,
    );

    expect(booleanStepPath(timeline.segments)).toBe("M 0 8 H 30 V 32 H 70 V 8 H 100");
  });

  it("collapses duplicate reports without losing transitions", () => {
    const timeline = buildDiscreteTimeline(
      [
        { at: "2026-08-18T01:00:00Z", value: "normal" },
        { at: "2026-08-18T02:00:00Z", value: "normal" },
        { at: "2026-08-18T04:00:00Z", value: "abnormal" },
      ],
      from,
      to,
    );

    expect(timeline.segments).toMatchObject([
      { left: 10, width: 30, value: "normal" },
      { left: 40, width: 60, value: "abnormal" },
    ]);
  });
});
