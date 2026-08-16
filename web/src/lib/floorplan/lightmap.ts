import type { RGB } from "$lib/device-tint";
import { arcLengthAtT, flattenWall, pointInPolygon, vertexMap, wallMetrics } from "./geometry";
import type { WallMetrics } from "./geometry";
import { solidSpans } from "./openings";
import type { Face, PlanGraph, PlanVertex, Point } from "./types";
import type { FloorplanFurnitureData } from "$lib/floorplan-editable";
import { furnitureContainsPoint, furnitureCorners } from "./furniture";

/** Grid cell size in meters. Six cells across a 0.9 m door is enough to shape a beam. */
export const CELL_M = 0.15;

/** Meters of guaranteed outdoors around the plan, so every sun ray can leave. */
const GRID_MARGIN_M = 0.45;

/** Cap on grid dimensions; a plan larger than this coarsens its cells instead. */
const MAX_GRID_DIM = 512;

/** e-folding distance of bounced light, in meters. */
const BOUNCE_FALLOFF_M = 1.8;

/** Cells dimmer than this cannot seed a visible bounce. */
const SEED_MIN = 0.003;

/** Bounce light too faint to render is never pushed further. */
const BOUNCE_FLOOR = 0.002;

/** Soft tonemap gain: overlapping sources roll off instead of clipping. */
const TONEMAP_GAIN = 1.6;

/** How far a lamp's direct light reaches, in meters. */
const LAMP_REACH_M = 2.6;

/** Scales lamp light overall: a lamp is a pool in a room, not a floodlight. */
const LAMP_GAIN = 0.42;

/** Lamps bounce a little less than daylight, or one bulb washes a whole room. */
const LAMP_ALBEDO = 0.3;

/**
 * Cells of light bled outward past the room edge at render time. The face-union
 * clip cuts the drawn light exactly at the wall centerline, so the bleed only
 * ever shows *under* the wall body — without it, bilinear upscaling fades the
 * last half-cell inside every room down toward black.
 */
const RENDER_BLEED_CELLS = 2;

export const CELL_SOLID = 0;
export const CELL_OUTDOOR = 1;
export const CELL_INDOOR = 2;
export const CELL_KIND_MASK = 0x03;
/** Diagnostic flag: the cell lies under an exterior window's span. */
export const CELL_PORTAL = 0x04;
/** The cell is solid because a piece of furniture blocks light there. */
export const CELL_OCCLUDER = 0x08;

/** An exterior window as a sky source: span endpoints and shadow-ray targets. */
/**
 * The sun-independent raster of a plan, rebuilt only when the graph changes.
 *
 * Cells are row-major, index `cy * width + cx`, kind in the low bits plus
 * flags. An enclosed courtyard is a face, so it rasters INDOOR and is lit and
 * dimmed like a room; sun rays stop at it rather than passing over.
 */
export interface LightmapGrid {
  width: number;
  height: number;
  /** World meters of cell (0,0)'s minimum corner. */
  originX: number;
  originY: number;
  /** {@link CELL_M}, or coarser when the plan's extent hits {@link MAX_GRID_DIM}. */
  cellM: number;
  cells: Uint8Array;
  /** Owning face per cell, -1 where none; aligned with the faces given at build. */
  faceIndex: Int16Array;
}

/** The cell a world point falls in, or null outside the grid. */
export function worldToCell(grid: LightmapGrid, p: Point): { cx: number; cy: number } | null {
  const cx = Math.floor((p.x - grid.originX) / grid.cellM);
  const cy = Math.floor((p.y - grid.originY) / grid.cellM);
  if (cx < 0 || cy < 0 || cx >= grid.width || cy >= grid.height) return null;
  return { cx, cy };
}

function kindAt(grid: LightmapGrid, cx: number, cy: number): number {
  return grid.cells[cy * grid.width + cx] & CELL_KIND_MASK;
}

/** The point `s` meters along a wall's flattened polyline. */
function pointAtArc(m: WallMetrics, s: number): Point {
  const clamped = Math.min(Math.max(s, 0), m.total);
  for (let i = 1; i < m.points.length; i++) {
    if (m.cumulative[i] >= clamped) {
      const span = m.cumulative[i] - m.cumulative[i - 1];
      const t = span > 0 ? (clamped - m.cumulative[i - 1]) / span : 0;
      const a = m.points[i - 1];
      const b = m.points[i];
      return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
    }
  }
  return m.points[m.points.length - 1];
}

