import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockClient } from "../helpers/mock-client";

const scene = {
  id: "scene-1",
  name: "Cozy",
  icon: null,
  rooms: [],
  actions: [{ targetType: "room", targetId: "living-room" }],
  devicePayloads: [],
  effectivePayloads: [{ deviceId: "light-1", payload: '{"on":true}' }],
  createdBy: null,
  activatedAt: null,
};

async function bootStore() {
  vi.resetModules();
  return await import("$lib/stores/scenes.svelte");
}

beforeEach(() => {
  localStorage.clear();
  vi.useRealTimers();
});

describe("scenesStore", () => {
  it("keeps the active state stable while an apply result settles", async () => {
    const fresh = await bootStore();
    const mock = createMockClient();
    mock.queueResult({ data: { scenes: [scene] } });
    await fresh.scenesStore.start(mock.client);

    mock.queueMutationResult({ data: { applyScene: scene } });
    const applying = fresh.scenesStore.apply(mock.client, scene.id);
    expect(fresh.scenesStore.byId.get(scene.id)?.activatedAt).not.toBeNull();

    const activatedAt = "2026-08-25T18:00:00Z";
    mock.emit({
      sceneActiveChanged: { sceneId: scene.id, activatedAt },
    });
    await applying;

    expect(fresh.scenesStore.byId.get(scene.id)?.activatedAt).toBe(activatedAt);
    fresh.scenesStore.stop();
  });

  it("suppresses a delayed deactivation until activation is confirmed", async () => {
    const fresh = await bootStore();
    const mock = createMockClient();
    mock.queueResult({ data: { scenes: [scene] } });
    await fresh.scenesStore.start(mock.client);

    mock.queueMutationResult({ data: { applyScene: scene } });
    const applying = fresh.scenesStore.apply(mock.client, scene.id);
    mock.emit({
      sceneActiveChanged: { sceneId: scene.id, activatedAt: null },
    });
    await applying;

    expect(fresh.scenesStore.byId.get(scene.id)?.activatedAt).not.toBeNull();

    const activatedAt = "2026-08-25T18:00:00Z";
    mock.emit({
      sceneActiveChanged: { sceneId: scene.id, activatedAt },
    });
    expect(fresh.scenesStore.byId.get(scene.id)?.activatedAt).toBe(activatedAt);
    fresh.scenesStore.stop();
  });

  it("reconciles a deferred deactivation when the settle window expires", async () => {
    vi.useFakeTimers();
    const fresh = await bootStore();
    const mock = createMockClient();
    mock.queueResult({ data: { scenes: [scene] } });
    await fresh.scenesStore.start(mock.client);

    mock.queueMutationResult({ data: { applyScene: scene } });
    const applying = fresh.scenesStore.apply(mock.client, scene.id);
    mock.emit({
      sceneActiveChanged: { sceneId: scene.id, activatedAt: null },
    });
    await applying;

    await vi.advanceTimersByTimeAsync(1499);
    expect(fresh.scenesStore.byId.get(scene.id)?.activatedAt).not.toBeNull();
    await vi.advanceTimersByTimeAsync(1);
    expect(fresh.scenesStore.byId.get(scene.id)?.activatedAt).toBeNull();
    fresh.scenesStore.stop();
  });
});
