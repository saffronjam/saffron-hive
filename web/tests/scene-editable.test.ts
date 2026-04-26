import { describe, it, expect } from "vitest";
import {
  parsePayload,
  buildTargetInfo,
  sceneToEditorState,
  type SceneAction,
  type SceneData,
} from "$lib/scene-editable";

describe("parsePayload", () => {
  it("parses valid JSON", () => {
    expect(parsePayload('{"on":true,"brightness":200}')).toEqual({
      kind: "static",
      on: true,
      brightness: 200,
    });
  });

  it("parses a partial payload as-is", () => {
    expect(parsePayload('{"colorTemp":350}')).toEqual({ kind: "static", colorTemp: 350 });
  });

  it("falls back to empty on invalid JSON", () => {
    expect(parsePayload("not-json")).toEqual({ kind: "static" });
  });

  it("falls back to empty on empty string", () => {
    expect(parsePayload("")).toEqual({ kind: "static" });
  });

  it("parses a tagged effect payload", () => {
    expect(parsePayload('{"kind":"effect","effect_id":"fireplace"}')).toEqual({
      kind: "effect",
      effectId: "fireplace",
    });
  });

  it("parses a tagged native_effect payload", () => {
    expect(parsePayload('{"kind":"native_effect","native_name":"fireplace"}')).toEqual({
      kind: "native_effect",
      nativeName: "fireplace",
    });
  });
});

describe("buildTargetInfo", () => {
  it("maps a Group target to group type", () => {
    const action: SceneAction = {
      targetType: "group",
      targetId: "g1",
      target: { __typename: "Group", id: "g1", name: "Living Room Lights" },
      payload: "{}",
    };
    expect(buildTargetInfo(action)).toEqual({
      type: "group",
      id: "g1",
      name: "Living Room Lights",
      icon: null,
    });
  });

  it("maps a Room target to room type", () => {
    const action: SceneAction = {
      targetType: "room",
      targetId: "r1",
      target: { __typename: "Room", id: "r1", name: "Kitchen", icon: "mdi:kitchen" },
      payload: "{}",
    };
    expect(buildTargetInfo(action)).toEqual({
      type: "room",
      id: "r1",
      name: "Kitchen",
      icon: "mdi:kitchen",
    });
  });

  it("maps a Device target to device type and preserves deviceType", () => {
    const action: SceneAction = {
      targetType: "device",
      targetId: "d1",
      target: { __typename: "Device", id: "d1", name: "Desk lamp", type: "light" },
      payload: "{}",
    };
    expect(buildTargetInfo(action)).toEqual({
      type: "device",
      id: "d1",
      name: "Desk lamp",
      deviceType: "light",
    });
  });
});

describe("sceneToEditorState", () => {
  it("produces both targets and payload map", () => {
    const scene: SceneData = {
      id: "s1",
      name: "Evening",
      actions: [
        {
          targetType: "device",
          targetId: "d1",
          target: { __typename: "Device", id: "d1", name: "Lamp", type: "light" },
          payload: "{}",
        },
        {
          targetType: "group",
          targetId: "g1",
          target: { __typename: "Group", id: "g1", name: "Kitchen" },
          payload: "{}",
        },
      ],
      devicePayloads: [{ deviceId: "d1", payload: '{"on":true,"brightness":100}' }],
    };
    const state = sceneToEditorState(scene);
    expect(state.targets).toHaveLength(2);
    expect(state.targets[0].type).toBe("device");
    expect(state.targets[1].type).toBe("group");
    expect(state.payloads.get("d1")).toEqual({ kind: "static", on: true, brightness: 100 });
  });

  it("handles empty scenes", () => {
    const scene: SceneData = { id: "s1", name: "Empty", actions: [], devicePayloads: [] };
    const state = sceneToEditorState(scene);
    expect(state.targets).toEqual([]);
    expect(state.payloads.size).toBe(0);
  });
});
