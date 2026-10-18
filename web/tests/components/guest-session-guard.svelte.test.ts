import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { flushSync, mount, unmount } from "svelte";
import { writable } from "svelte/store";
import GuestSessionGuard from "$lib/components/guest-session-guard.svelte";

const mocks = vi.hoisted(() => ({ teardown: vi.fn(), query: vi.fn(), subscription: vi.fn() }));
vi.mock("@urql/svelte", () => ({
  getContextClient: () => ({}),
  queryStore: (...args: unknown[]) => mocks.query(...args),
  subscriptionStore: (...args: unknown[]) => mocks.subscription(...args),
}));
vi.mock("$lib/session", () => ({ sessionTeardown: mocks.teardown }));

const current = writable<{
  fetching: boolean;
  error: Error | null;
  data: { currentGuest: { id: string; expiresAt: string } | null } | null;
}>({ fetching: true, error: null, data: null });
const changes = writable({ data: null });
let host: HTMLDivElement;
let component: ReturnType<typeof mount>;

beforeEach(() => {
  mocks.teardown.mockClear();
  mocks.query.mockReturnValue(current);
  mocks.subscription.mockReturnValue(changes);
  current.set({ fetching: true, error: null, data: null });
  host = document.createElement("div");
  document.body.append(host);
  component = mount(GuestSessionGuard, { target: host });
  flushSync();
});
afterEach(async () => {
  await unmount(component);
  host.remove();
});

it("keeps the session through interrupted requests and accepts a later valid guest", () => {
  current.set({ fetching: false, error: new Error("request aborted"), data: null });
  flushSync();
  expect(mocks.teardown).not.toHaveBeenCalled();
  current.set({
    fetching: false,
    error: null,
    data: { currentGuest: { id: "guest", expiresAt: new Date(Date.now() + 60000).toISOString() } },
  });
  flushSync();
  expect(mocks.teardown).not.toHaveBeenCalled();
});

it("ends the session when the server confirms that guest access is unavailable", () => {
  current.set({ fetching: false, error: null, data: { currentGuest: null } });
  flushSync();
  expect(mocks.teardown).toHaveBeenCalledOnce();
});
