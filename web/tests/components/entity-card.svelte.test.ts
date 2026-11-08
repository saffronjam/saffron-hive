import { afterEach, describe, expect, it, vi } from "vitest";
import { flushSync, mount, unmount } from "svelte";
import { Lightbulb } from "@lucide/svelte";
import EntityCard from "$lib/components/entity-card.svelte";

let instance: ReturnType<typeof mount> | null = null;
let host: HTMLDivElement | null = null;

afterEach(() => {
  if (instance) unmount(instance);
  host?.remove();
  instance = null;
  host = null;
});

describe("EntityCard", () => {
  it("plays press feedback only after a completed click", () => {
    host = document.createElement("div");
    document.body.appendChild(host);
    instance = mount(EntityCard, {
      target: host,
      props: {
        entity: { id: "kitchen", name: "Kitchen", icon: null },
        fallbackIcon: Lightbulb,
        readOnly: true,
        pressFeedback: true,
        onclick: () => {},
      },
    });
    flushSync();

    const card = host.firstElementChild as HTMLElement;
    card.dispatchEvent(new MouseEvent("pointerdown", { bubbles: true, button: 0 }));
    expect(card.hasAttribute("data-press-flash")).toBe(false);

    card.click();
    expect(card.hasAttribute("data-press-flash")).toBe(true);
  });

  it("keeps the remembered palette on the icon while inactive", () => {
    host = document.createElement("div");
    document.body.appendChild(host);
    instance = mount(EntityCard, {
      target: host,
      props: {
        entity: { id: "kitchen", name: "Kitchen", icon: null },
        fallbackIcon: Lightbulb,
        tintColors: null,
        inactiveTintColors: ["rgb(120, 80, 40)"],
        tintInactive: true,
        brightnessFill: 0,
        readOnly: true,
      },
    });
    flushSync();

    const card = host.firstElementChild as HTMLElement;
    const iconTint = host.querySelector<HTMLElement>('[aria-hidden="true"]');

    expect(card.className).toContain("tint-fill-horizontal-1");
    expect(card.style.getPropertyValue("--brightness-fill")).toBe("0%");
    expect(iconTint?.style.background).toContain("rgb(120, 80, 40)");
    expect(iconTint?.style.opacity).toBe("1");
  });

  it("uses the acknowledged output transition for live tint changes", () => {
    host = document.createElement("div");
    document.body.appendChild(host);
    instance = mount(EntityCard, {
      target: host,
      props: {
        entity: { id: "kitchen", name: "Kitchen", icon: null },
        fallbackIcon: Lightbulb,
        tintColors: ["rgb(20, 80, 140)"],
        tintTransitionSeconds: 1.8,
        readOnly: true,
      },
    });
    flushSync();

    const card = host.firstElementChild as HTMLElement;
    expect(card.style.getPropertyValue("--tint-transition-duration")).toBe("1.8s");
  });
  it("opens a resource name without activating its card action", () => {
    host = document.createElement("div");
    document.body.appendChild(host);
    const activate = vi.fn();
    instance = mount(EntityCard, {
      target: host,
      props: {
        entity: { id: "scene-1", name: "Evening" },
        fallbackIcon: Lightbulb,
        nameHref: "/scenes/scene-1",
        readOnly: true,
        onclick: activate,
      },
    });
    flushSync();
    const name = host.querySelector('a[href="/scenes/scene-1"]')!;
    name.addEventListener("click", (event) => event.preventDefault());
    name.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    name.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    expect(activate).not.toHaveBeenCalled();
    (host.firstElementChild as HTMLElement).click();
    expect(activate).toHaveBeenCalledOnce();
  });

});
