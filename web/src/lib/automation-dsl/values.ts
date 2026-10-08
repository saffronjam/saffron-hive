/** Conversions between the language's readable values and stored values. */

const DURATION_UNITS: Record<string, number> = {
  ms: 1,
  s: 1000,
  m: 60_000,
  h: 3_600_000,
  d: 86_400_000,
};

/** Milliseconds as the shortest exact duration text: "500ms", "10s", "5m", "1h". */
export function formatDuration(ms: number): string {
  for (const [unit, size] of [
    ["d", 86_400_000],
    ["h", 3_600_000],
    ["m", 60_000],
    ["s", 1000],
  ] as const) {
    if (ms >= size && ms % size === 0) return `${ms / size}${unit}`;
  }
  return `${ms}ms`;
}

/** Parses "1h30m", "10s", "500ms" or "2d" to milliseconds. */
export function parseDuration(text: string): number | null {
  const trimmed = text.trim();
  if (trimmed === "") return null;
  let total = 0;
  let rest = trimmed;
  while (rest !== "") {
    const match = /^(\d+(?:\.\d+)?)(ms|s|m|h|d)/.exec(rest);
    if (!match) return null;
    total += Number(match[1]) * DURATION_UNITS[match[2]];
    rest = rest.slice(match[0].length);
  }
  return Math.round(total);
}

/** "HH:MM" or "HH:MM:SS" to [hour, minute, second]. */
export function parseClock(text: string): [number, number, number] | null {
  const match = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(text.trim());
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  const second = Number(match[3] ?? 0);
  if (hour > 23 || minute > 59 || second > 59) return null;
  return [hour, minute, second];
}

export function formatClock(hour: number, minute: number, second = 0): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return second ? `${pad(hour)}:${pad(minute)}:${pad(second)}` : `${pad(hour)}:${pad(minute)}`;
}

export const DAY_CODES = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
export type DayCode = (typeof DAY_CODES)[number];

const FULL_DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

/** Accepts "mon", "Monday" or "MON". */
export function parseDay(text: string): DayCode | null {
  const lower = text.trim().toLowerCase();
  const index = DAY_CODES.indexOf(lower as DayCode);
  if (index >= 0) return DAY_CODES[index];
  const full = FULL_DAYS.indexOf(lower);
  return full >= 0 ? DAY_CODES[full] : null;
}

export function fullDayName(day: DayCode): string {
  const name = FULL_DAYS[DAY_CODES.indexOf(day)];
  return name[0].toUpperCase() + name.slice(1);
}

/** Brightness 0–254 as "80%" when the percentage maps back exactly. */
export function formatBrightness(value: number): number | string {
  const percent = Math.round((value / 254) * 100);
  return Math.round((percent / 100) * 254) === value ? `${percent}%` : value;
}

/** Colour temperature in mireds as "2700K" when that maps back exactly. */
export function formatColorTemp(mireds: number): number | string {
  if (mireds <= 0) return mireds;
  const kelvin = Math.round(1_000_000 / mireds);
  return Math.round(1_000_000 / kelvin) === mireds ? `${kelvin}K` : mireds;
}

export function formatColor(color: { r: number; g: number; b: number }): string {
  const hex = (n: number) =>
    Math.max(0, Math.min(255, Math.round(n)))
      .toString(16)
      .padStart(2, "0");
  return `#${hex(color.r)}${hex(color.g)}${hex(color.b)}`;
}

export type Converted = { ok: true; value: unknown } | { ok: false };

/** Reads one state value written in the language into its stored form. */
export function parseStateValue(field: string, value: unknown): Converted {
  if (typeof value !== "string") return { ok: true, value };
  if (/^\$\d+$/.test(value)) return { ok: true, value };
  switch (field) {
    case "brightness": {
      const match = /^(\d+(?:\.\d+)?)%$/.exec(value);
      return match
        ? { ok: true, value: Math.round((Number(match[1]) / 100) * 254) }
        : { ok: false };
    }
    case "colorTemp": {
      const match = /^(\d+)K$/i.exec(value);
      return match && Number(match[1]) > 0
        ? { ok: true, value: Math.round(1_000_000 / Number(match[1])) }
        : { ok: false };
    }
    case "color": {
      const match = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(value);
      return match
        ? {
            ok: true,
            value: {
              r: parseInt(match[1], 16),
              g: parseInt(match[2], 16),
              b: parseInt(match[3], 16),
            },
          }
        : { ok: false };
    }
    case "transition": {
      const ms = parseDuration(value);
      return ms === null ? { ok: false } : { ok: true, value: ms / 1000 };
    }
    default:
      return { ok: true, value };
  }
}

/** Writes one stored state value in its readable form. */
export function formatStateValue(field: string, value: unknown): unknown {
  switch (field) {
    case "brightness":
      return typeof value === "number" ? formatBrightness(value) : value;
    case "colorTemp":
      return typeof value === "number" ? formatColorTemp(value) : value;
    case "color":
      if (value && typeof value === "object" && "r" in value && "g" in value && "b" in value) {
        return formatColor(value as { r: number; g: number; b: number });
      }
      return value;
    case "transition":
      return typeof value === "number" && Number.isInteger(value * 1000)
        ? formatDuration(value * 1000)
        : value;
    default:
      return value;
  }
}