/**
 * Rasterise a plan for lighting. Null when there is nothing to light — no
 * walls or no rooms.
 */
export function rasterisePlan(
  graph: PlanGraph,
  faces: Face[],
  furniture: FloorplanFurnitureData[] = [],
): LightmapGrid | null {
  if (graph.walls.length === 0 || faces.length === 0) return null;
  const verts = vertexMap(graph.vertices);

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const wall of graph.walls) {
    for (const p of flattenWall(wall, verts)) {
      if (p.x < minX) minX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.x > maxX) maxX = p.x;
      if (p.y > maxY) maxY = p.y;
    }
  }
  if (!Number.isFinite(minX)) return null;

  const spanX = maxX - minX + GRID_MARGIN_M * 2;
  const spanY = maxY - minY + GRID_MARGIN_M * 2;
  const cellM = Math.max(CELL_M, spanX / MAX_GRID_DIM, spanY / MAX_GRID_DIM);
  const width = Math.max(1, Math.ceil(spanX / cellM));
  const height = Math.max(1, Math.ceil(spanY / cellM));
  const originX = minX - GRID_MARGIN_M;
  const originY = minY - GRID_MARGIN_M;

  const cells = new Uint8Array(width * height).fill(CELL_OUTDOOR);
  const faceIndex = new Int16Array(width * height).fill(-1);
  const grid: LightmapGrid = {
    width,
    height,
    originX,
    originY,
    cellM,
    cells,
    faceIndex,
  };

  stampWalls(grid, graph, verts);
  // Between the two: stampFaces skips cells that are already solid, so an
  // occluder stamped here survives as a hole in the room it stands in. Stamped
  // after, the face would paint straight over it.
  stampFurniture(grid, furniture);
  stampFaces(grid, faces);
  return grid;
}

/**
 * Stamp every occluding piece into the grid. The footprint is the piece's box
 * or ellipse rather than its drawn detail: predictable beats faithful for
 * something that decides where shadows fall.
 */
function stampFurniture(grid: LightmapGrid, furniture: FloorplanFurnitureData[]): void {
  const { cellM, originX, originY, cells } = grid;
  for (const piece of furniture) {
    if (!piece.occluder) continue;
    const corners = furnitureCorners(piece);
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const c of corners) {
      if (c.x < minX) minX = c.x;
      if (c.y < minY) minY = c.y;
      if (c.x > maxX) maxX = c.x;
      if (c.y > maxY) maxY = c.y;
    }
    const cx0 = Math.max(0, Math.floor((minX - originX) / cellM));
    const cx1 = Math.min(grid.width - 1, Math.floor((maxX - originX) / cellM));
    const cy0 = Math.max(0, Math.floor((minY - originY) / cellM));
    const cy1 = Math.min(grid.height - 1, Math.floor((maxY - originY) / cellM));
    let stamped = false;
    for (let cy = cy0; cy <= cy1; cy++) {
      for (let cx = cx0; cx <= cx1; cx++) {
        const center = { x: originX + (cx + 0.5) * cellM, y: originY + (cy + 0.5) * cellM };
        if (!furnitureContainsPoint(piece, center)) continue;
        cells[cy * grid.width + cx] = CELL_SOLID | CELL_OCCLUDER;
        stamped = true;
      }
    }
    // A piece narrower than a cell still blocks light, the same guarantee a
    // thin wall gets.
    if (!stamped) {
      const cell = worldToCell(grid, { x: piece.x, y: piece.y });
      if (cell) cells[cell.cy * grid.width + cell.cx] = CELL_SOLID | CELL_OCCLUDER;
    }
  }
}

/** Stamp a disc of SOLID cells around a world point. */
function stampSolid(grid: LightmapGrid, p: Point, radius: number): void {
  const { cellM, originX, originY, width, height, cells } = grid;
  const cx0 = Math.max(0, Math.floor((p.x - radius - originX) / cellM));
  const cx1 = Math.min(width - 1, Math.floor((p.x + radius - originX) / cellM));
  const cy0 = Math.max(0, Math.floor((p.y - radius - originY) / cellM));
  const cy1 = Math.min(height - 1, Math.floor((p.y + radius - originY) / cellM));
  const r2 = radius * radius;
  for (let cy = cy0; cy <= cy1; cy++) {
    const centerY = originY + (cy + 0.5) * cellM;
    for (let cx = cx0; cx <= cx1; cx++) {
      const centerX = originX + (cx + 0.5) * cellM;
      const dx = centerX - p.x;
      const dy = centerY - p.y;
      if (dx * dx + dy * dy <= r2) cells[cy * grid.width + cx] = CELL_SOLID;
    }
  }
}

