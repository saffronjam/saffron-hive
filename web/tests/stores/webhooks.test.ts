import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockClient } from "../helpers/mock-client";

const endpoint = {
  id: "hook-1",
  name: "Pipeline failed",
  enabled: true,
  rateLimitCount: 1,
  rateLimitWindowMs: 1000,
  createdAt: "2026-08-23T10:00:00Z",
  updatedAt: "2026-08-23T10:00:00Z",
  lastDeliveryAt: null,
  createdBy: null,
};

async function bootStore() {
  vi.resetModules();
  return await import("$lib/stores/webhooks.svelte");
}

beforeEach(() => {
  localStorage.clear();
});

describe("webhooksStore", () => {
  it("hydrates from the endpoint query and updates last request live", async () => {
    const fresh = await bootStore();
    const mock = createMockClient();
    mock.queueResult({ data: { webhookEndpoints: [endpoint] } });
    await fresh.webhooksStore.start(mock.client);

    expect(fresh.webhooksStore.items).toEqual([endpoint]);
    expect(mock.activeSubscriptions).toBe(1);
    mock.emit({
      webhookDeliveryRecorded: {
        id: "delivery-1",
        endpointId: "hook-1",
        receivedAt: "2026-08-23T10:05:00Z",
      },
    });
    await vi.waitFor(() =>
      expect(fresh.webhooksStore.byId.get("hook-1")?.lastDeliveryAt).toBe("2026-08-23T10:05:00Z"),
    );
    fresh.webhooksStore.stop();
    expect(mock.activeSubscriptions).toBe(0);
  });

  it("applies create, update, rotate, and delete mutation results", async () => {
    const fresh = await bootStore();
    const mock = createMockClient();
    mock.queueResult({ data: { webhookEndpoints: [] } });
    await fresh.webhooksStore.start(mock.client);

    mock.queueMutationResult({
      data: { createWebhookEndpoint: { endpoint, secretPath: "/api/webhooks/secret" } },
    });
    const created = await fresh.webhooksStore.create(mock.client, {
      name: endpoint.name,
      enabled: true,
      rateLimitCount: 1,
      rateLimitWindowMs: 1000,
    });
    expect(created.secretPath).toBe("/api/webhooks/secret");
    expect(fresh.webhooksStore.byId.get(endpoint.id)?.name).toBe(endpoint.name);

    const disabled = { ...endpoint, enabled: false };
    mock.queueMutationResult({ data: { updateWebhookEndpoint: disabled } });
    await fresh.webhooksStore.update(mock.client, endpoint.id, {
      name: endpoint.name,
      enabled: false,
      rateLimitCount: 1,
      rateLimitWindowMs: 1000,
    });
    expect(fresh.webhooksStore.byId.get(endpoint.id)?.enabled).toBe(false);

    mock.queueMutationResult({
      data: {
        rotateWebhookEndpointSecret: {
          endpoint: disabled,
          secretPath: "/api/webhooks/replacement",
        },
      },
    });
    await expect(fresh.webhooksStore.rotate(mock.client, endpoint.id)).resolves.toMatchObject({
      secretPath: "/api/webhooks/replacement",
    });

    mock.queueMutationResult({ data: { deleteWebhookEndpoint: true } });
    await fresh.webhooksStore.delete(mock.client, endpoint.id);
    expect(fresh.webhooksStore.items).toEqual([]);
    fresh.webhooksStore.stop();
  });

  it("refreshes after batch deletion and returns the deleted count", async () => {
    const fresh = await bootStore();
    const mock = createMockClient();
    const second = { ...endpoint, id: "hook-2", name: "Deploy finished" };
    mock.queueResult({ data: { webhookEndpoints: [endpoint, second] } });
    await fresh.webhooksStore.start(mock.client);

    mock.queueMutationResult({ data: { batchDeleteWebhookEndpoints: 1 } });
    mock.queueResult({ data: { webhookEndpoints: [second] } });

    await expect(
      fresh.webhooksStore.deleteMany(mock.client, [endpoint.id, second.id]),
    ).resolves.toBe(1);
    expect(fresh.webhooksStore.items).toEqual([second]);
    expect(mock.mutations.at(-1)?.variables).toEqual({
      ids: [endpoint.id, second.id],
    });
    fresh.webhooksStore.stop();
  });
});
