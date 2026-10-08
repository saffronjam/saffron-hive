import { describe, expect, it } from "vitest";
import {
  generateConditionExpr,
  normalizeConditionConfig,
  serializeConditionConfig,
  type ConditionConfig,
} from "$lib/components/graph/condition-expr";

describe("condition expressions", () => {
  const cases: [ConditionConfig, string][] = [
    [
      { mode: "time_window", afterHour: 7, afterMinute: 0, beforeHour: 22, beforeMinute: 30 },
      'time.between("07:00", "22:30")',
    ],
    [{ mode: "time_window", afterHour: 6, afterMinute: 5 }, 'time.after("06:05")'],
    [{ mode: "weekday", weekdays: ["Monday", "Friday"] }, 'day.in("mon", "fri")'],
    [
      {
        mode: "device_state",
        targetType: "room",
        targetId: "r-bed",
        property: "on",
        comparator: "==",
        value: "true",
      },
      'room("r-bed").on == true',
    ],
  ];

  it.each(cases)("writes %j and reads it back", (config, expr) => {
    expect(generateConditionExpr(config)).toBe(expr);
    expect(normalizeConditionConfig({ expr })).toMatchObject(config);
  });

  it("reads clock arithmetic and weekday equality", () => {
    expect(
      normalizeConditionConfig({
        expr: "(time.hour * 60 + time.minute) >= 1320 || (time.hour * 60 + time.minute) < 360",
      }),
    ).toEqual({ mode: "time_window", afterHour: 22, afterMinute: 0, beforeHour: 6, beforeMinute: 0 });
    expect(
      normalizeConditionConfig({ expr: '(time.weekday == "Saturday" || time.weekday == "Sunday")' }),
    ).toEqual({ mode: "weekday", weekdays: ["Saturday", "Sunday"] });
  });

  it("opens other expressions as custom and keeps macro references", () => {
    expect(normalizeConditionConfig({ expr: 'any_of({"room": "r"}, "on", true)' })).toEqual({
      mode: "custom",
      customExpr: 'any_of({"room": "r"}, "on", true)',
    });
    const macro = normalizeConditionConfig({ use: "night", negate: true });
    expect(macro).toEqual({ mode: "macro", macro: "night", negate: true });
    expect(JSON.parse(serializeConditionConfig(macro))).toEqual({ use: "night", negate: true });
  });
});
