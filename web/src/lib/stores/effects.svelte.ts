import type { Client } from "@urql/svelte";
import { graphql } from "$lib/gql";
import type { CreateEffectInput, EffectsStoreQuery, UpdateEffectInput } from "$lib/gql/graphql";
import { createEntityStore } from "$lib/stores/entity-store.svelte";

export type Effect = EffectsStoreQuery["effects"][number];

graphql(`
  fragment EffectFields on Effect {
    id
    name
    source
    icon
    kind
    nativeName
    loop
    durationMs
    requiredCapabilities
    tracks {
      id
      clips {
        id
      }
    }
    createdBy {
      id
      username
      name
    }
  }
`);

const EFFECTS_QUERY = graphql(`
  query EffectsStore {
    effects {
      ...EffectFields
    }
  }
`);

const CREATE_EFFECT = graphql(`
  mutation EffectsStoreCreate($input: CreateEffectInput!) {
    createEffect(input: $input) {
      ...EffectFields
    }
  }
`);

const UPDATE_EFFECT = graphql(`
  mutation EffectsStoreUpdate($input: UpdateEffectInput!) {
    updateEffect(input: $input) {
      ...EffectFields
    }
  }
`);

const DELETE_EFFECT = graphql(`
  mutation EffectsStoreDelete($id: ID!) {
    deleteEffect(id: $id)
  }
`);

const BATCH_DELETE_EFFECTS = graphql(`
  mutation EffectsStoreBatchDelete($ids: [ID!]!) {
    batchDeleteEffects(ids: $ids)
  }
`);

const base = createEntityStore<Effect, EffectsStoreQuery>({
  name: "effects",
  version: 2,
  query: EFFECTS_QUERY,
  select: (data) => data.effects,
});

/**
 * Effect definitions, shared by the list and the editor.
 *
 * Holds definitions only. `nativeEffectOptions` is derived from what the
 * connected devices support rather than from anything stored, so it stays a
 * plain query.
 */
export const effectsStore = {
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
  start: base.start,
  stop: base.stop,
  clear: base.clear,
  refresh: base.refresh,
  upsert: base.upsert,

  async create(client: Client, input: CreateEffectInput): Promise<Effect> {
    const result = await client.mutation(CREATE_EFFECT, { input }).toPromise();
    if (result.error || !result.data) throw result.error ?? new Error("createEffect failed");
    base.upsert(result.data.createEffect);
    return result.data.createEffect;
  },

  async update(client: Client, input: UpdateEffectInput): Promise<Effect> {
    const result = await client.mutation(UPDATE_EFFECT, { input }).toPromise();
    if (result.error || !result.data) throw result.error ?? new Error("updateEffect failed");
    base.upsert(result.data.updateEffect);
    return result.data.updateEffect;
  },

  async delete(client: Client, id: string): Promise<void> {
    const result = await client.mutation(DELETE_EFFECT, { id }).toPromise();
    if (result.error) throw result.error;
    base.remove(id);
  },

  async deleteMany(client: Client, ids: string[]): Promise<void> {
    const result = await client.mutation(BATCH_DELETE_EFFECTS, { ids }).toPromise();
    if (result.error) throw result.error;
    base.removeMany(ids);
  },
};
