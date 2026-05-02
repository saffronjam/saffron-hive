<p align="center">
  <img src="resources/icon.svg" width="80" alt="Hive logo" />
</p>

<h1 align="center">Hive</h1>

<p align="center">
  Home automation in a single Go binary.
</p>

<p align="center">
  <a href="https://github.com/saffronjam/saffron-hive/actions/workflows/ci.yaml"><img src="https://github.com/saffronjam/saffron-hive/actions/workflows/ci.yaml/badge.svg" alt="CI" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License" /></a>
  <img src="https://img.shields.io/badge/go-1.26-00ADD8.svg?logo=go&logoColor=white" alt="Go 1.26" />
  <img src="https://img.shields.io/badge/svelte-5-FF3E00.svg?logo=svelte&logoColor=white" alt="Svelte 5" />
</p>

---

Hive is a from-scratch alternative to Home Assistant. One container, one GraphQL API, one dashboard. It talks to your existing Zigbee gear through zigbee2mqtt and MQTT, and owns every layer above that: device registry, scenes, automations, effects, alarms, activity log, auth.

## What's in it

- **Devices.** Auto-discovered via zigbee2mqtt. Lights, sensors, switches, plugs. Soft-deleted on removal so scenes and automations keep their references.
- **Rooms and groups.** Organise devices and address them as one target. Group commands fan out to the underlying devices.
- **Scenes.** Named device-state collections, applied with one tap. Optionally tagged to rooms.
- **Automations.** Visual graph editor. Event and cron triggers, expr-lang conditions evaluated against live state, a configurable cooldown per rule, and per-node activation events streamed back to the editor so you can see rules fire in real time.
- **Effects.** Timed multi-track sequences of brightness, color, and on/off clips, or named native protocol effects (zigbee `colorloop` and friends). Run against any device, group, or room.
- **Activity feed.** Every state change, command, scene apply, and automation firing is recorded with its resolved device/room/scene/automation name. Persisted with retention, plus a live ring buffer for the UI.
- **Alarms.** Severity-tagged signals from a built-in system-health monitor. Grouped by ID, surfaced separately from the activity stream.
- **Live logs.** The backend's `slog` output is mirrored to a ring buffer and streamed to `/logs` over a GraphQL subscription.
- **Auth.** User accounts, JWT sessions, password hashing, avatar uploads, force-password-change on first login, configurable initial admin.
- **Real-time everywhere.** One GraphQL endpoint covers queries, mutations, and subscriptions. The dashboard updates as devices report state, no polling.

## Stack

- Go 1.26 backend, single binary with the frontend embedded via `go:embed`.
- Svelte 5 + shadcn-svelte + Tailwind, built and run with [Bun](https://bun.sh).
- SQLite, golang-migrate for schema, sqlc for queries.
- GraphQL: gqlgen on the server, graphql-codegen on the client. Schema is the single source of truth on both sides; CI fails on drift.
- MQTT (Mosquitto) for device traffic. Zigbee through zigbee2mqtt.

## Run it

### Docker

```bash
docker run -d \
  --name hive \
  -p 8080:8080 \
  -v hive-data:/data \
  -e HIVE_MQTT_ADDRESS=mqtt://192.168.1.200:1883 \
  -e HIVE_MQTT_USER=your_user \
  -e HIVE_MQTT_PASSWORD=your_pass \
  -e HIVE_INIT_USER=admin \
  -e HIVE_INIT_PASSWORD=change-me \
  ghcr.io/saffronjam/saffron-hive:latest
```

`HIVE_MQTT_*` is optional; you can configure the broker through the UI instead. `HIVE_INIT_*` seeds the first admin on an empty database, and that user is forced to change the password on first login.

### Kubernetes

Deployed via ArgoCD from the home-infra repo. Migrations run as an init container before the main pod starts.

### From source

Requires Go 1.26+ and Bun.

```bash
make deps          # install Go modules and bun packages
make web           # frontend dev server (vite)
make api           # backend dev server
make package       # build the production Docker image
```

## Development

```bash
make format        # gofmt + oxfmt
make lint          # go vet + oxlint
make test          # go test + vitest
make e2e           # Go and frontend e2e (testcontainers)
```

Code generation:

```bash
make sqlc          # regenerate internal/store/sqlite/ from queries/*.sql
make gqlgen        # regenerate Go GraphQL types and resolvers
make codegen       # regenerate the TypeScript GraphQL client
```

CI runs the `-check` variant of each codegen target. `make prepare-for-commit` chains everything (deps, codegen checks, format, lint, typecheck, errcheck, tests) for a clean local pre-flight.

## License

[MIT](LICENSE)
