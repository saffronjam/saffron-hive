import type { BadgeVariant } from "$lib/components/ui/badge/index.js";

export type ChipVariant = NonNullable<BadgeVariant>;

export interface ChipOption {
  value: string;
  label: string;
}

export interface ChipConfig {
  keyword: string;
  label: string;
  variant?: ChipVariant;
  options: (input: string) => ChipOption[];
}

export interface SearchChip {
  keyword: string;
  value: string;
}

export interface SearchState {
  chips: SearchChip[];
  freeText: string;
}

export function emptySearchState(): SearchState {
  return { chips: [], freeText: "" };
}

/**
 * If `text` looks like `<keyword>:...` and `<keyword>` is in `keywords`,
 * return the keyword; otherwise null.
 */
export function matchChipKeyword(text: string, keywords: readonly string[]): string | null {
  const idx = text.indexOf(":");
  if (idx <= 0) return null;
  const kw = text.slice(0, idx);
  return keywords.includes(kw) ? kw : null;
}

/**
 * Turn a SearchState into the flat, space-joined raw query string.
 */
export function serialize(state: SearchState): string {
  const parts: string[] = [];
  for (const c of state.chips) parts.push(`${c.keyword}:${c.value}`);
  if (state.freeText) parts.push(state.freeText);
  return parts.join(" ");
}

/**
 * Parse a raw query string into a SearchState, consulting the configured chip
 * keywords. Tokens matching `<keyword>:...` where `<keyword>` is configured
 * become chips; everything else becomes free text. Unknown keywords fall
 * through to free text as-is.
 */
export function parseQuery(query: string, keywords: readonly string[]): SearchState {
  const chips: SearchChip[] = [];
  const free: string[] = [];
  for (const raw of query.split(" ")) {
    if (!raw) continue;
    const kw = matchChipKeyword(raw, keywords);
    if (kw !== null) {
      chips.push({ keyword: kw, value: raw.slice(kw.length + 1) });
    } else {
      free.push(raw);
    }
  }
  return { chips, freeText: free.join(" ") };
}
