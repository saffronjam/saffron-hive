import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ClientOptions } from "graphql-ws";

const ws = vi.hoisted(() => {
  const terminate = vi.fn();
  const subscribe = vi.fn(() => vi.fn());
  return {
    terminate,
    subscribe,
    createClient: vi.fn((_options: unknown) => ({ terminate, subscribe })),
  };
});

vi.mock("graphql-ws", () => ({ createClient: ws.createClient }));
vi.mock("$lib/session", () => ({ sessionTeardown: vi.fn() }));

import { createGraphQLClient } from "$lib/graphql/client";

function latestOptions(): ClientOptions {
  return ws.createClient.mock.calls.at(-1)![0] as ClientOptions;
}

beforeEach(() => {
  vi.useFakeTimers();
  ws.createClient.mockClear();
  ws.terminate.mockClear();
  ws.subscribe.mockClear();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("GraphQL WebSocket recovery", () => {
  it("uses a bounded heartbeat and keeps retrying", () => {
    createGraphQLClient();

    const options = latestOptions();
    expect(options.keepAlive).toBe(15_000);
    expect(options.connectionAckWaitTimeout).toBe(10_000);
    expect(options.retryAttempts).toBe(Number.POSITIVE_INFINITY);
    expect(options.retryWait).toBeTypeOf("function");
  });

  it("terminates a connection that does not answer a ping", () => {
    createGraphQLClient();
    const options = latestOptions();

    options.on?.ping?.(false, undefined);
    vi.advanceTimersByTime(4_999);
    expect(ws.terminate).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(ws.terminate).toHaveBeenCalledOnce();
  });

  it("keeps the connection when its pong arrives in time", () => {
    createGraphQLClient();
    const options = latestOptions();

    options.on?.ping?.(false, undefined);
    vi.advanceTimersByTime(4_000);
    options.on?.pong?.(true, undefined);
    vi.advanceTimersByTime(1_000);

    expect(ws.terminate).not.toHaveBeenCalled();
  });

  it("reconciles live data after a recovered connection", () => {
    const onReconnect = vi.fn();
    createGraphQLClient({ onReconnect });
    const options = latestOptions();

    options.on?.connected?.({}, undefined, false);
    vi.runAllTimers();
    expect(onReconnect).not.toHaveBeenCalled();

    options.on?.connected?.({}, undefined, true);
    expect(onReconnect).not.toHaveBeenCalled();
    vi.runAllTimers();
    expect(onReconnect).toHaveBeenCalledOnce();
  });
});
