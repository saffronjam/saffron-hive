import { describe, expect, it } from "vitest";
import {
  configurationContains,
  configurationEntriesEqual,
  configurationEntry,
  writableConfigurationCapabilities,
} from "$lib/device-configuration";
import { CapabilityCategory, type Capability } from "$lib/gql/graphql";

function capability(over: Partial<Capability> = {}): Capability {
  return {
    name: "fall_detection",
    type: "binary",
    label: null,
    description: null,
    category: CapabilityCategory.Configuration,
    values: null,
    valueMin: null,
    valueMax: null,
    unit: null,
    reportsValue: true,
    canSet: true,
    canGet: true,
    ...over,
  };
}

describe("device configuration", () => {
  it("selects only writable configuration capabilities", () => {
    const values = [
      capability(),
      capability({ name: "contact", category: CapabilityCategory.State }),
      capability({ name: "read_only", canSet: false }),
    ];
    expect(writableConfigurationCapabilities(values).map((value) => value.name)).toEqual([
      "fall_detection",
    ]);
  });

  it("creates one typed value for each capability type", () => {
    expect(configurationEntry(capability())).toMatchObject({ booleanValue: false });
    expect(
      configurationEntry(capability({ name: "sensitivity", type: "numeric", valueMin: 1 })),
    ).toMatchObject({ numberValue: 1 });
    expect(
      configurationEntry(
        capability({ name: "mode", type: "enum", values: ["normal", "strict"] }),
      ),
    ).toMatchObject({ stringValue: "normal" });
  });

  it("matches confirmed entries independent of ordering", () => {
    const first = {
      capability: "fall_detection",
      booleanValue: true,
      numberValue: null,
      stringValue: null,
    };
    const second = {
      capability: "movement_detection",
      booleanValue: false,
      numberValue: null,
      stringValue: null,
    };
    expect(configurationEntriesEqual([first, second], [second, first])).toBe(true);
    expect(configurationContains([first, second], [second])).toBe(true);
  });
});
