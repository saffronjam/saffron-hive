import { m } from "$lib/i18n/messages";
import { locale } from "$lib/i18n/locale.svelte";

/** Strips urql's `[GraphQL] ` / `[Network] ` transport prefix from a message. */
export function stripErrorPrefix(message: string): string {
  return message.replace(/^\[(GraphQL|Network)\]\s*/i, "").trim();
}

/**
 * Presents stable GraphQL error codes and keeps server diagnostics out of the UI.
 */
export function graphqlErrorMessage(error: unknown, requestedFallback?: string): string {
  const fallback = requestedFallback ?? m.common_error_generic({}, locale.messageOptions());
  if (typeof error !== "object" || error === null) return fallback;
  const maybe = error as {
    graphQLErrors?: Array<{ message?: string; extensions?: Record<string, unknown> }>;
    message?: string;
  };
  const graphError = maybe.graphQLErrors?.[0];
  const code = typeof graphError?.extensions?.code === "string" ? graphError.extensions.code : "";
  const args = graphError?.extensions?.arguments;
  const seconds =
    typeof args === "object" &&
    args !== null &&
    typeof (args as Record<string, unknown>).seconds === "number"
      ? (args as Record<string, number>).seconds
      : 0;
  console.error("GraphQL request failed", { code, detail: graphError?.message ?? maybe.message });
  const options = locale.messageOptions();
  switch (code) {
    case "UNAUTHENTICATED":
      return m.error_unauthenticated({}, options);
    case "PASSWORD_CHANGE_REQUIRED":
      return m.error_password_change_required({}, options);
    case "BAD_REQUEST":
      return m.error_bad_request({}, options);
    case "RATE_LIMITED":
      return m.error_rate_limited({ seconds }, options);
    case "AUTHENTICATION_FAILED":
      return m.error_authentication_failed({}, options);
    case "INVALID_BOOTSTRAP_TOKEN":
      return m.error_invalid_bootstrap_token({}, options);
    case "NOT_FOUND":
      return m.error_not_found({}, options);
    case "CONFLICT":
      return m.error_conflict({}, options);
    case "VALIDATION_FAILED":
      return m.error_validation({}, options);
    default:
      return fallback;
  }
}
