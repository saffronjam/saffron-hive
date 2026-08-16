import type { Client } from "@urql/svelte";
import {
  AUTOMATION_DETAIL_QUERY,
  EFFECT_DETAIL_QUERY,
  SCENE_DETAIL_QUERY,
} from "$lib/graphql/details";

export type DetailKind = "scene" | "automation" | "effect";

const DOCUMENTS = {
  scene: SCENE_DETAIL_QUERY,
  automation: AUTOMATION_DETAIL_QUERY,
  effect: EFFECT_DETAIL_QUERY,
};

// One warm per entity per session. The document cache holds the result, so a
// second warm would be a no-op; this just skips the bookkeeping.
const warmed = new Set<string>();

/** Forgets which entities have been warmed. Called when a session ends. */
export function resetPrefetchedDetails(): void {
  warmed.clear();
}

/**
 * Warms an editor's detail query into the cache when the pointer reaches the
 * card that opens it, so the editor paints from cache instead of waiting on a
 * round trip.
 *
 * Only editors that need more than their shared store holds have a detail query
 * at all — a device or room page reads straight from its store.
 */
export function prefetchDetail(client: Client, kind: DetailKind, id: string): void {
  const key = `${kind}:${id}`;
  if (warmed.has(key)) return;
  warmed.add(key);
  void client.query(DOCUMENTS[kind], { id }).toPromise();
}
