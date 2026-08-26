import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { installAppRecovery } from "$lib/graphql/app-recovery";
import type { GraphQLConnection } from "$lib/graphql/client";

function connection(): GraphQLConnection {
  return {
    client: {} as GraphQLConnection["client"],
    recover: vi.fn(),
    onRecovered: vi.fn(() => () => {}),
  };
}

function setVisibility(value: DocumentVisibilityState) {
  Object.defineProperty(document, "visibilityState", { configurable: true, value });
}

beforeEach(() => {
  setVisibility("visible");
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("app recovery triggers", () => {
  it("forces one recovery when a hidden app becomes visible", () => {
    const controller = connection();
    const uninstall = installAppRecovery(controller, () => true);

    setVisibility("hidden");
    document.dispatchEvent(new Event("visibilitychange"));
    setVisibility("visible");
    document.dispatchEvent(new Event("visibilitychange"));
    document.dispatchEvent(new Event("visibilitychange"));

    expect(controller.recover).toHaveBeenCalledTimes(1);
    expect(controller.recover).toHaveBeenCalledWith("foreground");
    uninstall();
  });

  it("recovers a visible app when the network returns", () => {
    const controller = connection();
    const uninstall = installAppRecovery(controller, () => true);

    window.dispatchEvent(new Event("online"));

    expect(controller.recover).toHaveBeenCalledWith("network_restored");
    uninstall();
  });

  it("recovers a page restored from the back-forward cache", () => {
    const controller = connection();
    const uninstall = installAppRecovery(controller, () => true);

    window.dispatchEvent(new PageTransitionEvent("pageshow", { persisted: true }));

    expect(controller.recover).toHaveBeenCalledWith("page_restore");
    uninstall();
  });

  it("coalesces overlapping browser lifecycle signals", () => {
    const controller = connection();
    const uninstall = installAppRecovery(controller, () => true);

    window.dispatchEvent(new Event("online"));
    setVisibility("hidden");
    document.dispatchEvent(new Event("visibilitychange"));
    setVisibility("visible");
    document.dispatchEvent(new Event("visibilitychange"));

    expect(controller.recover).toHaveBeenCalledTimes(1);
    uninstall();
  });

  it("ignores lifecycle signals while recovery is disabled", () => {
    const controller = connection();
    const uninstall = installAppRecovery(controller, () => false);

    setVisibility("hidden");
    document.dispatchEvent(new Event("visibilitychange"));
    setVisibility("visible");
    document.dispatchEvent(new Event("visibilitychange"));
    window.dispatchEvent(new Event("online"));

    expect(controller.recover).not.toHaveBeenCalled();
    uninstall();
  });
});
