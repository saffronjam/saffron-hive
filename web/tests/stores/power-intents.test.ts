import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PowerIntents } from "$lib/stores/power-intents.svelte";
import type { Device } from "$lib/stores/devices";

function light(id: string, on: boolean, brightness = 100): Device {
  return {
    id,
    name: id,
    friendlyName: id,
    source: "zigbee2mqtt",
    type: "light",
    available: true,
    disabled: false,
    deleted: false,
    seen: true,
    capabilities: [],
    configuration: [],
    roles: { controlledLoad: null, contact: null },
    state: { on, brightness },
  };
}

const accepted = async () => ({ data: { setTargetState: true } });
let power: PowerIntents;

beforeEach(() => {
  vi.useFakeTimers();
  power = new PowerIntents();
});

afterEach(() => {
  power.clear();
  vi.useRealTimers();
});

describe("optimistic power intent", () => {
  it("holds a whole batch off through partial reports without changing confirmed state", async () => {
    const a = light("a", true, 40);
    const b = light("b", true, 220);
    power.reconcile({ a, b });
    await power.toggle([a, b], false, accepted);
    expect(power.devices([a, b]).map((d) => d.state?.on)).toEqual([false, false]);
    expect(a.state?.on).toBe(true);
    const aOff = light("a", false, 40);
    power.reconcile({ a: aOff, b });
    expect(power.devices([aOff, b]).map((d) => d.state?.on)).toEqual([false, false]);
    expect(power.has([a, b])).toBe(true);
    power.reconcile({ a: aOff, b: light("b", false, 220) });
    expect(power.has([a, b])).toBe(false);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("holds remembered brightness on all members until all on reports arrive", async () => {
    const a = light("a", false, 40);
    const b = light("b", false, 220);
    power.reconcile({ a, b });
    await power.toggle([a, b], true, accepted);
    const aOn = light("a", true, 80);
    power.reconcile({ a: aOn, b });
    expect(power.devices([aOn, b]).map((d) => d.state)).toEqual([
      { on: true, brightness: 40 },
      { on: true, brightness: 220 },
    ]);
    expect(power.has([a, b])).toBe(true);
    power.reconcile({ a: aOn, b: light("b", true, 220) });
    expect(power.has([a, b])).toBe(false);
    expect(power.device(aOn).state?.brightness).toBe(80);
  });

  it.each(["graphql", "rejected", "network"])(
    "restores live state after a %s failure",
    async (failure) => {
      const a = light("a", true);
      power.reconcile({ a });
      await power.toggle([a], false, async () => {
        if (failure === "network") throw new Error("Disconnected");
        if (failure === "graphql") return { error: new Error("Rejected") };
        return { data: { setTargetState: false } };
      });
      expect(power.device(a)).toBe(a);
      expect(vi.getTimerCount()).toBe(0);
    },
  );

  it("reconciles to actual device state after a missing confirmation times out", async () => {
    const a = light("a", true);
    power.reconcile({ a });
    await power.toggle([a], false, accepted);
    await vi.advanceTimersByTimeAsync(9_999);
    expect(power.device(a).state?.on).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    expect(power.device(a)).toBe(a);
  });

  it("keeps the latest toggle through an older rejection and stale opposite echo", async () => {
    const a = light("a", true);
    power.reconcile({ a });
    let rejectFirst!: (reason: Error) => void;
    const first = power.toggle(
      [a],
      false,
      () =>
        new Promise((_resolve, reject) => {
          rejectFirst = reject;
        }),
    );
    await power.toggle([a], true, accepted);
    expect(power.has([a])).toBe(true);
    rejectFirst(new Error("Older request failed"));
    await first;
    const off = light("a", false);
    power.reconcile({ a: off });
    expect(power.device(off).state?.on).toBe(true);
    power.reconcile({ a: light("a", true) });
    expect(power.has([a])).toBe(false);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("lets a member's new intent take precedence over a bulk toggle", async () => {
    const a = light("a", true);
    const b = light("b", true);
    power.reconcile({ a, b });
    await power.toggle([a, b], false, accepted);
    await power.toggle([a], true, accepted);
    power.reconcile({ a: light("a", false), b: light("b", false) });
    expect(power.device(a).state?.on).toBe(true);
    expect(power.has([b])).toBe(false);
    power.reconcile({ a: light("a", true), b: light("b", false) });
    expect(power.has([a, b])).toBe(false);
  });

  it("drops intent for removed or disabled members and clears timers on session teardown", async () => {
    const a = light("a", true);
    const b = light("b", true);
    power.reconcile({ a, b });
    await power.toggle([a, b], false, accepted);
    power.reconcile({ a: { ...a, disabled: true } });
    expect(power.has([a, b])).toBe(false);
    expect(vi.getTimerCount()).toBe(0);
    power.reconcile({ a });
    await power.toggle([a], false, accepted);
    power.reconcile({});
    expect(power.has([a])).toBe(false);
    expect(vi.getTimerCount()).toBe(0);
  });
});
