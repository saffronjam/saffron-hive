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

/**
 * Format an automation cooldown (seconds, may be fractional) for display.
 * Zero becomes "no cooldown"; sub-second values render in milliseconds;
 * anything else renders in seconds with up to three decimals trimmed.
 */
export function formatCooldown(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return "no cooldown";
  if (seconds < 1) return `${Math.round(seconds * 1000)}ms`;
  return `${+seconds.toFixed(3)}s`;
}
