import { describe, it, expect } from "vitest";
import {
  parsePayload,
  buildTargetInfo,
  sceneToEditable,
  type SceneAction,
  type SceneData,
} from "$lib/scene-editable";

describe("parsePayload", () => {
  it("parses valid JSON", () => {
    expect(parsePayload('{"on":true,"brightness":200}')).toEqual({
      on: true,
      brightness: 200,
    });
  });

  it("parses a partial payload as-is", () => {
    expect(parsePayload('{"colorTemp":350}')).toEqual({ colorTemp: 350 });
  });

  it("falls back to default on invalid JSON", () => {
    expect(parsePayload("not-json")).toEqual({ on: true, brightness: 127 });
  });

  it("falls back to default on empty string", () => {
    expect(parsePayload("")).toEqual({ on: true, brightness: 127 });
  });
});

describe("buildTargetInfo", () => {
  it("maps a Group target to group type", () => {
    const action: SceneAction = {
      id: "a1",
      targetType: "group",
      targetId: "g1",
      target: { __typename: "Group", id: "g1", name: "Living Room Lights" },
      payload: "{}",
    };
    expect(buildTargetInfo(action)).toEqual({
      id: "g1",
      name: "Living Room Lights",
      type: "group",
    });
  });

  it("maps a Device target to device type and preserves deviceType", () => {
    const action: SceneAction = {
      id: "a1",
      targetType: "device",
      targetId: "d1",
      target: { __typename: "Device", id: "d1", name: "Desk lamp", type: "light" },
      payload: "{}",
    };
    expect(buildTargetInfo(action)).toEqual({
      id: "d1",
      name: "Desk lamp",
      type: "device",
      deviceType: "light",
    });
  });

  it("treats non-Group __typename as a device even without a type", () => {
    const action: SceneAction = {
      id: "a1",
      targetType: "device",
      targetId: "d1",
      target: { __typename: "Device", id: "d1", name: "Unknown" },
      payload: "{}",
    };
    expect(buildTargetInfo(action)).toEqual({
      id: "d1",
      name: "Unknown",
      type: "device",
      deviceType: undefined,
    });
  });
});

describe("sceneToEditable", () => {
  it("maps each action and preserves order", () => {
    const scene: SceneData = {
      id: "s1",
      name: "Evening",
      actions: [
        {
          id: "a1",
          targetType: "device",
          targetId: "d1",
          target: { __typename: "Device", id: "d1", name: "Lamp", type: "light" },
          payload: '{"on":true}',
        },
        {
          id: "a2",
          targetType: "group",
          targetId: "g1",
          target: { __typename: "Group", id: "g1", name: "Kitchen" },
          payload: '{"brightness":64}',
        },
      ],
    };
    const result = sceneToEditable(scene);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      targetType: "device",
      targetId: "d1",
      target: { id: "d1", name: "Lamp", type: "device", deviceType: "light" },
      payload: { on: true },
    });
    expect(result[1]).toEqual({
      targetType: "group",
      targetId: "g1",
      target: { id: "g1", name: "Kitchen", type: "group" },
      payload: { brightness: 64 },
    });
  });

  it("handles an empty action list", () => {
    const scene: SceneData = { id: "s1", name: "Empty", actions: [] };
    expect(sceneToEditable(scene)).toEqual([]);
  });

  it("applies the parsePayload fallback for malformed payloads", () => {
    const scene: SceneData = {
      id: "s1",
      name: "Bad",
      actions: [
        {
          id: "a1",
          targetType: "device",
          targetId: "d1",
          target: { __typename: "Device", id: "d1", name: "Lamp", type: "light" },
          payload: "not-json",
        },
      ],
    };
    expect(sceneToEditable(scene)[0].payload).toEqual({ on: true, brightness: 127 });
  });
});