/**
 * Stamp every wall's solid spans. Openings are simply never stamped, which is
 * what lets light cross them. The brush is at least ~three-quarters of a cell,
 * enough that the nearest cell centre to any point on the line is always
 * inside it — a thinner brush would leave diagonal pinholes. Span ends that
 * abut an opening retract by half the brush so the gap keeps most of its
 * width; openings much narrower than a cell may still seal at this resolution.
 */
function stampWalls(grid: LightmapGrid, graph: PlanGraph, verts: Map<string, PlanVertex>): void {
  const step = grid.cellM / 2;
  for (const wall of graph.walls) {
    const metrics = wallMetrics(wall, verts);
    if (metrics.total <= 0) continue;
    const brush = Math.max(grid.cellM * 0.75, wall.thickness / 2);
    const retract = brush / 2;
    for (const [t0, t1] of solidSpans(wall, verts)) {
      let s0 = arcLengthAtT(metrics, t0);
      let s1 = arcLengthAtT(metrics, t1);
      if (t0 > 1e-9) s0 += retract;
      if (t1 < 1 - 1e-9) s1 -= retract;
      if (s1 <= s0) continue;
      for (let s = s0; ; s += step) {
        const done = s >= s1;
        stampSolid(grid, pointAtArc(metrics, done ? s1 : s), brush);
        if (done) break;
      }
    }
  }
}

/**
 * Mark cells inside each face INDOOR with the face's index. Faces stamp in
 * descending area order so a nested smaller room overwrites its container —
 * the same rule `faceContainingPoint` resolves nesting by.
 */
function stampFaces(grid: LightmapGrid, faces: Face[]): void {
  const order = faces.map((_, i) => i).sort((a, b) => faces[b].area - faces[a].area);
  const { cellM, originX, originY, cells, faceIndex } = grid;
  for (const i of order) {
    const polygon = faces[i].polygon;
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const p of polygon) {
      if (p.x < minX) minX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.x > maxX) maxX = p.x;
      if (p.y > maxY) maxY = p.y;
    }
    const cx0 = Math.max(0, Math.floor((minX - originX) / cellM));
    const cx1 = Math.min(grid.width - 1, Math.floor((maxX - originX) / cellM));
    const cy0 = Math.max(0, Math.floor((minY - originY) / cellM));
    const cy1 = Math.min(grid.height - 1, Math.floor((maxY - originY) / cellM));
    for (let cy = cy0; cy <= cy1; cy++) {
      for (let cx = cx0; cx <= cx1; cx++) {
        const idx = cy * grid.width + cx;
        if ((cells[idx] & CELL_KIND_MASK) === CELL_SOLID) continue;
        const center = { x: originX + (cx + 0.5) * cellM, y: originY + (cy + 0.5) * cellM };
        if (pointInPolygon(center, polygon)) {
          cells[idx] = CELL_INDOOR;
          faceIndex[idx] = i;
        }
      }
    }
  }
}

/** How close two boundary crossings must be to count as hitting a cell corner. */
const CORNER_EPS = 1e-9;

function solidAt(grid: LightmapGrid, cx: number, cy: number): boolean {
  if (cx < 0 || cy < 0 || cx >= grid.width || cy >= grid.height) return false;
  return kindAt(grid, cx, cy) === CELL_SOLID;
}

/**
 * Whether anything opaque lies on the open segment between two world points.
 * Everything that is not indoors blocks: walls outright, and outdoor cells so
 * that lamp light cannot jump an outdoor strip between separated rooms.
 */
