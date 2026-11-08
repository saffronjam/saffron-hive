import type { CleaningAnchor, CleaningMap, CleaningTransform } from "$lib/gql/graphql";

export function fitCleaningMap(anchors: CleaningAnchor[]): CleaningTransform | null {
  if (
    anchors.length < 2 ||
    anchors.some((p) => ![p.robot.x, p.robot.y, p.hive.x, p.hive.y].every(Number.isFinite))
  )
    return null;
  const n = anchors.length;
  const center = anchors.reduce(
    (s, p) => ({
      sx: s.sx + p.robot.x,
      sy: s.sy + p.robot.y,
      tx: s.tx + p.hive.x,
      ty: s.ty + p.hive.y,
    }),
    { sx: 0, sy: 0, tx: 0, ty: 0 },
  );
  center.sx /= n;
  center.sy /= n;
  center.tx /= n;
  center.ty /= n;
  let d = 0,
    a = 0,
    b = 0;
  for (const p of anchors) {
    const x = p.robot.x - center.sx,
      y = p.robot.y - center.sy,
      u = p.hive.x - center.tx,
      v = p.hive.y - center.ty;
    d += x * x + y * y;
    a += x * u + y * v;
    b += x * v - y * u;
  }
  if (d < 1e-10) return null;
  a /= d;
  b /= d;
  if (!Number.isFinite(a) || !Number.isFinite(b) || Math.hypot(a, b) < 1e-6) return null;
  return {
    a,
    b,
    x: center.tx - a * center.sx + b * center.sy,
    y: center.ty - b * center.sx - a * center.sy,
  };
}

export function rotateCleaningPoint(
  map: CleaningMap,
  point: { x: number; y: number },
  degrees: number,
) {
  const cx = map.origin.x + (map.width * map.metersPerPixel) / 2,
    cy = map.origin.y + (map.height * map.metersPerPixel) / 2;
  const angle = (degrees * Math.PI) / 180,
    c = Math.cos(angle),
    s = Math.sin(angle),
    x = point.x - cx,
    y = point.y - cy;
  return { x: cx + x * c - y * s, y: cy + x * s + y * c };
}

export function cleaningMapCorners(map: CleaningMap, degrees = 0) {
  const { x, y } = map.origin,
    w = map.width * map.metersPerPixel,
    h = map.height * map.metersPerPixel;
  return [
    { x, y },
    { x: x + w, y },
    { x: x + w, y: y + h },
    { x, y: y + h },
  ].map((p) => rotateCleaningPoint(map, p, degrees));
}

export function transformCleaningPoint(t: CleaningTransform, p: { x: number; y: number }) {
  return { x: t.a * p.x - t.b * p.y + t.x, y: t.b * p.x + t.a * p.y + t.y };
}

export function cleaningRoomColor(id: number): string {
  const colors = ["blue", "teal", "amber", "purple", "orange", "pink"];
  const color = colors[Math.abs(id - 1) % colors.length];
  return `color-mix(in srgb, var(--color-${color}-500) 30%, var(--card))`;
}
