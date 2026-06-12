# Tuya Cloud Go Spike

This is a minimal Go client for Tuya's cloud HTTP API. It is intentionally small and uses only the Go standard library.

It was written after inspecting `github.com/tuya/tuya-cloud-sdk-go`. The important SDK behavior is:

- token request: `GET /v1.0/token?grant_type=1`
- signed API requests use headers `client_id`, `access_token`, `t`, `sign_method`, and `sign`
- `sign` is an uppercase HMAC-SHA256 over `client_id + access_token + timestamp + stringToSign`
- `stringToSign` is `METHOD + "\n" + SHA256(body) + "\n" + headers + "\n" + pathWithSortedQuery`
- command post endpoint: `POST /v1.0/devices/{device_id}/commands`

This spike uses the same signing shape directly instead of importing the SDK, so the request flow is visible.

## Config

The client loads environment variables and also reads `../tuya-spike.env`.

Required:

- `TUYA_ACCESS_ID`
- `TUYA_ACCESS_SECRET`
- `TUYA_REGION=eu`

Optional:

- `TUYA_DEVICE_ID`
- `TUYA_CLOUD_HOST`

`TUYA_CLOUD_HOST` is only needed to override the region host.

## Commands

From this directory:

```sh
go run . token
go run . discover
go run . status
go run . functions
go run . specs
go run . command --code switch --value true
go run . command --code temp_set --value 22
go run . command --code mode --value cold
```

If `TUYA_DEVICE_ID` is not set, `discover` falls back to `../devices.json` from the TinyTuya spike.
Printed JSON redacts secret fields such as `local_key` and access tokens.

`command` performs a real cloud command against the device. Use it deliberately.

You can also call any Tuya API path:

```sh
go run . raw --method GET --path /v1.0/devices/bf8fde5ed4051e229baz4g/status
```

## What This Proves

This proves the cloud-control path:

```text
Go -> Tuya Cloud HTTP API -> AC
```

This is different from the TinyTuya local-control path:

```text
Python -> LAN encrypted Tuya protocol -> AC
```

The cloud path does not need the local key, but it needs internet access and Tuya Cloud credentials. The local path needs the local key and protocol implementation, but can run without Tuya Cloud once the key is known.
