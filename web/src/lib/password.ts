/**
 * Client-side password validation mirroring the server's `validatePassword` in
 * `internal/graph/helpers.go`. Bumping either side without the other lets
 * legitimate submissions fail at the server with a less-friendly error, so
 * keep them in sync.
 */
export const MIN_PASSWORD_LEN = 10;

/**
 * Returns a human-readable rejection reason, or null when the password
 * satisfies the policy (length >= MIN_PASSWORD_LEN, with at least one
 * uppercase letter, lowercase letter, and digit).
 */
export function validateNewPassword(pw: string): string | null {
  if (pw.length < MIN_PASSWORD_LEN) {
    return m.auth_password_minimum({ count: MIN_PASSWORD_LEN }, locale.messageOptions());
  }
  if (!/[A-Z]/.test(pw) || !/[a-z]/.test(pw) || !/[0-9]/.test(pw)) {
    return m.auth_password_complexity({}, locale.messageOptions());
  }
  return null;
}
import { m } from "$lib/i18n/messages";
import { locale } from "$lib/i18n/locale.svelte";
