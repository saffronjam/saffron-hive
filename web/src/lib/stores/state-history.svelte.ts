import { queryStore, type Client } from "@urql/svelte";
import type { CombinedError } from "@urql/core";
import { SvelteMap } from "svelte/reactivity";
import { graphql } from "$lib/gql";
import { AggregatedHistoryTargetType } from "$lib/gql/graphql";
import { sourceKey, type StateHistorySource } from "$lib/state-history-source";

export interface HistorySeries {
  field: string;
  valueType: "NUMBER" | "BOOLEAN" | "TEXT";
  points: { at: string; value: number | boolean | string }[];
}

export interface HistoryRequest {
  sources: StateHistorySource[];
  fields?: string[];
  from: Date;
  to: Date;
  bucketSeconds?: number;
  rollingSnapshot?: boolean;
  enabled?: boolean;
}

interface SourceResult {
  series: HistorySeries[];
  loaded: boolean;
  fetching: boolean;
  error?: CombinedError;
}

interface Snapshot {
  from: number;
  to: number;
  series: HistorySeries[];
}

const snapshots = new Map<string, Snapshot>();
const resetters = new Set<() => void>();
const MAX_SNAPSHOTS = 64;
let sessionRequests = new WeakMap<Client, Set<string>>();

/** Clears chart data and releases queries when the authenticated session ends. */
export function clearStateHistory(): void {
  snapshots.clear();
  sessionRequests = new WeakMap();
  for (const reset of resetters) reset();
}

function rememberSnapshot(key: string, snapshot: Snapshot): void {
  const current = snapshots.get(key);
  if (current && current.to > snapshot.to) return;
  snapshots.delete(key);
  snapshots.set(key, snapshot);
  if (snapshots.size > MAX_SNAPSHOTS) snapshots.delete(snapshots.keys().next().value!);
}

function readSnapshot(key: string, from: number, to: number): HistorySeries[] | undefined {
  const snapshot = snapshots.get(key);
  if (!snapshot || snapshot.to < from || snapshot.from > to) return undefined;
  snapshots.delete(key);
  snapshots.set(key, snapshot);
  return snapshot.series.map((series) => {
    const points = series.points.filter((p) => Date.parse(p.at) >= from && Date.parse(p.at) <= to);
    if (series.valueType !== "NUMBER") {
      const anchor = series.points.findLast((p) => Date.parse(p.at) < from);
      if (anchor) points.unshift({ ...anchor, at: new Date(from).toISOString() });
    }
    return { ...series, points };
  });
}

const STATE_HISTORY_QUERY = graphql(`
  query StateHistory($filter: StateHistoryFilter!) {
    stateHistory(filter: $filter) {
      deviceId
      field
      valueType
      points {
        at
        numberValue
        booleanValue
        textValue
      }
    }
  }
`);

const AGGREGATED_STATE_HISTORY_QUERY = graphql(`
  query AggregatedStateHistory($filter: AggregatedStateHistoryFilter!) {
    aggregatedStateHistory(filter: $filter) {
      field
      points {
        at
        value
      }
    }
  }
`);

