import type { ScenePreview } from "$lib/scene-editable";

const MAXIMUM_WARP = 0.6;
const MOTION_SPATIAL_SCALE = 0.22;
const UINT64_MASK = (1n << 64n) - 1n;
const MINIMUM_CYCLE_SECONDS = 5;
const MAXIMUM_CYCLE_SECONDS = 30 * 60;

interface NoiseOctave {
  frequency: number;
  xFrequency: number;
  yFrequency: number;
  timeFrequency: number;
  offset: number;
  weight: number;
}

const motionCache = new Map<string, [NoiseOctave[], NoiseOctave[]]>();

export function previewDescription(preview: ScenePreview): string {
  if (preview.swatches.length === 0) return "Lighting vibe preview";
  return `Lighting vibe with ${preview.swatches.length} representative ${preview.swatches.length === 1 ? "colour" : "colours"}`;
}

export function paintVibeRaster(context: CanvasRenderingContext2D, preview: ScenePreview): boolean {
  return paintVibeFrame(context, preview, 0, 0, "0") !== null;
}

export function paintVibeFrame(
  context: CanvasRenderingContext2D,
  preview: ScenePreview,
  movement: number,
  phase: number,
  seed: string,
  target?: ImageData | null,
  scale = 1,
  maximumTemporalFrequency = 3,
): ImageData | null {
  if (
    preview.width < 1 ||
    preview.height < 1 ||
    preview.pixels.length !== preview.width * preview.height
  )
    return null;

  const boundedMovement = clamp(movement, 0, 1);
  const boundedPhase = ((phase % 1) + 1) % 1;
  const boundedScale = Math.max(1, Math.round(scale));
  const outputWidth = preview.width * boundedScale;
  const outputHeight = preview.height * boundedScale;
  const image =
    target?.width === outputWidth && target.height === outputHeight
      ? target
      : context.createImageData(outputWidth, outputHeight);
  const motion = motionParameters(seed);

  for (let y = 0; y < outputHeight; y++) {
    for (let x = 0; x < outputWidth; x++) {
      const nx = outputWidth === 1 ? 0.5 : x / (outputWidth - 1);
      const ny = outputHeight === 1 ? 0.5 : y / (outputHeight - 1);
      const pixel = samplePixel(preview, nx, ny);
      const offset = (y * outputWidth + x) * 4;
      if (boundedMovement === 0) {
        writePixel(image.data, offset, pixel.r, pixel.g, pixel.b);
        continue;
      }

      const distance = MAXIMUM_WARP * boundedMovement * (0.35 + 0.65 * boundedMovement);
      const warpedX = clamp(
        nx +
          distance *
            periodicNoise(
              motion[0],
              nx * MOTION_SPATIAL_SCALE,
              ny * MOTION_SPATIAL_SCALE,
              boundedPhase,
              maximumTemporalFrequency,
            ),
        0,
        1,
      );
      const warpedY = clamp(
        ny +
          distance *
            periodicNoise(
              motion[1],
              nx * MOTION_SPATIAL_SCALE,
              ny * MOTION_SPATIAL_SCALE,
              boundedPhase,
              maximumTemporalFrequency,
            ),
        0,
        1,
      );
      const warped = samplePixel(preview, warpedX, warpedY);
      writePixel(
        image.data,
        offset,
        mix(pixel.r, warped.r, boundedMovement),
        mix(pixel.g, warped.g, boundedMovement),
        mix(pixel.b, warped.b, boundedMovement),
      );
    }
  }
  context.putImageData(image, 0, 0);
  return image;
}

export function previewMotionSeconds(cycleSeconds: number): number {
  return Math.max(1, cycleSeconds);
}

export function choicePreviewMotionSeconds(cycleSeconds: number): number {
  return Math.min(30, Math.max(4, cycleSeconds / 60));
}

export function cycleSecondsToPacePosition(cycleSeconds: number): number {
  const bounded = clamp(cycleSeconds, MINIMUM_CYCLE_SECONDS, MAXIMUM_CYCLE_SECONDS);
  return (
    (Math.log(bounded / MINIMUM_CYCLE_SECONDS) /
      Math.log(MAXIMUM_CYCLE_SECONDS / MINIMUM_CYCLE_SECONDS)) *
    100
  );
}

export function pacePositionToCycleSeconds(position: number): number {
  const bounded = clamp(position, 0, 100);
  const raw =
    MINIMUM_CYCLE_SECONDS * (MAXIMUM_CYCLE_SECONDS / MINIMUM_CYCLE_SECONDS) ** (bounded / 100);
  const step = raw < 60 ? 5 : 30;
  return clamp(Math.round(raw / step) * step, MINIMUM_CYCLE_SECONDS, MAXIMUM_CYCLE_SECONDS);
}

