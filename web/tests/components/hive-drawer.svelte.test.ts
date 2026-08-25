import { afterEach, describe, expect, it, vi } from "vitest";
import { flushSync, mount, unmount } from "svelte";
import HiveDrawer from "$lib/components/hive-drawer.svelte";

let instance: ReturnType<typeof mount> | null = null;
let host: HTMLDivElement | null = null;

afterEach(() => {
  if (instance) unmount(instance);
  host?.remove();
  instance = null;
  host = null;
});

describe("HiveDrawer", () => {
  it("clears the pointer highlight when the pointer leaves the list", () => {
    host = document.createElement("div");
    document.body.appendChild(host);
    instance = mount(HiveDrawer, {
      target: host,
      props: {
        open: true,
        groups: [
          {
            heading: "Rooms",
            items: [
              { type: "room", id: "bathroom", name: "Bathroom" },
              { type: "room", id: "living-room", name: "Living room" },
            ],
          },
        ],
        onselect: vi.fn(),
      },
    });
    flushSync();

    const livingRoom = [...document.querySelectorAll<HTMLElement>("[role=option]")].find(
      (option) => option.textContent?.includes("Living room"),
    )!;
    livingRoom.dispatchEvent(new MouseEvent("pointermove", { bubbles: true }));
    flushSync();
    expect(livingRoom.hasAttribute("data-selected")).toBe(true);

    const list = livingRoom.closest<HTMLElement>("[data-slot=command-list]")!;
    list.dispatchEvent(new MouseEvent("pointerleave"));
    flushSync();

    expect(document.querySelector("[role=option][data-selected]")).toBeNull();
  });
});
