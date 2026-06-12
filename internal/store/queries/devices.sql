-- Capabilities is stored as a JSON TEXT blob; the Go wrapper marshals it
-- before hitting these queries and unmarshals on read.

-- name: CreateDevice :exec
INSERT INTO devices (id, name, source, type, capabilities, available, removed)
VALUES (?, ?, ?, ?, ?, false, false);

-- name: UpsertDevice :exec
-- Keeps the user-owned name and clears the removed flag when a device appears.
INSERT INTO devices (id, name, source, type, capabilities, available, removed)
VALUES (?, ?, ?, ?, ?, false, false)
ON CONFLICT(id) DO UPDATE SET
    source       = excluded.source,
    type         = excluded.type,
    capabilities = excluded.capabilities,
    removed      = false;

-- name: GetDevice :one
SELECT id, name, icon, source, type, capabilities, available, removed, last_seen
FROM devices
WHERE id = ?;

-- name: ListDevices :many
SELECT id, name, icon, source, type, capabilities, available, removed, last_seen
FROM devices;

-- name: ListDevicesBySource :many
SELECT id, name, icon, source, type, capabilities, available, removed, last_seen
FROM devices
WHERE source = ?;

-- name: UpdateDevice :exec
UPDATE devices
SET name = ?, available = ?, removed = ?, last_seen = ?
WHERE id = ?;

-- The nullable icon column needs a dedicated ClearDeviceIcon because COALESCE
-- can't distinguish "leave alone" from "set to NULL". UpdateDevice deliberately
-- skips the icon column so MQTT-driven sync (UpsertDevice) and re-sync don't
-- overwrite a user-set icon.

-- name: UpdateDeviceIcon :exec
UPDATE devices SET icon = ? WHERE id = ?;

-- name: ClearDeviceIcon :exec
UPDATE devices SET icon = NULL WHERE id = ?;

-- name: DeleteDevice :exec
DELETE FROM devices WHERE id = ?;
