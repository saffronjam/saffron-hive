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
  Object.defineProperty(document, "visibilityState", { configurable: true, value: "visible" });
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

  it("keeps a responsive socket on repeated returns and reconciles page data", () => {
    const connection = createGraphQLConnection();
    const recovered = vi.fn();
    connection.onRecovered(recovered);
    const socket = { readyState: WebSocket.OPEN, send: vi.fn() };
    const options = latestOptions();
    options.on?.connected?.(socket, undefined, false);

    for (let visit = 0; visit < 3; visit++) {
      connection.recover("foreground");
      const ping = JSON.parse(socket.send.mock.calls.at(-1)![0]);
      expect(ping.type).toBe("ping");
      options.on?.pong?.(true, ping.payload);
      vi.advanceTimersByTime(3_000);
    }

    expect(ws.terminate).not.toHaveBeenCalled();
    expect(recovered).toHaveBeenCalledTimes(3);
    expect(recovered).toHaveBeenLastCalledWith({ reason: "foreground" });
    expect((options.connectionParams as () => unknown)()).not.toHaveProperty("recoveryReason");
  });

  it("reconnects an unresponsive socket without letting repeated focus signals extend the deadline", () => {
    const connection = createGraphQLConnection();
    const socket = { readyState: WebSocket.OPEN, send: vi.fn() };
    const options = latestOptions();
    options.on?.connected?.(socket, undefined, false);
    connection.recover("foreground");
    vi.advanceTimersByTime(1_500);
    connection.recover("foreground");
    options.on?.ping?.(false, undefined);
    options.on?.pong?.(true, undefined);
    vi.advanceTimersByTime(500);
    expect(socket.send).toHaveBeenCalledOnce();
    expect(ws.terminate).toHaveBeenCalledOnce();
    expect((options.connectionParams as () => unknown)()).toMatchObject({
      recoveryReason: "foreground",
    });
  });

  it("ignores a delayed response from an earlier resume probe", () => {
    const connection = createGraphQLConnection();
    const socket = { readyState: WebSocket.OPEN, send: vi.fn() };
    const options = latestOptions();
    options.on?.connected?.(socket, undefined, false);
    connection.recover("foreground");
    const first = JSON.parse(socket.send.mock.calls.at(-1)![0]);
    options.on?.pong?.(true, first.payload);
    connection.recover("page_restore");
    options.on?.pong?.(true, first.payload);
    vi.advanceTimersByTime(2_000);
    expect(ws.terminate).toHaveBeenCalledOnce();
  });

  it("suspends outstanding heartbeats and checks afresh when the app resumes", () => {
    const connection = createGraphQLConnection();
    const socket = { readyState: WebSocket.OPEN, send: vi.fn() };
    const options = latestOptions();
    options.on?.connected?.(socket, undefined, false);
    options.on?.ping?.(false, undefined);
    vi.advanceTimersByTime(1_000);
    connection.suspend();
    options.on?.ping?.(false, undefined);
    vi.advanceTimersByTime(60_000);
    expect(ws.terminate).not.toHaveBeenCalled();
    connection.recover("foreground");
    const ping = JSON.parse(socket.send.mock.calls.at(-1)![0]);
    vi.advanceTimersByTime(1_500);
    options.on?.pong?.(true, ping.payload);
    vi.advanceTimersByTime(1_000);
    expect(ws.terminate).not.toHaveBeenCalled();
  });

  it("does not time out background heartbeats before a lifecycle signal is delivered", () => {
    createGraphQLConnection();
    const options = latestOptions();
    options.on?.ping?.(false, undefined);
    Object.defineProperty(document, "visibilityState", { configurable: true, value: "hidden" });
    vi.advanceTimersByTime(2_000);
    options.on?.ping?.(false, undefined);
    vi.advanceTimersByTime(2_000);
    expect(ws.terminate).not.toHaveBeenCalled();
  });

  it("lets a connection in progress finish when the app returns", () => {
    const connection = createGraphQLConnection();
    connection.recover("foreground");
    expect(ws.terminate).not.toHaveBeenCalled();
    latestOptions().on?.connected?.(
      { readyState: WebSocket.OPEN, send: vi.fn() },
      undefined,
      false,
    );
    vi.runAllTimers();
    expect(ws.terminate).not.toHaveBeenCalled();
  });

  it("reconnects when sending a resume probe fails", () => {
    const connection = createGraphQLConnection();
    const options = latestOptions();
    options.on?.connected?.(
      {
        readyState: WebSocket.OPEN,
        send() {
          throw new Error("Disconnected");
        },
      },
      undefined,
      false,
    );
    connection.recover("foreground");
    expect(ws.terminate).toHaveBeenCalledOnce();
    expect((options.connectionParams as () => unknown)()).toMatchObject({
      recoveryReason: "socket_error",
    });
    expect(vi.getTimerCount()).toBe(0);
  });

  it("replaces a socket whose close handshake is still pending", () => {
    const connection = createGraphQLConnection();
    const socket = { readyState: WebSocket.CLOSING, send: vi.fn() };
    latestOptions().on?.connected?.(socket, undefined, false);
    connection.recover("foreground");
    expect(socket.send).not.toHaveBeenCalled();
    expect(ws.terminate).toHaveBeenCalledOnce();
  });

  it("reconciles a normal closure even when the library does not mark the connection as a retry", () => {
    const connection = createGraphQLConnection();
    const recovered = vi.fn();
    connection.onRecovered(recovered);
    const options = latestOptions();
    options.on?.connected?.({}, undefined, false);
    options.on?.closed?.({ code: 1000 } as CloseEvent);
    options.on?.connected?.({}, undefined, false);
    vi.runAllTimers();
    expect(recovered).toHaveBeenCalledExactlyOnceWith({
      reason: "socket_closed",
      previousCloseCode: 1000,
    });
    options.on?.connected?.({}, undefined, false);
    vi.runAllTimers();
    expect(recovered).toHaveBeenCalledTimes(1);
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
