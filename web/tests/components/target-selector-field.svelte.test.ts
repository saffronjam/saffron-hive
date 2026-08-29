import { afterEach, describe, expect, it, vi } from "vitest";
import { flushSync, mount, unmount } from "svelte";
import TargetSelectorField from "$lib/components/target-selector-field.svelte";
import type { Device } from "$lib/gql/graphql";

let instance: ReturnType<typeof mount> | null = null;
let host: HTMLDivElement | null = null;

afterEach(() => {
  if (instance) unmount(instance);
  host?.remove();
  instance = null;
  host = null;
});

describe("TargetSelectorField", () => {
  it("keeps rule selection presses inside the editor", () => {
    host = document.createElement("div");
    document.body.appendChild(host);
    const parentPress = vi.fn();
    host.addEventListener("mousedown", parentPress);
    instance = mount(TargetSelectorField, {
      target: host,
      props: {
        value: [],
        onchange: vi.fn(),
        devices: [],
        groups: [],
        rooms: [],
      },
    });
    flushSync();

    const input = host.querySelector("input")!;
    input.focus();
    flushSync();
    const room = [...host.querySelectorAll<HTMLElement>("[role=option]")].find(
      (option) => option.textContent?.trim() === "Room",
    )!;
    room.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, cancelable: true }));
    flushSync();

    expect(parentPress).not.toHaveBeenCalled();
    expect(host.textContent).toContain("Room");
    expect(input.placeholder).toBe("is / is not…");
  });

  it("shows device type and direct room context in device choices", () => {
    host = document.createElement("div");
    document.body.appendChild(host);
    const devices = [
      { id: "switch-1", name: "Living room switch", friendlyName: null, type: "button" },
    ] as unknown as Device[];
    instance = mount(TargetSelectorField, {
      target: host,
      props: {
        value: [],
        onchange: vi.fn(),
        devices,
        groups: [],
        rooms: [
          {
            id: "living-room",
            name: "Living room",
            members: [{ memberType: "device", memberId: "switch-1" }],
          },
        ],
      },
    });
    flushSync();

    const input = host.querySelector("input")!;
    input.focus();
    flushSync();
    const pick = (label: string) => {
      const option = [...host!.querySelectorAll<HTMLElement>("[role=option]")].find(
        (candidate) => candidate.textContent?.trim() === label,
      )!;
      option.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, cancelable: true }));
      flushSync();
    };

    pick("Device");
    pick("is");

    const deviceOption = [...host.querySelectorAll<HTMLElement>("[role=option]")].find((option) =>
      option.textContent?.includes("Living room switch"),
    )!;
    expect(deviceOption.textContent).toContain("Button");
    expect(deviceOption.textContent).toContain("Living room");
  });

  it("offers writable capabilities with product labels", () => {
    host = document.createElement("div");
    document.body.appendChild(host);
    const devices = [
      {
        id: "rgb-1",
        name: "Colour lamp",
        type: "light",
        disabled: false,
        deleted: false,
        roles: {},
        capabilities: [
          {
            name: "color",
            type: "composite",
            canSet: true,
            reportsValue: true,
            canGet: false,
          },
        ],
      },
    ] as unknown as Device[];
    instance = mount(TargetSelectorField, {
      target: host,
      props: { value: [], onchange: vi.fn(), devices, groups: [], rooms: [] },
    });
    flushSync();

    const input = host.querySelector("input")!;
    input.focus();
    flushSync();
    const pick = (label: string) => {
      const option = [...host!.querySelectorAll<HTMLElement>("[role=option]")].find(
        (candidate) => candidate.textContent?.trim() === label,
      )!;
      option.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, cancelable: true }));
      flushSync();
    };

    pick("Can set");
    expect(input.placeholder).toBe("includes…");
    pick("includes");
    expect(host.textContent).toContain("Full colour");
  });
});
