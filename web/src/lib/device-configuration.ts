import type { Capability, DeviceConfigurationEntry } from "$lib/stores/devices";
import { CapabilityCategory } from "$lib/gql/graphql";

export function writableConfigurationCapabilities(capabilities: Capability[]): Capability[] {
  return capabilities.filter(
    (capability) => capability.category === CapabilityCategory.Configuration && capability.canSet,
  );
}

export function configurationEntry(
  capability: Capability,
  current?: DeviceConfigurationEntry,
): DeviceConfigurationEntry {
  if (current) return { ...current };
  switch (capability.type) {
    case "binary":
      return {
        capability: capability.name,
        booleanValue: false,
        numberValue: null,
        stringValue: null,
      };
    case "numeric":
      return {
        capability: capability.name,
        booleanValue: null,
        numberValue: capability.valueMin ?? 0,
        stringValue: null,
      };
    default:
      return {
        capability: capability.name,
        booleanValue: null,
        numberValue: null,
        stringValue: capability.values?.[0] ?? "",
      };
  }
}

export function configurationEntriesEqual(
  left: DeviceConfigurationEntry[],
  right: DeviceConfigurationEntry[],
): boolean {
  if (left.length !== right.length) return false;
  const byCapability = new Map(right.map((entry) => [entry.capability, entry]));
  return left.every((entry) => {
    const other = byCapability.get(entry.capability);
    return (
      other !== undefined &&
      entry.booleanValue === other.booleanValue &&
      entry.numberValue === other.numberValue &&
      entry.stringValue === other.stringValue
    );
  });
}

export function configurationContains(
  confirmed: DeviceConfigurationEntry[],
  expected: DeviceConfigurationEntry[],
): boolean {
  const byCapability = new Map(confirmed.map((entry) => [entry.capability, entry]));
  return expected.every((entry) => {
    const other = byCapability.get(entry.capability);
    return (
      other !== undefined &&
      entry.booleanValue === other.booleanValue &&
      entry.numberValue === other.numberValue &&
      entry.stringValue === other.stringValue
    );
  });
}
