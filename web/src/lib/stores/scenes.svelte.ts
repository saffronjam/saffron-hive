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
    actions {
      targetType
      targetId
    }
    devicePayloads {
      deviceId
      payload
    }
    effectivePayloads {
      deviceId
      payload
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
  version: 1,
  query: SCENES_QUERY,
  select: (data) => data.scenes,
});

let activeUnsub: (() => void) | null = null;

function setActivatedAt(id: string, activatedAt: string | null) {
  const scene = base.byId.get(id);
  if (!scene) return;
  if ((scene.activatedAt ?? null) === activatedAt) return;
  base.upsert({ ...scene, activatedAt });
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
  clear: base.clear,
  refresh: base.refresh,
  setActivatedAt,

  async start(client: Client) {
    await base.start(client);
    if (activeUnsub) return;
    // One callback per event: coalescing through $effect can merge an
    // activate and a deactivate that land within a few milliseconds into a
    // single run that only sees the later one, silently losing the other.
    const sub = client.subscription(SCENE_ACTIVE_CHANGED, {}).subscribe((result) => {
      const event = result.data?.sceneActiveChanged;
      if (!event) return;
      setActivatedAt(event.sceneId, event.activatedAt ?? null);
    });
    activeUnsub = sub.unsubscribe;
  },

  stop() {
    if (activeUnsub) {
      activeUnsub();
      activeUnsub = null;
    }
    base.stop();
  },

  async create(client: Client, name: string): Promise<Scene> {
    const result = await client
      .mutation(CREATE_SCENE, { input: { name, actions: [] } })
      .toPromise();
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
   * tap rather than to the round trip. The server's own answer replaces the
   * guess, and a failure rolls it back.
   */
  async apply(client: Client, id: string): Promise<void> {
    const previous = base.byId.get(id)?.activatedAt ?? null;
    setActivatedAt(id, new Date().toISOString());
    const result = await client.mutation(APPLY_SCENE, { sceneId: id }).toPromise();
    if (result.error || !result.data) {
      setActivatedAt(id, previous);
      throw result.error ?? new Error("applyScene failed");
    }
    base.upsert(result.data.applyScene);
  },
};
