import { describe, expect, it } from "vitest";
import { uniqueFilterOptions } from "$lib/list-helpers";
import { activityTypeOptions } from "$lib/i18n/activity";

describe("data-driven filter suggestions", () => {
  it("includes unfamiliar source values without changing filter identifiers", () => {
    const options = uniqueFilterOptions(["hive", "future_mesh", "hive"]);
    expect(options).toHaveLength(2);
    expect(options.find(option => option.value === "future_mesh")?.label).toBeTruthy();
    expect(uniqueFilterOptions([])).toEqual([]);
  });

  it("offers device actions even before they appear in the current activity page", () => {
    expect(activityTypeOptions([], false)).toContainEqual({ value: "device.action_fired", label: "Device action" });
  });

  it("keeps additional event types from the feed discoverable", () => {
    const options = activityTypeOptions(["custom.event", "custom.event", "command.confirmed"], false);
    expect(options.filter(option => option.value === "custom.event")).toHaveLength(1);
    expect(options.some(option => option.value === "command.confirmed")).toBe(true);
  });

  it("adds diagnostic event types for advanced searches", () => {
    expect(activityTypeOptions([], false).some(option => option.value === "automation.node_activated")).toBe(false);
    expect(activityTypeOptions([], true).some(option => option.value === "automation.node_activated")).toBe(true);
  });
});
