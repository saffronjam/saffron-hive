import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createGraphQLConnection } from "$lib/graphql/client";
import { installAppRecovery } from "$lib/graphql/app-recovery";

vi.mock("$lib/session", () => ({ sessionTeardown: vi.fn() }));

interface Message {
  type: string;
  id?: string;
  payload?: Record<string, unknown>;
}

class BrowserSocket extends EventTarget {
  static readonly CONNECTING = 0;
  static readonly OPEN = 1;
  static readonly CLOSING = 2;
  static readonly CLOSED = 3;
  static instances: BrowserSocket[] = [];

  readyState = BrowserSocket.CONNECTING;
  sent: Message[] = [];
  onopen: (() => void) | null = null;
  onmessage: ((event: { data: string }) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;

  constructor() {
    super();
    this.addEventListener("error", (event) => this.onerror?.(event));
    BrowserSocket.instances.push(this);
  }

  send(raw: string) {
    this.sent.push(JSON.parse(raw) as Message);
  }

  open() {
    this.readyState = BrowserSocket.OPEN;
    this.onopen?.();
  }

  receive(message: Message) {
    this.onmessage?.({ data: JSON.stringify(message) });
  }

  close(code = 1000, reason = "Closed") {
    this.readyState = BrowserSocket.CLOSED;
    queueMicrotask(() => this.onclose?.(new CloseEvent("close", { code, reason })));
  }

  fail() {
    this.dispatchEvent(new Event("error"));
    this.close(1006, "Network unavailable");
  }

  publish(value: number) {
    for (const message of this.sent.filter((message) => message.type === "subscribe")) {
      this.receive({ type: "next", id: message.id, payload: { data: { value } } });
    }
  }
}

const cleanups: (() => void)[] = [];

function visibility(value: DocumentVisibilityState) {
  Object.defineProperty(document, "visibilityState", { configurable: true, value });
  document.dispatchEvent(new Event("visibilitychange"));
}

async function flush() {
  await vi.advanceTimersByTimeAsync(0);
}

async function acknowledge(socket: BrowserSocket) {
  socket.open();
  await flush();
  expect(socket.sent[0]?.type).toBe("connection_init");
  socket.receive({ type: "connection_ack" });
  await flush();
}

function subscribe(connection: ReturnType<typeof createGraphQLConnection>, name = "LiveValues") {
  const values: number[] = [];
  const errors: string[] = [];
  const subscription = connection.client
    .subscription<{ value: number }>(`subscription ${name} { value }`, {})
    .subscribe((result) => {
      if (result.data) values.push(result.data.value);
      if (result.error) errors.push(result.error.message);
    });
  cleanups.push(() => subscription.unsubscribe());
  return { values, errors };
}

beforeEach(() => {
  vi.useFakeTimers();
  BrowserSocket.instances = [];
  vi.stubGlobal("WebSocket", BrowserSocket);
  Object.defineProperty(document, "readyState", { configurable: true, value: "complete" });
  visibility("visible");
});

afterEach(async () => {
  for (const cleanup of cleanups.splice(0).reverse()) cleanup();
  await flush();
  vi.clearAllTimers();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("GraphQL recovery with the subscription transport", () => {
  it("restores every subscription after a background network error and keeps receiving updates", async () => {
    const connection = createGraphQLConnection();
    const recovered = vi.fn();
    connection.onRecovered(recovered);
    cleanups.push(installAppRecovery(connection, () => true));
    const devices = subscribe(connection, "DeviceUpdates");
    const scenes = subscribe(connection, "SceneUpdates");
    await flush();
    await acknowledge(BrowserSocket.instances[0]);
    BrowserSocket.instances[0].publish(1);
    expect(devices.values).toEqual([1]);
    expect(scenes.values).toEqual([1]);

    visibility("hidden");
    BrowserSocket.instances[0].fail();
    await flush();
    expect(devices.errors).toEqual([]);
    expect(scenes.errors).toEqual([]);
    expect(BrowserSocket.instances).toHaveLength(2);
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Response.json({ data: { setValue: true } })),
    );
    const mutation = connection.client
      .mutation<{ setValue: boolean }>("mutation SetValue { setValue }", {})
      .toPromise();
    await flush();
    expect((await mutation).data?.setValue).toBe(true);
    expect(devices.values).toEqual([1]);
    visibility("visible");
    window.dispatchEvent(new Event("focus"));
    await acknowledge(BrowserSocket.instances[1]);
    expect(recovered).toHaveBeenCalledOnce();
    expect(
      BrowserSocket.instances[1].sent.filter((message) => message.type === "subscribe"),
    ).toHaveLength(2);
    BrowserSocket.instances[1].publish(2);
    BrowserSocket.instances[1].publish(3);
    expect(devices.values).toEqual([1, 2, 3]);
    expect(scenes.values).toEqual([1, 2, 3]);
  });

  it("recovers a visible app from a transport error without any lifecycle event", async () => {
    const connection = createGraphQLConnection();
    const stream = subscribe(connection);
    await flush();
    await acknowledge(BrowserSocket.instances[0]);
    BrowserSocket.instances[0].fail();
    await flush();
    expect(BrowserSocket.instances).toHaveLength(2);
    await acknowledge(BrowserSocket.instances[1]);
    BrowserSocket.instances[1].publish(7);
    expect(stream.values).toEqual([7]);
    expect(stream.errors).toEqual([]);
  });

  it.each(["opening", "subscribed"])(
    "isolates a delayed close from an errored %s socket",
    async (stage) => {
      const connection = createGraphQLConnection();
      const recovered = vi.fn();
      connection.onRecovered(recovered);
      const stream = subscribe(connection);
      await flush();
      const abandoned = BrowserSocket.instances[0];
      if (stage === "subscribed") await acknowledge(abandoned);

      abandoned.dispatchEvent(new Event("error"));
      await flush();
      expect(BrowserSocket.instances).toHaveLength(2);
      expect(abandoned.readyState).toBe(BrowserSocket.CLOSED);
      expect(recovered).not.toHaveBeenCalled();
      abandoned.close(1006, "Network unavailable");
      await flush();
      await acknowledge(BrowserSocket.instances[1]);
      BrowserSocket.instances[1].publish(2);
      await vi.advanceTimersByTimeAsync(1_000);
      BrowserSocket.instances[1].publish(3);

      expect(BrowserSocket.instances).toHaveLength(2);
      expect(recovered).toHaveBeenCalledOnce();
      expect(stream.values).toEqual([2, 3]);
      expect(stream.errors).toEqual([]);
    },
  );

  it("preserves recovery listeners across repeated network failures", async () => {
    const connection = createGraphQLConnection();
    const recovered = vi.fn();
    connection.onRecovered(recovered);
    const stream = subscribe(connection);
    await flush();
    await acknowledge(BrowserSocket.instances[0]);
    for (let cycle = 1; cycle <= 3; cycle++) {
      BrowserSocket.instances.at(-1)!.fail();
      await flush();
      expect(BrowserSocket.instances).toHaveLength(cycle + 1);
      await acknowledge(BrowserSocket.instances.at(-1)!);
      BrowserSocket.instances.at(-1)!.publish(cycle);
      expect(recovered).toHaveBeenCalledTimes(cycle);
      expect(recovered).toHaveBeenLastCalledWith({ reason: "socket_error" });
    }
    expect(stream.values).toEqual([1, 2, 3]);
    expect(stream.errors).toEqual([]);
  });

  it.each(["opening", "acknowledgement"])(
    "bounds a stalled %s while preserving subscriptions",
    async (stage) => {
      const connection = createGraphQLConnection();
      const stream = subscribe(connection);
      await flush();
      if (stage === "acknowledgement") BrowserSocket.instances[0].open();
      await vi.advanceTimersByTimeAsync(4_000);
      connection.recover("foreground");
      await vi.advanceTimersByTimeAsync(1_000);
      expect(BrowserSocket.instances).toHaveLength(2);
      await acknowledge(BrowserSocket.instances[1]);
      BrowserSocket.instances[1].publish(8);
      expect(stream.values).toEqual([8]);
      expect(stream.errors).toEqual([]);
    },
  );

  it("checks a responsive socket before announcing recovery", async () => {
    const connection = createGraphQLConnection();
    const recovered = vi.fn();
    connection.onRecovered(recovered);
    subscribe(connection);
    await flush();
    await acknowledge(BrowserSocket.instances[0]);
    connection.suspend();
    connection.recover("foreground");
    expect(recovered).not.toHaveBeenCalled();
    const probe = BrowserSocket.instances[0].sent.at(-1)!;
    expect(probe.type).toBe("ping");
    BrowserSocket.instances[0].receive({ type: "pong", payload: probe.payload });
    expect(recovered).toHaveBeenCalledExactlyOnceWith({ reason: "foreground" });
    expect(BrowserSocket.instances).toHaveLength(1);
  });

  it("restores subscriptions after heartbeat termination", async () => {
    const connection = createGraphQLConnection();
    const stream = subscribe(connection);
    await flush();
    await acknowledge(BrowserSocket.instances[0]);
    await vi.advanceTimersByTimeAsync(5_000);
    expect(BrowserSocket.instances).toHaveLength(2);
    await acknowledge(BrowserSocket.instances[1]);
    BrowserSocket.instances[1].publish(9);
    expect(stream.values).toEqual([9]);
    expect(stream.errors).toEqual([]);
  });

  it("does not retry fatal protocol failures on foreground recovery", async () => {
    const connection = createGraphQLConnection();
    const stream = subscribe(connection);
    await flush();
    await acknowledge(BrowserSocket.instances[0]);
    BrowserSocket.instances[0].close(4400, "Bad request");
    await flush();
    expect(stream.errors).toHaveLength(1);
    connection.recover("foreground");
    await vi.advanceTimersByTimeAsync(20_000);
    expect(BrowserSocket.instances).toHaveLength(1);
  });

  it("reports malformed protocol messages without retrying them as network failures", async () => {
    const connection = createGraphQLConnection();
    const stream = subscribe(connection);
    await flush();
    await acknowledge(BrowserSocket.instances[0]);
    BrowserSocket.instances[0].receive({ type: "invalid" });
    await flush();
    expect(stream.errors).toHaveLength(1);
    connection.recover("foreground");
    await vi.advanceTimersByTimeAsync(20_000);
    expect(BrowserSocket.instances).toHaveLength(1);
  });
});
