# Tuya Nedis AC Spike

This is a quick local-control spike for a Tuya/Nedis smart air conditioner.

The spike uses `tinytuya` directly because it gives the shortest path to prove LAN control:

- discover Tuya devices on the LAN
- fetch or use local device keys
- read raw DPS values
- set individual DPS values
- optionally bridge the raw DPS state and commands to MQTT

## Setup

```sh
cd tuya-spike
python -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt
```

## First Test: LAN Discovery

```sh
python spike.py scan
```

This should list local Tuya devices with IP, device ID, product ID, and protocol version. It cannot recover the local key by LAN scan alone.

If no devices appear, check that your machine is on the same subnet as the AC and that UDP 6666, UDP 6667, UDP 7000, and TCP 6668 are not blocked.

## Getting Local Keys

If you already have the AC's local key, skip this section.

TinyTuya can run its wizard:

```sh
python -m tinytuya wizard
```

The wizard uses Tuya IoT Cloud credentials and writes `devices.json`. You usually need:

- Tuya IoT project access ID
- Tuya IoT project access secret
- app account linked to the Tuya/Smart Life/Nedis account
- correct Tuya data center region

The local key changes if the device is removed and paired again.

## Poll The AC

With explicit connection details:

```sh
python spike.py poll --id DEVICE_ID --ip DEVICE_IP --key LOCAL_KEY --version 3.3
```

Or by name from TinyTuya's `devices.json`:

```sh
python spike.py poll --name "Nedis AC"
```

For the currently linked Tuya app device, this works:

```sh
python spike.py poll --name "Mobile Air Conditioner"
```

Verified device:

- name: `Mobile Air Conditioner`
- model: `WIFIACMB1WT12`
- product name: `Smart Air Conditioner WIFIACMB1WT12`
- product ID: `vrredpnf22yayvhi`
- device ID: `bf8fde5ed4051e229baz4g`
- LAN IP from scan: `192.168.1.37`
- protocol version: `3.4`

Observed DPS:

- DP 1: power switch
- DP 2: target temperature Celsius, range 16-31
- DP 3: current temperature Celsius
- DP 4: mode, observed `wind`; cloud mapping lists `cold`, `wet`, `wind`, `hot`
- DP 5: fan speed, observed `low`
- DP 20: fault/alarm code, observed `0`
- DP 103: boolean, observed `false`
- DP 109: integer, observed `18`
- DP 110: boolean, observed `false`

The output includes raw `dps`. Save a few samples while changing mode, fan, temperature, swing, and ioniser from the app or remote.

## Set A Single DPS

Examples only. Use the DPS you discover from `poll`.

```sh
python spike.py set-dp --id DEVICE_ID --ip DEVICE_IP --key LOCAL_KEY --version 3.3 --dp 1 --value true
python spike.py set-dp --id DEVICE_ID --ip DEVICE_IP --key LOCAL_KEY --version 3.3 --dp 2 --value 22
python spike.py set-dp --id DEVICE_ID --ip DEVICE_IP --key LOCAL_KEY --version 3.3 --dp 4 --value cold
```

The script parses JSON values, so booleans/numbers should be unquoted and strings can be plain text or JSON strings.

## MQTT Bridge

This publishes raw Tuya DPS snapshots to MQTT and accepts raw set commands:

```sh
python spike.py mqtt-bridge \
  --id DEVICE_ID --ip DEVICE_IP --key LOCAL_KEY --version 3.3 \
  --mqtt-host 192.168.1.200 \
  --topic tuya/nedis-ac \
  --interval 5
```

Published state:

- `tuya/nedis-ac/state`
- JSON payload containing `device_id`, `ip`, `version`, `dps`, and raw TinyTuya response

Commands:

- topic: `tuya/nedis-ac/set`
- payload: `{"dp": 1, "value": true}`
- payload: `{"dp": "2", "value": 22}`

This is intentionally raw. If the AC responds correctly, the next repo step is a Go Tuya WiFi adapter that maps discovered DPS to the Saffron Hive generic device model.

## Likely AC DPS Patterns

Tuya AC devices are not consistent, but the common portable AC/minisplit patterns from tuya-local are:

- DP 1: power / HVAC off-on
- DP 2 or 6: target temperature
- DP 3 or 8: current temperature
- DP 4, 5, or 101: HVAC mode
- DP 5, 8, 103, or 104: fan mode/speed
- DP 15, 16, 31, 33, 106, 110, 117, or 118: swing controls
- DP 11 or 7: ioniser/anion on some devices
- DP 20 or 22: fault/problem code

The Nedis-specific tuya-local issue I found lists these extra DPS for a Nedis Portable Air Conditioner:

- DP 11: ionisation
- DP 15 and DP 110: horizontal swing
- DP 20: error alarm
- DP 104: switch timer on
- DP 105: switch timer off
- DP 107: target temperature Fahrenheit
- DP 108: current temperature Fahrenheit

Treat those as hints, not a schema. The device's product ID and live DPS decide the final mapping.

## Research Notes

- `make-all/tuya-local` is Home Assistant focused, but its device YAML catalog is the best source for real Tuya DPS mappings.
- `TheAgentK/tuya-mqtt` bridges Tuya LAN control to MQTT, but the project is in maintenance mode and only supports older Tuya protocol expectations well enough to be risky as a base.
- `gpajot/local-tuya` is a newer Python MQTT bridge with a 2026 release, but it still expects you to obtain device IDs/local keys elsewhere.
- `tinytuya` is the best spike dependency because it supports scanning, polling, setting DPS, local-key wizard flows, and protocol 3.5 encryption support through modern crypto dependencies.
- Tuya's official air conditioner standard instruction set is useful for names like `switch`, `temp_set`, `mode`, `windspeed`, `fan_speed_enum`, `anion`, and swing controls, but local devices expose numeric DPS and can differ by manufacturer.
