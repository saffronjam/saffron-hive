import { onMount } from "svelte";
import { onGraphQLRecovered } from "$lib/graphql/app-recovery";

const listeners = new Set<() => void>();
export function announceExternalChanges() {
  for (const listener of listeners) listener();
}
export function onExternalChanges(listener: () => void) {
  onMount(() => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  });
  onGraphQLRecovered(listener);
}
