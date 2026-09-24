import { describe, expect, it } from "vitest";
import {
  actionOptions,
  conditionOptions,
  triggerOptions,
} from "$lib/components/graph/automation-node-options";
import {
  defaultConditionConfig,
  normalizeConditionConfig,
  serializeConditionConfig,
  validateConditionConfig,
} from "$lib/components/graph/condition-expr";
import { normalizeTriggerConfig, serializeTriggerConfig } from "$lib/components/graph/trigger-expr";

describe("automation node options", () => {
  it("excludes custom choices and preserves saved expressions through serialization", () => {
    expect(triggerOptions().some((option) => option.value === "custom")).toBe(false);
    expect(conditionOptions().some((option) => option.value === "custom")).toBe(false);
    const trigger = {
      mode: "custom",
      eventType: "device.state_changed",
      customExpr: "event.brightness > 20",
    } as const;
    const condition = { mode: "custom", customExpr: "time.hour > 18" } as const;
    expect(normalizeTriggerConfig(JSON.parse(serializeTriggerConfig(trigger)))).toMatchObject(
      trigger,
    );
    expect(normalizeConditionConfig(JSON.parse(serializeConditionConfig(condition)))).toMatchObject(
      condition,
    );
  });
  it("uses sentence-case labels and brief descriptions without terminal punctuation", () => {
    const triggers = triggerOptions();
    const conditions = conditionOptions();
    const actions = actionOptions();
    const options = [...triggers, ...conditions, ...actions];
    expect(options.every((option) => !/[.!?]$/.test(option.description))).toBe(true);
    expect(actions.map((option) => option.label)).toContain("Set state");
    expect(triggers.map((option) => option.label)).toContain("Device event");
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
      code: "condition_required",
    });
  });
});