function segmentBlocked(grid: LightmapGrid, from: Point, to: Point): boolean {
  const { cellM, originX, originY } = grid;
  const gx0 = (from.x - originX) / cellM;
  const gy0 = (from.y - originY) / cellM;
  const gx1 = (to.x - originX) / cellM;
  const gy1 = (to.y - originY) / cellM;
  const dx = gx1 - gx0;
  const dy = gy1 - gy0;
  const stepX = dx > 0 ? 1 : dx < 0 ? -1 : 0;
  const stepY = dy > 0 ? 1 : dy < 0 ? -1 : 0;
  const tDeltaX = dx !== 0 ? Math.abs(1 / dx) : Infinity;
  const tDeltaY = dy !== 0 ? Math.abs(1 / dy) : Infinity;
  let x = Math.floor(gx0);
  let y = Math.floor(gy0);
  const endX = Math.floor(gx1);
  const endY = Math.floor(gy1);
  let tMaxX = stepX > 0 ? (x + 1 - gx0) / dx : stepX < 0 ? (x - gx0) / dx : Infinity;
  let tMaxY = stepY > 0 ? (y + 1 - gy0) / dy : stepY < 0 ? (y - gy0) / dy : Infinity;

  for (;;) {
    if (x === endX && y === endY) return false;
    if (Math.min(tMaxX, tMaxY) > 1) return false;
    if (Math.abs(tMaxX - tMaxY) < CORNER_EPS) {
      if (solidAt(grid, x + stepX, y) && solidAt(grid, x, y + stepY)) return true;
      x += stepX;
      y += stepY;
      tMaxX += tDeltaX;
      tMaxY += tDeltaY;
    } else if (tMaxX < tMaxY) {
      x += stepX;
      tMaxX += tDeltaX;
    } else {
      y += stepY;
      tMaxY += tDeltaY;
    }
    if (x < 0 || y < 0 || x >= grid.width || y >= grid.height) return false;
    if (kindAt(grid, x, y) !== CELL_INDOOR) return true;
  }
}

/**
 * One diffuse bounce: every lit cell re-emits `albedo` of its light,
 * which spreads through open indoor cells decaying with path distance — so it
 * rounds corners and passes doorways but never crosses a wall. Highest-value-
 * first Dijkstra: each cell settles at the strongest light any seed can send
 * it, which lets a bright far source outshine a dim near one.
 */
function bounce(grid: LightmapGrid, field: Float32Array, albedo: number): void {
  const { width, height, cells } = grid;
  const decayOrth = Math.exp(-grid.cellM / BOUNCE_FALLOFF_M);
  const decayDiag = Math.exp((-grid.cellM * Math.SQRT2) / BOUNCE_FALLOFF_M);
  // Float64: storing a settled value in float32 can round it *above* the exact
  // number the heap carries, and the stale-entry guard below would then discard
  // the cell's own pop — silently killing the wave a few cells from its seed.
  const best = new Float64Array(width * height);

  const heapVal: number[] = [];
  const heapIdx: number[] = [];
  const push = (value: number, idx: number) => {
    heapVal.push(value);
    heapIdx.push(idx);
    let i = heapVal.length - 1;
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (heapVal[parent] >= heapVal[i]) break;
      [heapVal[parent], heapVal[i]] = [heapVal[i], heapVal[parent]];
      [heapIdx[parent], heapIdx[i]] = [heapIdx[i], heapIdx[parent]];
      i = parent;
    }
  };
  const pop = (): number => {
    const idx = heapIdx[0];
    const lastVal = heapVal.pop()!;
    const lastIdx = heapIdx.pop()!;
    if (heapVal.length > 0) {
      heapVal[0] = lastVal;
      heapIdx[0] = lastIdx;
      let i = 0;
      for (;;) {
        const left = 2 * i + 1;
        const right = left + 1;
        let top = i;
        if (left < heapVal.length && heapVal[left] > heapVal[top]) top = left;
        if (right < heapVal.length && heapVal[right] > heapVal[top]) top = right;
        if (top === i) break;
        [heapVal[top], heapVal[i]] = [heapVal[i], heapVal[top]];
        [heapIdx[top], heapIdx[i]] = [heapIdx[i], heapIdx[top]];
        i = top;
      }
    }
    return idx;
  };

  for (let idx = 0; idx < field.length; idx++) {
    if (field[idx] > SEED_MIN && (cells[idx] & CELL_KIND_MASK) === CELL_INDOOR) {
      const seed = field[idx] * albedo;
      best[idx] = seed;
      push(seed, idx);
    }
  }

  while (heapVal.length > 0) {
    const value = heapVal[0];
    const idx = pop();
    if (value < best[idx]) continue;
    const cx = idx % width;
    const cy = (idx / width) | 0;
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        const nx = cx + dx;
        const ny = cy + dy;
        if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
        const nIdx = ny * width + nx;
        if ((cells[nIdx] & CELL_KIND_MASK) !== CELL_INDOOR) continue;
        const diagonal = dx !== 0 && dy !== 0;
        if (diagonal && solidAt(grid, cx + dx, cy) && solidAt(grid, cx, cy + dy)) continue;
        const next = value * (diagonal ? decayDiag : decayOrth);
        if (next > best[nIdx] && next > BOUNCE_FLOOR) {
          best[nIdx] = next;
          push(next, nIdx);
        }
      }
    }
  }

  smoothIndoor(grid, best);
  for (let idx = 0; idx < field.length; idx++) field[idx] += best[idx];
}

