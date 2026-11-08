import { afterEach, expect, it } from "vitest";
import { mount, unmount } from "svelte";
import DeviceBatteryCard from "$lib/components/device-battery-card.svelte";

let component: ReturnType<typeof mount> | undefined;
let host: HTMLDivElement | undefined;
afterEach(async () => {
  if (component) await unmount(component);
  host?.remove();
});

function render(value?: number | null) {
  host = document.createElement("div");
  document.body.append(host);
  component = mount(DeviceBatteryCard, { target: host, props: { value } });
  return host;
}

it.each([0, 55, 100])("shows a reported %s percent with an accessible level bar", (value) => {
  const view = render(value);
  const progress = view.querySelector("progress")!;
  expect(view.textContent).toContain(`${value}%`);
  expect(progress.value).toBe(value);
  expect(progress.max).toBe(100);
  expect(progress.getAttribute("aria-label")).toBe("Battery");
});

it.each([null, undefined, NaN, Infinity, -1, 101])("does not invent a battery reading for %s", (value) => {
  const view = render(value);
  expect(view.querySelector("progress")).toBeNull();
  expect(view.querySelector('[data-slot="card"]')).toBeNull();
});

it.each([[9, "text-destructive"], [10, "text-yellow-500"], [29, "text-yellow-500"], [30, "text-primary"]])("colors a %s percent remaining battery appropriately", (value, expectedClass) => {
  const view = render(Number(value));
  expect(view.querySelector("progress")?.classList.contains(String(expectedClass))).toBe(true);
});
