#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import signal
import sys
import time
from pathlib import Path
from typing import Any

import tinytuya


DEFAULT_VERSION = "3.3"
DEFAULT_MQTT_HOST = "192.168.1.200"
DEFAULT_TOPIC = "tuya/nedis-ac"


def print_json(value: Any) -> None:
    print(json.dumps(value, indent=2, sort_keys=True))


def parse_value(raw: str) -> Any:
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        return raw


def load_devices(path: Path) -> list[dict[str, Any]]:
    if not path.exists():
        raise SystemExit(f"{path} does not exist. Run `python -m tinytuya wizard` or pass --id/--ip/--key.")
    with path.open() as f:
        data = json.load(f)
    if isinstance(data, dict) and isinstance(data.get("devices"), list):
        return data["devices"]
    if isinstance(data, list):
        return data
    raise SystemExit(f"{path} is not a TinyTuya devices.json list")


def find_device(args: argparse.Namespace) -> dict[str, Any]:
    if args.id and args.ip and args.key:
        return {
            "id": args.id,
            "ip": args.ip,
            "key": args.key,
            "version": args.version,
            "name": args.name or args.id,
        }

    devices = load_devices(Path(args.device_file))
    matches: list[dict[str, Any]] = []
    for device in devices:
        if args.name and args.name.lower() in str(device.get("name", "")).lower():
            matches.append(device)
        elif args.id and args.id == device.get("id"):
            matches.append(device)

    if not matches:
        raise SystemExit("No matching device found. Pass --name, --id, or explicit --id/--ip/--key.")
    if len(matches) > 1:
        print_json(matches)
        raise SystemExit("Multiple devices matched. Use a more specific --name or --id.")
    match = matches[0]
    if match.get("id") and not match.get("ip"):
        match = {**match, **scan_for_device(str(match["id"]))}
    if not (match.get("id") and match.get("ip") and match.get("key")):
        raise SystemExit(f"Matched device is missing id/ip/key: {match}")
    match.setdefault("version", args.version)
    return match


def scan_for_device(device_id: str) -> dict[str, Any]:
    scan = tinytuya.deviceScan(False, 20)
    for details in scan.values():
        if details.get("id") == device_id or details.get("gwId") == device_id:
            return {
                "ip": details.get("ip"),
                "version": details.get("version") or DEFAULT_VERSION,
                "product_id": details.get("productKey"),
            }
    return {}


def make_device(config: dict[str, Any]) -> tinytuya.Device:
    device = tinytuya.Device(
        dev_id=str(config["id"]),
        address=str(config["ip"]),
        local_key=str(config["key"]),
        version=float(config.get("version") or DEFAULT_VERSION),
    )
    device.set_socketPersistent(False)
    return device


def command_scan(_args: argparse.Namespace) -> None:
    result = tinytuya.deviceScan(False, 20)
    print_json(result)


def command_list(args: argparse.Namespace) -> None:
    print_json(load_devices(Path(args.device_file)))


def command_poll(args: argparse.Namespace) -> None:
    config = find_device(args)
    device = make_device(config)
    status = device.status()
    print_json(
        {
            "device": {
                "id": config.get("id"),
                "name": config.get("name"),
                "ip": config.get("ip"),
                "version": config.get("version"),
                "product_id": config.get("product_id") or config.get("productKey"),
            },
            "status": status,
            "dps": status.get("dps") if isinstance(status, dict) else None,
        }
    )


def command_set_dp(args: argparse.Namespace) -> None:
    config = find_device(args)
    device = make_device(config)
    value = parse_value(args.value)
    result = device.set_value(str(args.dp), value)
    print_json({"dp": str(args.dp), "value": value, "result": result})


def command_monitor(args: argparse.Namespace) -> None:
    config = find_device(args)
    device = make_device(config)
    stop = False

    def on_signal(_signum: int, _frame: Any) -> None:
        nonlocal stop
        stop = True

    signal.signal(signal.SIGINT, on_signal)
    signal.signal(signal.SIGTERM, on_signal)

    last_dps: dict[str, Any] | None = None
    while not stop:
        status = device.status()
        dps = status.get("dps") if isinstance(status, dict) else None
        if dps != last_dps:
            print_json({"ts": time.time(), "dps": dps, "raw": status})
            last_dps = dps
        time.sleep(args.interval)


