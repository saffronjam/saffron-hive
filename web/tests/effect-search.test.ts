import { describe, expect, it } from "vitest";
import { matchesEffectFilter } from "$lib/effect-search";

describe("effect source filtering", () => {
  it("separates Hive and Zigbee effects", () => {
    expect(matchesEffectFilter("hive", ["Morning fade"], ["hive"], "")).toBe(true);
    expect(matchesEffectFilter("zigbee2mqtt", ["Blink"], ["hive"], "")).toBe(false);
    expect(matchesEffectFilter("zigbee2mqtt", ["Blink"], ["zigbee2mqtt"], "")).toBe(true);
  });

  it("matches stored names and Zigbee display or wire names", () => {
    expect(matchesEffectFilter("hive", ["Morning fade"], [], "fade")).toBe(true);
    expect(matchesEffectFilter("zigbee2mqtt", ["Color loop", "colorloop"], [], "colorloop")).toBe(
      true,
    );
    expect(matchesEffectFilter("zigbee2mqtt", ["Blink"], [], "pulse")).toBe(false);
  });
});