/**
 * Average each indoor cell with its indoor neighbours, in place.
 *
 * The bounce wave travels on eight fixed directions, so its contours are
 * octagons rather than circles, and the staircase edges surface as blotches
 * once a dim room quantises to a couple of byte levels. One 3x3 pass rounds
 * them off. Only indoor neighbours contribute, so nothing crosses a wall:
 * walls are at least a cell thick, which puts the far side out of reach.
 */
function smoothIndoor(grid: LightmapGrid, values: Float64Array): void {
  const { width, height, cells } = grid;
  const source = values.slice();
  for (let cy = 0; cy < height; cy++) {
    for (let cx = 0; cx < width; cx++) {
      const idx = cy * width + cx;
      if ((cells[idx] & CELL_KIND_MASK) !== CELL_INDOOR) continue;
      let sum = 0;
      let weight = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const nx = cx + dx;
          const ny = cy + dy;
          if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
          const nIdx = ny * width + nx;
          if ((cells[nIdx] & CELL_KIND_MASK) !== CELL_INDOOR) continue;
          const w = dx === 0 && dy === 0 ? 4 : dx === 0 || dy === 0 ? 2 : 1;
          sum += w * source[nIdx];
          weight += w;
        }
      }
      if (weight > 0) values[idx] = sum / weight;
    }
  }
}

/**
 * A unit-brightness lamp's light over the grid. Depends only on the lamp's
 * position and the raster — not on brightness or colour — so callers cache the
 * field per position and a lamp state change is a re-combine, not a re-trace.
 */
export function lampField(grid: LightmapGrid, at: Point): Float32Array {
  const field = new Float32Array(grid.width * grid.height);
  const cell = worldToCell(grid, at);
  if (!cell) return field;
  const { cellM, originX, originY } = grid;
  const cx0 = Math.max(0, Math.floor((at.x - LAMP_REACH_M - originX) / cellM));
  const cx1 = Math.min(grid.width - 1, Math.floor((at.x + LAMP_REACH_M - originX) / cellM));
  const cy0 = Math.max(0, Math.floor((at.y - LAMP_REACH_M - originY) / cellM));
  const cy1 = Math.min(grid.height - 1, Math.floor((at.y + LAMP_REACH_M - originY) / cellM));

  for (let cy = cy0; cy <= cy1; cy++) {
    for (let cx = cx0; cx <= cx1; cx++) {
      const idx = cy * grid.width + cx;
      if ((grid.cells[idx] & CELL_KIND_MASK) !== CELL_INDOOR) continue;
      const p = { x: originX + (cx + 0.5) * cellM, y: originY + (cy + 0.5) * cellM };
      const d = Math.hypot(p.x - at.x, p.y - at.y);
      if (d > LAMP_REACH_M) continue;
      if (segmentBlocked(grid, p, at)) continue;
      const t = 1 - d / LAMP_REACH_M;
      field[idx] = LAMP_GAIN * t * t;
    }
  }

  bounce(grid, field, LAMP_ALBEDO);
  return field;
}

/** One light source ready to combine: a field, its colour, and its strength. */
export interface LightSource {
  field: Float32Array;
  rgb: RGB;
  /** Scales the field; a lamp's brightness, 1 for daylight. */
  intensity: number;
}

export interface CombinedLight {
  /** RGBA bytes, row-major: tinted light on indoor cells, opaque black elsewhere. */
  rgba: Uint8ClampedArray<ArrayBuffer>;
}

/**
 * Sum tinted light fields into the drawable bitmap and per-face lift. The
 * tonemap `1 - exp(-gain·I)` keeps overlapping sources rolling off instead of
 * clipping. Face lift leans toward the bright end (p95 with a mean term) so
 * the dim overlay never visibly mutes a sun pool, while one hot cell cannot
 * lift a whole room.
 */
