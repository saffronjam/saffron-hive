import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { flushSync, mount, unmount } from "svelte";
import IntegrationsPage from "../../src/routes/integrations/+page.svelte";
import { pageHeader } from "$lib/stores/page-header.svelte";
import { createMockClient } from "../helpers/mock-client";
import { resetMockPage, setMockPageUrl } from "../mocks/app-state.svelte";

let instance: ReturnType<typeof mount> | null = null;
let host: HTMLDivElement;

beforeEach(() => {
  sessionStorage.clear();
  resetMockPage();
  setMockPageUrl("https://hive.test/integrations");
  host = document.createElement("div");
  document.body.appendChild(host);
});

afterEach(async () => {
  if (instance) await unmount(instance);
  instance = null;
  host.remove();
  pageHeader.reset();
});

describe("integration availability", () => {
  it.each([0, 1, 2])(
    "enables Add only when a provider remains with %s configured",
    async (configuredCount) => {
      const mock = createMockClient();
      mock.queueResult({
        data: {
          integrations: ["zigbee2mqtt", "tuya"].map((provider, index) => ({
            provider,
            name: provider,
            configured: index < configuredCount,
            enabled: true,
            connected: false,
            deviceCount: 0,
          })),
        },
      });
      instance = mount(IntegrationsPage, {
        target: host,
        context: new Map([["$$_urql", mock.client]]),
      });
      flushSync();
      expect(pageHeader.actions[0].disabled).toBe(true);
      await vi.waitFor(() => {
        flushSync();
        expect(pageHeader.actions[0].disabled).toBe(configuredCount === 2);
      });
    },
  );
});
