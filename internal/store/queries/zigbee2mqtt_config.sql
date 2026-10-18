-- name: GetZigbee2MQTTConfig :one
SELECT revision, broker, username, password, use_wss, enabled, scan_schedule_enabled, scan_hour, scan_minute, frontend_url,
       interactive_commands_per_second, continuous_commands_per_second
FROM zigbee2mqtt_config
WHERE id = 1;

-- name: UpsertZigbee2MQTTConfig :execrows
INSERT INTO zigbee2mqtt_config (revision, id, broker, username, password, use_wss, enabled, scan_schedule_enabled, scan_hour, scan_minute, frontend_url, interactive_commands_per_second, continuous_commands_per_second)
SELECT CAST(sqlc.arg('expected_revision') AS INTEGER)+1, 1, sqlc.arg('broker'), sqlc.arg('username'), sqlc.arg('password'), sqlc.arg('use_wss'), sqlc.arg('enabled'), sqlc.arg('scan_schedule_enabled'), sqlc.arg('scan_hour'), sqlc.arg('scan_minute'), sqlc.arg('frontend_url'), sqlc.arg('interactive_commands_per_second'), sqlc.arg('continuous_commands_per_second') WHERE CAST(sqlc.arg('expected_revision') AS INTEGER) = 0 OR EXISTS (SELECT 1 FROM zigbee2mqtt_config WHERE id=1 AND revision=sqlc.arg('expected_revision'))
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
    continuous_commands_per_second  = excluded.continuous_commands_per_second, revision=zigbee2mqtt_config.revision+1 WHERE zigbee2mqtt_config.revision=excluded.revision-1;

-- name: DeleteZigbee2MQTTConfig :exec
DELETE FROM zigbee2mqtt_config WHERE id = 1;
