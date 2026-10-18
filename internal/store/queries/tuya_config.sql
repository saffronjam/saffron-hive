-- name: GetTuyaConfig :one
SELECT revision, access_id, access_secret, region, enabled
FROM tuya_config
WHERE id = 1;

-- name: UpsertTuyaConfig :execrows
INSERT INTO tuya_config (revision, id, access_id, access_secret, region, enabled)
SELECT CAST(sqlc.arg('expected_revision') AS INTEGER)+1, 1, sqlc.arg('access_id'), sqlc.arg('access_secret'), sqlc.arg('region'), sqlc.arg('enabled') WHERE CAST(sqlc.arg('expected_revision') AS INTEGER) = 0 OR EXISTS (SELECT 1 FROM tuya_config WHERE id=1 AND revision=sqlc.arg('expected_revision'))
ON CONFLICT(id) DO UPDATE SET
    access_id     = excluded.access_id,
    access_secret = excluded.access_secret,
    region        = excluded.region,
    enabled       = excluded.enabled, revision=tuya_config.revision+1 WHERE tuya_config.revision=excluded.revision-1;

-- name: DeleteTuyaConfig :exec
DELETE FROM tuya_config WHERE id = 1;