def command_mqtt_bridge(args: argparse.Namespace) -> None:
    try:
        import paho.mqtt.client as mqtt
    except ImportError as exc:
        raise SystemExit("Install paho-mqtt with `pip install -r requirements.txt`.") from exc

    config = find_device(args)
    device = make_device(config)
    client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)
    state_topic = f"{args.topic.rstrip('/')}/state"
    set_topic = f"{args.topic.rstrip('/')}/set"

    def publish_status() -> None:
        status = device.status()
        payload = {
            "device_id": config.get("id"),
            "name": config.get("name"),
            "ip": config.get("ip"),
            "version": config.get("version"),
            "dps": status.get("dps") if isinstance(status, dict) else None,
            "raw": status,
        }
        client.publish(state_topic, json.dumps(payload), retain=True)

    def on_connect(client: mqtt.Client, _userdata: Any, _flags: Any, reason_code: Any, _properties: Any) -> None:
        if int(reason_code) != 0:
            print(f"MQTT connect failed: {reason_code}", file=sys.stderr)
            return
        client.subscribe(set_topic)
        publish_status()

    def on_message(_client: mqtt.Client, _userdata: Any, message: Any) -> None:
        try:
            payload = json.loads(message.payload.decode("utf-8"))
            dp = str(payload["dp"])
            value = payload["value"]
        except (KeyError, json.JSONDecodeError, UnicodeDecodeError) as exc:
            print(f"Invalid command payload on {message.topic}: {exc}", file=sys.stderr)
            return
        result = device.set_value(dp, value)
        client.publish(f"{args.topic.rstrip('/')}/set-result", json.dumps({"dp": dp, "value": value, "result": result}))
        publish_status()

    client.on_connect = on_connect
    client.on_message = on_message
    client.connect(args.mqtt_host, args.mqtt_port, keepalive=30)
    client.loop_start()

    try:
        while True:
            publish_status()
            time.sleep(args.interval)
    except KeyboardInterrupt:
        pass
    finally:
        client.loop_stop()
        client.disconnect()


def add_device_args(parser: argparse.ArgumentParser) -> None:
    parser.add_argument("--id", help="Tuya device ID")
    parser.add_argument("--ip", help="Device LAN IP")
    parser.add_argument("--key", help="Device local key")
    parser.add_argument("--version", default=DEFAULT_VERSION, help="Tuya protocol version, usually 3.3 or 3.5")
    parser.add_argument("--name", help="Case-insensitive name match from devices.json")
    parser.add_argument("--device-file", default="devices.json", help="TinyTuya devices.json path")


def main() -> None:
    parser = argparse.ArgumentParser(description="TinyTuya spike for Nedis/Tuya AC local control")
    subparsers = parser.add_subparsers(dest="command", required=True)

    scan = subparsers.add_parser("scan", help="Scan LAN for Tuya devices")
    scan.set_defaults(func=command_scan)

    list_parser = subparsers.add_parser("list", help="List devices from devices.json")
    list_parser.add_argument("--device-file", default="devices.json")
    list_parser.set_defaults(func=command_list)

    poll = subparsers.add_parser("poll", help="Read status and DPS")
    add_device_args(poll)
    poll.set_defaults(func=command_poll)

    set_dp = subparsers.add_parser("set-dp", help="Set one raw DPS value")
    add_device_args(set_dp)
    set_dp.add_argument("--dp", required=True)
    set_dp.add_argument("--value", required=True)
    set_dp.set_defaults(func=command_set_dp)

    monitor = subparsers.add_parser("monitor", help="Poll status and print changes")
    add_device_args(monitor)
    monitor.add_argument("--interval", type=float, default=2.0)
    monitor.set_defaults(func=command_monitor)

    bridge = subparsers.add_parser("mqtt-bridge", help="Publish raw DPS to MQTT and accept raw set commands")
    add_device_args(bridge)
    bridge.add_argument("--mqtt-host", default=DEFAULT_MQTT_HOST)
    bridge.add_argument("--mqtt-port", type=int, default=1883)
    bridge.add_argument("--topic", default=DEFAULT_TOPIC)
    bridge.add_argument("--interval", type=float, default=5.0)
    bridge.set_defaults(func=command_mqtt_bridge)

    args = parser.parse_args()
    args.func(args)


if __name__ == "__main__":
    main()
