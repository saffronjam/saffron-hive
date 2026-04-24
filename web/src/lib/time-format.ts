/**
 * Format a past Date as a short relative string: "just now", "12m ago",
 * "3h ago", falling through to a HH:mm:ss clock time after a day.
 */
export function formatRelative(date: Date, now: Date = new Date()): string {
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return formatTime(date);
}

/** HH:mm:ss in the user's locale. */
export function formatTime(date: Date): string {
  return date.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

/** Full ISO-8601 timestamp for tooltips and debugging. */
export function formatFull(date: Date): string {
  return date.toISOString();
}

/** Short readable timestamp like "Apr 24, 9:47:04 AM" for chart tooltips. */
export function formatTooltip(date: Date): string {
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  });
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
