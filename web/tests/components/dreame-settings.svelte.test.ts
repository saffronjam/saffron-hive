import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { flushSync, mount, unmount } from "svelte";
import DreameSettings from "../../src/routes/integrations/dreame/+page.svelte";
import { pageHeader } from "$lib/stores/page-header.svelte";
import { cleaningStore } from "$lib/stores/cleaning.svelte";
import { REDACTED_SECRET } from "$lib/redacted-secret";
import { createMockClient } from "../helpers/mock-client";

vi.mock("$lib/graphql/app-recovery", () => ({ onGraphQLRecovered: () => {} }));

let instance: ReturnType<typeof mount> | undefined;
let host: HTMLDivElement;
const config = { revision: 4, email: "test@example.com", password: REDACTED_SECRET, region: "eu", enabled: true };

beforeEach(() => {
  cleaningStore.clear();
  host = document.createElement("div");
  document.body.append(host);
});
afterEach(async () => {
  if (instance) await unmount(instance);
  instance = undefined;
  host.remove();
  pageHeader.reset();
  cleaningStore.clear();
});

it("opens saved settings clean and reserves the password field for replacement", async () => {
  const mock = createMockClient();
  mock.queueResult({ data: { dreameConfig: config } });
  instance = mount(DreameSettings, { target: host, context: new Map([["$$_urql", mock.client]]) });
  flushSync();
  await vi.waitFor(() => {
    flushSync();
    expect(host.querySelector<HTMLInputElement>("#dreame-email")?.value).toBe(config.email);
  });
  expect(pageHeader.actions[0].disabled).toBe(true);
  const password = host.querySelector<HTMLInputElement>("#dreame-password")!;
  expect(password.value).toBe("");
  expect(password.autocomplete).toBe("new-password");
  expect(host.querySelector<HTMLInputElement>("#dreame-email")?.autocomplete).toBe("off");

  const email = host.querySelector<HTMLInputElement>("#dreame-email")!;
  email.value = "edited@example.com";
  email.dispatchEvent(new Event("input", { bubbles: true }));
  flushSync();
  expect(pageHeader.actions[0].disabled).toBe(false);
  email.value = config.email;
  email.dispatchEvent(new Event("input", { bubbles: true }));
  flushSync();
  expect(pageHeader.actions[0].disabled).toBe(true);
});

it("keeps explicit password changes dirty until saved", async () => {
  const mock = createMockClient();
  mock.queueResult({ data: { dreameConfig: config } });
  instance = mount(DreameSettings, { target: host, context: new Map([["$$_urql", mock.client]]) });
  flushSync();
  await vi.waitFor(() => {
    flushSync();
    expect(host.querySelector<HTMLInputElement>("#dreame-email")?.value).toBe(config.email);
  });
  const password = host.querySelector<HTMLInputElement>("#dreame-password")!;
  password.value = "replacement-password";
  password.dispatchEvent(new Event("input", { bubbles: true }));
  flushSync();
  expect(pageHeader.actions[0].disabled).toBe(false);
  mock.queueMutationResult({ data: { updateDreameConfig: { config: { ...config, revision: 5 }, application: { success: true, code: "OK" } } } });
  mock.queueResult({ data: { cleaningDevices: [] } });
  await pageHeader.actions[0].onclick?.();
  flushSync();
  expect(mock.mutations[0].variables).toEqual({ input: { email: config.email, region: config.region, enabled: config.enabled, password: "replacement-password" }, expectedRevision: 4 });
  expect(pageHeader.actions[0].disabled).toBe(true);
  expect(password.value).toBe("");
});
