import type { Client } from "@urql/svelte";
import { graphql } from "$lib/gql";
import type { ScenesStoreQuery, UpdateSceneInput } from "$lib/gql/graphql";
import { createEntityStore } from "$lib/stores/entity-store.svelte";

export type Scene = ScenesStoreQuery["scenes"][number];

graphql(`
  fragment SceneFields on Scene {
    id
    name
    icon
    rooms {
      id
      name
      icon
    }
    targets {
      targetType
      targetId
      name
      expression {
        connector
        subject
        op
        values
      }
    }
    lighting {
      dynamicSource {
        domain
        sourceKind
        presetId
        presetTitle
        seed
        brightness
        movement
        cycleSeconds
      }
      overrides {
        deviceId
        kind
        state {
          on
          brightness
          colorTemp
          color {
            r
            g
            b
            x
            y
          }
          transition
          targetTemperature
          hvacMode
          fanMode
          swing
        }
        effectId
        nativeEffectName
      }
    }
    supportingStates {
      deviceId
      state {
        on
        brightness
        colorTemp
        color {
          r
          g
          b
          x
          y
        }
        transition
        targetTemperature
        hvacMode
        fanMode
        swing
      }
    }
    preview {
      width
      height
      pixels {
        r
        g
        b
      }
      swatches {
        x
        y
        color {
          r
          g
          b
        }
      }
    }
    createdBy {
      id
      username
      name
    }
    activatedAt
  }
`);

const SCENES_QUERY = graphql(`
  query ScenesStore {
    scenes {
      ...SceneFields
    }
  }
`);

const CREATE_SCENE = graphql(`
  mutation ScenesStoreCreate($input: CreateSceneInput!) {
    createScene(input: $input) {
      ...SceneFields
    }
  }
`);

const UPDATE_SCENE = graphql(`
  mutation ScenesStoreUpdate($id: ID!, $input: UpdateSceneInput!) {
    updateScene(id: $id, input: $input) {
      ...SceneFields
    }
  }
`);

const DELETE_SCENE = graphql(`
  mutation ScenesStoreDelete($id: ID!) {
    deleteScene(id: $id)
  }
`);

const BATCH_DELETE_SCENES = graphql(`
  mutation ScenesStoreBatchDelete($ids: [ID!]!) {
    batchDeleteScenes(ids: $ids)
  }
`);

const APPLY_SCENE = graphql(`
  mutation ScenesStoreApply($sceneId: ID!) {
    applyScene(sceneId: $sceneId) {
      ...SceneFields
    }
  }
`);

const SCENE_ACTIVE_CHANGED = graphql(`
  subscription ScenesStoreActiveChanged {
    sceneActiveChanged {
      sceneId
      activatedAt
    }
  }
`);

const base = createEntityStore<Scene, ScenesStoreQuery>({
  name: "scenes",
  version: 3,
  query: SCENES_QUERY,
  select: (data) => data.scenes,
});

let activeUnsub: (() => void) | null = null;
const ACTIVATION_SETTLE_MS = 1500;

interface ActivationSettle {
  timer: ReturnType<typeof setTimeout>;
  deferred: string | null | undefined;
}

const activationSettles = new Map<string, ActivationSettle>();

function setActivatedAt(id: string, activatedAt: string | null) {
  const scene = base.byId.get(id);
  if (!scene) return;
  if ((scene.activatedAt ?? null) === activatedAt) return;
  base.upsert({ ...scene, activatedAt });
}

function cancelActivationSettle(id: string) {
  const settle = activationSettles.get(id);
  if (!settle) return;
  clearTimeout(settle.timer);
  activationSettles.delete(id);
}

function clearActivationSettles() {
  for (const settle of activationSettles.values()) clearTimeout(settle.timer);
  activationSettles.clear();
}

function beginActivationSettle(id: string) {
  cancelActivationSettle(id);
  const settle: ActivationSettle = {
    deferred: undefined,
    timer: setTimeout(() => {
      if (activationSettles.get(id) !== settle) return;
      activationSettles.delete(id);
      if (settle.deferred !== undefined) setActivatedAt(id, settle.deferred);
    }, ACTIVATION_SETTLE_MS),
  };
  activationSettles.set(id, settle);
}

