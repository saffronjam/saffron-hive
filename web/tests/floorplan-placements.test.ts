import { describe, expect, it } from "vitest";
import {
  applyPlacement,
  needsConfirmation,
  placementConflicts,
  placementKey,
  type Placement,
  type PlacementRef,
} from "$lib/floorplan/placement-conflicts";

/** Group "g-lamps" holds d-1 and d-2; "g-all" holds those plus d-3. */
const MEMBERS: Record<string, string[]> = {
  "device:d-1": ["d-1"],
  "device:d-2": ["d-2"],
  "device:d-3": ["d-3"],
  "group:g-lamps": ["d-1", "d-2"],
  "group:g-all": ["d-1", "d-2", "d-3"],
  "group:g-empty": [],
};

const devicesOf = (ref: PlacementRef) => MEMBERS[placementKey(ref)] ?? [];

function at(memberType: "device" | "group", memberId: string, x = 0, y = 0): Placement {
  return { memberType, memberId, x, y };
}

describe("placementConflicts", () => {
  it("reports nothing when the incoming placement shares no device", () => {
    const conflict = placementConflicts(
      { memberType: "device", memberId: "d-3" },
      [at("device", "d-1"), at("device", "d-2")],
      devicesOf,
    );
    expect(conflict.displaced).toEqual([]);
    expect(conflict.sharedDeviceIds).toEqual([]);
  });

  it("displaces individually placed members when a group is dropped", () => {
    const conflict = placementConflicts(
      { memberType: "group", memberId: "g-lamps" },
      [at("device", "d-1"), at("device", "d-2"), at("device", "d-3")],
      devicesOf,
    );
    expect(conflict.displaced.map((p) => p.memberId).sort()).toEqual(["d-1", "d-2"]);
    expect(conflict.sharedDeviceIds.sort()).toEqual(["d-1", "d-2"]);
  });

  it("displaces a covering group when one of its devices is dropped", () => {
    const conflict = placementConflicts(
      { memberType: "device", memberId: "d-1" },
      [at("group", "g-lamps")],
      devicesOf,
    );
    expect(conflict.displaced.map(placementKey)).toEqual(["group:g-lamps"]);
    expect(conflict.sharedDeviceIds).toEqual(["d-1"]);
  });

  it("treats re-placing the same ref as a move, not a conflict", () => {
    const incoming = { memberType: "device" as const, memberId: "d-1" };
    const conflict = placementConflicts(incoming, [at("device", "d-1", 5, 5)], devicesOf);
    expect(conflict.displaced).toHaveLength(1);
    expect(needsConfirmation(incoming, conflict)).toBe(false);
  });

  it("asks for confirmation only when something else is displaced", () => {
    const incoming = { memberType: "group" as const, memberId: "g-lamps" };
    expect(needsConfirmation(incoming, placementConflicts(incoming, [], devicesOf))).toBe(false);
    expect(
      needsConfirmation(incoming, placementConflicts(incoming, [at("device", "d-1")], devicesOf)),
    ).toBe(true);
  });

  it("displaces an overlapping group when a wider group is dropped", () => {
    const conflict = placementConflicts(
      { memberType: "group", memberId: "g-all" },
      [at("group", "g-lamps")],
      devicesOf,
    );
    expect(conflict.displaced.map(placementKey)).toEqual(["group:g-lamps"]);
  });

  it("leaves an empty group alone", () => {
    const conflict = placementConflicts(
      { memberType: "group", memberId: "g-empty" },
      [at("device", "d-1")],
      devicesOf,
    );
    expect(conflict.displaced).toEqual([]);
  });
});

describe("applyPlacement", () => {
  it("drops the displaced placements and appends the incoming one", () => {
    const existing = [at("device", "d-1"), at("device", "d-2"), at("device", "d-3")];
    const incoming = at("group", "g-lamps", 2, 3);
    const conflict = placementConflicts(incoming, existing, devicesOf);
    const next = applyPlacement(existing, incoming, conflict);

    expect(next.map(placementKey)).toEqual(["device:d-3", "group:g-lamps"]);
    expect(next.at(-1)).toEqual(incoming);
  });

  it("moves a placement rather than duplicating it", () => {
    const existing = [at("device", "d-1", 1, 1)];
    const incoming = at("device", "d-1", 9, 9);
    const conflict = placementConflicts(incoming, existing, devicesOf);
    const next = applyPlacement(existing, incoming, conflict);

    expect(next).toHaveLength(1);
    expect(next[0]).toEqual(incoming);
  });

  it("does not mutate the list it is given", () => {
    const existing = [at("device", "d-1")];
    const snapshot = structuredClone(existing);
    const incoming = at("group", "g-lamps");
    applyPlacement(existing, incoming, placementConflicts(incoming, existing, devicesOf));
    expect(existing).toEqual(snapshot);
  });
});
