import { describe, expect, it } from "vitest";
import {
  ACTION_OPTIONS,
  CONDITION_OPTIONS,
  TRIGGER_OPTIONS,
} from "$lib/components/graph/automation-node-options";
import {
  defaultConditionConfig,
  normalizeConditionConfig,
  serializeConditionConfig,
  validateConditionConfig,
} from "$lib/components/graph/condition-expr";

describe("automation node options", () => {
  it("uses sentence-case labels and brief descriptions without terminal punctuation", () => {
    const options = [...TRIGGER_OPTIONS, ...CONDITION_OPTIONS, ...ACTION_OPTIONS];
    expect(options.every((option) => !/[.!?]$/.test(option.description))).toBe(true);
    expect(ACTION_OPTIONS.map((option) => option.label)).toContain("Set state");
    expect(TRIGGER_OPTIONS.map((option) => option.label)).toContain("Device event");
  });
});

describe("empty condition configuration", () => {
  it("stays unconfigured through serialization", () => {
    const config = defaultConditionConfig();
    const serialized = serializeConditionConfig(config);

    expect(config).toEqual({ mode: "" });
    expect(normalizeConditionConfig(JSON.parse(serialized))).toEqual({ mode: "" });
    expect(validateConditionConfig(config)).toEqual({
      field: "mode",
      message: "Pick a condition",
    });
  });
});
