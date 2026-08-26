import {
  cacheExchange,
  Client,
  fetchExchange,
  mapExchange,
  subscriptionExchange,
} from "@urql/svelte";
import { createClient as createWSClient, type Client as WSClient } from "graphql-ws";
import { goto } from "$app/navigation";
import { auth } from "$lib/stores/auth.svelte";
import { sessionTeardown } from "$lib/session";

const REFRESH_HEADER = "X-Refreshed-Token";
const KEEP_ALIVE_MS = 3_000;
const PONG_TIMEOUT_MS = 2_000;
const CONNECTION_ACK_TIMEOUT_MS = 3_000;
const MAX_RETRY_DELAY_MS = 15_000;

interface GraphQLConnectionOptions {
  endpoint?: string;
}

export type AppRecoveryReason = "foreground" | "page_restore" | "network_restored";
export type ConnectionRecoveryReason =
  | AppRecoveryReason
  | "heartbeat_timeout"
  | "socket_closed"
  | "socket_error";

export interface ConnectionRecoveryEvent {
  reason: ConnectionRecoveryReason;
  previousCloseCode?: number;
}

export interface GraphQLConnection {
  client: Client;
  recover(reason: AppRecoveryReason): void;
  onRecovered(listener: (event: ConnectionRecoveryEvent) => void): () => void;
}

function getWSUrl(httpUrl: string): string {
  const url = new URL(httpUrl, window.location.origin);
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  return url.toString();
}

/**
 * Custom fetch wrapper:
 *   1. Injects Authorization: Bearer <token> on every request.
 *   2. Reads X-Refreshed-Token from the response and hot-swaps the stored
 *      token so the session slides forward with activity.
 *   3. On 401, clears the token and redirects to /login.
 */
async function authenticatedFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const headers = new Headers(init?.headers);
  const token = auth.token;
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  const response = await fetch(input, { ...init, headers });
  const refreshed = response.headers.get(REFRESH_HEADER);
  if (refreshed) {
    auth.setToken(refreshed);
  }
  if (response.status === 401) {
    sessionTeardown();
    if (typeof window !== "undefined" && window.location.pathname !== "/login") {
      void goto("/login");
    }
  }
  return response;
}

function closeCode(event: unknown): number | undefined {
  if (typeof event !== "object" || event === null || !("code" in event)) return undefined;
  return typeof event.code === "number" ? event.code : undefined;
}

export function createGraphQLConnection(options: GraphQLConnectionOptions = {}): GraphQLConnection {
  const endpoint = options.endpoint ?? "/graphql";
  let pongTimeout: ReturnType<typeof setTimeout> | null = null;
  let wakeRetry: (() => void) | null = null;
  let recoveryReason: ConnectionRecoveryReason | null = null;
  let previousCloseCode: number | undefined;
  let wsClient: WSClient;
  const recoveryListeners = new Set<(event: ConnectionRecoveryEvent) => void>();

  function clearPongTimeout() {
    if (pongTimeout === null) return;
    clearTimeout(pongTimeout);
    pongTimeout = null;
  }

  function beginRecovery(reason: ConnectionRecoveryReason, code?: number) {
    recoveryReason ??= reason;
    previousCloseCode ??= code;
  }

  function notifyRecovered(event: ConnectionRecoveryEvent) {
    for (const listener of recoveryListeners) listener(event);
  }

  wsClient = createWSClient({
    url: getWSUrl(endpoint),
    connectionParams: () => {
      const token = auth.token;
      return {
        ...(token ? { authToken: token } : {}),
        ...(recoveryReason ? { recoveryReason } : {}),
        ...(previousCloseCode === undefined ? {} : { previousCloseCode }),
      };
    },
    keepAlive: KEEP_ALIVE_MS,
    connectionAckWaitTimeout: CONNECTION_ACK_TIMEOUT_MS,
    retryAttempts: Number.POSITIVE_INFINITY,
    retryWait: async (retries) => {
      if (retries === 0) return;
      const delay = Math.min(1000 * 2 ** (retries - 1), MAX_RETRY_DELAY_MS);
      await new Promise<void>((resolve) => {
        let settled = false;
        let timer: ReturnType<typeof setTimeout>;
        const finish = () => {
          if (settled) return;
          settled = true;
          clearTimeout(timer);
          if (wakeRetry === finish) wakeRetry = null;
          resolve();
        };
        timer = setTimeout(finish, delay);
        wakeRetry = finish;
      });
    },
    on: {
      connected(_socket, _payload, wasRetry) {
        clearPongTimeout();
        const recovered = wasRetry
          ? {
              reason: recoveryReason ?? "socket_closed",
              ...(previousCloseCode === undefined ? {} : { previousCloseCode }),
            }
          : null;
        recoveryReason = null;
        previousCloseCode = undefined;
        if (recovered) setTimeout(() => notifyRecovered(recovered), 0);
      },
      ping(received) {
        if (received) return;
        clearPongTimeout();
        pongTimeout = setTimeout(() => {
          pongTimeout = null;
          beginRecovery("heartbeat_timeout");
          wsClient.terminate();
        }, PONG_TIMEOUT_MS);
      },
      pong(received) {
        if (received) clearPongTimeout();
      },
      closed(event) {
        clearPongTimeout();
        beginRecovery("socket_closed", closeCode(event));
      },
      error() {
        clearPongTimeout();
        beginRecovery("socket_error");
      },
    },
  });

  const client = new Client({
    url: endpoint,
    fetch: authenticatedFetch as typeof fetch,
    // Serve a repeat query from the document cache immediately, then revalidate
    // in the background. Anything backed by a shared store in $lib/stores never
    // reaches the network at all; this covers everything else.
    requestPolicy: "cache-and-network",
    exchanges: [
      mapExchange({
        onError(error) {
          const unauth =
            error.response?.status === 401 ||
            error.graphQLErrors.some((e) => e.extensions?.code === "UNAUTHENTICATED");
          if (unauth) {
            sessionTeardown();
            if (typeof window !== "undefined" && window.location.pathname !== "/login") {
              void goto("/login");
            }
          }
        },
      }),
      cacheExchange,
      fetchExchange,
      subscriptionExchange({
        forwardSubscription(request) {
          const input = { ...request, query: request.query || "" };
          return {
            subscribe(sink) {
              const unsubscribe = wsClient.subscribe(input, sink);
              return { unsubscribe };
            },
          };
        },
      }),
    ],
  });

  return {
    client,
    recover(reason) {
      beginRecovery(reason);
      if (wakeRetry) wakeRetry();
      else wsClient.terminate();
    },
    onRecovered(listener) {
      recoveryListeners.add(listener);
      return () => recoveryListeners.delete(listener);
    },
  };
}
