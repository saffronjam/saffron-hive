import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockClient } from "../helpers/mock-client";
import { saveSessionSnapshot } from "$lib/session-cache";
import { createMaintenanceStore } from "$lib/stores/maintenance.svelte";

const task = {
  id: "task-1",
  kind: "BATTERY",
  canComplete: true,
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
    deleted: false,
    roles: { contact: null },
  },
};

function bootStore() {
  return { maintenanceStore: createMaintenanceStore() };
}

beforeEach(() => {
  sessionStorage.clear();
});

describe("maintenanceStore", () => {
  it("starts unhydrated without a session snapshot", async () => {
    const fresh = bootStore();
    expect(fresh.maintenanceStore.items).toEqual([]);
    expect(fresh.maintenanceStore.hydrated).toBe(false);
  });

  it("treats a cached empty snapshot as hydrated", async () => {
    saveSessionSnapshot(sessionStorage, "maintenance", 4, []);
    const fresh = bootStore();
    expect(fresh.maintenanceStore.items).toEqual([]);
    expect(fresh.maintenanceStore.hydrated).toBe(true);
  });

  it("hydrates synchronously and reconciles in the background", async () => {
    saveSessionSnapshot(sessionStorage, "maintenance", 4, [task]);
    const fresh = bootStore();
    expect(fresh.maintenanceStore.items.map((item) => item.id)).toEqual(["task-1"]);
    expect(fresh.maintenanceStore.hydrated).toBe(true);

    const mock = createMockClient();
    mock.queueResult({ data: { maintenanceTasks: [] } });
    await fresh.maintenanceStore.start(mock.client);
    await vi.waitFor(() => expect(fresh.maintenanceStore.items).toEqual([]));
    expect(fresh.maintenanceStore.hydrated).toBe(true);
    expect(mock.queries[0].requestPolicy).toBe("network-only");
    fresh.maintenanceStore.stop();
  });

  it("completes rows optimistically and persists the reconciled snapshot", async () => {
    const fresh = bootStore();
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

  it("hides maintenance for deleted devices", async () => {
    const fresh = bootStore();
    const mock = createMockClient();
    mock.queueResult({
      data: {
        maintenanceTasks: [{ ...task, device: { ...task.device, disabled: true, deleted: true } }],
      },
    });
    await fresh.maintenanceStore.start(mock.client);
    await vi.waitFor(() => expect(fresh.maintenanceStore.hydrated).toBe(true));
    expect(fresh.maintenanceStore.items).toEqual([]);
    fresh.maintenanceStore.stop();
  });

  it("restores rows when completion fails and clears session data", async () => {
    const fresh = bootStore();
    const mock = createMockClient();
    mock.queueResult({ data: { maintenanceTasks: [task] } });
    await fresh.maintenanceStore.start(mock.client);
    await vi.waitFor(() => expect(fresh.maintenanceStore.actionableCount).toBe(1));
    mock.queueMutationResult({ error: { message: "failed" } });

    await expect(fresh.maintenanceStore.completeOne("task-1")).resolves.toBe(false);
    expect(fresh.maintenanceStore.items.map((item) => item.id)).toEqual(["task-1"]);
    fresh.maintenanceStore.clear();
    expect(fresh.maintenanceStore.hydrated).toBe(false);
    expect(sessionStorage.length).toBe(0);
    fresh.maintenanceStore.stop();
  });
});

it("keeps cleaning maintenance visible until the device confirms a reset", async () => {
  const store = createMaintenanceStore();
  const mock = createMockClient();
  const cleaningTask = { ...task, kind: "CLEANING", context: "sensors", value: 0 };
  mock.queueResult({ data: { maintenanceTasks: [cleaningTask] } });
  await store.start(mock.client);
  await vi.waitFor(() => expect(store.items).toHaveLength(1));
  mock.queueMutationResult({ error: { message: "Reset failed" } });
  expect(await store.completeOne(task.id)).toBe(false);
  expect(store.items).toHaveLength(1);
  expect(store.isPending(task.id)).toBe(false);
  mock.queueMutationResult({ data: { completeMaintenanceTasks: [task.id] } });
  mock.queueResult({ data: { maintenanceTasks: [] } });
  expect(await store.completeOne(task.id)).toBe(true);
  expect(store.items).toHaveLength(0);
  store.stop();
});
