import { afterEach, expect, it, vi } from "vitest";
import { flushSync, mount, unmount } from "svelte";
import CleaningPage from "../../src/routes/cleaning/+page.svelte";
import { cleaningStore, type CleaningRobot } from "$lib/stores/cleaning.svelte";
import { deviceStore, type Device } from "$lib/stores/devices";
import { createMockClient } from "../helpers/mock-client";
import { resetMockPage } from "../mocks/app-state.svelte";

vi.mock("$lib/graphql/app-recovery", () => ({ onGraphQLRecovered: () => {} }));
vi.mock("svelte/motion", async (importOriginal) => ({
  ...await importOriginal<typeof import("svelte/motion")>(),
  prefersReducedMotion: { current: true },
}));

let instance: ReturnType<typeof mount> | undefined;
let host: HTMLDivElement;
afterEach(async () => {
  if (instance) await unmount(instance);
  instance = undefined;
  host?.remove();
  cleaningStore.stop();
  cleaningStore.clear();
  deviceStore.hydrate([]);
  resetMockPage();
});

async function openOptions() {
  const mock = createMockClient();
  const robots = ["A", "B"].map(id => ({
    id, deviceId: id, supported: true, status: "docked", controls: [], suction: 1, water: 2,
    activeMapId: "1", updatedAt: new Date().toISOString(), maps: [{ id: 1, name: "Home", revision: "v1" }],
    roomLinks: [{ mapId: "1", mapRevision: "v1", revision: 1, links: [{ roomId: "room", areaId: "1" }] }], consumables: [],
  } as CleaningRobot));
  mock.queueResult({ data: { cleaningDevices: robots } });
  await cleaningStore.refresh(mock.client);
  deviceStore.hydrate(robots.map(robot => ({
    id: robot.id, name: robot.id, friendlyName: robot.id, type: "vacuum", source: "dreame", available: true,
    revision: 1, seen: true, disabled: false, deleted: false, capabilities: [], roles: {}, attributes: [],
  } as Device)));
  host = document.createElement("div");
  document.body.append(host);
  instance = mount(CleaningPage, { target: host, context: new Map([["$$_urql", mock.client]]) });
  flushSync();
  host.querySelector<HTMLButtonElement>("[data-cleaning-scope-choices] button")!.click();
  flushSync();
  host.querySelector("[data-cleaning-page]")?.dispatchEvent(new Event("outroend"));
  await vi.waitFor(() => { flushSync(); expect(host.querySelector('[data-cleaning-step="options"]')).not.toBeNull(); });
  return mock;
}

it.each(["unavailable", "disabled", "removed"])("keeps vacuum identity when A becomes %s during Options", async change => {
  const mock = await openOptions();
  if (change === "unavailable") deviceStore.updateAvailability("A", false);
  else if (change === "disabled") deviceStore.updateDisabled("A", true);
  else {
    mock.queueResult({ data: { cleaningDevices: [cleaningStore.byId.get("B")] } });
    await cleaningStore.refresh(mock.client);
  }
  flushSync();
  const start = [...host.querySelectorAll<HTMLButtonElement>("button")].find(button => button.textContent?.trim() === "Start cleaning");
  expect(start?.disabled ?? true).toBe(true);
  start?.click();
  await Promise.resolve();
  expect(mock.mutations).toHaveLength(0);
});

it("starts the same vacuum after it recovers", async () => {
  const mock = await openOptions();
  deviceStore.updateAvailability("A", false);
  flushSync();
  deviceStore.updateAvailability("A", true);
  flushSync();
  mock.queueMutationResult({ data: { prepareCleaning: { deviceId: "A", mapId: "1", scope: "APARTMENT", roomIds: [], areaIds: ["1"], revision: "rev", options: { suction: 1, water: 2, repeats: 1 } } } });
  mock.queueMutationResult({ data: { startCleaning: { id: "task" } } });
  [...host.querySelectorAll<HTMLButtonElement>("button")].find(button => button.textContent?.trim() === "Start cleaning")!.click();
  await vi.waitFor(() => expect(mock.mutations).toHaveLength(2));
  expect(mock.mutations[0].variables).toMatchObject({ input: { deviceId: "A" } });
  expect(mock.mutations[1].variables).toMatchObject({ input: { selection: { deviceId: "A" } } });
});
