export const PHOTO_SAMPLE_SIZE = 128;
export const MAX_PHOTO_FILE_BYTES = 25 * 1024 * 1024;

export interface NormalizedPhotoSample {
  width: number;
  height: number;
  rgbBase64: string;
}

export interface CropRect {
  sx: number;
  sy: number;
  size: number;
}

export function centeredSquareCrop(width: number, height: number): CropRect {
  if (width < 1 || height < 1) throw new Error("The image has no visible pixels.");
  const size = Math.min(width, height);
  return {
    sx: (width - size) / 2,
    sy: (height - size) / 2,
    size,
  };
}

export function rgbaToRgbBase64(data: Uint8ClampedArray): string {
  if (data.length % 4 !== 0) throw new Error("The decoded image data is invalid.");
  const rgb = new Uint8Array((data.length / 4) * 3);
  for (let source = 0, target = 0; source < data.length; source += 4, target += 3) {
    const alpha = data[source + 3] / 255;
    rgb[target] = Math.round(data[source] * alpha + 255 * (1 - alpha));
    rgb[target + 1] = Math.round(data[source + 1] * alpha + 255 * (1 - alpha));
    rgb[target + 2] = Math.round(data[source + 2] * alpha + 255 * (1 - alpha));
  }
  let binary = "";
  const chunk = 0x8000;
  for (let offset = 0; offset < rgb.length; offset += chunk) {
    binary += String.fromCharCode(...rgb.subarray(offset, Math.min(rgb.length, offset + chunk)));
  }
  return btoa(binary);
}

export async function normalizePhoto(file: File): Promise<NormalizedPhotoSample> {
  if (!file.type.startsWith("image/")) throw new Error("Choose an image file.");
  if (file.size === 0) throw new Error("The image file is empty.");
  if (file.size > MAX_PHOTO_FILE_BYTES) throw new Error("The image must be smaller than 25 MB.");

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    throw new Error("Hive could not decode this image.");
  }

  try {
    const crop = centeredSquareCrop(bitmap.width, bitmap.height);
    const canvas = document.createElement("canvas");
    canvas.width = PHOTO_SAMPLE_SIZE;
    canvas.height = PHOTO_SAMPLE_SIZE;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) throw new Error("Image processing is unavailable in this browser.");
    context.clearRect(0, 0, PHOTO_SAMPLE_SIZE, PHOTO_SAMPLE_SIZE);
    context.drawImage(
      bitmap,
      crop.sx,
      crop.sy,
      crop.size,
      crop.size,
      0,
      0,
      PHOTO_SAMPLE_SIZE,
      PHOTO_SAMPLE_SIZE,
    );
    const image = context.getImageData(0, 0, PHOTO_SAMPLE_SIZE, PHOTO_SAMPLE_SIZE);
    return {
      width: PHOTO_SAMPLE_SIZE,
      height: PHOTO_SAMPLE_SIZE,
      rgbBase64: rgbaToRgbBase64(image.data),
    };
  } finally {
    bitmap.close();
  }
}
