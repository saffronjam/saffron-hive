import { GenericContainer, Network, Wait } from "testcontainers";
import type { StartedTestContainer, StartedNetwork } from "testcontainers";
import { connectAsync } from "mqtt";
import type { MqttClient } from "mqtt";
import { Client, fetchExchange, subscriptionExchange } from "@urql/core";
import { createClient as createWSClient } from "graphql-ws";
import { readFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { resolve } from "node:path";
import ws from "ws";
import { gql } from "@urql/core";

const FIXTURES_DIR = resolve(import.meta.dirname, "../../e2e/fixtures");
const _PROJECT_ROOT = resolve(import.meta.dirname, "../..");

interface E2EContext {
  network: StartedNetwork;
  mosquitto: StartedTestContainer;
  app: StartedTestContainer;
  graphqlClient: Client;
  mqttClient: MqttClient;
  graphqlUrl: string;
  wsUrl: string;
}

let ctx: E2EContext | undefined;

function loadFixture<T>(name: string): T {
  const content = readFileSync(resolve(FIXTURES_DIR, name), "utf-8");
  return JSON.parse(content) as T;
}

export function getContext(): E2EContext {
  if (!ctx) {
    throw new Error("E2E context not initialized — call setupE2E() first");
  }
  return ctx;
}

export function getBridgeDevicesFixture(): unknown[] {
  return loadFixture<unknown[]>("bridge_devices.json");
}

export function getLightStateFixture(): Record<string, unknown> {
  return loadFixture<Record<string, unknown>>("light_state.json");
}

export function getSensorStateFixture(): Record<string, unknown> {
  return loadFixture<Record<string, unknown>>("sensor_state.json");
}

export function getSwitchStateFixture(): Record<string, unknown> {
  return loadFixture<Record<string, unknown>>("switch_state.json");
}

export async function publishBridgeDevices(
  devices: unknown[],
): Promise<void> {
  const { mqttClient } = getContext();
  await mqttClient.publishAsync(
    "zigbee2mqtt/bridge/devices",
    JSON.stringify(devices),
    { retain: true },
  );
}

export async function publishDeviceState(
  friendlyName: string,
  payload: Record<string, unknown>,
): Promise<void> {
  const { mqttClient } = getContext();
  await mqttClient.publishAsync(
    `zigbee2mqtt/${friendlyName}`,
    JSON.stringify(payload),
    { retain: true },
  );
}

export async function publishAvailability(
  friendlyName: string,
  available: boolean,
): Promise<void> {
  const { mqttClient } = getContext();
  await mqttClient.publishAsync(
    `zigbee2mqtt/${friendlyName}/availability`,
    JSON.stringify({ state: available ? "online" : "offline" }),
    { retain: true },
  );
}

const DEVICES_QUERY = gql`
  query Devices {
    devices {
      id
      name
      source
      type
      available
    }
  }
`;

interface DevicesQueryResult {
  devices: Array<{
    id: string;
    name: string;
    source: string;
    type: string;
    available: boolean;
  }>;
}

export async function waitForDevices(
  expectedCount: number,
  timeoutMs: number,
): Promise<void> {
  const { graphqlClient } = getContext();
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const result = await graphqlClient
      .query<DevicesQueryResult>(DEVICES_QUERY, {})
      .toPromise();

    if (result.data && result.data.devices.length >= expectedCount) {
      return;
    }

    await new Promise((r) => setTimeout(r, 250));
  }

  throw new Error(
    `Timed out waiting for ${expectedCount} devices after ${timeoutMs}ms`,
  );
}

function createTestGraphQLClient(httpUrl: string, wsUrl: string): Client {
  const wsClient = createWSClient({
    url: wsUrl,
    webSocketImpl: ws,
  });

  return new Client({
    url: httpUrl,
    exchanges: [
      fetchExchange,
      subscriptionExchange({
        forwardSubscription(request) {
          const input = { ...request, query: request.query || "" };
          return {
            subscribe(sink) {
              const unsubscribe = wsClient.subscribe(input, sink);
              return { unsubscribe };
            },
          };
        },
      }),
    ],
  });
}

export async function setupE2E(): Promise<void> {
  const network = await new Network().start();

  const suffix = randomBytes(4).toString("hex");

  const mosquitto = await new GenericContainer("eclipse-mosquitto:2")
    .withName(`hive-e2e-ts-mosquitto-${suffix}`)
    .withNetwork(network)
    .withNetworkAliases("mosquitto")
    .withExposedPorts(1883)
    .withCopyContentToContainer([
      {
        content: readFileSync(resolve(FIXTURES_DIR, "mosquitto.conf"), "utf-8"),
        target: "/mosquitto/config/mosquitto.conf",
      },
    ])
    .withWaitStrategy(Wait.forListeningPorts())
    .start();

  const mosquittoHost = mosquitto.getHost();
  const mosquittoPort = mosquitto.getMappedPort(1883);

  const app = await new GenericContainer("saffron-hive-test")
    .withName(`hive-e2e-ts-app-${suffix}`)
    .withNetwork(network)
    .withNetworkAliases("saffron-hive")
    .withExposedPorts(8080)
    .withEntrypoint(["/bin/sh", "-c"])
    .withCommand(["saffron-hive migrate up && saffron-hive serve"])
    .withEnvironment({
      HIVE_MQTT_BROKER: "mosquitto:1883",
      HIVE_LISTEN_ADDR: ":8080",
      HIVE_DB_PATH: "/tmp/test.db",
    })
    .withWaitStrategy(Wait.forListeningPorts())
    .withStartupTimeout(30_000)
    .start();

  const appHost = app.getHost();
  const appPort = app.getMappedPort(8080);
  const graphqlUrl = `http://${appHost}:${appPort}/graphql`;
  const wsUrl = `ws://${appHost}:${appPort}/graphql`;

  const mqttClient = await connectAsync(`mqtt://${mosquittoHost}:${mosquittoPort}`);

  const graphqlClient = createTestGraphQLClient(graphqlUrl, wsUrl);

  ctx = {
    network,
    mosquitto,
    app,
    graphqlClient,
    mqttClient,
    graphqlUrl,
    wsUrl,
  };
}

interface MQTTCommandMessage {
  topic: string;
  payload: string;
}

export async function subscribeMQTTCommands(): Promise<{
  messages: MQTTCommandMessage[];
  cleanup: () => Promise<void>;
}> {
  const { mqttClient } = getContext();
  const messages: MQTTCommandMessage[] = [];
  const topic = "zigbee2mqtt/+/set";

  const handler = (receivedTopic: string, payload: Buffer) => {
    messages.push({
      topic: receivedTopic,
      payload: payload.toString(),
    });
  };

  mqttClient.on("message", handler);
  await mqttClient.subscribeAsync(topic);

  return {
    messages,
    cleanup: async () => {
      mqttClient.removeListener("message", handler);
      await mqttClient.unsubscribeAsync(topic);
    },
  };
}

export async function teardownE2E(): Promise<void> {
  if (!ctx) return;

  await ctx.mqttClient.endAsync();
  await ctx.app.stop();
  await ctx.mosquitto.stop();
  await ctx.network.stop();
  ctx = undefined;
}