export function combineLight(grid: LightmapGrid, sources: LightSource[]): CombinedLight {
  const size = grid.width * grid.height;
  const r = new Float32Array(size);
  const g = new Float32Array(size);
  const b = new Float32Array(size);
  for (const source of sources) {
    const scaleR = (source.rgb.r / 255) * source.intensity;
    const scaleG = (source.rgb.g / 255) * source.intensity;
    const scaleB = (source.rgb.b / 255) * source.intensity;
    if (source.intensity <= 0) continue;
    const field = source.field;
    for (let i = 0; i < size; i++) {
      const v = field[i];
      if (v <= 0) continue;
      r[i] += v * scaleR;
      g[i] += v * scaleG;
      b[i] += v * scaleB;
    }
  }

  const rgba = new Uint8ClampedArray(size * 4);

  for (let i = 0; i < size; i++) {
    const offset = i * 4;
    rgba[offset + 3] = 255;
    if ((grid.cells[i] & CELL_KIND_MASK) !== CELL_INDOOR) continue;
    const tr = 1 - Math.exp(-TONEMAP_GAIN * r[i]);
    const tg = 1 - Math.exp(-TONEMAP_GAIN * g[i]);
    const tb = 1 - Math.exp(-TONEMAP_GAIN * b[i]);
    rgba[offset] = tr * 255;
    rgba[offset + 1] = tg * 255;
    rgba[offset + 2] = tb * 255;
  }

  // Bleed the lit edge outward so upscaling interpolates flat colour up to the
  // clip boundary instead of fading to black inside the room. Only unlit,
  // non-indoor texels take a bled value, and each belongs to the face whose
  // interior sits strictly closest — only that room's light may fill it. A
  // texel two rooms tie over, the middle of a shared wall, takes no bleed at
  // all: nothing sits close enough to the neighbour's clip for the display
  // blur to push light under it, while each room's own side of the wall band
  // still glows right up to the boundary — shared walls, junction corners and
  // exterior walls alike.
  const ownerMap = new Int16Array(size).fill(-1);
  for (let cy = 0; cy < grid.height; cy++) {
    for (let cx = 0; cx < grid.width; cx++) {
      const i = cy * grid.width + cx;
      if ((grid.cells[i] & CELL_KIND_MASK) === CELL_INDOOR) continue;
      // An occluder is a hole inside a room rather than a wall band, so the
      // bleed would fill it from its neighbours and erase the very shadow it
      // exists to cast.
      if (grid.cells[i] & CELL_OCCLUDER) continue;
      let best = -1;
      let bestD = Infinity;
      let tie = false;
      for (let dy = -3; dy <= 3; dy++) {
        for (let dx = -3; dx <= 3; dx++) {
          if (dx === 0 && dy === 0) continue;
          const nx = cx + dx;
          const ny = cy + dy;
          if (nx < 0 || ny < 0 || nx >= grid.width || ny >= grid.height) continue;
          const n = ny * grid.width + nx;
          if ((grid.cells[n] & CELL_KIND_MASK) !== CELL_INDOOR) continue;
          const face = grid.faceIndex[n];
          if (face < 0) continue;
          const d = dx * dx + dy * dy;
          if (d < bestD) {
            bestD = d;
            best = face;
            tie = false;
          } else if (d === bestD && face !== best) {
            tie = true;
          }
        }
      }
      if (!tie) ownerMap[i] = best;
    }
  }
  for (let pass = 0; pass < RENDER_BLEED_CELLS; pass++) {
    const before = rgba.slice();
    for (let cy = 0; cy < grid.height; cy++) {
      for (let cx = 0; cx < grid.width; cx++) {
        const i = cy * grid.width + cx;
        if ((grid.cells[i] & CELL_KIND_MASK) === CELL_INDOOR) continue;
        const offset = i * 4;
        if (before[offset] || before[offset + 1] || before[offset + 2]) continue;
        const own = ownerMap[i];
        if (own < 0) continue;
        let bestR = 0;
        let bestG = 0;
        let bestB = 0;
        let bestSum = 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            const nx = cx + dx;
            const ny = cy + dy;
            if (nx < 0 || ny < 0 || nx >= grid.width || ny >= grid.height) continue;
            const n = ny * grid.width + nx;
            const face =
              (grid.cells[n] & CELL_KIND_MASK) === CELL_INDOOR ? grid.faceIndex[n] : ownerMap[n];
            if (face !== own) continue;
            const o = n * 4;
            const sum = before[o] + before[o + 1] + before[o + 2];
            if (sum > bestSum) {
              bestSum = sum;
              bestR = before[o];
              bestG = before[o + 1];
              bestB = before[o + 2];
            }
          }
        }
        if (bestSum > 0) {
          rgba[offset] = bestR;
          rgba[offset + 1] = bestG;
          rgba[offset + 2] = bestB;
        }
      }
    }
  }

  return { rgba };
}
