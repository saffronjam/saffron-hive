/** Strips urql's `[GraphQL] ` / `[Network] ` transport prefix from a message. */
export function stripErrorPrefix(message: string): string {
  return message.replace(/^\[(GraphQL|Network)\]\s*/i, "").trim();
}

/**
 * Pulls the most useful message out of an urql error. Prefers the first GraphQL
 * error over the combined message, and falls back when neither is present.
 */
export function graphqlErrorMessage(error: unknown, fallback: string): string {
  if (typeof error !== "object" || error === null) return fallback;
  const maybe = error as {
    graphQLErrors?: Array<{ message?: string }>;
    message?: string;
  };
  const raw = maybe.graphQLErrors?.find((e) => e.message)?.message ?? maybe.message;
  if (!raw) return fallback;
  const cleaned = stripErrorPrefix(raw);
  return cleaned === "" ? fallback : cleaned;
}
