-- name: GetMQTTConfig :one
SELECT broker, username, password, use_wss
FROM mqtt_config
WHERE id = 1;

-- name: UpsertMQTTConfig :exec
INSERT INTO mqtt_config (id, broker, username, password, use_wss)
VALUES (1, ?, ?, ?, ?)
ON CONFLICT(id) DO UPDATE SET
    broker   = excluded.broker,
    username = excluded.username,
    password = excluded.password,
    use_wss  = excluded.use_wss;
