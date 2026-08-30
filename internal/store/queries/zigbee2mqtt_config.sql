-- name: GetZigbee2MQTTConfig :one
SELECT broker, username, password, use_wss, enabled, scan_schedule_enabled, scan_hour, scan_minute, frontend_url,
       interactive_commands_per_second, continuous_commands_per_second
FROM zigbee2mqtt_config
WHERE id = 1;

-- name: UpsertZigbee2MQTTConfig :exec
INSERT INTO zigbee2mqtt_config (id, broker, username, password, use_wss, enabled, scan_schedule_enabled, scan_hour, scan_minute, frontend_url, interactive_commands_per_second, continuous_commands_per_second)
VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
ON CONFLICT(id) DO UPDATE SET
    broker                = excluded.broker,
    username              = excluded.username,
    password              = excluded.password,
    use_wss               = excluded.use_wss,
    enabled               = excluded.enabled,
    scan_schedule_enabled = excluded.scan_schedule_enabled,
    scan_hour             = excluded.scan_hour,
    scan_minute           = excluded.scan_minute,
    frontend_url          = excluded.frontend_url,
    interactive_commands_per_second = excluded.interactive_commands_per_second,
    continuous_commands_per_second  = excluded.continuous_commands_per_second;

-- name: DeleteZigbee2MQTTConfig :exec
DELETE FROM zigbee2mqtt_config WHERE id = 1;
