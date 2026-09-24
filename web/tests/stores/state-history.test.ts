import { afterEach, describe, expect, it, vi } from "vitest";
import { Client, cacheExchange, fetchExchange } from "@urql/core";
import {
  clearStateHistory,
  createStateHistory,
  type HistoryRequest,
} from "$lib/stores/state-history.svelte";

const from = new Date("2026-09-23T18:00:00.000Z");
const to = new Date("2026-09-24T06:00:00.000Z");
const at = "2026-09-24T05:00:00.000Z";
const stores: ReturnType<typeof createStateHistory>[] = [];

function network() {
  const requests: {
    variables: { filter: { fields: string[] | null; from: string; to: string } };
    signal?: AbortSignal | null;
    resolve: (response: Response) => void;
  }[] = [];
  const client = new Client({
    url: "http://localhost/graphql",
    preferGetMethod: false,
    exchanges: [cacheExchange, fetchExchange],
    fetch: (_input, init) =>
      new Promise<Response>((resolve) => {
        const body = JSON.parse(init!.body as string) as {
          variables: (typeof requests)[number]["variables"];
        };
        requests.push({ variables: body.variables, signal: init?.signal, resolve });
      }),
  });
  function store() {
    const result = createStateHistory(client);
    stores.push(result);
    return result;
  }
  function respond(index: number, data: unknown) {
    requests[index].resolve(
      new Response(JSON.stringify(data), {
        headers: { "Content-Type": "application/json" },
      }),
    );
  }
  return { requests, store, respond };
}

function request(overrides: Partial<HistoryRequest> = {}): HistoryRequest {
  return {
    sources: [{ kind: "room", id: "balcony", name: "Balcony" }],
    fields: ["temperature", "humidity"],
    from,
    to,
    ...overrides,
  };
}

function numeric(value = 18.1) {
  return {
    data: {
      aggregatedStateHistory: [
        {
          __typename: "AggregatedSeries",
          field: "temperature",
          points: [{ __typename: "NumericSeriesPoint", at, value }],
        },
      ],
    },
  };
}

afterEach(() => {
  for (const store of stores.splice(0)) store.destroy();
  clearStateHistory();
});

describe("history requests", () => {
  it("ignores equivalent arrays, field order, duplicate sources, names and unspecified resolution", async () => {
    const net = network();
    const history = net.store();
    history.update(request());
    await vi.waitFor(() => expect(net.requests).toHaveLength(1));
    net.respond(0, numeric());
    await vi.waitFor(() => expect(history.loaded).toBe(true));
    history.update(
      request({
        sources: [
          { kind: "room", id: "balcony", name: "Renamed" },
          { kind: "room", id: "balcony", name: "Duplicate" },
        ],
        fields: ["humidity", "temperature", "temperature"],
        bucketSeconds: 0,
        from: new Date(from),
        to: new Date(to),
      }),
    );
    expect(history.fetching).toBe(false);
    expect(net.requests).toHaveLength(1);
  });

  it("releases obsolete requests and accepts only the current selection", async () => {
    const net = network();
    const history = net.store();
    history.update(request());
    await vi.waitFor(() => expect(net.requests).toHaveLength(1));
    history.update(request({ fields: ["temperature"], bucketSeconds: 300 }));
    await vi.waitFor(() => expect(net.requests).toHaveLength(2));
    expect(net.requests[0].signal?.aborted).toBe(true);
    net.respond(1, numeric(22));
    await vi.waitFor(() => expect(history.fetching).toBe(false));
    net.respond(0, numeric(99));
    expect(history.results.get("room:balcony")?.series[0].points[0].value).toBe(22);
    history.update(request({ enabled: false }));
    expect(history.results.size).toBe(0);
  });

  it("renders individual sources without waiting for other responses", async () => {
    const net = network();
    const history = net.store();
    history.update(
      request({
        sources: [{ kind: "room", id: "balcony", name: "Balcony" }, { kind: "apartment" }],
      }),
    );
    await vi.waitFor(() => expect(net.requests).toHaveLength(2));
    net.respond(0, numeric());
    await vi.waitFor(() => expect(history.loaded).toBe(true));
    expect(history.fetching).toBe(true);
    expect(history.results.get("room:balcony")?.series).toHaveLength(1);
    history.update(request());
    expect(net.requests[1].signal?.aborted).toBe(true);
    expect(net.requests).toHaveLength(2);
  });

  it("shows urql's exact cached result while revalidating", async () => {
    const net = network();
    const first = net.store();
    first.update(request());
    await vi.waitFor(() => expect(net.requests).toHaveLength(1));
    net.respond(0, numeric());
    await vi.waitFor(() => expect(first.loaded).toBe(true));
    first.destroy();
    const second = net.store();
    second.update(request());
    expect(second.loaded).toBe(true);
    expect(second.results.get("room:balcony")?.series[0].points[0].value).toBe(18.1);
    await vi.waitFor(() => expect(net.requests).toHaveLength(2));
    expect(second.fetching).toBe(true);
  });

  it("preserves boolean false and text device series", async () => {
    const net = network();
    const history = net.store();
    history.update(request({ sources: [{ kind: "device", id: "door" }] }));
    await vi.waitFor(() => expect(net.requests).toHaveLength(1));
    net.respond(0, {
      data: {
        stateHistory: [
          {
            deviceId: "door",
            field: "contact",
            valueType: "BOOLEAN",
            points: [{ at, numberValue: null, booleanValue: false, textValue: null }],
          },
          {
            deviceId: "door",
            field: "orientation",
            valueType: "TEXT",
            points: [{ at, numberValue: null, booleanValue: null, textValue: "up" }],
          },
        ],
      },
    });
    await vi.waitFor(() => expect(history.loaded).toBe(true));
    expect(history.results.get("dev:door")?.series.map((s) => s.points[0].value)).toEqual([
      false,
      "up",
    ]);
  });
});

