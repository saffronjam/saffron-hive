import { Client, fetchExchange, subscriptionExchange } from "@urql/svelte";
import { createClient as createWSClient } from "graphql-ws";

function getWSUrl(httpUrl: string): string {
  const url = new URL(httpUrl, window.location.origin);
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  return url.toString();
}

export function createGraphQLClient(endpoint = "/graphql"): Client {
  const wsClient = createWSClient({
    url: getWSUrl(endpoint),
  });

  return new Client({
    url: endpoint,
    exchanges: [
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
