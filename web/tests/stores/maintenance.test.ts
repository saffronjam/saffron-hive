import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockClient } from "../helpers/mock-client";
import { saveSessionSnapshot } from "$lib/session-cache";

const task = {
  id: "task-1",
  kind: "BATTERY",
  title: "Replace battery",
  detail: "Sensor battery is 20%",
  action: "Replace or recharge the battery",
  currentValue: "20%",
  targetValue: null,
  actionUrl: "/devices/sensor-1",
  device: {
    id: "sensor-1",
    name: null,
    friendlyName: "Sensor",
    icon: null,
    type: "sensor",
    available: true,
    disabled: false,
    roles: { contact: null },
  },
};

async function bootStore() {
  vi.resetModules();
  return await import("$lib/stores/maintenance.svelte");
}

beforeEach(() => {
  sessionStorage.clear();
});

describe("maintenanceStore", () => {
  it("hydrates synchronously and reconciles in the background", async () => {
    saveSessionSnapshot(sessionStorage, "maintenance", 2, [task]);
    const fresh = await bootStore();
    expect(fresh.maintenanceStore.items.map((item) => item.id)).toEqual(["task-1"]);

    const mock = createMockClient();
    mock.queueResult({ data: { maintenanceTasks: [] } });
    await fresh.maintenanceStore.start(mock.client);
    await vi.waitFor(() => expect(fresh.maintenanceStore.items).toEqual([]));
    expect(mock.queries[0].requestPolicy).toBe("network-only");
    fresh.maintenanceStore.stop();
  });

  it("completes rows optimistically and persists the reconciled snapshot", async () => {
    const fresh = await bootStore();
    const mock = createMockClient();
    mock.queueResult({ data: { maintenanceTasks: [task] } });
    await fresh.maintenanceStore.start(mock.client);
    await vi.waitFor(() => expect(fresh.maintenanceStore.actionableCount).toBe(1));

    mock.queueMutationResult({ data: { completeMaintenanceTasks: ["task-1"] } });
    mock.queueResult({ data: { maintenanceTasks: [] } });
    await expect(fresh.maintenanceStore.completeOne("task-1")).resolves.toBe(true);
    expect(fresh.maintenanceStore.actionableCount).toBe(0);
    expect(mock.mutations[0].variables).toEqual({ ids: ["task-1"] });
    fresh.maintenanceStore.stop();
  });

  it("restores rows when completion fails and clears session data", async () => {
    const fresh = await bootStore();
    const mock = createMockClient();
    mock.queueResult({ data: { maintenanceTasks: [task] } });
    await fresh.maintenanceStore.start(mock.client);
    await vi.waitFor(() => expect(fresh.maintenanceStore.actionableCount).toBe(1));
    mock.queueMutationResult({ error: { message: "failed" } });

    await expect(fresh.maintenanceStore.completeOne("task-1")).resolves.toBe(false);
    expect(fresh.maintenanceStore.items.map((item) => item.id)).toEqual(["task-1"]);
    fresh.maintenanceStore.clear();
    expect(sessionStorage.length).toBe(0);
    fresh.maintenanceStore.stop();
  });
});