export function formatVibeCycle(cycleSeconds: number): string {
  if (cycleSeconds < 60) return `${Math.round(cycleSeconds)} sec cycle`;
  const minutes = cycleSeconds / 60;
  return `${Number.isInteger(minutes) ? minutes : minutes.toFixed(1)} min cycle`;
}

function samplePixel(preview: ScenePreview, x: number, y: number) {
  const pixelX = x * Math.max(0, preview.width - 1);
  const pixelY = y * Math.max(0, preview.height - 1);
  const left = Math.floor(pixelX);
  const top = Math.floor(pixelY);
  const right = Math.min(preview.width - 1, left + 1);
  const bottom = Math.min(preview.height - 1, top + 1);
  const tx = pixelX - left;
  const ty = pixelY - top;
  const topLeft = preview.pixels[top * preview.width + left];
  const topRight = preview.pixels[top * preview.width + right];
  const bottomLeft = preview.pixels[bottom * preview.width + left];
  const bottomRight = preview.pixels[bottom * preview.width + right];
  return {
    r: mix(mix(topLeft.r, topRight.r, tx), mix(bottomLeft.r, bottomRight.r, tx), ty),
    g: mix(mix(topLeft.g, topRight.g, tx), mix(bottomLeft.g, bottomRight.g, tx), ty),
    b: mix(mix(topLeft.b, topRight.b, tx), mix(bottomLeft.b, bottomRight.b, tx), ty),
  };
}

function writePixel(
  data: Uint8ClampedArray,
  offset: number,
  red: number,
  green: number,
  blue: number,
) {
  data[offset] = Math.round(red);
  data[offset + 1] = Math.round(green);
  data[offset + 2] = Math.round(blue);
  data[offset + 3] = 255;
}

function mix(left: number, right: number, amount: number): number {
  return left + (right - left) * amount;
}

function periodicNoise(
  octaves: NoiseOctave[],
  x: number,
  y: number,
  phase: number,
  maximumTemporalFrequency: number,
): number {
  let value = 0;
  let totalWeight = 0;
  if (maximumTemporalFrequency < 1) return 0;
  for (const octave of octaves) {
    const timeFrequency = Math.min(octave.timeFrequency, maximumTemporalFrequency);
    value +=
      Math.sin(
        2 *
          Math.PI *
          (octave.frequency * (octave.xFrequency * x + octave.yFrequency * y) +
            timeFrequency * phase) +
          octave.offset,
      ) * octave.weight;
    totalWeight += octave.weight;
  }
  return value / totalWeight;
}

function motionParameters(seed: string): [NoiseOctave[], NoiseOctave[]] {
  const cached = motionCache.get(seed);
  if (cached) return cached;
  let parsed = 0n;
  try {
    parsed = BigInt(seed);
  } catch {
    for (const character of seed)
      parsed = (parsed * 31n + BigInt(character.charCodeAt(0))) & UINT64_MASK;
  }
  const result: [NoiseOctave[], NoiseOctave[]] = [
    noiseChannel(parsed, 1n),
    noiseChannel(parsed, 2n),
  ];
  motionCache.set(seed, result);
  return result;
}

function noiseChannel(seed: bigint, channel: bigint): NoiseOctave[] {
  const octaves: NoiseOctave[] = [];
  let weight = 1;
  for (let octave = 0n; octave < 4n; octave++) {
    const hash = splitmix64(
      BigInt.asUintN(64, seed ^ (channel * 0x9e3779b97f4a7c15n) ^ (octave * 0xbf58476d1ce4e5b9n)),
    );
    octaves.push({
      frequency: 2 ** Number(octave),
      xFrequency: 1 + Number(hash % 3n),
      yFrequency: 1 + Number((hash >> 8n) % 3n),
      timeFrequency: 1 + Number((hash >> 16n) % 3n),
      offset: hashUnit(hash >> 24n) * 2 * Math.PI,
      weight,
    });
    weight *= 0.5;
  }
  return octaves;
}

function splitmix64(value: bigint): bigint {
  value = (value + 0x9e3779b97f4a7c15n) & UINT64_MASK;
  value = ((value ^ (value >> 30n)) * 0xbf58476d1ce4e5b9n) & UINT64_MASK;
  value = ((value ^ (value >> 27n)) * 0x94d049bb133111ebn) & UINT64_MASK;
  return (value ^ (value >> 31n)) & UINT64_MASK;
}

function hashUnit(value: bigint): number {
  return Number(splitmix64(value) >> 11n) / 2 ** 53;
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}
