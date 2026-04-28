import { describe, it, expect } from "vitest";
import { createConfirmationHold } from "$lib/utils/confirmation-hold";

function fakeClock() {
  type Pending = { cb: () => void; due: number; cancelled: boolean };
  const pending: Pending[] = [];
  let now = 0;
  return {
    schedule: (cb: () => void, ms: number) => {
      const entry: Pending = { cb, due: now + ms, cancelled: false };
      pending.push(entry);
      return () => {
        entry.cancelled = true;
      };
    },
    advance(ms: number) {
      now += ms;
      for (const p of pending) {
        if (!p.cancelled && p.due <= now) {
          p.cancelled = true;
          p.cb();
        }
      }
    },
    pendingCount: () => pending.filter((p) => !p.cancelled).length,
  };
}

const numberMatches = (a: number, b: number) => a === b;

describe("createConfirmationHold", () => {
  it("does not suppress when no hold is active", () => {
    const hold = createConfirmationHold<number>({ matches: numberMatches });
    expect(hold.active).toBe(false);
    expect(hold.shouldSuppress(42)).toBe(false);
  });

  it("suppresses incoming values that don't match the pending value", () => {
    const hold = createConfirmationHold<number>({ matches: numberMatches });
    hold.hold(10);
    expect(hold.active).toBe(true);
    expect(hold.shouldSuppress(5)).toBe(true);
    expect(hold.active).toBe(true);
  });

  it("releases when an incoming value confirms the pending value", () => {
    const hold = createConfirmationHold<number>({ matches: numberMatches });
    hold.hold(10);
    expect(hold.shouldSuppress(10)).toBe(false);
    expect(hold.active).toBe(false);
  });

  it("uses the matches predicate (tolerance)", () => {
    const hold = createConfirmationHold<number>({
      matches: (a, b) => Math.abs(a - b) <= 2,
    });
    hold.hold(100);
    expect(hold.shouldSuppress(95)).toBe(true);
    expect(hold.shouldSuppress(101)).toBe(false);
    expect(hold.active).toBe(false);
  });

  it("releases automatically after the safety timeout", () => {
    const clock = fakeClock();
    const hold = createConfirmationHold<number>({
      matches: numberMatches,
      timeoutMs: 1000,
      schedule: clock.schedule,
    });
    hold.hold(7);
    expect(hold.active).toBe(true);
    clock.advance(999);
    expect(hold.active).toBe(true);
    clock.advance(1);
    expect(hold.active).toBe(false);
    expect(hold.shouldSuppress(99)).toBe(false);
  });

  it("a fresh hold cancels the previous timer", () => {
    const clock = fakeClock();
    const hold = createConfirmationHold<number>({
      matches: numberMatches,
      timeoutMs: 1000,
      schedule: clock.schedule,
    });
    hold.hold(1);
    clock.advance(900);
    hold.hold(2);
    expect(clock.pendingCount()).toBe(1);
    clock.advance(900);
    expect(hold.active).toBe(true);
    clock.advance(100);
    expect(hold.active).toBe(false);
  });

  it("releasing on confirmation cancels the safety timer", () => {
    const clock = fakeClock();
    const hold = createConfirmationHold<number>({
      matches: numberMatches,
      timeoutMs: 1000,
      schedule: clock.schedule,
    });
    hold.hold(5);
    expect(clock.pendingCount()).toBe(1);
    hold.shouldSuppress(5);
    expect(clock.pendingCount()).toBe(0);
  });

  it("reset() cancels both pending and timer", () => {
    const clock = fakeClock();
    const hold = createConfirmationHold<number>({
      matches: numberMatches,
      timeoutMs: 1000,
      schedule: clock.schedule,
    });
    hold.hold(5);
    hold.reset();
    expect(hold.active).toBe(false);
    expect(clock.pendingCount()).toBe(0);
    expect(hold.shouldSuppress(99)).toBe(false);
  });

  it("works with object payloads via custom matches", () => {
    interface Rgb {
      r: number;
      g: number;
      b: number;
    }
    const hold = createConfirmationHold<Rgb>({
      matches: (a, b) =>
        Math.abs(a.r - b.r) <= 5 &&
        Math.abs(a.g - b.g) <= 5 &&
        Math.abs(a.b - b.b) <= 5,
    });
    hold.hold({ r: 200, g: 100, b: 50 });
    expect(hold.shouldSuppress({ r: 0, g: 0, b: 0 })).toBe(true);
    expect(hold.shouldSuppress({ r: 198, g: 102, b: 49 })).toBe(false);
  });
});
