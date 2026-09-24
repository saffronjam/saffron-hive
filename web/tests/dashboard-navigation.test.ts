import { describe, expect, it, vi } from "vitest";
import { DashboardNavigation } from "$lib/dashboard-navigation.svelte";

const rooms = new Set(["kitchen", "bedroom"]);
function setup(wide = true) {
  const history = { open: vi.fn(), back: vi.fn() };
  const navigation = new DashboardNavigation(history);
  navigation.synchronize(wide, null, rooms, true);
  return { navigation, history };
}

describe("dashboard navigation", () => {
  it("starts on Apartment and switches desktop targets without adding history", () => {
    const { navigation, history } = setup();
    expect(navigation.selectedRoomId).toBeNull();
    navigation.select("kitchen");
    navigation.select("bedroom");
    expect(navigation.selectedRoomId).toBe("bedroom");
    navigation.select(null);
    expect(history.open).not.toHaveBeenCalled();
    expect(history.back).not.toHaveBeenCalled();
  });

  it("opens one compact history entry and follows browser Back", () => {
    const { navigation, history } = setup(false);
    navigation.select("kitchen");
    navigation.select("kitchen");
    expect(history.open).toHaveBeenCalledExactlyOnceWith("kitchen");
    navigation.synchronize(false, "kitchen", rooms, true);
    navigation.synchronize(false, null, rooms, true);
    expect(navigation.selectedRoomId).toBeNull();
    expect(history.back).not.toHaveBeenCalled();
  });

  it("promotes a drawer and consumes only its history entry", () => {
    const { navigation, history } = setup(false);
    navigation.select("kitchen");
    navigation.synchronize(false, "kitchen", rooms, true);
    navigation.synchronize(true, "kitchen", rooms, true);
    navigation.synchronize(true, "kitchen", rooms, true);
    expect(history.back).toHaveBeenCalledTimes(1);
    navigation.synchronize(true, null, rooms, true);
    expect(navigation.selectedRoomId).toBe("kitchen");
    navigation.select("bedroom");
    navigation.synchronize(false, null, rooms, true);
    expect(history.open).toHaveBeenLastCalledWith("bedroom");
  });

  it("preserves a room through rapid resizing while history Back is pending", () => {
    const { navigation, history } = setup(false);
    navigation.select("kitchen");
    navigation.synchronize(false, "kitchen", rooms, true);
    navigation.synchronize(true, "kitchen", rooms, true);
    navigation.synchronize(false, "kitchen", rooms, true);
    navigation.synchronize(false, null, rooms, true);
    expect(navigation.selectedRoomId).toBe("kitchen");
    expect(history.open).toHaveBeenCalledTimes(2);
    expect(history.back).toHaveBeenCalledTimes(1);
  });

  it("waits for hydration before falling back when a selected room is missing", () => {
    const { navigation } = setup();
    navigation.select("bedroom");
    navigation.synchronize(true, null, new Set(), false);
    expect(navigation.selectedRoomId).toBe("bedroom");
    navigation.synchronize(true, null, new Set(), true);
    expect(navigation.selectedRoomId).toBeNull();
  });

  it("closes a deleted compact room once and does not reopen it on resize", () => {
    const { navigation, history } = setup(false);
    navigation.select("kitchen");
    navigation.synchronize(false, "kitchen", rooms, true);
    navigation.synchronize(false, "kitchen", new Set(), true);
    navigation.close();
    expect(history.back).toHaveBeenCalledTimes(1);
    navigation.synchronize(true, null, new Set(), true);
    expect(navigation.selectedRoomId).toBeNull();
  });
});
