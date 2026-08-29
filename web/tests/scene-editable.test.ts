import { describe, expect, it, vi } from "vitest";
import {
  buildTargetInfo,
  capturedSceneState,
  defaultDesiredState,
  editorDefinitionInput,
  initialSupportingState,
  sceneControllableDeviceCount,
  sceneToEditorState,
  type EditorState,
  type SceneData,
} from "$lib/scene-editable";
import { SceneLightOverrideKind, SceneTargetType } from "$lib/gql/graphql";

vi.stubGlobal("crypto", { randomUUID: () => "uid" });

describe("typed scene editing", () => {
  it("builds direct and capability Selector targets", () => {
    expect(
      buildTargetInfo({
        targetType: "device",
        targetId: "light-1",
        target: {
          __typename: "Device",
          id: "light-1",
          deviceName: "Reading light",
          friendlyName: "light_1",
        },
      }),
    ).toMatchObject({ uid: "uid", type: "device", id: "light-1", name: "Reading light" });

    expect(
      buildTargetInfo({
        targetType: "expression",
        targetId: "",
        target: null,
        name: "Colour lights",
        expression: [{ subject: "writable_capability", op: "is", values: ["color"] } as never],
      }),
    ).toMatchObject({ type: "expression", name: "Colour lights" });
  });

  it("restores direct target kinds without a resolved target object", () => {
    expect(
      buildTargetInfo({
        targetType: "room",
        targetId: "gaming",
        name: "Gaming room",
      }),
    ).toMatchObject({ type: "room", id: "gaming", name: "Gaming room" });

    expect(
      buildTargetInfo({
        targetType: "group",
        targetId: "ceiling",
        name: "Ceiling lights",
      }),
    ).toMatchObject({ type: "group", id: "ceiling", name: "Ceiling lights" });
  });

  it("maps the lighting layers into the editor state", () => {
    const scene: SceneData = {
      id: "scene-1",
      name: "Sky",
      targets: [],
      lighting: {
        dynamicSource: {
          domain: "full_color",
          sourceKind: "preset",
          presetId: "night-sky",
          presetTitle: "Night sky",
          seed: "seed",
          brightness: 0.8,
          movement: 0.4,
          cycleSeconds: 600,
        },
        overrides: [
          { kind: "state", deviceId: "light-1", state: { colorTemp: 320 } },
          { kind: "effect", deviceId: "light-2", effectId: "fireplace" },
        ],
      },
      supportingStates: [{ deviceId: "plug-1", state: { on: true } }],
      preview: { width: 1, height: 1, pixels: [{ r: 10, g: 20, b: 30 }], swatches: [] },
    };

    const state = sceneToEditorState(scene);
    expect(state.dynamicSource).toMatchObject({
      presetId: "night-sky",
      seed: "seed",
      guidedSelectedIds: [],
      gridWidth: 0,
      gridHeight: 0,
      samples: [],
    });
    expect(state.overrides.get("light-1")).toEqual({
      kind: "state",
      deviceId: "light-1",
      state: { colorTemp: 320 },
    });
    expect(state.supportingStates.get("plug-1")).toEqual({
      deviceId: "plug-1",
      state: { on: true },
    });
  });

  it("serializes light overrides and supporting states", () => {
    const definition = editorDefinitionInput({
      targets: [{ uid: "target", type: "room", id: "living", name: "Living room" }],
      dynamicSource: null,
      overrides: new Map([
        ["light-1", { kind: "state", deviceId: "light-1", state: { color: { r: 1, g: 2, b: 3 } } }],
        ["light-2", { kind: "effect", deviceId: "light-2", effectId: "fireplace" }],
      ]),
      supportingStates: new Map([["plug-1", { deviceId: "plug-1", state: { on: false } }]]),
    });

    expect(definition.targets[0]).toMatchObject({
      targetType: SceneTargetType.Room,
      targetId: "living",
    });
    expect(definition.lighting).not.toHaveProperty("fallback");
    expect(definition.lighting.overrides).toEqual([
      {
        deviceId: "light-1",
        kind: SceneLightOverrideKind.State,
        state: { color: { r: 1, g: 2, b: 3, x: 0, y: 0 } },
      },
      { deviceId: "light-2", kind: SceneLightOverrideKind.Effect, effectId: "fireplace" },
    ]);
    expect(definition.supportingStates).toEqual([{ deviceId: "plug-1", state: { on: false } }]);
  });

  it("sends the visible dynamic seed directly", () => {
    const definition = editorDefinitionInput({
      targets: [],
      dynamicSource: {
        domain: "full_color",
        sourceKind: "preset",
        guidedSelectedIds: [],
        seed: "912",
        brightness: 0.8,
        movement: 0.5,
        cycleSeconds: 600,
        gridWidth: 1,
        gridHeight: 1,
        samples: [],
      },
      overrides: new Map(),
      supportingStates: new Map(),
    });

    expect(definition.lighting.dynamicSource?.seed).toBe("912");
    expect(definition.lighting.dynamicSource).not.toHaveProperty("shuffle");
  });

  it("uses only writable lighting fields for a default state", () => {
    const state = defaultDesiredState({
      id: "d",
      capabilities: [
        { name: "on_off", canSet: true },
        { name: "brightness", canSet: false },
        { name: "color_temp", canSet: true },
      ],
    } as never);
    expect(state).toEqual({ on: true, colorTemp: 370 });
  });

  it("captures only writable fields that a scene can command", () => {
    expect(
      capturedSceneState({
        capabilities: [{ name: "sensitivity", canSet: true }],
        state: { temperature: 21.5 },
      } as never),
    ).toBeNull();

    expect(
      capturedSceneState({
        capabilities: [{ name: "on_off", canSet: true }],
        state: { on: false, power: 12 },
      } as never),
    ).toEqual({ on: false });

    expect(
      capturedSceneState({
        capabilities: [
          { name: "target_temperature", canSet: true },
          { name: "hvac_mode", canSet: true },
          { name: "fan_mode", canSet: false },
        ],
        state: { targetTemperature: 21, hvacMode: "heat", fanMode: "auto" },
      } as never),
    ).toEqual({ targetTemperature: 21, hvacMode: "heat" });
  });

  it("offers a safe initial state only for commandable supporting devices", () => {
    expect(
      initialSupportingState({
        type: "switch",
        roles: {},
        capabilities: [{ name: "on_off", canSet: true }],
        state: null,
      } as never),
    ).toEqual({ on: true });

    expect(
      initialSupportingState({
        type: "sensor",
        roles: {},
        capabilities: [{ name: "sensitivity", canSet: true }],
        state: { temperature: 21.5 },
      } as never),
    ).toBeNull();

    expect(
      initialSupportingState({
        type: "sensor",
        roles: {},
        capabilities: [{ name: "on_off", canSet: true }],
        state: { on: true },
      } as never),
    ).toBeNull();
  });

  it("counts only outputs the Scene runtime can control", () => {
    const light = {
      id: "light-1",
      type: "light",
      roles: {},
      disabled: false,
      deleted: false,
      capabilities: [{ name: "color", canSet: true }],
    } as never;
    const plug = {
      id: "plug-1",
      type: "plug",
      roles: {},
      disabled: false,
      deleted: false,
      capabilities: [{ name: "on_off", canSet: true }],
    } as never;
    const disabledPlug = {
      id: "plug-1",
      type: "plug",
      roles: {},
      disabled: true,
      deleted: false,
      capabilities: [{ name: "on_off", canSet: true }],
    } as never;
    const room = {
      id: "living",
      name: "Living room",
      resolvedDevices: [{ id: "light-1" }],
    };
    const state: EditorState = {
      targets: [{ uid: "target", type: "room" as const, id: "living", name: "Living room" }],
      dynamicSource: null,
      overrides: new Map(),
      supportingStates: new Map(),
    };

    expect(sceneControllableDeviceCount(state, [light, plug], [], [room])).toBe(0);
    state.dynamicSource = {
      domain: "full_color",
      sourceKind: "preset",
      guidedSelectedIds: [],
      seed: "1",
      brightness: 1,
      movement: 1,
      cycleSeconds: 60,
      gridWidth: 2,
      gridHeight: 2,
      samples: [],
    };
    expect(sceneControllableDeviceCount(state, [light, plug], [], [room])).toBe(1);

    state.dynamicSource = null;
    state.supportingStates.set("plug-1", { deviceId: "plug-1", state: { on: true } });
    expect(sceneControllableDeviceCount(state, [light, plug], [], [room])).toBe(1);
    expect(sceneControllableDeviceCount(state, [light, disabledPlug], [], [room])).toBe(0);
  });
});
