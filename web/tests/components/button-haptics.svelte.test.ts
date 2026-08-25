import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { flushSync, mount, unmount } from "svelte";
import Button from "$lib/components/ui/button/button.svelte";
import { haptics } from "$lib/stores/haptics.svelte";

let instance: ReturnType<typeof mount> | null = null;
let host: HTMLDivElement | null = null;

function render(props: { disabled?: boolean; haptic?: "execute" } = {}) {
  host = document.createElement("div");
  document.body.appendChild(host);
  instance = mount(Button, { target: host, props });
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

describe("Button haptics", () => {
  it("plays the requested intent for touch only", () => {
    const button = render({ haptic: "execute" });

    clickWithPointerType(button, "touch");
    expect(navigator.vibrate).toHaveBeenCalledWith(12);

    vi.mocked(navigator.vibrate).mockClear();
    clickWithPointerType(button, "mouse");
    expect(navigator.vibrate).not.toHaveBeenCalled();
  });

  it("stays silent without an intent or while disabled", () => {
    const plainButton = render();
    clickWithPointerType(plainButton, "touch");
    expect(navigator.vibrate).not.toHaveBeenCalled();

    if (instance) unmount(instance);
    host?.remove();
    instance = null;
    host = null;

    const disabledButton = render({ disabled: true, haptic: "execute" });
    clickWithPointerType(disabledButton, "touch");
    expect(navigator.vibrate).not.toHaveBeenCalled();
  });
});
