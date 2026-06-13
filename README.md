<p align="center">
  <img src="resources/icon.svg" width="80" alt="Hive logo" />
</p>

<h1 align="center">Hive</h1>

<p align="center">
  Home automation in one Go service.
</p>

<p align="center">
  <a href="https://github.com/saffronjam/saffron-hive/actions/workflows/ci.yaml"><img src="https://github.com/saffronjam/saffron-hive/actions/workflows/ci.yaml/badge.svg" alt="CI" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License" /></a>
  <img src="https://img.shields.io/badge/go-1.26-00ADD8.svg?logo=go&logoColor=white" alt="Go 1.26" />
  <img src="https://img.shields.io/badge/svelte-5-FF3E00.svg?logo=svelte&logoColor=white" alt="Svelte 5" />
</p>

---

Hive is a small home automation system. It runs as one Go service with an
embedded Svelte dashboard, a SQLite database, and a GraphQL API.

It talks to devices through protocol adapters. Zigbee support uses
zigbee2mqtt over MQTT. Tuya support uses the Tuya Cloud API and maps WiFi
devices into the same native device model as everything else.

## Features

- Device registry for lights, sensors, switches, plugs, climate devices,
  rooms, and groups.
- Live dashboard generated from rooms, groups, scenes, and device
  capabilities.
- Scenes that apply saved device states.
- Automations with event and cron triggers, expr-lang conditions, and
  cooldowns.
- Effects for timed light changes and native protocol effects.
- Activity feed, alarms, backend logs, and state history.
- User accounts with JWT sessions and password hashing.
- One GraphQL API for queries, mutations, and subscriptions.

## Stack

- Go 1.26 backend.
- Svelte 5 frontend with shadcn-svelte and Tailwind.
- Bun for frontend tooling.
- SQLite with golang-migrate and sqlc.
- gqlgen on the server, graphql-codegen on the client.
- MQTT for Zigbee traffic.

## Run with Docker

```bash
docker run -d \
  --name hive \
  -p 8080:8080 \
  -v hive-data:/data \
  -e HIVE_MQTT_ADDRESS=mqtt://192.168.1.200:1883 \
  -e HIVE_MQTT_USER=your_user \
  -e HIVE_MQTT_PASSWORD=your_pass \
  ghcr.io/saffronjam/saffron-hive:latest
```

MQTT can also be configured from the setup UI. Run migrations before serving
when deploying a new version:

```bash
saffron-hive migrate up
saffron-hive serve
```

## Run from source

Requires Go 1.26+ and Bun.

```bash
make deps
make web
make api
```

Useful targets:

```bash
make help
make format
make lint
make test
make e2e
make package
```

Code generation:

```bash
make sqlc
make gqlgen
make codegen
```

CI checks generated code for drift. Before committing larger changes, run:

```bash
make prepare-for-commit
```

## License

[MIT](LICENSE)
