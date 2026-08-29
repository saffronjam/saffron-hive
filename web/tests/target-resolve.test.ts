import { describe, expect, it } from "vitest";
import {
  capabilityLabel,
  capabilityOptions,
  evaluateExpression,
  type Clause,
} from "$lib/target-resolve";
import {
  CapabilityCategory,
  TargetClauseOperator,
  TargetClauseSubject,
  type Device,
} from "$lib/gql/graphql";

function device(id: string, capabilities: Device["capabilities"]): Device {
  return {
    id,
    type: "light",
    disabled: false,
    deleted: false,
    roles: {},
    capabilities,
  } as unknown as Device;
}

const devices = [
  device("rgb", [
    {
      name: "color",
      type: "composite",
      category: CapabilityCategory.State,
      canSet: true,
      reportsValue: true,
      canGet: false,
    },
  ]),
  device("temp", [
    {
      name: "color_temp",
      type: "numeric",
      label: "Colour temperature",
      category: CapabilityCategory.State,
      canSet: false,
      reportsValue: true,
      canGet: false,
    },
  ]),
] as Device[];

describe("capability selector helpers", () => {
  it("separates writable and reported capabilities", () => {
    expect(capabilityOptions(devices, TargetClauseSubject.WritableCapability)).toEqual([
      { value: "color", label: "Full colour" },
    ]);
    expect(capabilityOptions(devices, TargetClauseSubject.ReportedCapability)).toEqual([
      { value: "color", label: "Full colour" },
      { value: "color_temp", label: "Tunable white" },
    ]);
  });

  it("uses known, adapter, and fallback labels", () => {
    expect(capabilityLabel("brightness")).toBe("Dimming");
    expect(
      capabilityLabel("air_quality", [
        { ...devices[0].capabilities[0], name: "air_quality", label: "Air quality index" },
      ]),
    ).toBe("Air quality index");
    expect(capabilityLabel("future_capability")).toBe("Future capability");
  });

  it("matches capability access flags", () => {
    const writable: Clause[] = [
      {
        subject: TargetClauseSubject.WritableCapability,
        op: TargetClauseOperator.Is,
        values: ["color"],
      },
    ];
    expect(evaluateExpression(writable, devices, [], []).map((item) => item.id)).toEqual(["rgb"]);

    const reported: Clause[] = [
      {
        subject: TargetClauseSubject.ReportedCapability,
        op: TargetClauseOperator.Is,
        values: ["color_temp"],
      },
    ];
    expect(evaluateExpression(reported, devices, [], []).map((item) => item.id)).toEqual(["temp"]);
  });
});
