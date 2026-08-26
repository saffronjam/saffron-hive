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

import { createGraphQLConnection } from "$lib/graphql/client";

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
    createGraphQLConnection();

    const options = latestOptions();
    expect(options.keepAlive).toBe(3_000);
    expect(options.connectionAckWaitTimeout).toBe(3_000);
    expect(options.retryAttempts).toBe(Number.POSITIVE_INFINITY);
    expect(options.retryWait).toBeTypeOf("function");
  });

  it("terminates a connection that does not answer a ping", () => {
    createGraphQLConnection();
    const options = latestOptions();

    options.on?.ping?.(false, undefined);
    vi.advanceTimersByTime(1_999);
    expect(ws.terminate).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(ws.terminate).toHaveBeenCalledOnce();
  });

  it("keeps the connection when its pong arrives in time", () => {
    createGraphQLConnection();
    const options = latestOptions();

    options.on?.ping?.(false, undefined);
    vi.advanceTimersByTime(1_500);
    options.on?.pong?.(true, undefined);
    vi.advanceTimersByTime(500);

    expect(ws.terminate).not.toHaveBeenCalled();
  });

  it("notifies listeners after a recovered connection", () => {
    const onRecovered = vi.fn();
    const connection = createGraphQLConnection();
    connection.onRecovered(onRecovered);
    const options = latestOptions();

    options.on?.connected?.({}, undefined, false);
    vi.runAllTimers();
    expect(onRecovered).not.toHaveBeenCalled();

    options.on?.connected?.({}, undefined, true);
    expect(onRecovered).not.toHaveBeenCalled();
    vi.runAllTimers();
    expect(onRecovered).toHaveBeenCalledWith({ reason: "socket_closed" });
  });

  it("forces a fresh socket for an app lifecycle recovery", () => {
    const connection = createGraphQLConnection();

    connection.recover("foreground");

    expect(ws.terminate).toHaveBeenCalledOnce();
    const params = latestOptions().connectionParams;
    expect(typeof params).toBe("function");
    expect((params as () => unknown)()).toMatchObject({ recoveryReason: "foreground" });
  });

  it("reports a heartbeat timeout and the terminated socket code", () => {
    const onRecovered = vi.fn();
    const connection = createGraphQLConnection();
    connection.onRecovered(onRecovered);
    const options = latestOptions();

    options.on?.ping?.(false, undefined);
    vi.advanceTimersByTime(2_000);
    options.on?.closed?.({ code: 4499 } as CloseEvent);
    options.on?.connected?.({}, undefined, true);
    vi.runAllTimers();

    expect(onRecovered).toHaveBeenCalledWith({
      reason: "heartbeat_timeout",
      previousCloseCode: 4499,
    });
  });

  it("retries immediately once, then backs off from one second", async () => {
    createGraphQLConnection();
    const retryWait = latestOptions().retryWait!;

    await expect(retryWait(0)).resolves.toBeUndefined();
    let settled = false;
    const waiting = retryWait(1).then(() => {
      settled = true;
    });
    await vi.advanceTimersByTimeAsync(999);
    expect(settled).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    await waiting;
    expect(settled).toBe(true);
  });

  it("wakes an exponential retry wait when the app returns", async () => {
    const connection = createGraphQLConnection();
    const waiting = latestOptions().retryWait!(5);

    connection.recover("foreground");

    await expect(waiting).resolves.toBeUndefined();
    expect(ws.terminate).not.toHaveBeenCalled();
  });
});
