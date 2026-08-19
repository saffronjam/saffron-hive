export interface DiscretePoint<T extends boolean | string> {
  at: string;
  value: T;
}

export interface DiscreteSegment<T extends boolean | string> {
  left: number;
  width: number;
  value: T;
  start: Date;
  end: Date;
}

export interface DiscreteTimeline<T extends boolean | string> {
  unknownWidth: number;
  segments: DiscreteSegment<T>[];
  currentValue: T | null;
}

export function buildDiscreteTimeline<T extends boolean | string>(
  points: DiscretePoint<T>[],
  from: Date,
  to: Date,
): DiscreteTimeline<T> {
  const rangeStart = from.getTime();
  const rangeEnd = to.getTime();
  const duration = Math.max(1, rangeEnd - rangeStart);
  const sorted = points
    .map((point) => ({ ...point, time: new Date(point.at).getTime() }))
    .filter((point) => Number.isFinite(point.time) && point.time <= rangeEnd)
    .sort((left, right) => left.time - right.time);

  const collapsed: typeof sorted = [];
  for (const point of sorted) {
    const previous = collapsed.at(-1);
    if (previous?.time === point.time) {
      collapsed[collapsed.length - 1] = point;
      continue;
    }
    if (previous?.value === point.value) continue;
    collapsed.push(point);
  }

  const baselineIndex = collapsed.findLastIndex((point) => point.time <= rangeStart);
  const visible =
    baselineIndex >= 0
      ? [collapsed[baselineIndex], ...collapsed.slice(baselineIndex + 1)]
      : collapsed;
  const firstKnownAt = visible[0]?.time;
  const unknownWidth =
    firstKnownAt === undefined
      ? 100
      : Math.max(0, Math.min(100, ((firstKnownAt - rangeStart) / duration) * 100));
  const segments: DiscreteSegment<T>[] = [];

  for (let index = 0; index < visible.length; index++) {
    const point = visible[index];
    const segmentStart = Math.max(rangeStart, point.time);
    const segmentEnd = Math.min(rangeEnd, visible[index + 1]?.time ?? rangeEnd);
    if (segmentEnd <= segmentStart) continue;
    segments.push({
      left: ((segmentStart - rangeStart) / duration) * 100,
      width: ((segmentEnd - segmentStart) / duration) * 100,
      value: point.value,
      start: new Date(segmentStart),
      end: new Date(segmentEnd),
    });
  }

  return {
    unknownWidth,
    segments,
    currentValue: visible.at(-1)?.value ?? null,
  };
}

export function booleanStepPath(segments: DiscreteSegment<boolean>[]): string {
  if (segments.length === 0) return "";
  const y = (value: boolean) => (value ? 8 : 32);
  let path = `M ${segments[0].left} ${y(segments[0].value)}`;
  for (let index = 0; index < segments.length; index++) {
    const segment = segments[index];
    const end = segment.left + segment.width;
    path += ` H ${end}`;
    const next = segments[index + 1];
    if (next && next.value !== segment.value) path += ` V ${y(next.value)}`;
  }
  return path;
}
