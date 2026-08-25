import { afterEach, describe, expect, it, vi } from "vitest";
import { flushSync, mount, unmount } from "svelte";
import HiveSelectAutocomplete from "$lib/components/hive-select-autocomplete.svelte";
import { Dialog } from "$lib/components/ui/dialog/index.js";

let instance: ReturnType<typeof mount> | null = null;
let dialogInstance: ReturnType<typeof mount> | null = null;
let host: HTMLDivElement | null = null;

function itemText(item: unknown): string {
  return typeof item === "string" ? item : "";
}

afterEach(() => {
  if (instance) unmount(instance);
  if (dialogInstance) unmount(dialogInstance);
  host?.remove();
  instance = null;
  dialogInstance = null;
  host = null;
});

describe("HiveSelectAutocomplete", () => {
  it("does not activate on a secondary-button press", () => {
    host = document.createElement("div");
    document.body.appendChild(host);
    instance = mount(HiveSelectAutocomplete, {
      target: host,
      props: {
        items: ["Set state", "Toggle state"],
        getValue: itemText,
        getLabel: itemText,
        onchange: vi.fn(),
      },
    });
    flushSync();

    const input = host.querySelector("input")!;
    input.focus();
    flushSync();
    expect(document.querySelector("[role=listbox]")).not.toBeNull();

    const press = new MouseEvent("mousedown", {
      bubbles: true,
      cancelable: true,
      button: 2,
    });
    input.dispatchEvent(press);
    flushSync();

    expect(press.defaultPrevented).toBe(true);
    expect(document.activeElement).not.toBe(input);
    expect(document.querySelector("[role=listbox]")).toBeNull();
  });

  it("dismisses an open list when a context menu is requested elsewhere", () => {
    host = document.createElement("div");
    document.body.appendChild(host);
    instance = mount(HiveSelectAutocomplete, {
      target: host,
      props: {
        items: ["Set state", "Toggle state"],
        getValue: itemText,
        getLabel: itemText,
        onchange: vi.fn(),
      },
    });
    flushSync();

    const input = host.querySelector("input")!;
    input.focus();
    flushSync();
    expect(document.querySelector("[role=listbox]")).not.toBeNull();

    host.addEventListener("contextmenu", (event) => event.stopPropagation());
    host.dispatchEvent(new MouseEvent("contextmenu", { bubbles: true }));
    flushSync();

    expect(document.activeElement).not.toBe(input);
    expect(document.querySelector("[role=listbox]")).toBeNull();
  });

  it("dismisses when a modal overlay is requested", () => {
    host = document.createElement("div");
    document.body.appendChild(host);
    instance = mount(HiveSelectAutocomplete, {
      target: host,
      props: {
        items: ["Set state", "Toggle state"],
        getValue: itemText,
        getLabel: itemText,
        onchange: vi.fn(),
      },
    });
    flushSync();

    const input = host.querySelector("input")!;
    input.focus();
    flushSync();
    expect(document.querySelector("[role=listbox]")).not.toBeNull();

    dialogInstance = mount(Dialog, { target: host, props: { open: true } });
    flushSync();

    expect(document.querySelector("[role=listbox]")).toBeNull();
  });
});
