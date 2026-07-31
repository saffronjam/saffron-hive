/**
 * Placeholder the API returns in place of a stored secret. Sending it back in an
 * update means "keep the value that is already stored".
 */
export const REDACTED_SECRET = "********";

/** True when a fetched secret field is the placeholder, i.e. a secret is stored. */
export function hasStoredSecret(fetched: string | null | undefined): boolean {
  return fetched === REDACTED_SECRET;
}

/**
 * Value to submit for a secret field. An untouched field keeps the stored secret;
 * anything typed replaces it, including a deliberate clear when nothing is stored.
 */
export function secretToSend(typed: string, stored: boolean): string {
  return typed === "" && stored ? REDACTED_SECRET : typed;
}
