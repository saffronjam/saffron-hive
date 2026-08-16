import { describe, it, expect, beforeEach } from "vitest";
import {
  CACHE_KEY_PREFIX,
  cacheKey,
  clearAllSnapshots,
  clearSnapshot,
  loadSnapshot,
  saveSnapshot,
} from "$lib/entity-cache";

interface Row {
  id: string;
  name: string;
}

const VERSION = 1;
const rows: Row[] = [
  { id: "a", name: "Kitchen" },
  { id: "b", name: "Hallway" },
];

beforeEach(() => {
  localStorage.clear();
});

describe("cacheKey", () => {
  it("namespaces under the shared prefix", () => {
    expect(cacheKey("rooms")).toBe(`${CACHE_KEY_PREFIX}rooms`);
  });
});

describe("loadSnapshot", () => {
  it("returns null for null storage", () => {
    expect(loadSnapshot<Row>(null, "rooms", VERSION)).toBeNull();
  });

  it("returns null for undefined storage", () => {
    expect(loadSnapshot<Row>(undefined, "rooms", VERSION)).toBeNull();
  });

  it("returns null when the key is missing", () => {
    expect(loadSnapshot<Row>(localStorage, "rooms", VERSION)).toBeNull();
  });

  it("returns null for an empty string", () => {
    localStorage.setItem(cacheKey("rooms"), "");
    expect(loadSnapshot<Row>(localStorage, "rooms", VERSION)).toBeNull();
  });

  it("returns null for malformed JSON", () => {
    localStorage.setItem(cacheKey("rooms"), "{not json");
    expect(loadSnapshot<Row>(localStorage, "rooms", VERSION)).toBeNull();
  });

  it("returns null for array JSON", () => {
    localStorage.setItem(cacheKey("rooms"), JSON.stringify([1, 2, 3]));
    expect(loadSnapshot<Row>(localStorage, "rooms", VERSION)).toBeNull();
  });

  it("returns null for primitive JSON", () => {
    localStorage.setItem(cacheKey("rooms"), JSON.stringify(42));
    expect(loadSnapshot<Row>(localStorage, "rooms", VERSION)).toBeNull();
  });

  it("returns null for the literal null", () => {
    localStorage.setItem(cacheKey("rooms"), "null");
    expect(loadSnapshot<Row>(localStorage, "rooms", VERSION)).toBeNull();
  });

  it("returns null when items is not an array", () => {
    localStorage.setItem(cacheKey("rooms"), JSON.stringify({ v: VERSION, items: {} }));
    expect(loadSnapshot<Row>(localStorage, "rooms", VERSION)).toBeNull();
  });

  it("discards a snapshot written under a different version", () => {
    saveSnapshot(localStorage, "rooms", 1, rows);
    expect(loadSnapshot<Row>(localStorage, "rooms", 2)).toBeNull();
  });

  it("reads back a snapshot written at the same version", () => {
    saveSnapshot(localStorage, "rooms", VERSION, rows);
    expect(loadSnapshot<Row>(localStorage, "rooms", VERSION)).toEqual(rows);
  });

  it("distinguishes a cached empty list from a missing entry", () => {
    saveSnapshot<Row>(localStorage, "rooms", VERSION, []);
    expect(loadSnapshot<Row>(localStorage, "rooms", VERSION)).toEqual([]);
    expect(loadSnapshot<Row>(localStorage, "groups", VERSION)).toBeNull();
  });
});

describe("saveSnapshot", () => {
  it("no-ops for null storage", () => {
    expect(() => saveSnapshot<Row>(null, "rooms", VERSION, rows)).not.toThrow();
  });

  it("overwrites a previous snapshot", () => {
    saveSnapshot(localStorage, "rooms", VERSION, rows);
    saveSnapshot(localStorage, "rooms", VERSION, [{ id: "c", name: "Office" }]);
    expect(loadSnapshot<Row>(localStorage, "rooms", VERSION)).toEqual([
      { id: "c", name: "Office" },
    ]);
  });

  it("stays silent when the write throws", () => {
    const failing = {
      getItem: () => null,
      setItem: () => {
        throw new DOMException("QuotaExceededError");
      },
      removeItem: () => {},
      key: () => null,
      clear: () => {},
      length: 0,
    } as unknown as Storage;
    expect(() => saveSnapshot(failing, "rooms", VERSION, rows)).not.toThrow();
  });

  it("keeps entities separate by name", () => {
    saveSnapshot(localStorage, "rooms", VERSION, rows);
    saveSnapshot(localStorage, "groups", VERSION, [{ id: "g1", name: "Lamps" }]);
    expect(loadSnapshot<Row>(localStorage, "rooms", VERSION)).toEqual(rows);
    expect(loadSnapshot<Row>(localStorage, "groups", VERSION)).toEqual([
      { id: "g1", name: "Lamps" },
    ]);
  });
});

describe("clearSnapshot", () => {
  it("drops only the named entity", () => {
    saveSnapshot(localStorage, "rooms", VERSION, rows);
    saveSnapshot(localStorage, "groups", VERSION, rows);
    clearSnapshot(localStorage, "rooms");
    expect(loadSnapshot<Row>(localStorage, "rooms", VERSION)).toBeNull();
    expect(loadSnapshot<Row>(localStorage, "groups", VERSION)).toEqual(rows);
  });

  it("no-ops for null storage", () => {
    expect(() => clearSnapshot(null, "rooms")).not.toThrow();
  });
});

describe("clearAllSnapshots", () => {
  it("drops every cached entity but leaves unrelated keys alone", () => {
    saveSnapshot(localStorage, "rooms", VERSION, rows);
    saveSnapshot(localStorage, "groups", VERSION, rows);
    saveSnapshot(localStorage, "scenes", VERSION, rows);
    localStorage.setItem("hive.token", "jwt");
    localStorage.setItem("saffron-hive-theme", "dark");

    clearAllSnapshots(localStorage);

    expect(loadSnapshot<Row>(localStorage, "rooms", VERSION)).toBeNull();
    expect(loadSnapshot<Row>(localStorage, "groups", VERSION)).toBeNull();
    expect(loadSnapshot<Row>(localStorage, "scenes", VERSION)).toBeNull();
    expect(localStorage.getItem("hive.token")).toBe("jwt");
    expect(localStorage.getItem("saffron-hive-theme")).toBe("dark");
  });

  it("no-ops for null storage", () => {
    expect(() => clearAllSnapshots(null)).not.toThrow();
  });
});
