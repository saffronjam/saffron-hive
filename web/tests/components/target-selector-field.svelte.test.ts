import { afterEach, describe, expect, it, vi } from "vitest";
import { flushSync, mount, unmount } from "svelte";
import TargetSelectorField from "$lib/components/target-selector-field.svelte";

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
});
