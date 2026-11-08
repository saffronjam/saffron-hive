import { afterEach, expect, it, vi } from "vitest";
import { flushSync, mount, unmount } from "svelte";
import { toast } from "svelte-sonner";
import Harness from "../fixtures/error-toast-harness.svelte";

vi.mock("svelte-sonner", () => ({ toast: { error: vi.fn() } }));
let instance: ReturnType<typeof mount> | undefined;
let host: HTMLDivElement;
afterEach(async () => {
  if (instance) await unmount(instance);
  instance = undefined;
  host.remove();
  vi.clearAllMocks();
});
it("notifies once per failure and leaves content layout intact", () => {
  host=document.createElement("div");document.body.append(host);
  const view=mount(Harness,{target:host});instance=view;flushSync();
  const content=host.innerHTML;
  view.report("Could not load data.");flushSync();
  expect(toast.error).toHaveBeenCalledTimes(1);
  expect(toast.error).toHaveBeenCalledWith("Could not load data.",expect.objectContaining({id:"request-error:Could not load data."}));
  expect(host.innerHTML).toBe(content);
  view.report("Could not load data.");flushSync();
  expect(toast.error).toHaveBeenCalledTimes(1);
  view.report(null);flushSync();
  view.report("Could not load data.");flushSync();
  expect(toast.error).toHaveBeenCalledTimes(2);
});
it("suppresses hidden-page errors and preserves the retry action", async () => {
  host=document.createElement("div");document.body.append(host);
  const retry=vi.fn();const view=mount(Harness,{target:host,props:{onretry:retry}});instance=view;flushSync();
  view.setVisible(false);view.report("Try again");flushSync();
  expect(toast.error).not.toHaveBeenCalled();
  view.setVisible(true);flushSync();
  const options=vi.mocked(toast.error).mock.calls[0][1];
  expect(options?.action).toEqual(expect.objectContaining({label:"Try again"}));
  if (typeof options?.action === "object") {
    const click = new MouseEvent("click") as MouseEvent & { currentTarget: HTMLButtonElement };
    Object.defineProperty(click, "currentTarget", { value: document.createElement("button") });
    options.action.onClick(click);
  }
  expect(retry).toHaveBeenCalledTimes(1);
  await vi.waitFor(() => expect(toast.error).toHaveBeenCalledTimes(2));
});
