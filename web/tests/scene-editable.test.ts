import { describe, it, expect } from "vitest";
import {
  parsePayload,
  stringifyPayload,
  staticFieldsOf,
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

  it("lifts a flat colorTemp into the discriminated light mode", () => {
    expect(parsePayload('{"colorTemp":350}')).toEqual({
      kind: "static",
      light: { kind: "colorTemp", mireds: 350 },
    });
  });

  it("lifts a flat color into the discriminated light mode", () => {
    expect(parsePayload('{"color":{"r":255,"g":0,"b":128,"x":0.5,"y":0.3}}')).toEqual({
      kind: "static",
      light: { kind: "color", r: 255, g: 0, b: 128, x: 0.5, y: 0.3 },
    });
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

  it("heals a legacy row with both color and colorTemp by preferring color", () => {
    const raw = JSON.stringify({
      kind: "static",
      on: true,
      brightness: 254,
      colorTemp: 370,
      color: { r: 202, g: 12, b: 255, x: 0.2678, y: 0.1261 },
    });
    expect(parsePayload(raw)).toEqual({
      kind: "static",
      on: true,
      brightness: 254,
      light: { kind: "color", r: 202, g: 12, b: 255, x: 0.2678, y: 0.1261 },
    });
  });
});

describe("stringifyPayload", () => {
  it("flattens a colorTemp light mode back to the on-disk shape", () => {
    const raw = stringifyPayload({
      kind: "static",
      on: true,
      brightness: 200,
      light: { kind: "colorTemp", mireds: 350 },
    });
    expect(JSON.parse(raw)).toEqual({
      kind: "static",
      on: true,
      brightness: 200,
      colorTemp: 350,
    });
  });

  it("flattens a color light mode back to the on-disk shape", () => {
    const raw = stringifyPayload({
      kind: "static",
      on: true,
      light: { kind: "color", r: 10, g: 20, b: 30, x: 0.4, y: 0.3 },
    });
    expect(JSON.parse(raw)).toEqual({
      kind: "static",
      on: true,
      color: { r: 10, g: 20, b: 30, x: 0.4, y: 0.3 },
    });
  });

  it("round-trips a colour payload through parse → stringify → parse", () => {
    const original = parsePayload(
      '{"kind":"static","on":true,"brightness":254,"color":{"r":255,"g":0,"b":128,"x":0.5,"y":0.3}}',
    );
    expect(parsePayload(stringifyPayload(original))).toEqual(original);
  });
});

describe("staticFieldsOf", () => {
  it("emits only the colorTemp sibling when light mode is colorTemp", () => {
    const flat = staticFieldsOf({
      kind: "static",
      on: true,
      brightness: 200,
      light: { kind: "colorTemp", mireds: 370 },
    });
    expect(flat).toEqual({ on: true, brightness: 200, colorTemp: 370 });
    expect("color" in flat).toBe(false);
  });

  it("emits only the color sibling when light mode is color", () => {
    const flat = staticFieldsOf({
      kind: "static",
      on: true,
      light: { kind: "color", r: 10, g: 20, b: 30, x: 0.4, y: 0.3 },
    });
    expect(flat).toEqual({ on: true, color: { r: 10, g: 20, b: 30, x: 0.4, y: 0.3 } });
    expect("colorTemp" in flat).toBe(false);
  });

  it("returns an empty object for an effect payload", () => {
    expect(staticFieldsOf({ kind: "effect", effectId: "x" })).toEqual({});
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
      uid: expect.any(String),
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
      uid: expect.any(String),
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
      uid: expect.any(String),
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
