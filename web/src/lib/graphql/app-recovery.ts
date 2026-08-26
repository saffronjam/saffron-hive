import { getContext, onMount, setContext } from "svelte";
import type { ConnectionRecoveryEvent, GraphQLConnection } from "$lib/graphql/client";

const GRAPHQL_CONNECTION = Symbol("graphql-connection");
const RECOVERY_DEDUP_MS = 250;

export function setGraphQLConnectionContext(connection: GraphQLConnection): void {
  setContext(GRAPHQL_CONNECTION, connection);
}

export function getGraphQLConnectionContext(): GraphQLConnection {
  return getContext<GraphQLConnection>(GRAPHQL_CONNECTION);
}

export function onGraphQLRecovered(listener: (event: ConnectionRecoveryEvent) => void): void {
  const connection = getGraphQLConnectionContext();
  onMount(() => connection.onRecovered(listener));
}

export function installAppRecovery(
  connection: GraphQLConnection,
  enabled: () => boolean,
): () => void {
  let wasHidden = document.visibilityState !== "visible";
  let lastRecoveryAt = Number.NEGATIVE_INFINITY;

  const recover = (reason: "foreground" | "page_restore" | "network_restored") => {
    if (!enabled()) return;
    const now = Date.now();
    if (now - lastRecoveryAt < RECOVERY_DEDUP_MS) return;
    lastRecoveryAt = now;
    connection.recover(reason);
  };

  const onVisibilityChange = () => {
    if (document.visibilityState !== "visible") {
      wasHidden = true;
      return;
    }
    if (!wasHidden) return;
    wasHidden = false;
    recover("foreground");
  };
  const onPageShow = (event: PageTransitionEvent) => {
    if (event.persisted) recover("page_restore");
  };
  const onOnline = () => {
    if (document.visibilityState === "visible") recover("network_restored");
  };

  document.addEventListener("visibilitychange", onVisibilityChange);
  window.addEventListener("pageshow", onPageShow);
  window.addEventListener("online", onOnline);

  return () => {
    document.removeEventListener("visibilitychange", onVisibilityChange);
    window.removeEventListener("pageshow", onPageShow);
    window.removeEventListener("online", onOnline);
  };
}
