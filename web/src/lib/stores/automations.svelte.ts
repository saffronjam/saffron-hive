import type { Client } from "@urql/svelte";
import { graphql } from "$lib/gql";
import type { AutomationsStoreQuery, UpdateAutomationInput } from "$lib/gql/graphql";
import { createEntityStore } from "$lib/stores/entity-store.svelte";

export type Automation = AutomationsStoreQuery["automations"][number];

graphql(`
  fragment AutomationFields on AutomationGraph {
    id
    name
    icon
    enabled
    lastFiredAt
    nodes {
      id
      type
      config
    }
    edges {
      fromNodeId
      toNodeId
    }
    createdBy {
      id
      username
      name
    }
  }
`);

const AUTOMATIONS_QUERY = graphql(`
  query AutomationsStore {
    automations {
      ...AutomationFields
    }
  }
`);

const CREATE_AUTOMATION = graphql(`
  mutation AutomationsStoreCreate($input: CreateAutomationInput!) {
    createAutomation(input: $input) {
      ...AutomationFields
    }
  }
`);

const UPDATE_AUTOMATION = graphql(`
  mutation AutomationsStoreUpdate($id: ID!, $input: UpdateAutomationInput!) {
    updateAutomation(id: $id, input: $input) {
      ...AutomationFields
    }
  }
`);

const TOGGLE_AUTOMATION = graphql(`
  mutation AutomationsStoreToggle($id: ID!, $enabled: Boolean!) {
    toggleAutomation(id: $id, enabled: $enabled) {
      ...AutomationFields
    }
  }
`);

const DELETE_AUTOMATION = graphql(`
  mutation AutomationsStoreDelete($id: ID!) {
    deleteAutomation(id: $id)
  }
`);

const BATCH_DELETE_AUTOMATIONS = graphql(`
  mutation AutomationsStoreBatchDelete($ids: [ID!]!) {
    batchDeleteAutomations(ids: $ids)
  }
`);

const base = createEntityStore<Automation, AutomationsStoreQuery>({
  name: "automations",
  version: 1,
  query: AUTOMATIONS_QUERY,
  select: (data) => data.automations,
});

/**
 * Automations, shared across the list and the editor.
 *
 * `lastFiredAt` moves without any client action, so the list polls `refresh`
 * while it is open; every other field only changes through the mutations here.
 */
export const automationsStore = {
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

  async create(client: Client, name: string): Promise<Automation> {
    const result = await client
      .mutation(CREATE_AUTOMATION, { input: { name, enabled: false, nodes: [], edges: [] } })
      .toPromise();
    if (result.error || !result.data) throw result.error ?? new Error("createAutomation failed");
    base.upsert(result.data.createAutomation);
    return result.data.createAutomation;
  },

  async update(client: Client, id: string, input: UpdateAutomationInput): Promise<Automation> {
    const result = await client.mutation(UPDATE_AUTOMATION, { id, input }).toPromise();
    if (result.error || !result.data) throw result.error ?? new Error("updateAutomation failed");
    base.upsert(result.data.updateAutomation);
    return result.data.updateAutomation;
  },

  async toggle(client: Client, id: string, enabled: boolean): Promise<Automation> {
    const result = await client.mutation(TOGGLE_AUTOMATION, { id, enabled }).toPromise();
    if (result.error || !result.data) throw result.error ?? new Error("toggleAutomation failed");
    base.upsert(result.data.toggleAutomation);
    return result.data.toggleAutomation;
  },

  async delete(client: Client, id: string): Promise<void> {
    const result = await client.mutation(DELETE_AUTOMATION, { id }).toPromise();
    if (result.error) throw result.error;
    base.remove(id);
  },

  async deleteMany(client: Client, ids: string[]): Promise<void> {
    const result = await client.mutation(BATCH_DELETE_AUTOMATIONS, { ids }).toPromise();
    if (result.error) throw result.error;
    base.removeMany(ids);
  },
};
