import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { flushSync, mount, unmount } from "svelte";
import VibePreview from "$lib/components/vibe-preview.svelte";

let instance: ReturnType<typeof mount> | null = null;
let host: HTMLDivElement;

const preview = {
  width: 2,
  height: 2,
  pixels: [
    { r: 10, g: 20, b: 30 },
    { r: 40, g: 50, b: 60 },
    { r: 70, g: 80, b: 90 },
    { r: 100, g: 110, b: 120 },
  ],
  swatches: [],
};

beforeEach(() => {
  host = document.createElement("div");
  document.body.appendChild(host);
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })),
  );
});

afterEach(async () => {
  if (instance) await unmount(instance);
  instance = null;
  host.remove();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("VibePreview", () => {
  it("animates the native raster and updates brightness without repainting it", () => {
    const putImageData = vi.fn();
    const createImageData = vi.fn((width: number, height: number) => ({
      width,
      height,
      data: new Uint8ClampedArray(width * height * 4),
    }));
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
      createImageData,
      putImageData,
    } as unknown as CanvasRenderingContext2D);
    let nextFrameId = 0;
    const callbacks = new Map<number, FrameRequestCallback>();
    const animationFrame = vi
      .spyOn(window, "requestAnimationFrame")
      .mockImplementation((callback) => {
        const id = ++nextFrameId;
        callbacks.set(id, callback);
        return id;
      });
    const cancelFrame = vi.spyOn(window, "cancelAnimationFrame").mockImplementation(() => {});
    const runFrame = () => {
      const entry = callbacks.entries().next().value as [number, FrameRequestCallback] | undefined;
      if (!entry) throw new Error("no animation frame queued");
      callbacks.delete(entry[0]);
      entry[1](performance.now());
    };
    const props = $state({
      preview,
      brightness: 0.6,
      movement: 0.4,
      cycleSeconds: 1080,
      seed: "42",
    });

    instance = mount(VibePreview, { target: host, props });
    flushSync();

    const element = host.querySelector<HTMLElement>(".vibe-preview")!;
    const canvas = host.querySelector("canvas")!;
    expect(createImageData).toHaveBeenCalledWith(8, 8);
    expect(putImageData).toHaveBeenCalledOnce();
    expect(animationFrame).toHaveBeenCalledTimes(2);
    expect(element.style.getPropertyValue("--vibe-brightness")).toBe("0.6");
    expect(canvas.className).toContain("opacity-0");

    runFrame();
    flushSync();
    expect(putImageData).toHaveBeenCalledOnce();
    expect(canvas.className).toContain("opacity-100");

    props.brightness = 0.25;
    flushSync();
    expect(element.style.getPropertyValue("--vibe-brightness")).toBe("0.25");
    expect(putImageData).toHaveBeenCalledOnce();

    props.movement = 0.8;
    flushSync();
    expect(cancelFrame).toHaveBeenCalled();
    expect(putImageData).toHaveBeenCalledTimes(2);
  });

  it("crossfades between shuffled seeds", async () => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
      createImageData: (width: number, height: number) => ({
        width,
        height,
        data: new Uint8ClampedArray(width * height * 4),
      }),
      putImageData: vi.fn(),
    } as unknown as CanvasRenderingContext2D);
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => {
      callback(performance.now());
      return 17;
    });
    const props = $state({ preview, movement: 0, seed: "42" });

    instance = mount(VibePreview, { target: host, props });
    flushSync();
    expect(host.querySelectorAll("canvas")).toHaveLength(1);

    props.seed = "84";
    flushSync();
    await vi.waitFor(() => expect(host.querySelectorAll("canvas")).toHaveLength(2));
    await vi.waitFor(() =>
      expect(host.querySelectorAll("canvas")[1].className).toContain("opacity-100"),
    );
  });
});
