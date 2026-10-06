import type { Capability, DeviceAttributeValue } from "$lib/stores/devices";
import { CapabilityCategory } from "$lib/gql/graphql";

export function writableConfigurationCapabilities(capabilities: Capability[]): Capability[] {
  return capabilities.filter(
    (capability) => capability.category === CapabilityCategory.Configuration && capability.canSet,
  );
}

/** Write-only device commands such as identify or restart. */
export function deviceCommandCapabilities(capabilities: Capability[]): Capability[] {
  return capabilities.filter(
    (capability) =>
      capability.category === CapabilityCategory.Command &&
      (capability.type === "binary" || (capability.values?.length ?? 0) > 0),
  );
}

/** Generic readings the device reports that Hive does not model as typed state. */
export function diagnosticCapabilities(capabilities: Capability[]): Capability[] {
  return capabilities.filter(
    (capability) =>
      capability.category === CapabilityCategory.Diagnostic && capability.reportsValue,
  );
}

/**
 * The reported values of a device's writable settings, leaving out diagnostic
 * readings that share the attribute channel.
 */
export function configurationValues(
  capabilities: Capability[],
  attributes: DeviceAttributeValue[],
): DeviceAttributeValue[] {
  const settings = new Set(writableConfigurationCapabilities(capabilities).map((c) => c.name));
  return attributes.filter((value) => settings.has(value.capability));
}

export const CONFIGURATION_SECTIONS = [
  "presence",
  "climate",
  "light",
  "indicator",
  "other",
] as const;

export type ConfigurationSection = (typeof CONFIGURATION_SECTIONS)[number];

const SECTION_KEYWORDS: [ConfigurationSection, string[]][] = [
  [
    "presence",
    ["presence", "pir", "motion", "occupancy", "absence", "ai", "detection", "spatial", "target"],
  ],
  ["climate", ["temp", "temperature", "humidity"]],
  ["light", ["light", "illuminance", "lux"]],
  ["indicator", ["led", "indicator", "schedule"]],
];

/**
 * Picks the settings section for a capability by the first word of its name,
 * which converters use as the subject ("temp_reporting_mode", "led_disabled_night").
 */
export function configurationSection(name: string): ConfigurationSection {
  const subject = name.toLowerCase().split("_")[0];
  for (const [section, keywords] of SECTION_KEYWORDS) {
    if (keywords.includes(subject)) return section;
  }
  return "other";
}

export interface ConfigurationGroup {
  section: ConfigurationSection;
  capabilities: Capability[];
}

/**
 * Groups settings into sections by name, keeping the device's own order within
 * each section and dropping empty sections.
 */
export function groupConfigurationCapabilities(capabilities: Capability[]): ConfigurationGroup[] {
  return CONFIGURATION_SECTIONS.map((section) => ({
    section,
    capabilities: capabilities.filter((c) => configurationSection(c.name) === section),
  })).filter((group) => group.capabilities.length > 0);
}

/** Bitmask with every one of `count` flags set. */
export function allFlagsMask(count: number): number {
  return count <= 0 ? 0 : 2 ** count - 1;
}

export function flagIsSet(mask: number, index: number): boolean {
  return Math.floor(mask / 2 ** index) % 2 === 1;
}

export function setFlag(mask: number, index: number, on: boolean): number {
  if (flagIsSet(mask, index) === on) return mask;
  return on ? mask + 2 ** index : mask - 2 ** index;
}

export function configurationEntry(
  capability: Capability,
  current?: DeviceAttributeValue,
): DeviceAttributeValue {
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
    case "flags":
      return {
        capability: capability.name,
        booleanValue: null,
        numberValue: allFlagsMask(capability.values?.length ?? 0),
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
  left: DeviceAttributeValue[],
  right: DeviceAttributeValue[],
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
  confirmed: DeviceAttributeValue[],
  expected: DeviceAttributeValue[],
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
