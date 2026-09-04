import { m } from "$lib/i18n/messages";
import { locale } from "$lib/i18n/locale.svelte";
import { intlLocale } from "$lib/i18n/format";

export type TimeMode = "12h" | "24h";

function clockFormatter(mode: TimeMode): Intl.DateTimeFormat {
  return new Intl.DateTimeFormat(locale.intlLocale, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: mode === "12h",
  });
}

/**
 * Format a past Date as a short relative string: "just now", "12m ago",
 * "3h ago", falling through to a clock time after a day.
 */
export function formatRelative(date: Date, now: Date, mode: TimeMode): string {
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return m.time_just_now({}, locale.messageOptions());
  const formatter = new Intl.RelativeTimeFormat(intlLocale(), {
    numeric: "always",
    style: "short",
  });
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return formatter.format(-minutes, "minute");
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return formatter.format(-hours, "hour");
  return formatTime(date, mode);
}

/** Clock time in the user's chosen 12h/24h format, seconds included. */
export function formatTime(date: Date, mode: TimeMode): string {
  return clockFormatter(mode).format(date);
}

/** Full ISO-8601 timestamp for tooltips and debugging. */
export function formatFull(date: Date): string {
  return date.toISOString();
}

/** Full timestamp `YYYY-MM-DD HH:mm:ss` (or 12h variant) for chart tooltips. */
export function formatTooltip(date: Date, mode: TimeMode): string {
  return `${date.toISOString().slice(0, 10)} ${formatTime(date, mode)}`;
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
