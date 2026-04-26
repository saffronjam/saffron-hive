import { describe, expect, it } from "vitest";
import {
  actionKind,
  referencedDeviceIds,
  referencedEffectIds,
  referencedNativeEffectNames,
  referencedSceneIds,
  triggerKind,
} from "$lib/automation-config";

describe("triggerKind", () => {
  it("returns the stored kind when present", () => {
    expect(
      triggerKind({
        type: "trigger",
        config: JSON.stringify({ kind: "event", event_type: "device.state_changed" }),
      }),
    ).toBe("event");
    expect(
      triggerKind({
        type: "trigger",
        config: JSON.stringify({ kind: "schedule", cron_expr: "0 0 * * * *" }),
      }),
    ).toBe("schedule");
  });

  it("infers schedule from a non-empty cron_expr when kind is missing", () => {
    expect(
      triggerKind({ type: "trigger", config: JSON.stringify({ cron_expr: "* * * * * *" }) }),
    ).toBe("schedule");
  });

  it("defaults to event when kind and cron_expr are absent", () => {
    expect(
      triggerKind({
        type: "trigger",
        config: JSON.stringify({ event_type: "device.state_changed" }),
      }),
    ).toBe("event");
  });

  it("returns null for non-trigger nodes", () => {
    expect(actionKind({ type: "action", config: "{}" })).toBeNull();
    expect(triggerKind({ type: "action", config: JSON.stringify({ kind: "event" }) })).toBeNull();
  });

  it("returns null when config is not valid JSON", () => {
    expect(triggerKind({ type: "trigger", config: "not-json" })).toBeNull();
  });
});

describe("actionKind", () => {
  it("returns the action_type for action nodes", () => {
    expect(
      actionKind({
        type: "action",
        config: JSON.stringify({
          action_type: "set_device_state",
          target_type: "device",
          target_id: "light-1",
          payload: "{}",
        }),
      }),
    ).toBe("set_device_state");
    expect(
      actionKind({
        type: "action",
        config: JSON.stringify({ action_type: "activate_scene", payload: "scene-1" }),
      }),
    ).toBe("activate_scene");
  });

  it("returns null for non-action nodes", () => {
    expect(actionKind({ type: "trigger", config: "{}" })).toBeNull();
  });

  it("returns null when action_type is absent or non-string", () => {
    expect(actionKind({ type: "action", config: JSON.stringify({}) })).toBeNull();
    expect(actionKind({ type: "action", config: JSON.stringify({ action_type: 42 }) })).toBeNull();
  });

  it("returns null for malformed JSON", () => {
    expect(actionKind({ type: "action", config: "}{" })).toBeNull();
  });
});

describe("referencedDeviceIds", () => {
  it("extracts the target_id for a device-targeted set_device_state action", () => {
    expect(
      referencedDeviceIds({
        type: "action",
        config: JSON.stringify({
          action_type: "set_device_state",
          target_type: "device",
          target_id: "light-42",
          payload: "{}",
        }),
      }),
    ).toEqual(["light-42"]);
  });

  it("skips set_device_state actions that target a group or room", () => {
    expect(
      referencedDeviceIds({
        type: "action",
        config: JSON.stringify({
          action_type: "set_device_state",
          target_type: "group",
          target_id: "group-1",
          payload: "{}",
        }),
      }),
    ).toEqual([]);
  });

  it("returns no IDs for activate_scene actions", () => {
    expect(
      referencedDeviceIds({
        type: "action",
        config: JSON.stringify({ action_type: "activate_scene", payload: "scene-1" }),
      }),
    ).toEqual([]);
  });

  it("returns no IDs for trigger nodes even if they include a device reference somewhere", () => {
    expect(
      referencedDeviceIds({
        type: "trigger",
        config: JSON.stringify({
          kind: "event",
          event_type: "device.state_changed",
          filter_expr: 'trigger.device_id == "light-1"',
        }),
      }),
    ).toEqual([]);
  });

  it("returns no IDs for malformed configs", () => {
    expect(referencedDeviceIds({ type: "action", config: "not-json" })).toEqual([]);
  });

  it("returns no IDs when target_id is absent or empty", () => {
    expect(
      referencedDeviceIds({
        type: "action",
        config: JSON.stringify({
          action_type: "set_device_state",
          target_type: "device",
          target_id: "",
          payload: "{}",
        }),
      }),
    ).toEqual([]);
  });
});

describe("referencedSceneIds", () => {
  it("extracts the payload for activate_scene actions", () => {
    expect(
      referencedSceneIds({
        type: "action",
        config: JSON.stringify({ action_type: "activate_scene", payload: "scene-7" }),
      }),
    ).toEqual(["scene-7"]);
  });

  it("returns no IDs for set_device_state actions", () => {
    expect(
      referencedSceneIds({
        type: "action",
        config: JSON.stringify({
          action_type: "set_device_state",
          target_type: "device",
          target_id: "light-1",
          payload: "{}",
        }),
      }),
    ).toEqual([]);
  });

  it("returns no IDs for trigger nodes", () => {
    expect(
      referencedSceneIds({
        type: "trigger",
        config: JSON.stringify({ kind: "event" }),
      }),
    ).toEqual([]);
  });

  it("returns no IDs when payload is empty or missing", () => {
    expect(
      referencedSceneIds({
        type: "action",
        config: JSON.stringify({ action_type: "activate_scene", payload: "" }),
      }),
    ).toEqual([]);
    expect(
      referencedSceneIds({
        type: "action",
        config: JSON.stringify({ action_type: "activate_scene" }),
      }),
    ).toEqual([]);
  });

  it("returns no IDs for malformed configs", () => {
    expect(referencedSceneIds({ type: "action", config: "}{" })).toEqual([]);
  });
});

describe("referencedEffectIds", () => {
  it("extracts effect_id from a run_effect action", () => {
    expect(
      referencedEffectIds({
        type: "action",
        config: JSON.stringify({
          action_type: "run_effect",
          target_type: "device",
          target_id: "light-1",
          payload: JSON.stringify({ effect_id: "fireplace" }),
        }),
      }),
    ).toEqual(["fireplace"]);
  });

  it("returns no IDs when run_effect references a native effect", () => {
    expect(
      referencedEffectIds({
        type: "action",
        config: JSON.stringify({
          action_type: "run_effect",
          target_type: "device",
          target_id: "light-1",
          payload: JSON.stringify({ native_name: "fireplace" }),
        }),
      }),
    ).toEqual([]);
  });
});

describe("referencedNativeEffectNames", () => {
  it("extracts native_name from a run_effect action", () => {
    expect(
      referencedNativeEffectNames({
        type: "action",
        config: JSON.stringify({
          action_type: "run_effect",
          target_type: "device",
          target_id: "light-1",
          payload: JSON.stringify({ native_name: "fireplace" }),
        }),
      }),
    ).toEqual(["fireplace"]);
  });

  it("returns no names when run_effect references a stored effect_id", () => {
    expect(
      referencedNativeEffectNames({
        type: "action",
        config: JSON.stringify({
          action_type: "run_effect",
          target_type: "device",
          target_id: "light-1",
          payload: JSON.stringify({ effect_id: "fireplace" }),
        }),
      }),
    ).toEqual([]);
  });

  it("returns no names for non-run_effect actions", () => {
    expect(
      referencedNativeEffectNames({
        type: "action",
        config: JSON.stringify({ action_type: "activate_scene", payload: "scene-1" }),
      }),
    ).toEqual([]);
  });
});
