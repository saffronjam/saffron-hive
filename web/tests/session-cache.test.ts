import { beforeEach, describe, expect, it } from "vitest";
import {
  SESSION_CACHE_KEY_PREFIX,
  boundSessionSnapshotList,
  clearAllSessionSnapshots,
  loadSessionSnapshot,
  saveSessionSnapshot,
  sessionSnapshotByteLength,
  sessionSnapshotKey,
} from "$lib/session-cache";

beforeEach(() => sessionStorage.clear());

describe("session snapshots", () => {
  it("round-trips matching versions and isolates names", () => {
    saveSessionSnapshot(sessionStorage, "users", 2, [{ id: "u1" }]);
    saveSessionSnapshot(sessionStorage, "alarms", 1, [{ id: "a1" }]);
    expect(loadSessionSnapshot(sessionStorage, "users", 2)).toEqual([{ id: "u1" }]);
    expect(loadSessionSnapshot(sessionStorage, "users", 1)).toBeNull();
    expect(loadSessionSnapshot(sessionStorage, "alarms", 1)).toEqual([{ id: "a1" }]);
  });

  it("degrades silently for malformed and unavailable storage", () => {
    sessionStorage.setItem(sessionSnapshotKey("users"), "{bad json");
    expect(loadSessionSnapshot(sessionStorage, "users", 1)).toBeNull();
    expect(loadSessionSnapshot(null, "users", 1)).toBeNull();
    const blocked = {
      getItem: () => {
        throw new DOMException("blocked");
      },
      setItem: () => {
        throw new DOMException("quota");
      },
      removeItem: () => {},
      key: () => null,
      clear: () => {},
      length: 0,
    } as unknown as Storage;
    expect(loadSessionSnapshot(blocked, "users", 1)).toBeNull();
    expect(saveSessionSnapshot(blocked, "users", 1, [])).toBe(false);
  });

  it("refuses snapshots above the byte ceiling", () => {
    const value = ["å".repeat(20)];
    const bytes = sessionSnapshotByteLength(1, value);
    expect(saveSessionSnapshot(sessionStorage, "activity-basic", 1, value, bytes - 1)).toBe(false);
    expect(sessionStorage.getItem(sessionSnapshotKey("activity-basic"))).toBeNull();
    expect(saveSessionSnapshot(sessionStorage, "activity-basic", 1, value, bytes)).toBe(true);
  });

  it("bounds list snapshots by item count and serialized bytes", () => {
    const rows = Array.from({ length: 600 }, (_, id) => ({ id, payload: "x".repeat(100) }));
    const countBounded = boundSessionSnapshotList(1, rows, 500, 2 * 1024 * 1024);
    expect(countBounded).toHaveLength(500);
    expect(countBounded[0].id).toBe(0);
    expect(countBounded[499].id).toBe(499);

    const byteBounded = boundSessionSnapshotList(1, rows, 500, 10_000);
    expect(byteBounded.length).toBeLessThan(500);
    expect(sessionSnapshotByteLength(1, byteBounded)).toBeLessThanOrEqual(10_000);
    expect(byteBounded.map((row) => row.id)).toEqual(
      Array.from({ length: byteBounded.length }, (_, id) => id),
    );
  });

  it("clears only tab snapshots", () => {
    saveSessionSnapshot(sessionStorage, "users", 1, []);
    saveSessionSnapshot(sessionStorage, "integrations", 1, []);
    sessionStorage.setItem("unrelated", "keep");
    clearAllSessionSnapshots(sessionStorage);
    expect(sessionStorage.getItem(`${SESSION_CACHE_KEY_PREFIX}users`)).toBeNull();
    expect(sessionStorage.getItem(`${SESSION_CACHE_KEY_PREFIX}integrations`)).toBeNull();
    expect(sessionStorage.getItem("unrelated")).toBe("keep");
  });
});