describe("rolling popover snapshots", () => {
  it("shows the last window immediately on reopen and refreshes once", async () => {
    const net = network();
    const history = net.store();
    history.update(request({ rollingSnapshot: true }));
    await vi.waitFor(() => expect(net.requests).toHaveLength(1));
    net.respond(0, numeric());
    await vi.waitFor(() => expect(history.loaded).toBe(true));
    history.update(request({ enabled: false }));
    const reopened = request({
      rollingSnapshot: true,
      from: new Date(+from + 1000),
      to: new Date(+to + 1000),
    });
    history.update(reopened);
    expect(history.loaded).toBe(true);
    expect(history.fetching).toBe(true);
    expect(history.results.get("room:balcony")?.series[0].points[0].at).toBe(at);
    await vi.waitFor(() => expect(net.requests).toHaveLength(2));
    expect(net.requests[1].variables.filter.to).toBe(reopened.to.toISOString());
    history.update({ ...reopened, sources: [...reopened.sources], fields: [...reopened.fields!] });
    expect(net.requests).toHaveLength(2);
    net.respond(1, { errors: [{ message: "Temporarily unavailable" }] });
    await vi.waitFor(() => expect(history.error).toBeDefined());
    expect(history.loaded).toBe(true);
    expect(history.results.get("room:balcony")?.series[0].points[0].value).toBe(18.1);
  });

  it("recognizes cached empty results and never supplies rolling data to exact ranges", async () => {
    const net = network();
    const history = net.store();
    history.update(request({ rollingSnapshot: true }));
    await vi.waitFor(() => expect(net.requests).toHaveLength(1));
    net.respond(0, { data: { aggregatedStateHistory: [] } });
    await vi.waitFor(() => expect(history.loaded).toBe(true));
    const next = request({ from: new Date(+from + 1000), to: new Date(+to + 1000) });
    history.update({ ...next, rollingSnapshot: true });
    expect(history.loaded).toBe(true);
    expect(history.results.get("room:balcony")?.series).toEqual([]);
    history.update({ ...next, to: new Date(+to + 2000) });
    expect(history.loaded).toBe(false);
  });

  it("rejects nonoverlapping snapshots and clears active work on session teardown", async () => {
    const net = network();
    const history = net.store();
    history.update(request({ rollingSnapshot: true }));
    await vi.waitFor(() => expect(net.requests).toHaveLength(1));
    net.respond(0, numeric());
    await vi.waitFor(() => expect(history.loaded).toBe(true));
    const next = request({
      rollingSnapshot: true,
      from: new Date(+from + 86400000),
      to: new Date(+to + 86400000),
    });
    history.update(next);
    expect(history.loaded).toBe(false);
    await vi.waitFor(() => expect(net.requests).toHaveLength(2));
    clearStateHistory();
    expect(history.results.size).toBe(0);
    expect(net.requests[1].signal?.aborted).toBe(true);
    net.respond(1, numeric(99));
    history.update(
      request({ rollingSnapshot: true, from: new Date(+from + 1000), to: new Date(+to + 1000) }),
    );
    expect(history.loaded).toBe(false);
  });

  it("caps snapshots at 64 entries", async () => {
    const net = network();
    const history = net.store();
    for (let i = 0; i < 65; i++) {
      history.update(
        request({
          rollingSnapshot: true,
          sources: [{ kind: "group", id: String(i), name: "Group" }],
        }),
      );
      await vi.waitFor(() => expect(net.requests).toHaveLength(i + 1), { interval: 1 });
      net.respond(i, numeric());
      await vi.waitFor(() => expect(history.fetching).toBe(false), { interval: 1 });
    }
    const moved = { rollingSnapshot: true, from: new Date(+from + 1000), to: new Date(+to + 1000) };
    history.update(request({ ...moved, sources: [{ kind: "group", id: "0", name: "Group" }] }));
    expect(history.loaded).toBe(false);
    history.update(request({ ...moved, sources: [{ kind: "group", id: "64", name: "Group" }] }));
    expect(history.loaded).toBe(true);
  });

  it("does not expose urql data from an ended authenticated session", async () => {
    const net = network();
    const history = net.store();
    history.update(request({ rollingSnapshot: true }));
    await vi.waitFor(() => expect(net.requests).toHaveLength(1));
    net.respond(0, numeric());
    await vi.waitFor(() => expect(history.loaded).toBe(true));
    clearStateHistory();
    history.update(request({ rollingSnapshot: true }));
    expect(history.loaded).toBe(false);
    expect(history.results.get("room:balcony")?.series).toEqual([]);
    await vi.waitFor(() => expect(net.requests).toHaveLength(2));
  });
});
