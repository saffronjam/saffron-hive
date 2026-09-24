import { afterEach, describe, expect, it, vi } from "vitest";
import { flushSync, mount, unmount } from "svelte";
import { Slider } from "$lib/components/ui/slider";

vi.stubGlobal(
  "ResizeObserver",
  class {
    observe() {}
    unobserve() {}
    disconnect() {}
  },
);

let instance: ReturnType<typeof mount> | null = null;
let host: HTMLDivElement | null = null;

afterEach(async () => {
  if (instance) await unmount(instance);
  host?.remove();
  instance = null;
  host = null;
});

describe("slider position updates", () => {
  it("keeps its thumb mounted and focused through live value changes", () => {
    const props = $state({ type: "single" as const, value: 40, max: 254, onValueChange: vi.fn() });
    host = document.createElement("div");
    document.body.appendChild(host);
    instance = mount(Slider, { target: host, props });
    flushSync();
    const thumb = host.querySelector<HTMLElement>('[role="slider"]')!;
    thumb.focus();

    props.value = 180;
    flushSync();

    expect(host.querySelector('[role="slider"]')).toBe(thumb);
    expect(document.activeElement).toBe(thumb);
    expect(thumb.getAttribute("aria-valuenow")).toBe("180");
    expect(props.onValueChange).not.toHaveBeenCalled();
  });

  it("keeps each range thumb mounted through value changes", () => {
    const props = $state({ type: "multiple" as const, value: [20, 80], max: 100 });
    host = document.createElement("div");
    document.body.appendChild(host);
    instance = mount(Slider, { target: host, props });
    flushSync();
    const thumbs = [...host.querySelectorAll('[role="slider"]')];

    props.value = [30, 70];
    flushSync();

    expect([...host.querySelectorAll('[role="slider"]')]).toEqual(thumbs);
    expect(thumbs.map((thumb) => thumb.getAttribute("aria-valuenow"))).toEqual(["30", "70"]);
  });
});
