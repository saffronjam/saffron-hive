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
const CONNECTION_TIMEOUT_MS = 5_000;
const MAX_RETRY_DELAY_MS = 15_000;

interface GraphQLConnectionOptions {
  endpoint?: string;
}

export type AppRecoveryReason = "foreground" | "page_restore" | "network_restored";
export type ConnectionRecoveryReason =
  | AppRecoveryReason
  | "heartbeat_timeout"
  | "connection_timeout"
  | "socket_closed"
  | "socket_error";

export interface ConnectionRecoveryEvent {
  reason: ConnectionRecoveryReason;
  previousCloseCode?: number;
}

export interface GraphQLConnection {
  client: Client;
  recover(reason: AppRecoveryReason): void;
  suspend(): void;
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
    const guest = auth.isGuest();
    sessionTeardown();
    if (typeof window !== "undefined" && window.location.pathname !== "/login") {
      void goto(guest ? "/login?mode=guest&reason=unavailable" : "/login");
    }
  }
  return response;
}

function closeCode(event: unknown): number | undefined {
  if (typeof event !== "object" || event === null || !("code" in event)) return undefined;
  return typeof event.code === "number" ? event.code : undefined;
}

function isBrowserSocketError(event: unknown): event is Event {
  return event instanceof Event && event.type === "error";
}

export function createGraphQLConnection(options: GraphQLConnectionOptions = {}): GraphQLConnection {
  const endpoint = options.endpoint ?? "/graphql";
  let pongTimeout: ReturnType<typeof setTimeout> | null = null;
  let connectionTimeout: ReturnType<typeof setTimeout> | null = null;
  let wakeRetry: (() => void) | null = null;
  let recoveryReason: ConnectionRecoveryReason | null = null;
  let previousCloseCode: number | undefined;
  let wsClient: WSClient;
  let activeSocket: WebSocket | null = null;
  let suspended = false;
  let connecting = false;
  let subscriptions = 0;
  let nextProbeID = 0;
  let resumeProbe: { id: number; reason: AppRecoveryReason } | null = null;
  const recoveryListeners = new Set<(event: ConnectionRecoveryEvent) => void>();

  function clearPongTimeout() {
    if (pongTimeout === null) return;
    clearTimeout(pongTimeout);
    pongTimeout = null;
  }

  function clearConnectionTimeout() {
    if (connectionTimeout === null) return;
    clearTimeout(connectionTimeout);
    connectionTimeout = null;
  }

  function watchForConnection() {
    if (connectionTimeout !== null || suspended || document.visibilityState === "hidden") return;
    connectionTimeout = setTimeout(() => {
      connectionTimeout = null;
      if (!subscriptions || suspended || document.visibilityState === "hidden") return;
      beginRecovery("connection_timeout");
      wsClient.terminate();
    }, CONNECTION_TIMEOUT_MS);
  }

  function beginRecovery(reason: ConnectionRecoveryReason, code?: number) {
    recoveryReason ??= reason;
    previousCloseCode ??= code;
  }

  function notifyRecovered(event: ConnectionRecoveryEvent) {
    for (const listener of recoveryListeners) listener(event);
  }

  function watchForPong() {
    clearPongTimeout();
    pongTimeout = setTimeout(() => {
      pongTimeout = null;
      const reason = resumeProbe?.reason ?? "heartbeat_timeout";
      resumeProbe = null;
      if (suspended || document.visibilityState === "hidden") return;
      beginRecovery(reason);
      wsClient.terminate();
    }, PONG_TIMEOUT_MS);
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
    retryAttempts: Number.POSITIVE_INFINITY,
    shouldRetry: (event) => closeCode(event) !== undefined || isBrowserSocketError(event),
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
      connecting() {
        connecting = true;
        watchForConnection();
      },
      connected(socket, _payload, wasRetry) {
        if ((socket as WebSocket).readyState !== WebSocket.OPEN) return;
        connecting = false;
        clearConnectionTimeout();
        clearPongTimeout();
        activeSocket = socket as WebSocket;
        resumeProbe = null;
        const recovered =
          wasRetry || recoveryReason !== null
            ? {
                reason: recoveryReason ?? "socket_closed",
                ...(previousCloseCode === undefined ? {} : { previousCloseCode }),
              }
            : null;
        recoveryReason = null;
        previousCloseCode = undefined;
        if (recovered) {
          setTimeout(() => {
            if (activeSocket === socket) notifyRecovered(recovered);
          }, 0);
        }
      },
      ping(received) {
        if (received || suspended || document.visibilityState === "hidden" || resumeProbe) return;
        watchForPong();
      },
      pong(received, payload) {
        if (!received) return;
        if (resumeProbe && payload?.hiveProbe !== resumeProbe.id) return;
        const resumed = resumeProbe;
        resumeProbe = null;
        clearPongTimeout();
        if (resumed) notifyRecovered({ reason: resumed.reason });
      },
      closed(event) {
        connecting = false;
        clearConnectionTimeout();
        activeSocket = null;
        resumeProbe = null;
        clearPongTimeout();
        beginRecovery("socket_closed", closeCode(event));
      },
      error(event) {
        connecting = false;
        clearConnectionTimeout();
        activeSocket = null;
        resumeProbe = null;
        clearPongTimeout();
        beginRecovery("socket_error");
        if (isBrowserSocketError(event) && event.target instanceof WebSocket) {
          // A delayed event from this socket must not interrupt its replacement.
          const socket = event.target;
          socket.onopen = null;
          socket.onmessage = null;
          socket.onerror = null;
          socket.onclose = null;
          socket.close();
        }
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
            const guest = auth.isGuest();
            sessionTeardown();
            if (typeof window !== "undefined" && window.location.pathname !== "/login") {
              void goto(guest ? "/login?mode=guest&reason=unavailable" : "/login");
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
              subscriptions++;
              let finished = false;
              const finish = () => {
                if (finished) return;
                finished = true;
                subscriptions--;
                if (subscriptions === 0) {
                  clearConnectionTimeout();
                  clearPongTimeout();
                }
              };
              const unsubscribe = wsClient.subscribe(input, {
                next: sink.next,
                error(error) {
                  finish();
                  sink.error(error);
                },
                complete() {
                  finish();
                  sink.complete();
                },
              });
              return {
                unsubscribe() {
                  finish();
                  unsubscribe();
                },
              };
            },
          };
        },
      }),
    ],
  });

  return {
    client,
    recover(reason) {
      suspended = false;
      if (wakeRetry) {
        beginRecovery(reason);
        wakeRetry();
        return;
      }
      if (!activeSocket) {
        if (!subscriptions) return;
        beginRecovery(reason);
        if (!connecting) wsClient.terminate();
        watchForConnection();
        return;
      }
      if (activeSocket.readyState !== WebSocket.OPEN) {
        beginRecovery(reason);
        wsClient.terminate();
        return;
      }
      if (resumeProbe) return;
      resumeProbe = { id: ++nextProbeID, reason };
      watchForPong();
      try {
        activeSocket.send(JSON.stringify({ type: "ping", payload: { hiveProbe: resumeProbe.id } }));
      } catch {
        clearPongTimeout();
        resumeProbe = null;
        beginRecovery("socket_error");
        wsClient.terminate();
      }
    },
    suspend() {
      suspended = true;
      resumeProbe = null;
      clearPongTimeout();
      clearConnectionTimeout();
    },
    onRecovered(listener) {
      recoveryListeners.add(listener);
      return () => recoveryListeners.delete(listener);
    },
  };
}
