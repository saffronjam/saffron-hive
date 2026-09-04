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

function setReadyState(value: DocumentReadyState) {
  Object.defineProperty(document, "readyState", { configurable: true, value });
}

beforeEach(() => {
  setVisibility("visible");
  setReadyState("complete");
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("app recovery triggers", () => {
  it("recovers from a visible lifecycle signal without observing the app become hidden", () => {
    const controller = connection();
    const reconcile = vi.fn();
    const uninstall = installAppRecovery(controller, () => true, reconcile);

    document.dispatchEvent(new Event("visibilitychange"));
    document.dispatchEvent(new Event("visibilitychange"));

    expect(controller.recover).toHaveBeenCalledTimes(1);
    expect(controller.recover).toHaveBeenCalledWith("foreground");
    expect(reconcile).toHaveBeenCalledWith("foreground");
    uninstall();
  });

  it("recovers when a visible app regains focus", () => {
    const controller = connection();
    const uninstall = installAppRecovery(controller, () => true);

    window.dispatchEvent(new Event("focus"));

    expect(controller.recover).toHaveBeenCalledWith("foreground");
    uninstall();
  });

  it("recovers when a suspended document resumes", () => {
    setVisibility("hidden");
    const controller = connection();
    const uninstall = installAppRecovery(controller, () => true);

    document.dispatchEvent(new Event("resume"));

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

  it("recovers from a page show after startup", () => {
    const controller = connection();
    const uninstall = installAppRecovery(controller, () => true);

    window.dispatchEvent(new PageTransitionEvent("pageshow", { persisted: false }));

    expect(controller.recover).toHaveBeenCalledWith("page_restore");
    uninstall();
  });

  it("ignores the initial page show during document loading", () => {
    setReadyState("loading");
    const controller = connection();
    const uninstall = installAppRecovery(controller, () => true);

    window.dispatchEvent(new PageTransitionEvent("pageshow", { persisted: false }));

    expect(controller.recover).not.toHaveBeenCalled();
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
    window.dispatchEvent(new Event("focus"));

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
    document.dispatchEvent(new Event("resume"));
    window.dispatchEvent(new Event("focus"));
    window.dispatchEvent(new Event("online"));

    expect(controller.recover).not.toHaveBeenCalled();
    uninstall();
  });
});