function reconcileActivatedAt(id: string, activatedAt: string | null) {
  const settle = activationSettles.get(id);
  if (!settle) {
    setActivatedAt(id, activatedAt);
    return;
  }
  if (activatedAt !== null) {
    cancelActivationSettle(id);
    setActivatedAt(id, activatedAt);
    return;
  }
  settle.deferred = null;
}

/**
 * Scenes, shared across every page.
 *
 * Owns the single `sceneActiveChanged` subscription and the optimistic
 * activation flip, so the dashboard, the map and the scene pages all show the
 * same live "this scene is the current state" marker without each running their
 * own subscription and rollback.
 */
export const scenesStore = {
  get items() {
    return base.items;
  },
  get byId() {
    return base.byId;
  },
  get hydrated() {
    return base.hydrated;
  },
  get error() {
    return base.error;
  },
  clear() {
    clearActivationSettles();
    base.clear();
  },
  refresh: base.refresh,

  async start(client: Client) {
    await base.start(client);
    if (activeUnsub) return;
    // One callback per event: coalescing through $effect can merge an
    // activate and a deactivate that land within a few milliseconds into a
    // single run that only sees the later one, silently losing the other.
    const sub = client.subscription(SCENE_ACTIVE_CHANGED, {}).subscribe((result) => {
      const event = result.data?.sceneActiveChanged;
      if (!event) return;
      reconcileActivatedAt(event.sceneId, event.activatedAt ?? null);
    });
    activeUnsub = sub.unsubscribe;
  },

  stop() {
    clearActivationSettles();
    if (activeUnsub) {
      activeUnsub();
      activeUnsub = null;
    }
    base.stop();
  },

  async create(client: Client, input: import("$lib/gql/graphql").CreateSceneInput): Promise<Scene> {
    const result = await client.mutation(CREATE_SCENE, { input }).toPromise();
    if (result.error || !result.data) throw result.error ?? new Error("createScene failed");
    base.upsert(result.data.createScene);
    return result.data.createScene;
  },

  async update(client: Client, id: string, input: UpdateSceneInput): Promise<Scene> {
    const result = await client.mutation(UPDATE_SCENE, { id, input }).toPromise();
    if (result.error || !result.data) throw result.error ?? new Error("updateScene failed");
    base.upsert(result.data.updateScene);
    return result.data.updateScene;
  },

  async delete(client: Client, id: string): Promise<void> {
    const result = await client.mutation(DELETE_SCENE, { id }).toPromise();
    if (result.error) throw result.error;
    base.remove(id);
  },

  async deleteMany(client: Client, ids: string[]): Promise<void> {
    const result = await client.mutation(BATCH_DELETE_SCENES, { ids }).toPromise();
    if (result.error) throw result.error;
    base.removeMany(ids);
  },

  /**
   * Applies a scene, marking it active straight away so the card reacts to the
   * tap rather than to the round trip. Activation remains owned by the live
   * scene subscription, and a failed mutation restores the prior value.
   */
  async apply(client: Client, id: string): Promise<void> {
    const previous = base.byId.get(id)?.activatedAt ?? null;
    beginActivationSettle(id);
    setActivatedAt(id, new Date().toISOString());
    const result = await client.mutation(APPLY_SCENE, { sceneId: id }).toPromise();
    if (result.error || !result.data) {
      cancelActivationSettle(id);
      setActivatedAt(id, previous);
      throw result.error ?? new Error("applyScene failed");
    }
    base.upsert({
      ...result.data.applyScene,
      activatedAt: base.byId.get(id)?.activatedAt ?? null,
    });
  },

  async deactivate(client: Client, id: string): Promise<void> {
    const previous = base.byId.get(id)?.activatedAt ?? null;
    setActivatedAt(id, null);
    const result = await client
      .mutation(
        graphql(`
          mutation ScenesStoreStop($sceneId: ID!) {
            deactivateScene(sceneId: $sceneId) {
              ...SceneFields
            }
          }
        `),
        { sceneId: id },
      )
      .toPromise();
    if (result.error || !result.data) {
      setActivatedAt(id, previous);
      throw result.error ?? new Error("deactivateScene failed");
    }
    base.upsert(result.data.deactivateScene);
  },
};
