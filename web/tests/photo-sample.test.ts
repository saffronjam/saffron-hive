import { afterEach, describe, expect, it, vi } from "vitest";
import {
  MAX_PHOTO_FILE_BYTES,
  PHOTO_SAMPLE_SIZE,
  centeredSquareCrop,
  normalizePhoto,
  rgbaToRgbBase64,
} from "$lib/photo-sample";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("photo sample normalization", () => {
  it("center-crops landscape and portrait images", () => {
    expect(centeredSquareCrop(1200, 800)).toEqual({ sx: 200, sy: 0, size: 800 });
    expect(centeredSquareCrop(600, 1000)).toEqual({ sx: 0, sy: 200, size: 600 });
    expect(() => centeredSquareCrop(0, 100)).toThrow("no visible pixels");
  });

  it("composites transparent pixels over white and strips alpha", () => {
    const encoded = rgbaToRgbBase64(
      new Uint8ClampedArray([10, 20, 30, 255, 20, 40, 60, 0, 0, 100, 200, 128]),
    );
    expect(Array.from(Uint8Array.from(atob(encoded), (value) => value.charCodeAt(0)))).toEqual([
      10, 20, 30, 255, 255, 255, 127, 177, 227,
    ]);
    expect(() => rgbaToRgbBase64(new Uint8ClampedArray([1, 2, 3]))).toThrow("invalid");
  });

  it("rejects non-images, empty files, oversized files, and decode failures", async () => {
    await expect(
      normalizePhoto(new File(["text"], "note.txt", { type: "text/plain" })),
    ).rejects.toThrow("Choose an image");
    await expect(normalizePhoto(new File([], "empty.png", { type: "image/png" }))).rejects.toThrow(
      "empty",
    );
    await expect(
      normalizePhoto(
        new File([new Uint8Array(MAX_PHOTO_FILE_BYTES + 1)], "large.png", { type: "image/png" }),
      ),
    ).rejects.toThrow("smaller than 25 MB");
    vi.stubGlobal("createImageBitmap", vi.fn().mockRejectedValue(new Error("decode")));
    await expect(
      normalizePhoto(new File(["bad"], "bad.png", { type: "image/png" })),
    ).rejects.toThrow("could not decode");
  });

  it("honours decoded orientation, center-crops, downsamples, and closes the bitmap", async () => {
    const close = vi.fn();
    const bitmap = { width: 1200, height: 800, close } as unknown as ImageBitmap;
    const createBitmap = vi.fn().mockResolvedValue(bitmap);
    vi.stubGlobal("createImageBitmap", createBitmap);
    const drawImage = vi.fn();
    const clearRect = vi.fn();
    const context = {
      clearRect,
      drawImage,
      getImageData: () => ({
        data: new Uint8ClampedArray(PHOTO_SAMPLE_SIZE * PHOTO_SAMPLE_SIZE * 4),
      }),
    };
    const canvas = {
      width: 0,
      height: 0,
      getContext: vi.fn(() => context),
    } as unknown as HTMLCanvasElement;
    const nativeCreateElement = document.createElement.bind(document);
    vi.spyOn(document, "createElement").mockImplementation(((tag: string) =>
      tag === "canvas" ? canvas : nativeCreateElement(tag)) as typeof document.createElement);

    const file = new File(["pixels"], "oriented.jpg", { type: "image/jpeg" });
    const result = await normalizePhoto(file);

    expect(createBitmap).toHaveBeenCalledWith(file, { imageOrientation: "from-image" });
    expect(drawImage).toHaveBeenCalledWith(
      bitmap,
      200,
      0,
      800,
      800,
      0,
      0,
      PHOTO_SAMPLE_SIZE,
      PHOTO_SAMPLE_SIZE,
    );
    expect(result).toMatchObject({ width: PHOTO_SAMPLE_SIZE, height: PHOTO_SAMPLE_SIZE });
    expect(close).toHaveBeenCalledOnce();
  });
});