/** Maintains one live query per distinct source and semantic history filter. */
export function createStateHistory(client: Client) {
  const results = new SvelteMap<string, SourceResult>();
  const active = new Map<string, { key: string; stop: () => void }>();

  function clear(): void {
    for (const query of active.values()) query.stop();
    active.clear();
    results.clear();
  }

  resetters.add(clear);

  function update(request: HistoryRequest): void {
    if (request.enabled === false) {
      clear();
      return;
    }
    const fields = request.fields?.length ? [...new Set(request.fields)].sort() : null;
    const bucketSeconds =
      request.bucketSeconds && request.bucketSeconds > 0 ? request.bucketSeconds : null;
    const from = request.from.getTime();
    const to = request.to.getTime();
    const filter = {
      fields,
      bucketSeconds,
      from: request.from.toISOString(),
      to: request.to.toISOString(),
    };
    const filterKey = JSON.stringify([fields, bucketSeconds, from, to, !!request.rollingSnapshot]);
    const selected = new Set(request.sources.map(sourceKey));
    for (const [key, query] of active) {
      if (selected.has(key)) continue;
      query.stop();
      active.delete(key);
      results.delete(key);
    }

    for (const source of request.sources) {
      const key = sourceKey(source);
      const previous = active.get(key);
      if (previous?.key === filterKey) continue;
      previous?.stop();
      const requestKey = JSON.stringify([key, filterKey]);
      const knownRequests = sessionRequests.get(client) ?? new Set<string>();
      // An urql client can outlive authentication; only reuse this session's entries.
      const requestPolicy = knownRequests.has(requestKey) ? "cache-and-network" : "network-only";
      knownRequests.delete(requestKey);
      knownRequests.add(requestKey);
      if (knownRequests.size > MAX_SNAPSHOTS)
        knownRequests.delete(knownRequests.values().next().value!);
      sessionRequests.set(client, knownRequests);
      const snapshotKey = JSON.stringify([key, fields, bucketSeconds, to - from]);
      const cached = request.rollingSnapshot ? readSnapshot(snapshotKey, from, to) : undefined;
      results.set(key, { series: cached ?? [], loaded: cached !== undefined, fetching: true });

      let stopped = false;
      function receive(
        series: HistorySeries[] | undefined,
        fetching: boolean,
        error?: CombinedError,
      ): void {
        if (stopped) return;
        const previousResult = results.get(key)!;
        results.set(key, {
          series: series ?? previousResult.series,
          loaded: series !== undefined || previousResult.loaded,
          fetching,
          error,
        });
        if (request.rollingSnapshot && series !== undefined && !error && !fetching) {
          rememberSnapshot(snapshotKey, { from, to, series });
        }
      }

      let unsubscribe: () => void;
      if (source.kind === "device") {
        const query = queryStore({
          client,
          query: STATE_HISTORY_QUERY,
          variables: { filter: { ...filter, deviceIds: [source.id] } },
          requestPolicy,
        });
        unsubscribe = query.subscribe((result) => {
          receive(
            result.data?.stateHistory.map((series) => ({
              field: series.field,
              valueType: series.valueType,
              points: series.points.map((p) => ({
                at: p.at as string,
                value: p.numberValue ?? p.booleanValue ?? p.textValue ?? "",
              })),
            })),
            result.fetching || result.stale || result.hasNext,
            result.error,
          );
        });
      } else {
        const target =
          source.kind === "apartment"
            ? { type: AggregatedHistoryTargetType.Apartment }
            : {
                type:
                  source.kind === "room"
                    ? AggregatedHistoryTargetType.Room
                    : AggregatedHistoryTargetType.Group,
                id: source.id,
              };
        const query = queryStore({
          client,
          query: AGGREGATED_STATE_HISTORY_QUERY,
          variables: { filter: { ...filter, target } },
          requestPolicy,
        });
        unsubscribe = query.subscribe((result) => {
          receive(
            result.data?.aggregatedStateHistory.map((series) => ({
              field: series.field,
              valueType: "NUMBER",
              points: series.points.map((p) => ({ at: p.at as string, value: p.value })),
            })),
            result.fetching || result.stale || result.hasNext,
            result.error,
          );
        });
      }
      active.set(key, {
        key: filterKey,
        stop() {
          stopped = true;
          unsubscribe();
        },
      });
    }
  }

  return {
    results,
    get fetching() {
      return [...results.values()].some((r) => r.fetching);
    },
    get loaded() {
      return [...results.values()].some((r) => r.loaded);
    },
    get error() {
      return [...results.values()].find((r) => r.error)?.error;
    },
    update,
    destroy() {
      clear();
      resetters.delete(clear);
    },
  };
}
