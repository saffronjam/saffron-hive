import type { Client, TypedDocumentNode } from "@urql/svelte";
import type { Exact } from "$lib/gql/graphql";
import { clearSnapshot, loadSnapshot, saveSnapshot } from "$lib/entity-cache";
import { graphqlErrorMessage } from "$lib/graphql-error";

/** Anything a store can hold: an entity with a stable server id. */
export interface Identified {
  id: string;
}

/** The hydrating query takes no arguments — a store always holds the whole list. */
type NoVariables = Exact<{ [key: string]: never }>;

export interface EntityStoreOptions<TItem extends Identified, TData> {
  /** Cache key segment, e.g. `"rooms"`. */
  name: string;
  /**
   * Bump when the selection set changes so snapshots written against the old
   * shape are discarded rather than read back with missing fields.
   */
  version: number;
  query: TypedDocumentNode<TData, NoVariables>;
  /** Pulls the list out of the query result. */
  select: (data: TData) => TItem[] | null | undefined;
}

const PERSIST_DEBOUNCE_MS = 250;

function storage(): Storage | null {
  return typeof window === "undefined" ? null : window.localStorage;
}

/**
 * A shared, layout-level list of entities.
 *
 * Reads are synchronous and never hit the network: pages render straight from
 * `items`. The store hydrates from its disk snapshot when it is constructed, so
 * the first frame after a cold start already has data, and reconciles with the
 * server when `start` or `refresh` runs.
 *
 * The server announces no structural changes for these entities, so callers
 * apply their own mutation results through `upsert` / `remove` / `replaceAll`.
 */
export function createEntityStore<TItem extends Identified, TData>(
  options: EntityStoreOptions<TItem, TData>,
) {
  const { name, version, query, select } = options;

  const restored = loadSnapshot<TItem>(storage(), name, version);
  // Raw, not deep-proxied. These lists are replaced wholesale — every mutator
  // below reassigns — so per-property proxying would cost on every read
  // (`room.members[i].memberId` and friends, once per row per render) and buy
  // nothing. See https://svelte.dev/docs/svelte/$state#$state.raw
  let items = $state.raw<TItem[]>(restored ?? []);
  let hydrated = $state(restored !== null);
  let error = $state<string | null>(null);

  let started = false;
  let persistTimer: ReturnType<typeof setTimeout> | null = null;

  const byId = $derived.by(() => {
    const map = new Map<string, TItem>();
    for (const item of items) map.set(item.id, item);
    return map;
  });

  function persist() {
    if (persistTimer !== null) return;
    persistTimer = setTimeout(() => {
      persistTimer = null;
      saveSnapshot(storage(), name, version, items);
    }, PERSIST_DEBOUNCE_MS);
  }

  function flushPersist() {
    if (persistTimer === null) return;
    clearTimeout(persistTimer);
    persistTimer = null;
    saveSnapshot(storage(), name, version, items);
  }

  function replaceAll(next: TItem[]) {
    items = next;
    persist();
  }

  function upsert(item: TItem) {
    const idx = items.findIndex((i) => i.id === item.id);
    items = idx >= 0 ? items.with(idx, item) : [...items, item];
    persist();
  }

  function remove(id: string) {
    if (!items.some((i) => i.id === id)) return;
    items = items.filter((i) => i.id !== id);
    persist();
  }

  function removeMany(ids: string[]) {
    const doomed = new Set(ids);
    if (!items.some((i) => doomed.has(i.id))) return;
    items = items.filter((i) => !doomed.has(i.id));
    persist();
  }

  /**
   * Fetches the list and replaces the local copy. Goes straight to the network:
   * this store is the cache, so routing through urql's document cache would only
   * add a second copy of the same data.
   */
  async function refresh(client: Client) {
    const result = await client.query(query, {}, { requestPolicy: "network-only" }).toPromise();
    if (result.error) {
      error = graphqlErrorMessage(result.error, `Could not load ${name}.`);
      return;
    }
    const next = result.data ? select(result.data) : null;
    if (!next) return;
    error = null;
    hydrated = true;
    replaceAll(next);
  }

  return {
    get items() {
      return items;
    },
    get byId() {
      return byId;
    },
    /**
     * True once the list is safe to render as authoritative — after a snapshot
     * restore or a successful fetch. Gate "nothing here yet" empty states on
     * this so a pre-load empty list does not read as a real absence.
     */
    get hydrated() {
      return hydrated;
    },
    get error() {
      return error;
    },
    replaceAll,
    upsert,
    remove,
    removeMany,
    refresh,

    async start(client: Client) {
      if (started) return;
      started = true;
      await refresh(client);
    },

    stop() {
      started = false;
      flushPersist();
    },

    /** Drops in-memory and on-disk data. Used when a session ends. */
    clear() {
      if (persistTimer !== null) {
        clearTimeout(persistTimer);
        persistTimer = null;
      }
      items = [];
      hydrated = false;
      error = null;
      clearSnapshot(storage(), name);
    },
  };
}

export type EntityStore<TItem extends Identified, TData> = ReturnType<
  typeof createEntityStore<TItem, TData>
>;
