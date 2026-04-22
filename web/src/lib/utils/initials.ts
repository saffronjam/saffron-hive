/**
 * Returns 1-2 uppercase initials derived from a display name. Splits on
 * whitespace, picks the first unicode letter from each word, caps at two.
 * Falls back to "U" (for "user") when no letters are present.
 */
export function initials(name: string): string {
  const words = name.split(/\s+/).filter(Boolean);
  const letters: string[] = [];
  for (const w of words) {
    const m = w.match(/\p{L}/u);
    if (m) letters.push(m[0].toUpperCase());
    if (letters.length === 2) break;
  }
  return letters.join("") || "U";
}
