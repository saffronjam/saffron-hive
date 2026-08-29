import { graphql } from "$lib/gql";
import type { Client } from "@urql/svelte";

/**
 * Shared so the routing gate and the setup page cannot drift apart. Operation
 * names must be unique across the document set, so two copies of this query
 * would only survive codegen while byte-identical.
 */
export const SETUP_STATUS_QUERY = graphql(`
  query setupStatus {
    setupStatus {
      hasInitialUser
    }
  }
`);

const INITIAL_RETRY_DELAY_MS = 100;
const MAX_RETRY_DELAY_MS = 2_000;

interface SetupStatusWaitOptions {
  signal?: AbortSignal;
  pause?: (delayMs: number, signal?: AbortSignal) => Promise<void>;
}

function pause(delayMs: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(signal.reason);
      return;
    }
    const onAbort = () => {
      clearTimeout(timer);
      reject(signal?.reason);
    };
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, delayMs);
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

export async function waitForSetupStatus(
  client: Client,
  options: SetupStatusWaitOptions = {},
): Promise<{ hasInitialUser: boolean }> {
  const wait = options.pause ?? pause;
  let retryDelayMs = INITIAL_RETRY_DELAY_MS;

  while (true) {
    options.signal?.throwIfAborted();
    const result = await client
      .query(SETUP_STATUS_QUERY, {}, { fetchOptions: { signal: options.signal } })
      .toPromise();
    if (result.data?.setupStatus) return result.data.setupStatus;
    if (!result.error?.networkError) {
      throw result.error ?? new Error("The setup status response was empty.");
    }
    await wait(retryDelayMs, options.signal);
    retryDelayMs = Math.min(retryDelayMs * 2, MAX_RETRY_DELAY_MS);
  }
}
