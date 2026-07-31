-- name: GetZigbee2MQTTConfig :one
SELECT broker, username, password, use_wss, enabled
FROM zigbee2mqtt_config
WHERE id = 1;

-- name: UpsertZigbee2MQTTConfig :exec
INSERT INTO zigbee2mqtt_config (id, broker, username, password, use_wss, enabled)
VALUES (1, ?, ?, ?, ?, ?)
ON CONFLICT(id) DO UPDATE SET
    broker   = excluded.broker,
    username = excluded.username,
    password = excluded.password,
    use_wss  = excluded.use_wss,
    enabled  = excluded.enabled;

-- name: DeleteZigbee2MQTTConfig :exec
DELETE FROM zigbee2mqtt_config WHERE id = 1;
