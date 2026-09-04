import { getContext, onMount, setContext } from "svelte";
import type {
  AppRecoveryReason,
  ConnectionRecoveryEvent,
  GraphQLConnection,
} from "$lib/graphql/client";

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
  onRecoveryRequested: (reason: AppRecoveryReason) => void = () => {},
): () => void {
  let initialPageShowPending = document.readyState !== "complete";
  let lastRecoveryAt = Number.NEGATIVE_INFINITY;

  const recover = (reason: AppRecoveryReason) => {
    if (!enabled()) return;
    const now = Date.now();
    if (now - lastRecoveryAt < RECOVERY_DEDUP_MS) return;
    lastRecoveryAt = now;
    onRecoveryRequested(reason);
    connection.recover(reason);
  };

  const onVisibilityChange = () => {
    if (document.visibilityState === "visible") recover("foreground");
  };
  const onFocus = () => {
    if (document.visibilityState === "visible") recover("foreground");
  };
  const onResume = () => {
    recover("foreground");
  };
  const onPageShow = (event: PageTransitionEvent) => {
    if (initialPageShowPending && !event.persisted) {
      initialPageShowPending = false;
      return;
    }
    initialPageShowPending = false;
    recover("page_restore");
  };
  const onOnline = () => {
    if (document.visibilityState === "visible") recover("network_restored");
  };

  document.addEventListener("visibilitychange", onVisibilityChange);
  document.addEventListener("resume", onResume);
  window.addEventListener("focus", onFocus);
  window.addEventListener("pageshow", onPageShow);
  window.addEventListener("online", onOnline);

  return () => {
    document.removeEventListener("visibilitychange", onVisibilityChange);
    document.removeEventListener("resume", onResume);
    window.removeEventListener("focus", onFocus);
    window.removeEventListener("pageshow", onPageShow);
    window.removeEventListener("online", onOnline);
  };
}
