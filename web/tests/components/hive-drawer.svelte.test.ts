import { afterEach, describe, expect, it, vi } from "vitest";
import { flushSync, mount, unmount } from "svelte";
import HiveDrawer from "$lib/components/hive-drawer.svelte";

let instance: ReturnType<typeof mount> | null = null;
let host: HTMLDivElement | null = null;

afterEach(async () => {
  if (instance) await unmount(instance);
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

    const livingRoom = [...document.querySelectorAll<HTMLElement>("[role=option]")].find((option) =>
      option.textContent?.includes("Living room"),
    )!;
    livingRoom.dispatchEvent(new MouseEvent("pointermove", { bubbles: true }));
    flushSync();
    expect(livingRoom.hasAttribute("data-selected")).toBe(true);

    const list = livingRoom.closest<HTMLElement>("[data-slot=command-list]")!;
    list.dispatchEvent(new MouseEvent("pointerleave"));
    flushSync();

    expect(document.querySelector("[role=option][data-selected]")).toBeNull();
  });

  it("keeps the pending row highlighted while every row is disabled", () => {
    host = document.createElement("div");
    document.body.appendChild(host);
    const onselect = vi.fn();
    instance = mount(HiveDrawer, {
      target: host,
      props: {
        open: true,
        disabled: true,
        pendingItem: { type: "device", id: "tree-2" },
        groups: [
          {
            heading: "Devices",
            items: [
              { type: "device", id: "tree-2", name: "Tree 2" },
              { type: "device", id: "tree-3", name: "Tree 3" },
            ],
          },
        ],
        onselect,
      },
    });
    flushSync();

    const options = [...document.querySelectorAll<HTMLElement>("[role=option]")];
    const pending = options.find((option) => option.textContent?.includes("Tree 2"))!;

    expect(options.every((option) => option.hasAttribute("data-disabled"))).toBe(true);
    expect(pending.getAttribute("data-pending")).toBe("true");
    expect(pending.getAttribute("aria-busy")).toBe("true");
    expect(pending.className).toContain("data-[pending=true]:bg-muted");
    expect(pending.querySelector(".animate-spin")).not.toBeNull();
    expect(pending.closest(".pl-5")).not.toBeNull();

    options[1].click();
    flushSync();
    expect(onselect).not.toHaveBeenCalled();
  });

  it("renders semantic device badges through HiveChip", () => {
    Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
      configurable: true,
      value: vi.fn(),
    });
    host = document.createElement("div");
    document.body.appendChild(host);
    instance = mount(HiveDrawer, {
      target: host,
      props: {
        open: true,
        groups: [
          {
            heading: "Devices",
            items: [
              {
                type: "device",
                id: "temperature",
                name: "Temperature sensor",
                badgeType: "sensor",
              },
            ],
          },
        ],
        onselect: vi.fn(),
      },
    });
    flushSync();

    const option = [...document.querySelectorAll<HTMLElement>("[role=option]")].find((row) =>
      row.textContent?.includes("Temperature sensor"),
    );
    expect(option?.textContent).toContain("Sensor");
    expect(option?.querySelector(".text-cyan-700")).not.toBeNull();
  });
});
