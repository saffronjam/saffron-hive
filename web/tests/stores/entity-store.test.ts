import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import type { AnyVariables, TypedDocumentNode } from "@urql/svelte";
import { createEntityStore } from "$lib/stores/entity-store.svelte";
import { cacheKey, loadSnapshot, saveSnapshot } from "$lib/entity-cache";
import { createMockClient } from "../helpers/mock-client";

interface Room {
  id: string;
  name: string;
}

interface RoomsData {
  rooms: Room[];
}

const QUERY = {} as TypedDocumentNode<RoomsData, AnyVariables>;

function makeStore(version = 1) {
  return createEntityStore<Room, RoomsData>({
    name: "test-rooms",
    version,
    query: QUERY,
    select: (data) => data.rooms,
  });
}

const kitchen: Room = { id: "r1", name: "Kitchen" };
const hallway: Room = { id: "r2", name: "Hallway" };

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("hydration", () => {
  it("starts empty and unhydrated with no snapshot", () => {
    const store = makeStore();
    expect(store.items).toEqual([]);
    expect(store.hydrated).toBe(false);
  });

  it("restores a snapshot synchronously at construction", () => {
    saveSnapshot(localStorage, "test-rooms", 1, [kitchen, hallway]);
    const store = makeStore();
    expect(store.items).toEqual([kitchen, hallway]);
    expect(store.hydrated).toBe(true);
  });

  it("treats a cached empty list as hydrated", () => {
    saveSnapshot<Room>(localStorage, "test-rooms", 1, []);
    const store = makeStore();
    expect(store.items).toEqual([]);
    expect(store.hydrated).toBe(true);
  });

  it("ignores a snapshot written under a different version", () => {
    saveSnapshot(localStorage, "test-rooms", 1, [kitchen]);
    const store = makeStore(2);
    expect(store.items).toEqual([]);
    expect(store.hydrated).toBe(false);
  });
});

describe("start", () => {
  it("fetches and replaces the list", async () => {
    const mock = createMockClient();
    mock.queueResult({ data: { rooms: [kitchen, hallway] } });
    const store = makeStore();

    await store.start(mock.client);

    expect(store.items).toEqual([kitchen, hallway]);
    expect(store.hydrated).toBe(true);
    expect(mock.queryCount).toBe(1);
    store.stop();
  });

  it("goes to the network rather than urql's document cache", async () => {
    const mock = createMockClient();
    mock.queueResult({ data: { rooms: [] } });
    const store = makeStore();

    await store.start(mock.client);

    expect(mock.queries[0].requestPolicy).toBe("network-only");
    store.stop();
  });

  it("no-ops on a second call so a re-firing layout effect is safe", async () => {
    const mock = createMockClient();
    mock.queueResult({ data: { rooms: [kitchen] } });
    const store = makeStore();

    await store.start(mock.client);
    await store.start(mock.client);

    expect(mock.queryCount).toBe(1);
    store.stop();
  });

  it("latches before the first await so concurrent calls fetch once", async () => {
    const mock = createMockClient();
    mock.queueResult({ data: { rooms: [kitchen] } });
    const store = makeStore();

    await Promise.all([store.start(mock.client), store.start(mock.client)]);

    expect(mock.queryCount).toBe(1);
    store.stop();
  });

  it("surfaces an error and stays unhydrated when the query fails", async () => {
    const mock = createMockClient();
    mock.queueResult({ error: { message: "[Network] offline" } });
    const store = makeStore();

    await store.start(mock.client);

    expect(store.error).toBe("offline");
    expect(store.hydrated).toBe(false);
    expect(store.items).toEqual([]);
    store.stop();
  });

  it("keeps a restored snapshot visible when the revalidate fails", async () => {
    saveSnapshot(localStorage, "test-rooms", 1, [kitchen]);
    const mock = createMockClient();
    mock.queueResult({ error: { message: "[Network] offline" } });
    const store = makeStore();

    await store.start(mock.client);

    expect(store.items).toEqual([kitchen]);
    expect(store.hydrated).toBe(true);
    store.stop();
  });

  it("clears a previous error on a successful refresh", async () => {
    const mock = createMockClient();
    mock.queueResult({ error: { message: "[Network] offline" } });
    const store = makeStore();
    await store.start(mock.client);
    expect(store.error).not.toBeNull();

    mock.queueResult({ data: { rooms: [kitchen] } });
    await store.refresh(mock.client);

    expect(store.error).toBeNull();
    store.stop();
  });
});

