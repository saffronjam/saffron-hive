import { describe, it, expect } from "vitest";
import { Lightbulb, Thermometer, MousePointerClick, Plug, Package } from "@lucide/svelte";
import { cn, deviceIcon } from "$lib/utils";

describe("cn", () => {
  it("merges class names", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("handles conditional classes via clsx", () => {
    const condition = false;
    expect(cn("base", condition && "hidden", "visible")).toBe("base visible");
  });

  it("deduplicates conflicting tailwind classes", () => {
    expect(cn("p-4", "p-2")).toBe("p-2");
  });

  it("handles conflicting tailwind color classes", () => {
    expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
  });

  it("handles empty input", () => {
    expect(cn()).toBe("");
  });

  it("handles undefined and null", () => {
    expect(cn("foo", undefined, null, "bar")).toBe("foo bar");
  });

  it("merges array inputs", () => {
    expect(cn(["foo", "bar"], "baz")).toBe("foo bar baz");
  });
});

describe("deviceIcon", () => {
  it("returns Lightbulb for light", () => {
    expect(deviceIcon("light")).toBe(Lightbulb);
  });

  it("returns Thermometer for sensor", () => {
    expect(deviceIcon("sensor")).toBe(Thermometer);
  });

  it("returns MousePointerClick for button", () => {
    expect(deviceIcon("button")).toBe(MousePointerClick);
  });

  it("returns Plug for plug", () => {
    expect(deviceIcon("plug")).toBe(Plug);
  });

  it("falls back to Package for unknown types", () => {
    expect(deviceIcon("unknown")).toBe(Package);
    expect(deviceIcon("switch")).toBe(Package);
    expect(deviceIcon("")).toBe(Package);
  });
});
