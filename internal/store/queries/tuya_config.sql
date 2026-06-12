-- name: GetTuyaConfig :one
SELECT access_id, access_secret, region, enabled
FROM tuya_config
WHERE id = 1;

-- name: UpsertTuyaConfig :exec
INSERT INTO tuya_config (id, access_id, access_secret, region, enabled)
VALUES (1, ?, ?, ?, ?)
ON CONFLICT(id) DO UPDATE SET
    access_id     = excluded.access_id,
    access_secret = excluded.access_secret,
    region        = excluded.region,
    enabled       = excluded.enabled;

-- name: DeleteTuyaConfig :exec
DELETE FROM tuya_config WHERE id = 1;
