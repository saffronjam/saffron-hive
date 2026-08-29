import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { flushSync, mount, unmount } from "svelte";
import VibeChoiceCard from "$lib/components/vibe-choice-card.svelte";

let instance: ReturnType<typeof mount> | null = null;
let host: HTMLDivElement;

const preview = {
  width: 2,
  height: 2,
  pixels: [
    { r: 240, g: 80, b: 120 },
    { r: 80, g: 200, b: 180 },
    { r: 120, g: 90, b: 240 },
    { r: 240, g: 180, b: 90 },
  ],
  swatches: [
    { x: 0, y: 0, color: { r: 240, g: 80, b: 120 } },
    { x: 1, y: 0, color: { r: 80, g: 200, b: 180 } },
    { x: 0, y: 1, color: { r: 120, g: 90, b: 240 } },
  ],
};

beforeEach(() => {
  host = document.createElement("div");
  document.body.appendChild(host);
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })),
  );
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
});

afterEach(async () => {
  if (instance) await unmount(instance);
  instance = null;
  host.remove();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("VibeChoiceCard", () => {
  it("does not render an inactive glow canvas", () => {
    instance = mount(VibeChoiceCard, {
      target: host,
      props: { preview, label: "Aurora haze", onclick: vi.fn() },
    });

    expect(host.querySelector(".field-glow")).not.toBeNull();
    expect(host.querySelectorAll("canvas")).toHaveLength(1);
  });

  it("uses the live field as a borderless selected glow", () => {
    instance = mount(VibeChoiceCard, {
      target: host,
      props: { preview, label: "Aurora haze", selected: true, onclick: vi.fn() },
    });

    const wrapper = host.querySelector<HTMLElement>(".vibe-choice")!;
    const button = host.querySelector("button")!;
    expect(wrapper.classList).toContain("selected");
    expect(wrapper.classList).toContain("live-preview");
    expect(wrapper.querySelector(".field-glow")).not.toBeNull();
    expect(wrapper.querySelectorAll("canvas")).toHaveLength(2);
    expect(button.classList).not.toContain("ring-2");
    expect(button.classList).not.toContain("focus-visible:ring-2");
    expect(button.getAttribute("aria-pressed")).toBe("true");
    expect(button.querySelector(".lucide-check")).not.toBeNull();
  });

  it("uses compositor motion without starting a raster animation loop", () => {
    const requestFrame = vi.spyOn(window, "requestAnimationFrame").mockImplementation(() => 1);
    vi.spyOn(window, "cancelAnimationFrame").mockImplementation(() => {});
    const props = $state({
      preview,
      label: "Aurora haze",
      selected: false,
      movement: 0.6,
      onclick: vi.fn(),
    });

    instance = mount(VibeChoiceCard, { target: host, props });
    flushSync();
    expect(requestFrame).not.toHaveBeenCalled();

    props.selected = true;
    flushSync();
    const wrapper = host.querySelector<HTMLElement>(".vibe-choice")!;
    expect(requestFrame).not.toHaveBeenCalled();
    expect(wrapper.classList).toContain("live-motion");
    expect(wrapper.style.getPropertyValue("--vibe-card-motion-duration")).toBe("6s");
  });

  it("uses mouse hover instead of selection for hover-driven live previews", () => {
    const requestFrame = vi.spyOn(window, "requestAnimationFrame").mockImplementation(() => 1);
    vi.spyOn(window, "cancelAnimationFrame").mockImplementation(() => {});

    instance = mount(VibeChoiceCard, {
      target: host,
      props: {
        preview,
        label: "Aurora haze",
        animateOnHover: true,
        selected: true,
        onclick: vi.fn(),
      },
    });
    flushSync();
    expect(requestFrame).not.toHaveBeenCalled();
    const wrapper = host.querySelector<HTMLElement>(".vibe-choice")!;
    expect(wrapper.classList).toContain("selected");
    expect(wrapper.classList).not.toContain("live-preview");

    const pointerEnter = new Event("pointerenter");
    Object.defineProperty(pointerEnter, "pointerType", { value: "mouse" });
    host.querySelector("button")!.dispatchEvent(pointerEnter);
    flushSync();
    expect(requestFrame).not.toHaveBeenCalled();
    expect(wrapper.classList).toContain("live-preview");
    expect(wrapper.classList).toContain("live-motion");
  });
});
