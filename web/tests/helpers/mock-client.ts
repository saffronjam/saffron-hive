import type { Client } from "@urql/svelte";

interface QueryResult {
  data?: unknown;
  error?: { message: string; graphQLErrors?: Array<{ message: string }> };
}

interface SubscriptionSink {
  (result: { data?: unknown }): void;
}

/**
 * Minimal stand-in for an urql `Client`, covering the two calls the shared
 * stores make: `query(doc, vars, opts).toPromise()` and
 * `subscription(doc, vars).subscribe(sink)`.
 *
 * Queued results are consumed in order; once the queue is empty the last
 * queued result repeats, so a store can refresh more than once
 * without the test having to queue one result per refresh.
 */
export function createMockClient() {
  const queue: QueryResult[] = [];
  const mutationQueue: QueryResult[] = [];
  let last: QueryResult = { data: undefined };
  const sinks = new Set<SubscriptionSink>();

  const queries: Array<{ variables: unknown; requestPolicy: string | undefined }> = [];
  const mutations: Array<{ variables: unknown }> = [];
  let unsubscribeCount = 0;

  const client = {
    query(_doc: unknown, variables: unknown, opts?: { requestPolicy?: string }) {
      queries.push({ variables, requestPolicy: opts?.requestPolicy });
      const result = queue.shift() ?? last;
      if (queue.length === 0) last = result;
      return { toPromise: () => Promise.resolve(result) };
    },
    subscription(_doc: unknown, _variables: unknown) {
      return {
        subscribe(sink: SubscriptionSink) {
          sinks.add(sink);
          return {
            unsubscribe() {
              sinks.delete(sink);
              unsubscribeCount++;
            },
          };
        },
      };
    },
    mutation(_doc: unknown, variables: unknown) {
      mutations.push({ variables });
      const result = mutationQueue.shift() ?? { data: undefined };
      return { toPromise: () => Promise.resolve(result) };
    },
  };

  return {
    /** Pass to `store.start(...)`. */
    client: client as unknown as Client,
    /** Queue one result for the next `query` call. */
    queueResult(result: QueryResult) {
      queue.push(result);
      last = result;
    },
    queueMutationResult(result: QueryResult) {
      mutationQueue.push(result);
    },
    /** Deliver a payload to every live subscription sink. */
    emit(data: unknown) {
      for (const sink of sinks) sink({ data });
    },
    get queryCount() {
      return queries.length;
    },
    get queries() {
      return queries;
    },
    get activeSubscriptions() {
      return sinks.size;
    },
    get mutations() {
      return mutations;
    },
    get unsubscribeCount() {
      return unsubscribeCount;
    },
  };
}