describe("stop", () => {
  it("re-arms start so the next session hydrates again", async () => {
    const mock = createMockClient();
    mock.queueResult({ data: { rooms: [kitchen] } });
    const store = makeStore();

    await store.start(mock.client);
    store.stop();
    mock.queueResult({ data: { rooms: [hallway] } });
    await store.start(mock.client);

    expect(mock.queryCount).toBe(2);
    expect(store.items).toEqual([hallway]);
    store.stop();
  });

  it("detaches the revalidate listeners", async () => {
    const removeSpy = vi.spyOn(window, "removeEventListener");
    const mock = createMockClient();
    mock.queueResult({ data: { rooms: [] } });
    const store = makeStore();

    await store.start(mock.client);
    store.stop();

    expect(removeSpy).toHaveBeenCalledWith("focus", expect.any(Function));
    removeSpy.mockRestore();
  });
});

describe("local mutations", () => {
  it("upsert appends a new entity", () => {
    const store = makeStore();
    store.upsert(kitchen);
    expect(store.items).toEqual([kitchen]);
  });

  it("upsert replaces an existing entity in place", () => {
    const store = makeStore();
    store.replaceAll([kitchen, hallway]);
    store.upsert({ id: "r1", name: "Kitchen renamed" });
    expect(store.items).toEqual([{ id: "r1", name: "Kitchen renamed" }, hallway]);
  });

  it("remove drops one entity", () => {
    const store = makeStore();
    store.replaceAll([kitchen, hallway]);
    store.remove("r1");
    expect(store.items).toEqual([hallway]);
  });

  it("remove ignores an unknown id", () => {
    const store = makeStore();
    store.replaceAll([kitchen]);
    store.remove("nope");
    expect(store.items).toEqual([kitchen]);
  });

  it("removeMany drops every listed entity", () => {
    const store = makeStore();
    store.replaceAll([kitchen, hallway, { id: "r3", name: "Office" }]);
    store.removeMany(["r1", "r3"]);
    expect(store.items).toEqual([hallway]);
  });

  it("byId indexes the current list", () => {
    const store = makeStore();
    store.replaceAll([kitchen, hallway]);
    expect(store.byId.get("r2")).toEqual(hallway);
    store.remove("r2");
    expect(store.byId.get("r2")).toBeUndefined();
  });
});

describe("persistence", () => {
  it("writes a snapshot after the debounce settles", () => {
    vi.useFakeTimers();
    const store = makeStore();
    store.replaceAll([kitchen]);
    expect(loadSnapshot<Room>(localStorage, "test-rooms", 1)).toBeNull();

    vi.advanceTimersByTime(250);

    expect(loadSnapshot<Room>(localStorage, "test-rooms", 1)).toEqual([kitchen]);
  });

  it("flushes a pending write on stop", async () => {
    const mock = createMockClient();
    mock.queueResult({ data: { rooms: [kitchen] } });
    const store = makeStore();
    await store.start(mock.client);

    store.stop();

    expect(loadSnapshot<Room>(localStorage, "test-rooms", 1)).toEqual([kitchen]);
  });

  it("survives into a freshly constructed store", async () => {
    const mock = createMockClient();
    mock.queueResult({ data: { rooms: [kitchen, hallway] } });
    const first = makeStore();
    await first.start(mock.client);
    first.stop();

    const second = makeStore();
    expect(second.items).toEqual([kitchen, hallway]);
    expect(second.hydrated).toBe(true);
  });
});

describe("clear", () => {
  it("empties memory and disk", async () => {
    const mock = createMockClient();
    mock.queueResult({ data: { rooms: [kitchen] } });
    const store = makeStore();
    await store.start(mock.client);
    store.stop();

    store.clear();

    expect(store.items).toEqual([]);
    expect(store.hydrated).toBe(false);
    expect(localStorage.getItem(cacheKey("test-rooms"))).toBeNull();
  });

  it("drops a pending write so cleared data cannot land on disk afterwards", () => {
    vi.useFakeTimers();
    const store = makeStore();
    store.replaceAll([kitchen]);

    store.clear();
    vi.advanceTimersByTime(500);

    expect(localStorage.getItem(cacheKey("test-rooms"))).toBeNull();
  });
});
