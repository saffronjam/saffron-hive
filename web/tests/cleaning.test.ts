import { describe, it, expect } from "vitest";
import {
  cleaningActivity,
  cleaningCandidates,
  cleaningDefaultOptions,
  expandCleaningRooms,
} from "$lib/cleaning";
import type { CleaningRobot } from "$lib/stores/cleaning.svelte";
const robot = {
  id: "vacuum",
  supported: true,
  activeMapId: "2",
  maps: [{ id: 2, name: "Home", revision: "geometry" }],
  roomLinks: [
    {
      mapId: "2",
      mapRevision: "geometry",
      revision: 1,
      links: [{ roomId: "kitchen", areaId: "1" }],
    },
  ],
};
const device = { available: true, disabled: false, deleted: false };
describe("cleaning activity", () => {
  const activity = { status: "cleaning", activeTask: { state: "running" } as CleaningRobot["activeTask"], progress: null, estimatedProgress: 58 };
  it("uses the reported return state and stops showing the area estimate", () => {
    expect(cleaningActivity({ ...activity, status: "returning" })).toEqual({ status: "returning", progress: null, estimated: false });
    expect(cleaningActivity({ ...activity, status: "docked" })).toEqual({ status: "docked", progress: null, estimated: false });
  });
  it("resumes estimates when cleaning resumes and respects native zero", () => {
    expect(cleaningActivity(activity)).toEqual({ status: "cleaning", progress: 58, estimated: true });
    expect(cleaningActivity({ ...activity, progress: 0 })).toEqual({ status: "cleaning", progress: 0, estimated: false });
  });
});
describe("cleaning option defaults", () => {
  it("uses reported settings with one pass", () => {
    expect(cleaningDefaultOptions({ suction: 3, water: 1 })).toEqual({
      suction: 3,
      water: 1,
      repeats: 1,
    });
    expect(cleaningDefaultOptions({ suction: 0, water: 3 })).toEqual({
      suction: 0,
      water: 3,
      repeats: 1,
    });
  });
  it("falls back to standard suction and medium water for unavailable settings", () => {
    for (const current of [
      undefined,
      { suction: null, water: null },
      { suction: -1, water: 0 },
    ]) {
      expect(cleaningDefaultOptions(current)).toEqual({
        suction: 1,
        water: 2,
        repeats: 1,
      });
    }
  });
});
describe("cleaning eligibility", () => {
  it("requires a reachable enabled vacuum with current room links", () => {
    expect(cleaningCandidates([robot], { vacuum: device })).toEqual([robot]);
    for (const d of [
      { ...device, available: false },
      { ...device, disabled: true },
      { ...device, deleted: true },
    ])
      expect(cleaningCandidates([robot], { vacuum: d })).toEqual([]);
    for (const r of [
      { ...robot, supported: false },
      { ...robot, activeMapId: null },
      { ...robot, roomLinks: [] },
      { ...robot, maps: [] },
    ])
      expect(cleaningCandidates([r], { vacuum: device })).toEqual([]);
  });
  it("keeps linked rooms available when map geometry refreshes", () => {
    const refreshed = { ...robot, maps: [{ ...robot.maps[0], revision: "new-geometry" }] };
    expect(cleaningCandidates([refreshed], { vacuum: device })).toEqual([refreshed]);
  });
  it("expands shared areas transitively", () => {
    const links = [
      { roomId: "living", areaId: "1" },
      { roomId: "balcony", areaId: "1" },
      { roomId: "balcony", areaId: "2" },
      { roomId: "hall", areaId: "2" },
    ];
    expect(expandCleaningRooms(links, ["living"])).toEqual([
      "balcony",
      "hall",
      "living",
    ]);
  });
});
