# Tuya AC Control Notes

## Verified Device

- App name: `Mobile Air Conditioner`
- Model: `WIFIACMB1WT12`
- Product name: `Smart Air Conditioner WIFIACMB1WT12`
- Product ID: `vrredpnf22yayvhi`
- Device ID: `bf8fde5ed4051e229baz4g`
- LAN IP at test time: `192.168.1.37`
- Tuya protocol version: `3.4`
- Tuya category: `kt`

The local key is stored in `devices.json`, which is ignored by git.

## What Was Tested

The AC was discovered through Tuya Cloud using TinyTuya and then controlled over the local network.

Read state:

```sh
python spike.py poll --name "Mobile Air Conditioner"
```

Observed DPS state:

```json
{
  "1": false,
  "2": 16,
  "3": 26,
  "4": "wind",
  "5": "low",
  "20": 0,
  "103": false,
  "109": 18,
  "110": false
}
```

Turn on:

```sh
python spike.py set-dp --name "Mobile Air Conditioner" --dp 1 --value true
```

That command successfully turned the AC on.

## Known DPS Mapping

From Tuya Cloud metadata and local polling:

- DP 1: power switch, boolean
- DP 2: target temperature Celsius, integer, range 16-31
- DP 3: current temperature Celsius, integer
- DP 4: mode, enum: `cold`, `wet`, `wind`, `hot`
- DP 5: fan speed, observed `low`
- DP 20: fault/alarm code, observed `0`
- DP 103: unknown boolean, observed `false`
- DP 109: unknown integer, observed `18`
- DP 110: unknown boolean, observed `false`

Tuya Cloud also reported:

- DP 11: `anion`, boolean
- DP 107: target temperature Fahrenheit, integer, range 61-88
- DP 108: current temperature Fahrenheit, integer

Those did not appear in the first local poll, but they may appear when the feature is active or the device reports a fuller state.

## What Is Required To Communicate With Tuya Locally

For local LAN control, the required values are:

- device ID
- device LAN IP
- local key
- protocol version
- DPS mapping for the device model

The device ID, LAN IP, and protocol version can be discovered on the LAN by TinyTuya scan. The local key cannot be recovered from LAN broadcast; it comes from the Tuya account/project or another key extraction method.

The local key changes if the device is removed and paired again.

## Does This Require Python?

No. Python is only used for the spike.

TinyTuya provides convenient implementations of:

- Tuya LAN discovery
- Tuya Cloud device/key lookup
- encrypted Tuya LAN protocol framing
- DPS polling
- DPS writes

For Saffron Hive, there are two viable implementation paths:

1. Keep a small external Python bridge for early iteration.
2. Implement a native Go Tuya WiFi adapter.

The preferred long-term direction for this repo is a native Go adapter, because Saffron Hive is a single Go service with protocol adapters inside `internal/adapter/`.

## Does This Require Tuya Cloud?

Cloud is required for the easiest local key discovery path.

Cloud is not required for normal control once these values are known:

- device ID
- local key
- LAN IP
- protocol version

After that, commands are sent directly to the device over the LAN using Tuya's encrypted local protocol.

For a production-quality adapter, Saffron Hive should store the device ID, local key, protocol version, and discovered DPS profile. It can discover or refresh the LAN IP by broadcast scan, DHCP reservation, or configured static IP.

## Next Saffron Hive Shape

A first native integration can be narrow and model-specific:

- Add a Tuya WiFi adapter package.
- Configure one device with ID, local key, protocol version, and optional static IP.
- Poll DPS periodically and publish `device.state_changed`.
- Translate `command.requested` into DPS writes.
- Map this AC as a climate-capable device:
  - `on` from DP 1
  - target temperature from DP 2
  - current temperature from DP 3
  - mode from DP 4
  - fan mode from DP 5

General Tuya support can come later by adding per-product DPS profiles.
