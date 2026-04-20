-- Capabilities is stored as a JSON TEXT blob; the Go wrapper marshals it
-- before hitting these queries and unmarshals on read (with a legacy format
-- fallback preserved in mapper.go).

-- name: CreateDevice :exec
INSERT INTO devices (id, name, source, type, capabilities, available, removed)
VALUES (?, ?, ?, ?, ?, false, false);

-- name: UpsertDevice :exec
-- Clears the removed flag on conflict so re-discovered devices become active.
INSERT INTO devices (id, name, source, type, capabilities, available, removed)
VALUES (?, ?, ?, ?, ?, false, false)
ON CONFLICT(id) DO UPDATE SET
    name         = excluded.name,
    source       = excluded.source,
    type         = excluded.type,
    capabilities = excluded.capabilities,
    removed      = false;

-- name: GetDevice :one
SELECT id, name, source, type, capabilities, available, removed, last_seen
FROM devices
WHERE id = ?;

-- name: ListDevices :many
SELECT id, name, source, type, capabilities, available, removed, last_seen
FROM devices;

-- name: ListDevicesBySource :many
SELECT id, name, source, type, capabilities, available, removed, last_seen
FROM devices
WHERE source = ?;

-- name: UpdateDevice :exec
UPDATE devices
SET name = ?, available = ?, removed = ?, last_seen = ?
WHERE id = ?;

-- name: DeleteDevice :exec
DELETE FROM devices WHERE id = ?;
