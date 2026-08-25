import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { flushSync, mount, unmount } from "svelte";
import Switch from "$lib/components/ui/switch/switch.svelte";
import { haptics } from "$lib/stores/haptics.svelte";

let instance: ReturnType<typeof mount> | null = null;
let host: HTMLDivElement | null = null;

function render(props: { disabled?: boolean; haptic?: boolean } = {}) {
  host = document.createElement("div");
  document.body.appendChild(host);
  instance = mount(Switch, { target: host, props });
  flushSync();
  return host.querySelector("button")!;
}

function clickWithPointerType(button: HTMLButtonElement, pointerType: string) {
  const event = new MouseEvent("click", { bubbles: true, cancelable: true });
  Object.defineProperty(event, "pointerType", { value: pointerType });
  button.dispatchEvent(event);
  flushSync();
}

beforeEach(() => {
  haptics.reset();
  Object.defineProperty(document, "visibilityState", {
    configurable: true,
    value: "visible",
  });
  Object.defineProperty(navigator, "vibrate", {
    configurable: true,
    value: vi.fn(() => true),
  });
});

afterEach(() => {
  if (instance) unmount(instance);
  host?.remove();
  instance = null;
  host = null;
});

describe("Switch haptics", () => {
  it("plays once for touch and ignores mouse", () => {
    const button = render();

    clickWithPointerType(button, "touch");
    expect(navigator.vibrate).toHaveBeenCalledWith(10);

    vi.mocked(navigator.vibrate).mockClear();
    clickWithPointerType(button, "mouse");
    expect(navigator.vibrate).not.toHaveBeenCalled();
  });

  it("supports opting out", () => {
    const button = render({ haptic: false });
    clickWithPointerType(button, "pen");
    expect(navigator.vibrate).not.toHaveBeenCalled();
  });

  it("does not play for a disabled switch", () => {
    const button = render({ disabled: true });
    clickWithPointerType(button, "touch");
    expect(navigator.vibrate).not.toHaveBeenCalled();
  });
});
