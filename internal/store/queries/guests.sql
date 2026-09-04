-- name: CreateGuest :exec
INSERT INTO guests (id, name, normalized_name, expires_at, created_at)
VALUES (?, ?, ?, ?, ?);

-- name: DeleteExpiredGuestByNormalizedName :exec
DELETE FROM guests
WHERE normalized_name = sqlc.arg('normalized_name')
  AND expires_at <= sqlc.arg('now');

-- name: GetGuestByID :one
SELECT id, name, normalized_name, expires_at, created_at
FROM guests
WHERE id = ?;

-- name: GetActiveGuestByID :one
SELECT id, name, normalized_name, expires_at, created_at
FROM guests
WHERE id = sqlc.arg('id')
  AND expires_at > sqlc.arg('now');

-- name: GetActiveGuestByNormalizedName :one
SELECT id, name, normalized_name, expires_at, created_at
FROM guests
WHERE normalized_name = sqlc.arg('normalized_name')
  AND expires_at > sqlc.arg('now');

-- name: ListActiveGuests :many
SELECT id, name, normalized_name, expires_at, created_at
FROM guests
WHERE expires_at > ?
ORDER BY created_at ASC;

-- name: UpdateGuestExpiresAt :execrows
UPDATE guests
SET expires_at = sqlc.arg('expires_at')
WHERE id = sqlc.arg('id');

-- name: DeleteGuest :execrows
DELETE FROM guests WHERE id = ?;

-- name: BatchDeleteGuests :many
DELETE FROM guests
WHERE id IN (SELECT value FROM json_each(CAST(sqlc.arg('ids_json') AS TEXT)))
RETURNING id;

-- name: DeleteExpiredGuests :many
DELETE FROM guests
WHERE expires_at <= ?
RETURNING id;
