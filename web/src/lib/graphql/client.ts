import { Client, fetchExchange, mapExchange, subscriptionExchange } from "@urql/svelte";
import { createClient as createWSClient } from "graphql-ws";
import { goto } from "$app/navigation";
import { auth } from "$lib/stores/auth.svelte";

const REFRESH_HEADER = "X-Refreshed-Token";

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
    auth.clearToken();
    if (typeof window !== "undefined" && window.location.pathname !== "/login") {
      void goto("/login");
    }
  }
  return response;
}

export function createGraphQLClient(endpoint = "/graphql"): Client {
  const wsClient = createWSClient({
    url: getWSUrl(endpoint),
    connectionParams: () => {
      const token = auth.token;
      return token ? { authToken: token } : {};
    },
  });

  return new Client({
    url: endpoint,
    fetch: authenticatedFetch as typeof fetch,
    exchanges: [
      mapExchange({
        onError(error) {
          const unauth =
            error.response?.status === 401 ||
            error.graphQLErrors.some((e) => e.extensions?.code === "UNAUTHENTICATED");
          if (unauth) {
            auth.clearToken();
            if (typeof window !== "undefined" && window.location.pathname !== "/login") {
              void goto("/login");
            }
          }
        },
      }),
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
}
