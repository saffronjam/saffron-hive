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

Hive runs your home from a single binary. One Go process serves a GraphQL API, an
embedded Svelte dashboard, and a SQLite database, so there is nothing to
orchestrate and nothing to keep in sync.

Devices arrive through integrations. Zigbee2MQTT bridges Zigbee devices over an
MQTT broker you already run; Tuya reaches WiFi devices through its cloud API.
Both land in the same device model, so scenes, automations and the dashboard
never care where a light came from.

Integrations are opt-in and configured in the UI. A fresh install starts with no
devices and waits for you to add one.

## Run with Docker

```bash
docker run -d \
  --name hive \
  -p 8080:8080 \
  -v hive-data:/data \
  -e HIVE_DATA_DIR=/data \
  -e HIVE_DB_PATH=/data/hive.db \
  -e HIVE_ALLOWED_ORIGINS=https://hive.example.com \
  ghcr.io/saffronjam/saffron-hive:latest
```

`HIVE_ALLOWED_ORIGINS` gates WebSocket upgrades, so set it to whatever hostname
you serve the dashboard from or subscriptions will be rejected.

Migrations do not run automatically. Apply them before serving on every deploy:

```bash
saffron-hive migrate up
saffron-hive serve
```

## First run

Open the dashboard and you land on `/setup`, which creates the admin account. It
asks for a bootstrap token, printed to the server log on first boot and also
written to `$HIVE_DATA_DIR/bootstrap.token`. The token exists so a stranger who
finds the URL before you do cannot claim the admin account.

After that, go to Integrations and add Zigbee2MQTT. Point it at the broker your
zigbee2mqtt instance publishes to and your devices show up on their own.

## Run from source

Needs Go 1.26+ and Bun.

```bash
make deps
make web   # dashboard on :5173, proxies the API
make api   # Go service on :8080
```

`make help` lists everything else. The ones worth knowing:

```bash
make sqlc gqlgen codegen   # regenerate SQL, server schema, client types
make prepare-for-commit    # what CI runs
```

CI fails on generated-code drift, so run `prepare-for-commit` before pushing
anything that touches `queries/`, `api/schema.graphql`, or a GraphQL document.

To watch raw broker traffic while debugging an adapter:

```bash
make mqttprint TOPIC='zigbee2mqtt/#'
```

It reads the broker credentials from the Zigbee2MQTT integration, so it works
against a running deployment too:

```bash
docker exec hive saffron-hive mqttprint 'zigbee2mqtt/#'
```

## License

[MIT](LICENSE)
