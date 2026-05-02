export type TimeMode = "12h" | "24h";

const pad = (n: number) => String(n).padStart(2, "0");

function clock(date: Date, mode: TimeMode): string {
  const h = date.getHours();
  const m = pad(date.getMinutes());
  const s = pad(date.getSeconds());
  if (mode === "12h") {
    const suffix = h >= 12 ? "PM" : "AM";
    const h12 = ((h + 11) % 12) + 1;
    return `${pad(h12)}:${m}:${s} ${suffix}`;
  }
  return `${pad(h)}:${m}:${s}`;
}

function dateStamp(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/**
 * Format a past Date as a short relative string: "just now", "12m ago",
 * "3h ago", falling through to a clock time after a day.
 */
export function formatRelative(date: Date, now: Date, mode: TimeMode): string {
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return formatTime(date, mode);
}

/** Clock time in the user's chosen 12h/24h format, seconds included. */
export function formatTime(date: Date, mode: TimeMode): string {
  return clock(date, mode);
}

/** Full ISO-8601 timestamp for tooltips and debugging. */
export function formatFull(date: Date): string {
  return date.toISOString();
}

/** Full timestamp `YYYY-MM-DD HH:mm:ss` (or 12h variant) for chart tooltips. */
export function formatTooltip(date: Date, mode: TimeMode): string {
  return `${dateStamp(date)} ${clock(date, mode)}`;
}

/**
 * Parse a relative duration like "30s", "15m", "2h", "7d" as a Date that far
 * in the past from now. Returns null if the string doesn't match.
 */
export function parseSince(raw: string): Date | null {
  const m = raw.match(/^(\d+)([smhd])$/);
  if (!m) return null;
  const n = parseInt(m[1], 10);
  const unit = m[2];
  const multipliers: Record<string, number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };
  return new Date(Date.now() - n * multipliers[unit]);
}
