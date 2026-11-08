import { describe, expect, it } from "vitest";
import { deviceChargeState } from "../src/lib/device-charging";

describe("charging indication", () => {
  it("requires reported charging, not just a full battery", () => {
    expect(deviceChargeState({ state: { battery: 100 } })).toBeNull();
    expect(
      deviceChargeState({
        state: { battery: 100, cleaningStatus: "cleaning" },
      }),
    ).toBeNull();
    expect(
      deviceChargeState({
        available: false,
        state: { battery: 100, cleaningStatus: "docked" },
      }),
    ).toBeNull();
  });
  it("distinguishes a charging battery from a fully charged docked device", () => {
    expect(
      deviceChargeState({ state: { battery: 42, cleaningStatus: "docked" } }),
    ).toBe("charging");
    expect(
      deviceChargeState({ state: { battery: 100, cleaningStatus: "docked" } }),
    ).toBe("charged");
  });
  it("supports charging reported by other device integrations", () => {
    const attributes = [{ capability: "charging", booleanValue: true }];
    expect(deviceChargeState({ attributes, state: { battery: 80 } })).toBe(
      "charging",
    );
    expect(deviceChargeState({ attributes, state: { battery: 100 } })).toBe(
      "charged",
    );
    expect(
      deviceChargeState({
        attributes: [{ capability: "charging", booleanValue: false }],
        state: { battery: 100 },
      }),
    ).toBeNull();
  });
});
