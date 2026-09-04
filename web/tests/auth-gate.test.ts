import { describe, it, expect } from "vitest";
import { nextRoute, type GateState } from "$lib/auth-gate";

const base: GateState = {
  pathname: "/",
  hasInitialUser: true,
  isAuthenticated: true,
  isGuest: false,
  mustChangePassword: false,
};

function at(overrides: Partial<GateState>): string | null {
  return nextRoute({ ...base, ...overrides });
}

describe("nextRoute", () => {
  describe("no initial user", () => {
    const fresh = { hasInitialUser: false, isAuthenticated: false };

    it("sends every route to /setup", () => {
      expect(at({ ...fresh, pathname: "/" })).toBe("/setup");
      expect(at({ ...fresh, pathname: "/devices" })).toBe("/setup");
      expect(at({ ...fresh, pathname: "/login" })).toBe("/setup");
    });

    it("stays on /setup", () => {
      expect(at({ ...fresh, pathname: "/setup" })).toBeNull();
    });
  });

  describe("unauthenticated", () => {
    const anon = { isAuthenticated: false };

    it("sends every route to /login", () => {
      expect(at({ ...anon, pathname: "/" })).toBe("/login");
      expect(at({ ...anon, pathname: "/integrations" })).toBe("/login");
    });

    // Once a user exists, /setup has nothing left to do and needs a session.
    it("sends /setup to /login", () => {
      expect(at({ ...anon, pathname: "/setup" })).toBe("/login");
    });

    it("stays on /login", () => {
      expect(at({ ...anon, pathname: "/login" })).toBeNull();
    });

    it("sends an expired guest to guest login with a reason", () => {
      expect(at({ ...anon, isGuest: true, pathname: "/" })).toBe(
        "/login?mode=guest&reason=unavailable",
      );
    });
  });

  describe("forced password change", () => {
    const forced = { mustChangePassword: true };

    it("sends every route to /change-password-required", () => {
      expect(at({ ...forced, pathname: "/" })).toBe("/change-password-required");
      expect(at({ ...forced, pathname: "/settings" })).toBe("/change-password-required");
    });

    it("stays on /change-password-required", () => {
      expect(at({ ...forced, pathname: "/change-password-required" })).toBeNull();
    });

    it("outranks the onboarding bounce", () => {
      expect(at({ ...forced, pathname: "/login" })).toBe("/change-password-required");
    });
  });

  describe("guest session", () => {
    const guest = { isGuest: true };

    it("stays on the dashboard", () => {
      expect(at({ ...guest, pathname: "/" })).toBeNull();
    });

    it("redirects every other route to the dashboard", () => {
      expect(at({ ...guest, pathname: "/settings" })).toBe("/");
      expect(at({ ...guest, pathname: "/login" })).toBe("/");
    });
  });

  describe("fully set up", () => {
    it("stays on ordinary routes", () => {
      expect(at({ pathname: "/" })).toBeNull();
      expect(at({ pathname: "/devices" })).toBeNull();
      expect(at({ pathname: "/integrations/zigbee2mqtt" })).toBeNull();
    });

    it("bounces the onboarding routes to the dashboard", () => {
      expect(at({ pathname: "/login" })).toBe("/");
      expect(at({ pathname: "/setup" })).toBe("/");
      expect(at({ pathname: "/change-password-required" })).toBe("/");
    });

    // Nothing gates on an integration being configured — a fresh install with no
    // integration must reach the dashboard, which is where it is prompted to add one.
    it("does not gate on integrations being configured", () => {
      expect(at({ pathname: "/" })).toBeNull();
      expect(at({ pathname: "/integrations" })).toBeNull();
    });
  });
});
