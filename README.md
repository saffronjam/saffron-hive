<p align="center">
  <img src="resources/icon.svg" width="80" alt="Hive logo" />
</p>

<h1 align="center">Hive</h1>

<p align="center">
  A simpler, more sleek home automation system.
</p>

<p align="center">
  <a href="https://github.com/saffronjam/saffron-hive/actions/workflows/ci.yaml"><img src="https://github.com/saffronjam/saffron-hive/actions/workflows/ci.yaml/badge.svg" alt="CI" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License" /></a>
  <img src="https://img.shields.io/badge/go-1.26-00ADD8.svg?logo=go&logoColor=white" alt="Go 1.26" />
  <img src="https://img.shields.io/badge/svelte-5-FF3E00.svg?logo=svelte&logoColor=white" alt="Svelte 5" />
</p>

---

Hive is a home automation system built from scratch with Go and Svelte. Devices, scenes, automations, and a real-time dashboard, all in a single binary. It talks to your existing Zigbee devices through zigbee2mqtt and MQTT.

## Features

- Devices, scenes, groups, and automations
- Real-time dashboard with live controls (sliders, color pickers, sensor charts)
- Visual automation editor with trigger/condition/action graphs
- Dark and light mode
- Ships as one container

## Getting started

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

### Kubernetes

Manifests in [`deploy/`](deploy/). Migrations run as an init container.

### Build from source

Requires Go 1.26+ and [Bun](https://bun.sh).

```bash
make deps          # install dependencies
make web           # start frontend dev server
make api           # start backend dev server
make package       # build Docker image
```

## Development

```bash
make format        # gofmt + oxfmt
make lint          # go vet + oxlint
make test          # go test + vitest
make e2e           # end-to-end tests with testcontainers
```

## License

[MIT](LICENSE)
