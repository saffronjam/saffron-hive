import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockClient } from "../helpers/mock-client";

const scene = {
  id: "scene-1",
  name: "Cozy",
  icon: null,
  rooms: [],
  targets: [
    {
      targetType: "room",
      targetId: "living-room",
      name: "Living room",
      expression: [],
    },
  ],
  lighting: {
    dynamicSource: null,
    overrides: [],
  },
  supportingStates: [],
  preview: {
    width: 1,
    height: 1,
    pixels: [{ r: 255, g: 210, b: 160 }],
    swatches: [{ x: 0.5, y: 0.5, color: { r: 255, g: 210, b: 160 } }],
  },
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
  it("does not hydrate scenes from an incompatible cache generation", async () => {
    localStorage.setItem(
      "hive:cache:scenes",
      JSON.stringify({
        v: 2,
        items: [{ id: "cached-scene", name: "Cached", targets: [] }],
      }),
    );

    const fresh = await bootStore();

    expect(fresh.scenesStore.items).toEqual([]);
    expect(fresh.scenesStore.hydrated).toBe(false);
    fresh.scenesStore.stop();
  });

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

  it("optimistically stops and restores active state when stop fails", async () => {
    const fresh = await bootStore();
    const active = { ...scene, activatedAt: "2026-08-25T18:00:00Z" };
    const mock = createMockClient();
    mock.queueResult({ data: { scenes: [active] } });
    await fresh.scenesStore.start(mock.client);

    mock.queueMutationResult({ error: new Error("stop failed") });
    const stopping = fresh.scenesStore.deactivate(mock.client, scene.id);
    expect(fresh.scenesStore.byId.get(scene.id)?.activatedAt).toBeNull();
    await expect(stopping).rejects.toThrow();
    expect(fresh.scenesStore.byId.get(scene.id)?.activatedAt).toBe(active.activatedAt);
    fresh.scenesStore.stop();
  });
});
