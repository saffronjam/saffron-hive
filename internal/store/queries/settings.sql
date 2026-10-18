-- name: GetSetting :one
SELECT key, value, revision FROM settings WHERE key = ?;

-- name: ListSettings :many
SELECT key, value, revision FROM settings;

-- name: UpsertSetting :exec
INSERT INTO settings (key, value) VALUES (?, ?)
ON CONFLICT(key) DO UPDATE SET value = excluded.value, revision=settings.revision+1;

-- name: UpdateSetting :execrows
INSERT INTO settings (revision, key,value)
SELECT CAST(sqlc.arg('expected_revision') AS INTEGER)+1, sqlc.arg('key'), sqlc.arg('value') WHERE sqlc.arg('expected_revision')=0 OR EXISTS(SELECT 1 FROM settings WHERE key=sqlc.arg('key') AND revision=sqlc.arg('expected_revision'))
ON CONFLICT(key) DO UPDATE SET value=excluded.value, revision=settings.revision+1 WHERE settings.revision=excluded.revision-1;
