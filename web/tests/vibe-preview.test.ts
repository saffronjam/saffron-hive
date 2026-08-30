import { describe, expect, it } from "vitest";
import {
  choicePreviewMotionSeconds,
  cycleSecondsToPacePosition,
  formatVibeCycle,
  pacePositionToCycleSeconds,
  paintVibeFrame,
  paintVibeRaster,
  previewDescription,
  previewMotionSeconds,
} from "$lib/vibe-preview";
import type { ScenePreview } from "$lib/scene-editable";

function context() {
  let output: ImageData | null = null;
  return {
    value: {
      createImageData: (width: number, height: number) =>
        ({ width, height, data: new Uint8ClampedArray(width * height * 4) }) as ImageData,
      putImageData: (image: ImageData) => {
        output = image;
      },
    } as unknown as CanvasRenderingContext2D,
    output: () => output,
  };
}

const preview: ScenePreview = {
  width: 2,
  height: 2,
  pixels: [
    { r: 255, g: 0, b: 0 },
    { r: 0, g: 255, b: 0 },
    { r: 0, g: 0, b: 255 },
    { r: 255, g: 255, b: 255 },
  ],
  swatches: [
    { x: 0.25, y: 0.25, color: { r: 255, g: 0, b: 0 } },
    { x: 0.75, y: 0.75, color: { r: 255, g: 255, b: 255 } },
  ],
};

describe("Vibe preview rendering", () => {
  it("describes representative colours accessibly", () => {
    expect(previewDescription(preview)).toBe("Lighting vibe with 2 representative colours");
    expect(previewDescription({ ...preview, swatches: [] })).toBe("Lighting vibe preview");
  });

  it("paints only the native raster without display-sized resampling", () => {
    const target = context();
    expect(paintVibeRaster(target.value, preview)).toBe(true);
    expect(target.output()?.width).toBe(2);
    expect(target.output()?.height).toBe(2);
    expect(Array.from(target.output()!.data)).toEqual([
      255, 0, 0, 255, 0, 255, 0, 255, 0, 0, 255, 255, 255, 255, 255, 255,
    ]);
  });

  it("ignores malformed fields and keeps editor motion on the physical clock", () => {
    const invalid = context();
    expect(paintVibeRaster(invalid.value, { ...preview, pixels: [] })).toBe(false);
    expect(invalid.output()).toBeNull();

    expect(previewMotionSeconds(5)).toBe(5);
    expect(previewMotionSeconds(60)).toBe(60);
    expect(previewMotionSeconds(18 * 60)).toBe(18 * 60);
    expect(choicePreviewMotionSeconds(60)).toBe(4);
    expect(choicePreviewMotionSeconds(18 * 60)).toBe(18);
  });

  it("maps the Pace slider across short and long cycles", () => {
    expect(pacePositionToCycleSeconds(0)).toBe(5);
    expect(pacePositionToCycleSeconds(100)).toBe(30 * 60);
    expect(pacePositionToCycleSeconds(cycleSecondsToPacePosition(60))).toBe(60);
    expect(formatVibeCycle(15)).toBe("15 sec cycle");
    expect(formatVibeCycle(90)).toBe("1.5 min cycle");
  });

  it("morphs deterministically by phase and seed at native resolution", () => {
    const first = context();
    const repeated = context();
    const later = context();
    const shuffled = context();

    expect(paintVibeFrame(first.value, preview, 1, 0.1, "42")).not.toBeNull();
    expect(paintVibeFrame(repeated.value, preview, 1, 0.1, "42")).not.toBeNull();
    expect(paintVibeFrame(later.value, preview, 1, 0.42, "42")).not.toBeNull();
    expect(paintVibeFrame(shuffled.value, preview, 1, 0.1, "43")).not.toBeNull();

    expect(Array.from(repeated.output()!.data)).toEqual(Array.from(first.output()!.data));
    expect(Array.from(later.output()!.data)).not.toEqual(Array.from(first.output()!.data));
    expect(Array.from(shuffled.output()!.data)).not.toEqual(Array.from(first.output()!.data));
    expect(first.output()?.width).toBe(preview.width);
    expect(first.output()?.height).toBe(preview.height);
  });

  it("holds motion still when the output cadence cannot represent a cycle", () => {
    const first = context();
    const later = context();

    expect(paintVibeFrame(first.value, preview, 1, 0.1, "42", null, 1, 0)).not.toBeNull();
    expect(paintVibeFrame(later.value, preview, 1, 0.7, "42", null, 1, 0)).not.toBeNull();

    expect(Array.from(first.output()!.data)).toEqual(Array.from(later.output()!.data));
  });

  it("supports a bounded high-resolution backing raster", () => {
    const target = context();
    expect(paintVibeFrame(target.value, preview, 1, 0.2, "42", null, 4)).not.toBeNull();
    expect(target.output()?.width).toBe(8);
    expect(target.output()?.height).toBe(8);
  });
});
