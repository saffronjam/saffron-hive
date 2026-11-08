import { afterEach, expect, it, vi } from "vitest";
import { flushSync, mount, unmount } from "svelte";
import Harness from "../fixtures/cleaning-map-layer-harness.svelte";
import { createMockClient } from "../helpers/mock-client";
import { cleaningMapFixture } from "../fixtures/cleaning-map";
import type { CleaningRobot } from "$lib/stores/cleaning.svelte";
import { cleaningStore } from "$lib/stores/cleaning.svelte";

let instance: ReturnType<typeof mount> | undefined;
let host: HTMLDivElement;
afterEach(async () => {
  if (instance) await unmount(instance);
  instance = undefined;
  cleaningStore.stop();
  host.remove();
});

it("coalesces updates during an in-flight map request and displays the newest position", async () => {
  const mock = createMockClient();
  const first = Promise.withResolvers<unknown>();
  const query = vi.spyOn(mock.client, "query");
  query.mockReturnValueOnce({ toPromise: () => first.promise } as ReturnType<
    typeof mock.client.query
  >);
  const result = (x: number) => ({
    data: {
      cleaningDevice: {
        liveMap: { ...cleaningMapFixture, robot: { x, y: 4, angle: 0 } },
      },
      cleaningCalibration: {
        enabled: true,
        valid: true,
        transform: { a: 1, b: 0, x: 0, y: 0 },
      },
    },
  });
  mock.queueResult(result(7));
  const robot: CleaningRobot = {
    id: "robot",
    deviceId: "robot",
    supported: true,
    controls: [],
    status: "cleaning",
    activeMapId: "7",
    maps: [cleaningMapFixture],
    consumables: [],
    roomLinks: [],
    updatedAt: "2026-01-01T00:00:00Z",
    liveAt: "2026-01-01T00:00:00Z",
  };
  host = document.createElement("div");
  document.body.append(host);
  const view = mount(Harness, {
    target: host,
    props: { initial: robot },
    context: new Map([["$$_urql", mock.client]]),
  });
  instance = view;
  flushSync();
  expect(query).toHaveBeenCalledTimes(1);
  view.report("2026-01-01T00:00:01Z");
  flushSync();
  view.report("2026-01-01T00:00:02Z");
  flushSync();
  expect(query).toHaveBeenCalledTimes(1);
  first.resolve(result(1));
  await vi.waitFor(() => {
    flushSync();
    expect(query).toHaveBeenCalledTimes(2);
  });
  await vi.waitFor(() => {
    flushSync();
    expect(
      host.querySelector("g.pointer-events-auto")?.getAttribute("transform"),
    ).toBe("translate(7 4) scale(1)");
  });
  expect(host.querySelector("[data-cleaning-trail]")).toBeNull();
  view.setTrails(true);
  flushSync();
  expect(host.querySelector("[data-cleaning-trail]")).not.toBeNull();
  view.setTrails(false);
  flushSync();
  expect(host.querySelector("[data-cleaning-trail]")).toBeNull();
});

it("reports readiness only after the position response and handles unavailable alignment", async () => {
  const mock = createMockClient();
  const response = Promise.withResolvers<unknown>();
  vi.spyOn(mock.client, "query").mockReturnValueOnce({ toPromise: () => response.promise } as ReturnType<typeof mock.client.query>);
  const status = vi.fn();
  const robot: CleaningRobot = {
    id: "robot", deviceId: "robot", supported: true, controls: [], status: "cleaning",
    activeMapId: "7", maps: [cleaningMapFixture], consumables: [], roomLinks: [],
    updatedAt: "2026-01-01T00:00:00Z",
  };
  host = document.createElement("div");
  document.body.append(host);
  const view = mount(Harness, { target: host, props: { initial: robot, onstatuschange: status }, context: new Map([["$$_urql", mock.client]]) });
  instance = view;
  view.setTrails(true);
  flushSync();
  expect(status).toHaveBeenLastCalledWith("loading");
  expect(host.querySelector("[data-cleaning-trail]")).toBeNull();
  response.resolve({ data: {
    cleaningDevice: { liveMap: cleaningMapFixture },
    cleaningCalibration: { enabled: true, valid: true, transform: { a: 1, b: 0, x: 0, y: 0 } },
  } });
  await vi.waitFor(() => {
    flushSync();
    expect(status).toHaveBeenLastCalledWith("available");
    expect(host.querySelector("[data-cleaning-trail]")).not.toBeNull();
  });
  mock.queueResult({ data: { cleaningDevice: { liveMap: cleaningMapFixture }, cleaningCalibration: { enabled: true, valid: false } } });
  view.report("2026-01-01T00:00:01Z");
  await vi.waitFor(() => {
    flushSync();
    expect(status).toHaveBeenLastCalledWith("unavailable");
    expect(host.querySelector("[data-cleaning-trail]")).toBeNull();
  });
});

