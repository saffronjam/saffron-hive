import { afterEach, describe, expect, it, vi } from "vitest";
import { flushSync, mount, unmount } from "svelte";
import ConfirmDialog from "$lib/components/confirm-dialog.svelte";
import NodeTypeSelect from "$lib/components/graph/node-type-select.svelte";
import { triggerOptions } from "$lib/components/graph/automation-node-options";

let instance: ReturnType<typeof mount> | null = null;
let host: HTMLDivElement;

afterEach(async () => {
  if (instance) await unmount(instance);
  instance = null;
  host?.remove();
});

function createHost() {
  host = document.createElement("div");
  document.body.appendChild(host);
}

describe("confirmation dismissal", () => {
  it.each([false, true])("keeps Cancel usable with showCloseButton=%s", async (showCloseButton) => {
    createHost();
    const oncancel = vi.fn();
    instance = mount(ConfirmDialog, {
      target: host,
      props: {
        open: true,
        title: "Delete automation",
        showCloseButton,
        oncancel,
        onconfirm: vi.fn(),
      },
    });
    flushSync();
    const dialog = document.querySelector('[role="dialog"]')!;
    expect(dialog.querySelector('[data-slot="dialog-close"]') !== null).toBe(showCloseButton);
    const cancel = Array.from(dialog.querySelectorAll("button")).find(
      (button) => button.textContent?.trim() === "Cancel",
    )!;
    cancel.click();
    expect(oncancel).toHaveBeenCalledOnce();
  });
});

describe("saved node selection", () => {
  it("displays a saved Custom value without offering it as a choice", () => {
    createHost();
    instance = mount(NodeTypeSelect, {
      target: host,
      props: {
        value: "custom",
        placeholder: "Select trigger",
        options: triggerOptions(),
        selectedFallback: { value: "custom", label: "Custom", description: "Saved expression" },
        onchange: vi.fn(),
      },
    });
    flushSync();
    expect(host.textContent).toContain("Custom");
    host.querySelector("input")!.focus();
    flushSync();
    const options = document.querySelector('[role="listbox"]');
    expect(options).not.toBeNull();
    expect(options!.textContent).toContain("Device event");
    expect(options!.textContent).not.toContain("Custom");
  });
});
