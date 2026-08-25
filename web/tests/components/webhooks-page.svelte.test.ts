import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { flushSync, mount, unmount } from "svelte";
import WebhooksPage from "$lib/components/webhooks-page.svelte";
import { automationsStore } from "$lib/stores/automations.svelte";
import { webhooksStore } from "$lib/stores/webhooks.svelte";
import { createMockClient } from "../helpers/mock-client";
import { resetMockPage, setMockPageUrl } from "../mocks/app-state.svelte";

vi.hoisted(() => {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
});

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

let instance: ReturnType<typeof mount> | null = null;
let host: HTMLDivElement;

beforeEach(() => {
  resetMockPage();
  setMockPageUrl("https://hive.test/webhooks");
  localStorage.clear();
  webhooksStore.clear();
  automationsStore.clear();
  host = document.createElement("div");
  document.body.appendChild(host);
});

afterEach(() => {
  if (instance) unmount(instance);
  instance = null;
  webhooksStore.stop();
  automationsStore.stop();
  webhooksStore.clear();
  automationsStore.clear();
  host.remove();
});

describe("WebhooksPage", () => {
  it("renames a webhook by double-clicking its name", async () => {
    const mock = createMockClient();
    mock.queueResult({ data: { webhookEndpoints: [endpoint] } });
    await webhooksStore.start(mock.client);
    mock.queueResult({ data: { automations: [] } });
    await automationsStore.start(mock.client);

    instance = mount(WebhooksPage, {
      target: host,
      props: { visible: true },
      context: new Map([["$$_urql", mock.client]]),
    });
    flushSync();

    const name = Array.from(host.querySelectorAll("h3")).find(
      (element) => element.textContent === endpoint.name,
    );
    expect(name).toBeDefined();
    name!.parentElement!.dispatchEvent(new MouseEvent("dblclick", { bubbles: true }));
    flushSync();

    const input = name!.parentElement!.querySelector("input");
    expect(input).not.toBeNull();
    input!.value = "Deploy failed";
    input!.dispatchEvent(new Event("input", { bubbles: true }));
    mock.queueMutationResult({
      data: { updateWebhookEndpoint: { ...endpoint, name: "Deploy failed" } },
    });
    input!.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));

    await vi.waitFor(() => {
      expect(mock.mutations.at(-1)?.variables).toEqual({
        id: endpoint.id,
        input: {
          name: "Deploy failed",
          enabled: true,
          rateLimitCount: 1,
          rateLimitWindowMs: 1000,
        },
      });
      expect(webhooksStore.byId.get(endpoint.id)?.name).toBe("Deploy failed");
    });
  });
});
