# Plan: E2E Test Infrastructure

## Dependencies
- All previous layers (the app must be functional end-to-end)

## Goal
Set up an e2e test environment using testcontainers that can be spun up from both Go and TypeScript. Tests exercise the full stack: MQTT → adapter → event bus → state store → GraphQL → client.

## Infrastructure

### Mosquitto container
Both Go and TS test suites start their own Mosquitto instance via testcontainers. Each gets an ephemeral port — no conflicts, no cleanup, fully isolated.

Use the official `eclipse-mosquitto:2` image with a minimal config that disables auth and allows anonymous connections (test-only).

Config file (`e2e/fixtures/mosquitto.conf`):
```
listener 1883
allow_anonymous true
```

### App startup

**Go tests:** Start the app in-process by importing the serve package directly. Wire up a fresh SQLite (`:memory:` or temp file), point MQTT at the testcontainer broker, run migrations, start the server on a random port. This is fast and debuggable.

**TS tests:** Start the app as a Docker container using the existing Dockerfile. Pass env vars for MQTT broker (pointing at the Mosquitto testcontainer) and listen address. Testcontainers handles networking between containers.

### Shared fixtures (`e2e/fixtures/`)

JSON files representing realistic zigbee2mqtt payloads. Both languages read the same files:

- `bridge_devices.json` — a `bridge/devices` payload with a mix of device types (lights, sensors, switches) with realistic feature definitions
- `light_state.json` — example light state update payload
- `sensor_state.json` — example sensor state update payload
- `switch_state.json` — example switch action payload

These are the raw MQTT message bodies that zigbee2mqtt would publish. Keep them realistic — copy from actual zigbee2mqtt output.

### Fake zigbee publisher

Not a shared service — each language implements its own MQTT publisher natively. The logic is trivial: connect to broker, publish JSON to topics.

**Go:** Use the same Paho MQTT client the app uses. Helper functions like:
- `PublishBridgeDevices(client, fixtures)` — publishes `bridge/devices` topic
- `PublishDeviceState(client, friendlyName, payload)` — publishes to `zigbee2mqtt/<name>`
- `PublishAvailability(client, friendlyName, available)` — publishes to `zigbee2mqtt/<name>/availability`
- `WaitForDevices(graphqlURL, expectedCount, timeout)` — polls the GraphQL API until devices appear

**TS:** Use `mqtt` npm package (tiny, no deps). Same helper pattern.

## Go e2e tests

### Package: `e2e/`

#### Setup (`e2e/infra/`)

- `e2e/infra/mosquitto.go` — starts Mosquitto testcontainer, returns broker URL
- `e2e/infra/app.go` — starts the saffron-hive app in-process: creates temp SQLite, runs migrations, starts HTTP server on random port, connects to MQTT. Returns the GraphQL URL and a cleanup function.
- `e2e/infra/publisher.go` — fake zigbee2mqtt MQTT publisher with helper functions
- `e2e/infra/fixtures.go` — loads JSON fixtures from `e2e/fixtures/`

#### Test suite (`e2e/graphql/`)

Uses `TestMain` to start infrastructure once for the whole package. All tests share the same app + broker instance.

- `e2e/graphql/setup_test.go` — TestMain: start Mosquitto, start app, publish bridge/devices, wait for devices to appear
- `e2e/graphql/devices_test.go`:
  - Query all devices, verify count and fields match fixtures
  - Query single device by ID
  - Publish a state change via MQTT, verify GraphQL query reflects new state
  - Verify availability changes propagate
- `e2e/graphql/groups_test.go`:
  - Create group, verify returned data
  - Add device member, add group member
  - Query group with resolved devices
  - Circular dependency rejection
  - Delete group, verify cascade
- `e2e/graphql/scenes_test.go`:
  - Create scene with device target
  - Create scene with group target
  - Apply scene, verify device state commands were sent (subscribe to MQTT command topic)
  - Update scene, delete scene
- `e2e/graphql/automations_test.go`:
  - Create automation graph (trigger → action)
  - Publish matching event via MQTT, verify action command published to MQTT
  - Create automation with AND operator, verify both triggers needed
  - Disable automation, verify it stops firing
  - Cooldown behavior
- `e2e/graphql/subscriptions_test.go`:
  - Subscribe to deviceStateChanged, publish MQTT state change, verify subscription fires
  - Subscribe to deviceAvailabilityChanged, verify it fires
  - Subscribe to automationNodeActivated during automation execution

### GraphQL client for Go tests

Use plain `net/http` with JSON marshaling. No need for a GraphQL client library — just POST to `/graphql` with `{"query": "...", "variables": {...}}` and unmarshal the response. Keep it simple.

For subscriptions, use `nhooyr.io/websocket` (already a transitive dependency via gqlgen) to connect and receive frames.

## TypeScript e2e tests

### Package: `web/e2e/`

Uses Vitest as the test runner (already in the stack).

#### Setup (`web/e2e/setup.ts`)

- Start Mosquitto via `testcontainers` npm package
- Start the app container via `testcontainers` (using the project's Dockerfile)
- Create urql client pointing at the app's GraphQL endpoint
- Create MQTT client (`mqtt` npm package) pointing at broker
- Export helpers: `publishBridgeDevices()`, `publishDeviceState()`, etc.

#### Tests (`web/e2e/`)

These test the actual urql client code path — the same transport the frontend uses:

- `web/e2e/devices.test.ts`:
  - Query devices via urql, verify types and data
  - Subscribe to state changes, publish MQTT update, verify subscription delivers
- `web/e2e/groups.test.ts`:
  - Create/read/delete groups via mutations
  - Add members, verify resolved devices
- `web/e2e/scenes.test.ts`:
  - Create scene, apply scene via mutation
- `web/e2e/subscriptions.test.ts`:
  - Test subscription reconnect behavior
  - Test multiple concurrent subscriptions

### Why test from TS too?

The Go tests verify the server is correct. The TS tests verify the client works correctly with the server — catches issues like the GET vs POST transport bug, nullable field mismatches, union type deserialization, and subscription wire format.

## File tree

```
e2e/
  fixtures/
    mosquitto.conf
    bridge_devices.json
    light_state.json
    sensor_state.json
    switch_state.json
  infra/
    mosquitto.go
    app.go
    publisher.go
    fixtures.go
  graphql/
    setup_test.go
    devices_test.go
    groups_test.go
    scenes_test.go
    automations_test.go
    subscriptions_test.go
web/
  e2e/
    setup.ts
    devices.test.ts
    groups.test.ts
    scenes.test.ts
    subscriptions.test.ts
```

## Makefile additions

```makefile
e2e:
	go test ./e2e/... -v -count=1 -timeout=60s
	cd web && bun run test:e2e

e2e-go:
	go test ./e2e/... -v -count=1 -timeout=60s

e2e-ts:
	cd web && bun run test:e2e
```

## Dependencies to add

**Go:**
- `github.com/testcontainers/testcontainers-go` — container management

**TS (web/):**
- `testcontainers` — container management (dev dep)
- `mqtt` — MQTT client for publishing test messages (dev dep)

## Tests for the tests

The e2e infra itself is validated by the test suite running. If Mosquitto doesn't start, if the app doesn't connect, if fixtures don't load — the tests fail with clear errors. No separate tests for the test helpers.

## Performance target

Full Go e2e suite: under 10 seconds (Mosquitto starts in ~100ms, app in-process is instant, most time is waiting for MQTT propagation).

Full TS e2e suite: under 30 seconds (app container build + start adds overhead, but only once per suite).