it("renders a preloaded map without another request", async () => {
  const mock = createMockClient();
  const robot: CleaningRobot = {
    id: "robot", deviceId: "robot", supported: true, controls: [], status: "cleaning",
    activeMapId: "7", maps: [cleaningMapFixture], consumables: [], roomLinks: [],
    updatedAt: "2026-01-01T00:00:00Z",
  };
  mock.queueResult({ data: {
    cleaningDevice: { liveMap: cleaningMapFixture },
    cleaningCalibration: { enabled: true, valid: true, transform: { a: 1, b: 0, x: 0, y: 0 } },
  } });
  await cleaningStore.loadMapView(mock.client, robot, "floor");
  expect(mock.queryCount).toBe(1);
  const status = vi.fn();
  host = document.createElement("div");
  document.body.append(host);
  const view = mount(Harness, { target: host, props: { initial: robot, onstatuschange: status }, context: new Map([["$$_urql", mock.client]]) });
  instance = view;
  view.setTrails(true);
  flushSync();
  expect(status).toHaveBeenLastCalledWith("available");
  expect(host.querySelector("[data-cleaning-trail]")).not.toBeNull();
  expect(mock.queryCount).toBe(1);
});

it("shares an in-flight preload and discards its result when the session stops", async () => {
  const mock = createMockClient();
  const response = Promise.withResolvers<unknown>();
  vi.spyOn(mock.client, "query").mockReturnValue({ toPromise: () => response.promise } as ReturnType<typeof mock.client.query>);
  const robot: CleaningRobot = {
    id: "robot", deviceId: "robot", supported: true, controls: [], status: "cleaning",
    activeMapId: "7", maps: [cleaningMapFixture], consumables: [], roomLinks: [],
    updatedAt: "2026-01-01T00:00:00Z",
  };
  host = document.createElement("div");
  const first = cleaningStore.loadMapView(mock.client, robot, "floor");
  const second = cleaningStore.loadMapView(mock.client, robot, "floor");
  expect(mock.client.query).toHaveBeenCalledTimes(1);
  cleaningStore.stop();
  response.resolve({ data: { cleaningDevice: { liveMap: cleaningMapFixture } } });
  await Promise.all([first, second]);
  expect(cleaningStore.mapView(robot, "floor").loaded).toBe(false);
  expect(cleaningStore.mapView(robot, "floor").data).toBeNull();
});

it("retries a failed preload when the same map is requested again", async () => {
  const mock = createMockClient();
  const robot: CleaningRobot = {
    id: "robot", deviceId: "robot", supported: true, controls: [], status: "cleaning",
    activeMapId: "7", maps: [cleaningMapFixture], consumables: [], roomLinks: [],
    updatedAt: "2026-01-01T00:00:00Z",
  };
  host = document.createElement("div");
  mock.queueResult({ error: { message: "Temporarily unavailable" } });
  await cleaningStore.loadMapView(mock.client, robot, "floor");
  expect(cleaningStore.mapView(robot, "floor").data).toBeNull();
  mock.queueResult({ data: { cleaningDevice: { liveMap: cleaningMapFixture } } });
  await cleaningStore.loadMapView(mock.client, robot, "floor");
  expect(mock.queryCount).toBe(2);
  expect(cleaningStore.mapView(robot, "floor").data?.cleaningDevice?.liveMap?.id).toBe(7);
});
