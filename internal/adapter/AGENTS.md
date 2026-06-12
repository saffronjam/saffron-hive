# adapter/

Protocol adapters that translate external device protocols into the internal domain model.

## How an adapter works

Each adapter is a self-contained package that:

1. Connects to an external source (MQTT topics, HTTP APIs, etc.)
2. Discovers devices and registers them with the device store
3. Parses protocol-specific messages into MQTT DTOs (private to the adapter)
4. Maps DTOs to domain types (from `device/` package)
5. Publishes domain events on the event bus
6. Accepts outgoing commands and translates them back to protocol-specific messages

## Adapter contract

An adapter must never leak its protocol-specific types beyond its own package. Everything published to the event bus uses domain types from `device/`.

## Current adapters

- `zigbee/` — connects to zigbee2mqtt via MQTT. Discovers devices from `bridge/devices`, subscribes to state updates, publishes commands to `<friendly_name>/set` topics.

## Future adapters

- WiFi (Tuya, Shelly, WLED)
- Sonos (via SoCo / UPnP)
- Spotify (via Web API)
