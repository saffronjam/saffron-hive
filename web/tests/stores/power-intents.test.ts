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
let refresh: ReturnType<typeof vi.fn<() => Promise<boolean>>>;

beforeEach(() => {
  vi.useFakeTimers();
  power = new PowerIntents();
  refresh = vi.fn(async () => true);
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
    await power.toggle([a, b], false, accepted, refresh);
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
    await power.toggle([a, b], true, accepted, refresh);
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
      await power.toggle(
        [a],
        false,
        async () => {
          if (failure === "network") throw new Error("Disconnected");
          if (failure === "graphql") return { error: new Error("Rejected") };
          return { data: { setTargetState: false } };
        },
        refresh,
      );
      expect(power.device(a)).toBe(a);
      expect(vi.getTimerCount()).toBe(0);
    },
  );

  it("reconciles to actual device state after a missing confirmation times out", async () => {
    const a = light("a", true);
    power.reconcile({ a });
    await power.toggle([a], false, accepted, refresh);
    await vi.advanceTimersByTimeAsync(9_999);
    expect(power.device(a).state?.on).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    expect(refresh).toHaveBeenCalledOnce();
    expect(power.device(a)).toBe(a);
  });

  it("keeps a successful bulk off visible past the timeout until a fresh snapshot arrives", async () => {
    const a = light("a", true);
    const b = light("b", true);
    power.reconcile({ a, b });
    let finishRefresh!: (value: boolean) => void;
    refresh.mockImplementation(
      () =>
        new Promise((resolve) => {
          finishRefresh = resolve;
        }),
    );
    await power.toggle([a, b], false, accepted, refresh);
    await vi.advanceTimersByTimeAsync(15_000);
    expect(power.devices([a, b]).map((d) => d.state?.on)).toEqual([false, false]);
    expect(power.has([a, b])).toBe(true);
    const confirmed = { a: light("a", false), b: light("b", false) };
    power.reconcile(confirmed);
    finishRefresh(true);
    await vi.advanceTimersByTimeAsync(0);
    expect(power.has([a, b])).toBe(false);
    expect(power.devices(Object.values(confirmed)).map((d) => d.state?.on)).toEqual([false, false]);
    expect(vi.getTimerCount()).toBe(0);
  });

  it.each([false, new Error("Offline")])(
    "retains pending feedback when refresh fails: %s",
    async (failure) => {
      const a = light("a", true);
      power.reconcile({ a });
      refresh.mockImplementationOnce(async () => {
        if (failure instanceof Error) throw failure;
        return failure;
      });
      await power.toggle([a], false, accepted, refresh);
      await vi.advanceTimersByTimeAsync(10_000);
      expect(power.device(a).state?.on).toBe(false);
      expect(power.has([a])).toBe(true);
      refresh.mockImplementationOnce(async () => {
        power.reconcile({ a: light("a", false) });
        return true;
      });
      await vi.advanceTimersByTimeAsync(3_000);
      expect(power.has([a])).toBe(false);
      expect(vi.getTimerCount()).toBe(0);
    },
  );

  it("starts the confirmation deadline after command acceptance", async () => {
    const a = light("a", true);
    power.reconcile({ a });
    let accept!: (value: { data: { setTargetState: boolean } }) => void;
    const command = power.toggle(
      [a],
      false,
      () =>
        new Promise((resolve) => {
          accept = resolve;
        }),
      refresh,
    );
    await vi.advanceTimersByTimeAsync(15_000);
    expect(power.device(a).state?.on).toBe(false);
    expect(refresh).not.toHaveBeenCalled();
    accept({ data: { setTargetState: true } });
    await command;
    await vi.advanceTimersByTimeAsync(10_000);
    expect(refresh).toHaveBeenCalledOnce();
  });

  it("does not release a newer command when an older timeout refresh completes", async () => {
    const a = light("a", true);
    power.reconcile({ a });
    let finishRefresh!: (value: boolean) => void;
    refresh.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finishRefresh = resolve;
        }),
    );
    await power.toggle([a], false, accepted, refresh);
    await vi.advanceTimersByTimeAsync(10_000);
    await power.toggle([a], true, accepted, refresh);
    finishRefresh(true);
    await vi.advanceTimersByTimeAsync(0);
    expect(power.has([a])).toBe(true);
    expect(power.device(a).state?.on).toBe(true);
  });

  it("does not restart reconciliation after session teardown", async () => {
    const a = light("a", true);
    power.reconcile({ a });
    let finishRefresh!: (value: boolean) => void;
    refresh.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finishRefresh = resolve;
        }),
    );
    await power.toggle([a], false, accepted, refresh);
    await vi.advanceTimersByTimeAsync(10_000);
    power.clear();
    finishRefresh(false);
    await vi.advanceTimersByTimeAsync(0);
    expect(vi.getTimerCount()).toBe(0);
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
      refresh,
    );
    await power.toggle([a], true, accepted, refresh);
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
    await power.toggle([a, b], false, accepted, refresh);
    await power.toggle([a], true, accepted, refresh);
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
    await power.toggle([a, b], false, accepted, refresh);
    power.reconcile({ a: { ...a, disabled: true } });
    expect(power.has([a, b])).toBe(false);
    expect(vi.getTimerCount()).toBe(0);
    power.reconcile({ a });
    await power.toggle([a], false, accepted, refresh);
    power.reconcile({});
    expect(power.has([a])).toBe(false);
    expect(vi.getTimerCount()).toBe(0);
  });
});
