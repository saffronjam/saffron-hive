import { describe, expect, it } from "vitest";
import {
  ControlledLoadRole,
  TargetClauseOperator,
  TargetClauseSubject,
  type Device,
} from "$lib/gql/graphql";
import {
  classifyVibeDevices,
  resolveSceneTargets,
  skippedReason,
} from "$lib/scene-capability-summary";

function device(
  id: string,
  type: string,
  capabilities: string[],
  controlledLoad: ControlledLoadRole | null = null,
): Device {
  return {
    id,
    type,
    disabled: false,
    deleted: false,
    roles: { controlledLoad, contact: null },
    capabilities: capabilities.map((name) => ({ name, canSet: true })),
  } as unknown as Device;
}

const devices = [
  device("rgb", "light", ["on_off", "brightness", "color", "color_temp"]),
  device("white", "light", ["on_off", "brightness", "color_temp"]),
  device("dim", "light", ["on_off", "brightness"]),
  device("switch", "plug", ["on_off"], ControlledLoadRole.Light),
  device("appliance", "plug", ["on_off"], ControlledLoadRole.Appliance),
];

describe("Scene capability summary", () => {
  it("classifies lights by graceful Vibe fallback", () => {
    const full = classifyVibeDevices(devices, "full_color");
    expect(full.fullColor.map((item) => item.id)).toEqual(["rgb"]);
    expect(full.tunableWhite.map((item) => item.id)).toEqual(["white"]);
    expect(full.dimming.map((item) => item.id)).toEqual(["dim"]);
    expect(full.switchOnly.map((item) => item.id)).toEqual(["switch"]);
    expect(full.skipped.map((item) => item.id)).toEqual(["appliance"]);

    const whites = classifyVibeDevices(devices, "white_ambience");
    expect(whites.tunableWhite.map((item) => item.id)).toEqual(["rgb", "white"]);
    expect(skippedReason(devices[4])).toBe("is not assigned the light role");
  });

  it("deduplicates overlapping structure and capability Selectors", () => {
    const targets = [
      { uid: "room", type: "room" as const, id: "living", name: "Living" },
      {
        uid: "selector",
        type: "expression" as const,
        id: "",
        name: "Colour lights",
        expression: [
          {
            subject: TargetClauseSubject.WritableCapability,
            op: TargetClauseOperator.Is,
            values: ["color"],
          },
        ],
      },
    ];
    const resolved = resolveSceneTargets(
      targets,
      devices,
      [],
      [{ id: "living", resolvedDevices: [{ id: "rgb" }, { id: "white" }] }],
    );
    expect(resolved.map((item) => item.id)).toEqual(["rgb", "white"]);
  });
});
