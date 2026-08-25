import { describe, expect, it } from "vitest";
import { nativeEffectSupportSummary } from "$lib/native-effect";

describe("nativeEffectSupportSummary", () => {
  it("shows the confirmed devices as supported", () => {
    expect(nativeEffectSupportSummary({ confirmedDeviceCount: 2 })).toBe("2 supported");
  });

  it("shows zero until a device is confirmed", () => {
    expect(nativeEffectSupportSummary({ confirmedDeviceCount: 0 })).toBe("0 supported");
  });
});
