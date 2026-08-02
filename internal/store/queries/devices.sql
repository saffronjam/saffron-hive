-- Capabilities is stored as a JSON TEXT blob; the Go wrapper marshals it
-- before hitting these queries and unmarshals on read.

-- name: CreateDevice :exec
INSERT INTO devices (id, friendly_name, source, type, capabilities, available, removed)
VALUES (?, ?, ?, ?, ?, false, false);

-- name: UpsertDevice :exec
-- Refreshes every adapter-owned column, including the friendly name, and clears
-- the removed flag when a device reappears. The name column is the user's
-- override and is never touched here.
INSERT INTO devices (id, friendly_name, source, type, capabilities, available, removed)
VALUES (?, ?, ?, ?, ?, false, false)
ON CONFLICT(id) DO UPDATE SET
    friendly_name = excluded.friendly_name,
    source        = excluded.source,
    type          = excluded.type,
    capabilities  = excluded.capabilities,
    removed       = false;

-- name: GetDevice :one
SELECT id, name, friendly_name, icon, source, type, capabilities, available, removed, disabled, seen, last_seen
FROM devices
WHERE id = ?;

-- name: ListDevices :many
SELECT id, name, friendly_name, icon, source, type, capabilities, available, removed, disabled, seen, last_seen
FROM devices;

-- name: ListDevicesBySource :many
SELECT id, name, friendly_name, icon, source, type, capabilities, available, removed, disabled, seen, last_seen
FROM devices
WHERE source = ?;

-- name: UpdateDevice :exec
UPDATE devices
SET available = ?, removed = ?, last_seen = ?
WHERE id = ?;

-- The nullable icon column needs a dedicated ClearDeviceIcon because COALESCE
-- can't distinguish "leave alone" from "set to NULL". UpdateDevice deliberately
-- skips the icon column so MQTT-driven sync (UpsertDevice) and re-sync don't
-- overwrite a user-set icon.

-- The disabled flag, the name override and the seen flag are user-owned, so each
-- gets its own setter for the same reason the icon column does: UpdateDevice
-- overwrites every column it names, and the device-removal path calls it with an
-- otherwise zero-value struct. UpsertDevice leaves all four alone as well, or an
-- adapter re-sync would undo them.

-- name: SetDeviceName :exec
UPDATE devices SET name = ? WHERE id = ?;

-- name: SetDeviceDisabled :exec
UPDATE devices SET disabled = ? WHERE id = ?;

-- name: ListDisabledDeviceIDs :many
SELECT id FROM devices WHERE disabled = true;

-- name: MarkDevicesSeen :execrows
UPDATE devices SET seen = true
WHERE id IN (SELECT value FROM json_each(CAST(sqlc.arg('ids_json') AS TEXT)));

-- name: UpdateDeviceIcon :exec
UPDATE devices SET icon = ? WHERE id = ?;

-- name: ClearDeviceIcon :exec
UPDATE devices SET icon = NULL WHERE id = ?;

-- name: DeleteDevice :exec
DELETE FROM devices WHERE id = ?;
