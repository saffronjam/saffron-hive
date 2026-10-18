import { describe, expect, it } from "vitest";
import {
  normalizeConditionConfig,
  serializeConditionConfig,
  type ConditionConfig,
} from "$lib/components/graph/condition-expr";
describe("typed condition authoring", () => {
  const cases: ConditionConfig[] = [
    { mode: "time_window", afterHour: 0, afterMinute: 0, beforeHour: 4, beforeMinute: 0 },
    { mode: "weekday", weekdays: ["Monday", "Friday"] },
    {
      mode: "device_state",
      targetType: "room",
      targetId: "hallway",
      property: "on",
      comparator: "==",
      value: "true",
      valueType: "boolean",
    },
    {
      mode: "device_state",
      targetType: "device",
      targetId: "sensor",
      property: "value",
      comparator: "==",
      value: "true",
      valueType: "string",
    },
    { mode: "time_window", afterHour: 0, beforeHour: 4, negate: true },
    { mode: "", negate: true },
    { mode: "custom", negate: true, customExpr: 'scene_active("night")' },
    { mode: "macro", macro: "night", negate: true },
  ];
  it.each(cases)("preserves %j", (config) =>
    expect(normalizeConditionConfig(JSON.parse(serializeConditionConfig(config)))).toMatchObject(
      config,
    ),
  );
});
it("shows backend weekday codes as selected editor days", () => {
  expect(
    normalizeConditionConfig({ condition: { mode: "weekday", weekdays: ["mon", "fri"] } }).weekdays,
  ).toEqual(["Monday", "Friday"]);
});
