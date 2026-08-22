import { describe, expect, it } from "vitest";
import {
  capabilityToExprProperty,
  eventTypeForMode,
  generateFilterExpr,
  normalizeTriggerConfig,
  serializeTriggerConfig,
  supportsDeviceEvents,
  validateActionConfig,
  type TriggerConfig,
} from "$lib/components/graph/trigger-expr";

describe("capabilityToExprProperty", () => {
  it.each([
    ["on_off", "on"],
    ["color_temp", "colorTemp"],
    ["target_temperature", "targetTemperature"],
    ["device_posture", "devicePosture"],
    ["link_quality", "linkQuality"],
    ["orientation", "orientation"],
  ])("maps %s to %s", (capability, property) => {
    expect(capabilityToExprProperty(capability)).toBe(property);
  });
});

describe("configure_device action validation", () => {
  it("requires a direct device and at least one typed setting", () => {
    expect(
      validateActionConfig({
        actionType: "configure_device",
        targetType: "group",
        targetId: "group-1",
        payload: '{"settings":[]}',
      }),
    ).toMatchObject({ field: "target" });
    expect(
      validateActionConfig({
        actionType: "configure_device",
        targetType: "device",
        targetId: "sensor-1",
        payload: '{"settings":[]}',
      }),
    ).toMatchObject({ field: "payload" });
    expect(
      validateActionConfig({
        actionType: "configure_device",
        targetType: "device",
        targetId: "sensor-1",
        payload: '{"settings":[{"capability":"fall_detection","booleanValue":true}]}',
      }),
    ).toBeNull();
  });
});

describe("run_effect action validation", () => {
  it("accepts a selector target", () => {
    expect(
      validateActionConfig({
        actionType: "run_effect",
        targetType: "expression",
        targetId: "",
        targetExpr: [{ subject: "device_type", op: "is", values: ["light"] }],
        payload: '{"effect_id":"fireplace"}',
      }),
    ).toBeNull();
  });

  it("requires at least one selector rule", () => {
    expect(
      validateActionConfig({
        actionType: "run_effect",
        targetType: "expression",
        targetId: "",
        targetExpr: [],
        payload: '{"effect_id":"fireplace"}',
      }),
    ).toMatchObject({ field: "target" });
  });
});

function roundTrip(cfg: TriggerConfig): TriggerConfig {
  const serialized = serializeTriggerConfig(cfg);
  return normalizeTriggerConfig(JSON.parse(serialized) as Record<string, unknown>);
}

