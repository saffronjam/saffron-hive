import type { Client } from "@urql/svelte";
import { graphql } from "$lib/gql";
import type {
  CreateWebhookEndpointInput,
  UpdateWebhookEndpointInput,
  WebhookEndpointsStoreQuery,
} from "$lib/gql/graphql";
import { createEntityStore } from "$lib/stores/entity-store.svelte";

export type WebhookEndpoint = WebhookEndpointsStoreQuery["webhookEndpoints"][number];

graphql(`
  fragment WebhookEndpointFields on WebhookEndpoint {
    id
    name
    enabled
    rateLimitCount
    rateLimitWindowMs
    createdAt
    updatedAt
    lastDeliveryAt
    createdBy {
      id
      username
      name
    }
  }
`);

const WEBHOOK_ENDPOINTS_QUERY = graphql(`
  query WebhookEndpointsStore {
    webhookEndpoints {
      ...WebhookEndpointFields
    }
  }
`);

const CREATE_WEBHOOK_ENDPOINT = graphql(`
  mutation WebhookEndpointsStoreCreate($input: CreateWebhookEndpointInput!) {
    createWebhookEndpoint(input: $input) {
      endpoint {
        ...WebhookEndpointFields
      }
      secretPath
    }
  }
`);

const UPDATE_WEBHOOK_ENDPOINT = graphql(`
  mutation WebhookEndpointsStoreUpdate($id: ID!, $input: UpdateWebhookEndpointInput!) {
    updateWebhookEndpoint(id: $id, input: $input) {
      ...WebhookEndpointFields
    }
  }
`);

const ROTATE_WEBHOOK_ENDPOINT = graphql(`
  mutation WebhookEndpointsStoreRotate($id: ID!) {
    rotateWebhookEndpointSecret(id: $id) {
      endpoint {
        ...WebhookEndpointFields
      }
      secretPath
    }
  }
`);

const DELETE_WEBHOOK_ENDPOINT = graphql(`
  mutation WebhookEndpointsStoreDelete($id: ID!) {
    deleteWebhookEndpoint(id: $id)
  }
`);

const BATCH_DELETE_WEBHOOK_ENDPOINTS = graphql(`
  mutation WebhookEndpointsStoreBatchDelete($ids: [ID!]!) {
    batchDeleteWebhookEndpoints(ids: $ids)
  }
`);

const WEBHOOK_DELIVERY_RECORDED = graphql(`
  subscription WebhookEndpointsStoreDeliveryRecorded {
    webhookDeliveryRecorded {
      id
      endpointId
      receivedAt
    }
  }
`);

export function createWebhooksStore() {
  const base = createEntityStore<WebhookEndpoint, WebhookEndpointsStoreQuery>({
    name: "webhooks",
    version: 2,
    query: WEBHOOK_ENDPOINTS_QUERY,
    select: (data) => data.webhookEndpoints,
  });
  let deliverySubscription: { unsubscribe(): void } | null = null;

  return {
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
    async start(client: Client) {
      if (!deliverySubscription) {
        deliverySubscription = client
          .subscription(WEBHOOK_DELIVERY_RECORDED, {})
          .subscribe((result) => {
            const delivery = result.data?.webhookDeliveryRecorded;
            if (!delivery) return;
            const endpoint = base.byId.get(delivery.endpointId);
            if (endpoint) base.upsert({ ...endpoint, lastDeliveryAt: delivery.receivedAt });
          });
      }
      await base.start(client);
    },
    stop() {
      deliverySubscription?.unsubscribe();
      deliverySubscription = null;
      base.stop();
    },
    clear: base.clear,
    refresh: base.refresh,
    upsert: base.upsert,

    async create(client: Client, input: CreateWebhookEndpointInput) {
      const result = await client.mutation(CREATE_WEBHOOK_ENDPOINT, { input }).toPromise();
      if (result.error || !result.data)
        throw result.error ?? new Error("createWebhookEndpoint failed");
      base.upsert(result.data.createWebhookEndpoint.endpoint);
      return result.data.createWebhookEndpoint;
    },

    async update(client: Client, id: string, input: UpdateWebhookEndpointInput) {
      const result = await client.mutation(UPDATE_WEBHOOK_ENDPOINT, { id, input }).toPromise();
      if (result.error || !result.data)
        throw result.error ?? new Error("updateWebhookEndpoint failed");
      base.upsert(result.data.updateWebhookEndpoint);
      return result.data.updateWebhookEndpoint;
    },

    async rotate(client: Client, id: string) {
      const result = await client.mutation(ROTATE_WEBHOOK_ENDPOINT, { id }).toPromise();
      if (result.error || !result.data)
        throw result.error ?? new Error("rotateWebhookEndpointSecret failed");
      base.upsert(result.data.rotateWebhookEndpointSecret.endpoint);
      return result.data.rotateWebhookEndpointSecret;
    },

    async delete(client: Client, id: string) {
      const result = await client.mutation(DELETE_WEBHOOK_ENDPOINT, { id }).toPromise();
      if (result.error) throw result.error;
      base.remove(id);
    },

    async deleteMany(client: Client, ids: string[]): Promise<number> {
      const result = await client.mutation(BATCH_DELETE_WEBHOOK_ENDPOINTS, { ids }).toPromise();
      if (result.error || !result.data)
        throw result.error ?? new Error("batchDeleteWebhookEndpoints failed");
      await base.refresh(client);
      return result.data.batchDeleteWebhookEndpoints;
    },
  };
}

export const webhooksStore = createWebhooksStore();
