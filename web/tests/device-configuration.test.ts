import { describe, expect, it } from "vitest";
import {
  allFlagsMask,
  configurationContains,
  configurationEntriesEqual,
  configurationEntry,
  configurationSection,
  configurationValues,
  deviceCommandCapabilities,
  flagIsSet,
  groupConfigurationCapabilities,
  setFlag,
  writableConfigurationCapabilities,
} from "$lib/device-configuration";
import { CapabilityCategory, type Capability } from "$lib/gql/graphql";

function capability(over: Partial<Capability> = {}): Capability {
  return {
    name: "fall_detection",
    type: "binary",
    label: null,
    description: null,
    category: CapabilityCategory.Configuration,
    values: null,
    valueMin: null,
    valueMax: null,
    unit: null,
    reportsValue: true,
    canSet: true,
    canGet: true,
    ...over,
  };
}

describe("device configuration", () => {
  it("selects only writable configuration capabilities", () => {
    const values = [
      capability(),
      capability({ name: "contact", category: CapabilityCategory.State }),
      capability({ name: "read_only", canSet: false }),
    ];
    expect(writableConfigurationCapabilities(values).map((value) => value.name)).toEqual([
      "fall_detection",
    ]);
  });

  it("creates one typed value for each capability type", () => {
    expect(configurationEntry(capability())).toMatchObject({ booleanValue: false });
    expect(
      configurationEntry(capability({ name: "sensitivity", type: "numeric", valueMin: 1 })),
    ).toMatchObject({ numberValue: 1 });
    expect(
      configurationEntry(capability({ name: "mode", type: "enum", values: ["normal", "strict"] })),
    ).toMatchObject({ stringValue: "normal" });
  });

  it("matches confirmed entries independent of ordering", () => {
    const first = {
      capability: "fall_detection",
      booleanValue: true,
      numberValue: null,
      stringValue: null,
    };
    const second = {
      capability: "movement_detection",
      booleanValue: false,
      numberValue: null,
      stringValue: null,
    };
    expect(configurationEntriesEqual([first, second], [second, first])).toBe(true);
    expect(configurationContains([first, second], [second])).toBe(true);
  });
});

describe("device attributes", () => {
  it("keeps only writable setting values out of the attribute channel", () => {
    const capabilities = [
      capability({ name: "absence_delay_timer", type: "numeric" }),
      capability({
        name: "power_outage_count",
        category: CapabilityCategory.Diagnostic,
        canSet: false,
      }),
    ];
    const attributes = [
      { capability: "absence_delay_timer", booleanValue: null, numberValue: 10, stringValue: null },
      { capability: "power_outage_count", booleanValue: null, numberValue: 1, stringValue: null },
    ];
    expect(configurationValues(capabilities, attributes).map((value) => value.capability)).toEqual([
      "absence_delay_timer",
    ]);
  });

  it("lists write-only commands separately from settings", () => {
    const capabilities = [
      capability({
        name: "identify",
        type: "enum",
        values: ["identify"],
        category: CapabilityCategory.Command,
        reportsValue: false,
      }),
      capability({ name: "led_disabled_night" }),
    ];
    expect(deviceCommandCapabilities(capabilities).map((value) => value.name)).toEqual([
      "identify",
    ]);
    expect(writableConfigurationCapabilities(capabilities).map((value) => value.name)).toEqual([
      "led_disabled_night",
    ]);
  });
});

describe("settings sections", () => {
  it("assigns sections by the subject word of the name", () => {
    expect(configurationSection("absence_delay_timer")).toBe("presence");
    expect(configurationSection("ai_sensitivity_adaptive")).toBe("presence");
    expect(configurationSection("detection_range_composite")).toBe("presence");
    expect(configurationSection("temp_and_humidity_sampling")).toBe("climate");
    expect(configurationSection("humidity_report_mode")).toBe("climate");
    expect(configurationSection("light_sampling")).toBe("light");
    expect(configurationSection("led_disabled_night")).toBe("indicator");
    expect(configurationSection("schedule_start_time")).toBe("indicator");
    expect(configurationSection("color_temp_startup")).toBe("other");
  });

  it("groups in section order and keeps the device order within a section", () => {
    const groups = groupConfigurationCapabilities([
      capability({ name: "led_disabled_night" }),
      capability({ name: "motion_sensitivity" }),
      capability({ name: "temp_reporting_mode" }),
      capability({ name: "absence_delay_timer" }),
    ]);
    expect(groups.map((group) => [group.section, group.capabilities.map((c) => c.name)])).toEqual([
      ["presence", ["motion_sensitivity", "absence_delay_timer"]],
      ["climate", ["temp_reporting_mode"]],
      ["indicator", ["led_disabled_night"]],
    ]);
  });
});

describe("flags settings", () => {
  it("reads and toggles individual bits of a 24-flag mask", () => {
    const all = allFlagsMask(24);
    expect(all).toBe(16777215);
    const without = setFlag(all, 23, false);
    expect(flagIsSet(without, 23)).toBe(false);
    expect(flagIsSet(without, 22)).toBe(true);
    expect(setFlag(without, 23, true)).toBe(all);
    expect(setFlag(0, 0, false)).toBe(0);
  });

  it("defaults a new flags setting to every flag on", () => {
    expect(
      configurationEntry(capability({ name: "zones", type: "flags", values: ["a", "b", "c"] })),
    ).toMatchObject({ numberValue: 7 });
  });
});