describe("normalizeTriggerConfig mode recovery", () => {
  it("availability: recovers deviceId", () => {
    const cfg: TriggerConfig = {
      mode: "availability",
      eventType: "device.availability_changed",
      deviceId: "0x1234",
      deviceName: "Lamp",
    };
    const round = roundTrip(cfg);
    expect(round.mode).toBe("availability");
    expect(round.deviceId).toBe("0x1234");
  });

  it("device_event: uses device.action_fired event type", () => {
    expect(eventTypeForMode("device_event")).toBe("device.action_fired");
  });

  it("device_event: generates payload-based filter, not device-state lookup", () => {
    const filter = generateFilterExpr({
      mode: "device_event",
      deviceId: "0xABCD",
      deviceName: "Bedroom switch",
      eventValue: "single",
    });
    expect(filter).toBe('trigger.device_id == "0xABCD" && trigger.payload.action == "single"');
    expect(filter).not.toContain("device(");
  });

  it.each([
    "single",
    "double",
    "triple",
    "hold",
    "release",
    "on_press",
    "on_press_release",
    "arrow_left_click",
    "triple_tap",
    "movement",
    "vibration",
    "orientation",
    "fall",
    "static",
  ])("device_event: round-trips event value %s", (eventValue) => {
    const cfg: TriggerConfig = {
      mode: "device_event",
      eventType: "device.action_fired",
      deviceId: "0xABCD",
      deviceName: "Bedroom switch",
      eventValue,
    };
    const round = roundTrip(cfg);
    expect(round.mode).toBe("device_event");
    expect(round.eventType).toBe("device.action_fired");
    expect(round.deviceId).toBe("0xABCD");
    expect(round.eventValue).toBe(eventValue);
  });

  it("device_event: device-only filter round-trips and matches any event", () => {
    const cfg: TriggerConfig = {
      mode: "device_event",
      eventType: "device.action_fired",
      deviceId: "0xDEAD",
    };
    const filter = generateFilterExpr(cfg);
    expect(filter).toBe('trigger.device_id == "0xDEAD"');
    const round = roundTrip(cfg);
    expect(round.mode).toBe("device_event");
    expect(round.deviceId).toBe("0xDEAD");
    expect(round.eventValue).toBeUndefined();
  });

  it("device_event: escapes quotes and backslashes in eventValue", () => {
    const cfg: TriggerConfig = {
      mode: "device_event",
      eventType: "device.action_fired",
      deviceId: "0xABCD",
      eventValue: 'weird"action\\value',
    };
    const filter = generateFilterExpr(cfg);
    expect(filter).toBe(
      'trigger.device_id == "0xABCD" && trigger.payload.action == "weird\\"action\\\\value"',
    );
  });

  it("device_event: empty config (no deviceId) returns true filter", () => {
    const filter = generateFilterExpr({ mode: "device_event" });
    expect(filter).toBe("true");
  });

  it("includes sensors that expose device events", () => {
    expect(
      supportsDeviceEvents({
        capabilities: [{ name: "orientation" }, { name: "action" }, { name: "device_posture" }],
      }),
    ).toBe(true);
    expect(supportsDeviceEvents({ capabilities: [{ name: "contact" }] })).toBe(false);
  });

  it("device_event: a state lookup for action falls back to custom mode", () => {
    // An event value is not persistent device state, so this expression remains custom.
    const raw = {
      kind: "event",
      event_type: "device.state_changed",
      filter_expr: 'trigger.device_id == "0xABCD" && device("Bedroom switch").action == "single"',
    };
    const round = normalizeTriggerConfig(raw as Record<string, unknown>);
    expect(round.mode).toBe("custom");
    expect(round.customExpr).toBe(raw.filter_expr);
  });

  it("device_state scopes the predicate to the changed device and field", () => {
    const cfg: TriggerConfig = {
      mode: "device_state",
      eventType: "device.state_changed",
      deviceId: "0x9999",
      deviceName: "Thermo",
      property: "temperature",
      comparator: ">",
      value: "22",
    };
    expect(generateFilterExpr(cfg)).toBe(
      'trigger.device_id == "0x9999" && trigger.payload.state.temperature != nil && trigger.payload.state.temperature > 22',
    );
    const round = roundTrip(cfg);
    expect(round.mode).toBe("device_state");
    expect(round.deviceId).toBe("0x9999");
    expect(round.property).toBe("temperature");
    expect(round.comparator).toBe(">");
    expect(round.value).toBe("22");
  });

  it("device_state (string): strips surrounding quotes from value", () => {
    const cfg: TriggerConfig = {
      mode: "device_state",
      eventType: "device.state_changed",
      deviceId: "0xEEEE",
      deviceName: "Door",
      property: "state",
      comparator: "==",
      value: "open",
    };
    const round = roundTrip(cfg);
    expect(round.mode).toBe("device_state");
    expect(round.value).toBe("open");
  });

  it("manual: round-trips as manual", () => {
    const round = roundTrip({ mode: "manual" });
    expect(round.mode).toBe("manual");
  });

  it("schedule (every): round-trips as schedule/every", () => {
    const round = roundTrip({
      mode: "schedule",
      scheduleSubmode: "every",
      scheduleIntervalValue: 15,
      scheduleIntervalUnit: "minutes",
    });
    expect(round.mode).toBe("schedule");
    expect(round.scheduleSubmode).toBe("every");
    expect(round.scheduleIntervalValue).toBe(15);
    expect(round.scheduleIntervalUnit).toBe("minutes");
  });

  it("custom: round-trips as custom", () => {
    const round = roundTrip({
      mode: "custom",
      eventType: "device.state_changed",
      customExpr: 'device("X").on && trigger.device_id == "Y"',
    });
    expect(round.mode).toBe("custom");
    expect(round.customExpr).toContain("device(");
  });

  it("unrecognized filter falls back to custom", () => {
    const raw = {
      kind: "event",
      event_type: "device.state_changed",
      filter_expr: "unparseable",
    };
    const round = normalizeTriggerConfig(raw as Record<string, unknown>);
    expect(round.mode).toBe("custom");
    expect(round.customExpr).toBe("unparseable");
  });
});
