import { afterEach, expect, it, vi } from "vitest";
import { flushSync, mount, unmount } from "svelte";
import InlineEditName from "$lib/components/inline-edit-name.svelte";
import { createMockClient } from "../helpers/mock-client";

const errorToast = vi.hoisted(() => vi.fn());
vi.mock("svelte-sonner", () => ({ toast: { error: errorToast } }));
let component: ReturnType<typeof mount> | undefined;
let host: HTMLDivElement | undefined;
afterEach(async () => {
  if (component) await unmount(component);
  host?.remove();
  errorToast.mockClear();
});

it("restores the confirmed name after a rejected save and submits Enter once", async () => {
  const { client } = createMockClient();
  host = document.createElement("div");
  document.body.append(host);
  let reject: (reason: Error) => void = () => {};
  const save = vi.fn(() => new Promise<void>((_, fail) => { reject = fail; }));
  component = mount(InlineEditName, {
    target: host, context: new Map([["$$_urql", client]]),
    props: { name: "Confirmed", onsave: save },
  });
  flushSync();
  host.firstElementChild!.dispatchEvent(new MouseEvent("dblclick", { bubbles: true }));
  flushSync();
  const input = host.querySelector("input")!;
  input.value = "Local edit";
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
  input.dispatchEvent(new Event("blur"));
  flushSync();
  expect(save).toHaveBeenCalledExactlyOnceWith("Local edit");
  expect(host.querySelector("h3")?.textContent).toBe("Local edit");
  reject(new Error("revision conflict"));
  await vi.waitFor(() => {
    expect(host!.querySelector("h3")?.textContent).toBe("Confirmed");
    expect(errorToast).toHaveBeenCalledOnce();
  });
});

it("keeps linked names out of double-click editing and restores link focus after cancel", async () => {
  const { client } = createMockClient();
  host = document.createElement("div");
  document.body.append(host);
  const save = vi.fn();
  const editor = mount(InlineEditName, {
    target: host,
    context: new Map([["$$_urql", client]]),
    props: { name: "Kitchen", href: "/rooms?edit=kitchen", onsave: save },
  });
  component = editor;
  flushSync();
  host.firstElementChild!.dispatchEvent(new MouseEvent("dblclick", { bubbles: true }));
  flushSync();
  expect(host.querySelector("input")).toBeNull();

  editor.startEditing();
  flushSync();
  const input = host.querySelector("input")!;
  input.focus();
  input.value = "Draft";
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
  flushSync();
  await vi.waitFor(() => expect(document.activeElement).toBe(host!.querySelector("a")));
  expect(save).not.toHaveBeenCalled();
});
