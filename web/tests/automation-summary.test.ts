import { describe, expect, it } from "vitest";
import {
  activeCycleIndex,
  operatorLabel,
  summarizeAction,
  summarizeCondition,
  summarizeTrigger,
  type SummaryLookups,
} from "$lib/components/graph/automation-summary";
import { CapabilityCategory, type Device } from "$lib/gql/graphql";

function device(id: string, name: string, capabilities: Device["capabilities"] = []): Device {
  return {
    id,
    name,
    friendlyName: name,
    type: "sensor",
    disabled: false,
    deleted: false,
    roles: {},
    capabilities,
  } as unknown as Device;
}

const lookups: SummaryLookups = {
  devices: [
    device("motion", "Motion sensor", [
      {
        name: "presence",
        type: "binary",
        category: CapabilityCategory.State,
        canSet: false,
        reportsValue: true,
        canGet: false,
      },
      {
        name: "temperature",
        type: "numeric",
        unit: "°C",
        category: CapabilityCategory.State,
        canSet: false,
        reportsValue: true,
        canGet: false,
      },
    ]),
    device("lamp", "Lava lamp"),
  ],
  groups: [],
  rooms: [
    { id: "kitchen", name: "Kitchen", members: [] } as unknown as SummaryLookups["rooms"][number],
  ],
  scenes: [
    { id: "evening", name: "Evening" },
    { id: "night", name: "Night" },
  ],
  effects: [{ kind: "timeline", id: "fx", name: "Sunrise" }],
  webhooks: [{ id: "hook", name: "Doorbell" }],
};

describe("summarizeTrigger", () => {
  it("describes a schedule in words", () => {
    const summary = summarizeTrigger(
      {
        mode: "schedule",
        scheduleSubmode: "at",
        scheduleHour: 7,
        scheduleMinute: 13,
        scheduleSecond: 0,
        scheduleWeekdays: ["TUE"],
      },
      lookups,
    );
    expect(summary.invalid).toBe(false);
    expect(summary.text).toContain("07:13");
    expect(summary.text).toContain("Tuesday");
  });

  it("describes a device state comparison with its hold", () => {
    const summary = summarizeTrigger(
      {
        mode: "device_state",
        deviceId: "motion",
        property: "presence",
        comparator: "==",
        value: "false",
        holdMs: 10_000,
      },
      lookups,
    );
    expect(summary).toEqual({ text: "Motion sensor: Presence = Off · 10 sec", invalid: false });
  });

  it("names the button event and the webhook", () => {
    expect(
      summarizeTrigger({ mode: "device_event", deviceId: "motion", eventValue: "single" }, lookups)
        .text,
    ).toContain("Motion sensor");
    expect(summarizeTrigger({ mode: "webhook", endpointId: "hook" }, lookups).text).toBe(
      "Webhook Doorbell",
    );
  });

  it("reports what is missing instead of a summary", () => {
    const summary = summarizeTrigger({ mode: "device_state" }, lookups);
    expect(summary.invalid).toBe(true);
    expect(summary.text).not.toBe("");
  });
});

describe("summarizeCondition", () => {
  it("formats time windows and weekdays", () => {
    expect(
      summarizeCondition(
        { mode: "time_window", afterHour: 7, afterMinute: 0, beforeHour: 22, beforeMinute: 30 },
        lookups,
      ).text,
    ).toBe("07:00–22:30");
    expect(
      summarizeCondition({ mode: "weekday", weekdays: ["Monday", "Friday"] }, lookups).text,
    ).toBe("Mon, Fri");
  });

  it("includes the unit of a numeric comparison", () => {
    expect(
      summarizeCondition(
        {
          mode: "device_state",
          targetType: "device",
          targetId: "motion",
          property: "temperature",
          comparator: ">",
          value: "21",
        },
        lookups,
      ).text,
    ).toBe("Motion sensor: Temperature > 21 °C");
  });
});

describe("summarizeCondition with functions and macros", () => {
  it("describes aggregates and definitions in words", () => {
    const any = summarizeCondition(
      { mode: "custom", customExpr: 'any_of({"room": "kitchen"}, "on", true)' },
      lookups,
    ).text;
    expect(any).toContain("Kitchen");
    expect(any).not.toContain("any_of");
    expect(summarizeCondition({ mode: "macro", macro: "night", negate: true }, lookups).text).toContain(
      "!$night",
    );
  });
});

describe("summarizeAction", () => {
  const action = (
    actionType: string,
    payload: object,
    target: Partial<{ targetType: string; targetId: string }> = {},
  ) => ({
    actionType,
    targetType: target.targetType ?? "device",
    targetId: target.targetId ?? "lamp",
    payload: JSON.stringify(payload),
  });

  it("describes state, toggle and scene actions on their target", () => {
    expect(
      summarizeAction(action("set_device_state", { on: true, brightness: 254 }), lookups).text,
    ).toBe("Lava lamp: On · 100%");
    expect(summarizeAction(action("toggle_device_state", {}), lookups).text).toBe(
      "Toggle Lava lamp",
    );
    expect(
      summarizeAction(
        action("activate_scene", {}, { targetType: "scene", targetId: "evening" }),
        lookups,
      ).text,
    ).toBe("Activate Evening");
  });

  it("shows the scene a cycle is on in Live", () => {
    const cycle = action(
      "cycle_scenes",
      { scenes: ["evening", "night"] },
      { targetType: "", targetId: "" },
    );
    expect(summarizeAction(cycle, lookups).text).toBe("Cycle 2 scenes");
    expect(
      summarizeAction(cycle, lookups, {
        runtimeState: JSON.stringify({ cycle_index: 0 }),
        live: true,
      }).text,
    ).toBe("Now: Night");
  });

  it("flags an action without a target", () => {
    const summary = summarizeAction(action("toggle_device_state", {}, { targetId: "" }), lookups);
    expect(summary.invalid).toBe(true);
  });
});

describe("activeCycleIndex and operatorLabel", () => {
  it("points at the scene that fired last", () => {
    expect(activeCycleIndex(3, JSON.stringify({ cycle_index: 1 }))).toBe(0);
    expect(activeCycleIndex(3, JSON.stringify({ cycle_index: 0 }))).toBe(2);
    expect(activeCycleIndex(3, "{}")).toBe(-1);
    expect(activeCycleIndex(0, JSON.stringify({ cycle_index: 1 }))).toBe(-1);
  });

  it("labels operators", () => {
    expect(operatorLabel("OR")).toBe("OR");
  });
});
