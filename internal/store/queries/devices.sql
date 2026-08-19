-- Capabilities is stored as a JSON TEXT blob; the Go wrapper marshals it
-- before hitting these queries and unmarshals on read.

-- name: CreateDevice :exec
INSERT INTO devices (
    id, friendly_name, source, type, capabilities,
    controlled_load_role, contact_role, available, removed
)
VALUES (
    sqlc.arg('id'), sqlc.arg('friendly_name'), sqlc.arg('source'),
    sqlc.arg('type'), sqlc.arg('capabilities'),
    sqlc.narg('controlled_load_role'), sqlc.narg('contact_role'), false, false
);

-- name: UpsertDevice :exec
-- Refreshes every adapter-owned column, including the friendly name, and clears
-- the removed flag when a device reappears. The name column is the user's
-- override and is never touched here.
INSERT INTO devices (
    id, friendly_name, source, type, capabilities,
    controlled_load_role, contact_role, available, removed
)
VALUES (
    sqlc.arg('id'), sqlc.arg('friendly_name'), sqlc.arg('source'),
    sqlc.arg('type'), sqlc.arg('capabilities'),
    sqlc.narg('controlled_load_role'), sqlc.narg('contact_role'), false, false
)
ON CONFLICT(id) DO UPDATE SET
    friendly_name = excluded.friendly_name,
    source        = excluded.source,
    type          = excluded.type,
    capabilities  = excluded.capabilities,
    controlled_load_role = CASE
        WHEN excluded.controlled_load_role IS NULL THEN NULL
        ELSE COALESCE(devices.controlled_load_role, excluded.controlled_load_role)
    END,
    contact_role = CASE
        WHEN excluded.contact_role IS NULL THEN NULL
        ELSE COALESCE(devices.contact_role, excluded.contact_role)
    END,
    removed       = false;

-- name: GetDevice :one
SELECT id, name, friendly_name, icon, display_color, display_brightness, source, type, controlled_load_role, contact_role, capabilities, available, removed, disabled, seen, last_seen
FROM devices
WHERE id = ?;

-- name: ListDevices :many
SELECT id, name, friendly_name, icon, display_color, display_brightness, source, type, controlled_load_role, contact_role, capabilities, available, removed, disabled, seen, last_seen
FROM devices;

-- name: ListDevicesBySource :many
SELECT id, name, friendly_name, icon, display_color, display_brightness, source, type, controlled_load_role, contact_role, capabilities, available, removed, disabled, seen, last_seen
FROM devices
WHERE source = ?;

-- name: UpdateDevice :exec
UPDATE devices
SET available = ?, removed = ?, last_seen = ?
WHERE id = ?;

-- The nullable icon and display_color columns need dedicated clear queries
-- because COALESCE can't distinguish "leave alone" from "set to NULL".
-- UpdateDevice deliberately skips both so MQTT-driven sync (UpsertDevice) and
-- re-sync don't overwrite what the user set.

-- The disabled flag, the name override and the seen flag are user-owned, so each
-- gets its own setter for the same reason the icon column does: UpdateDevice
-- overwrites every column it names, and the device-removal path calls it with an
-- otherwise zero-value struct. UpsertDevice preserves user-owned values and
-- reconciles role categories against the adapter-owned type and capabilities.

-- name: SetDeviceName :exec
UPDATE devices SET name = ? WHERE id = ?;

-- name: SetDeviceDisabled :exec
UPDATE devices SET disabled = ? WHERE id = ?;

-- name: SetDeviceRoles :exec
UPDATE devices
SET controlled_load_role = sqlc.narg('controlled_load_role'),
    contact_role = sqlc.narg('contact_role')
WHERE id = sqlc.arg('id');

-- name: ListDisabledDeviceIDs :many
SELECT id FROM devices WHERE disabled = true;

-- name: MarkDevicesSeen :execrows
UPDATE devices SET seen = true
WHERE id IN (SELECT value FROM json_each(CAST(sqlc.arg('ids_json') AS TEXT)));

-- name: UpdateDeviceIcon :exec
UPDATE devices SET icon = ? WHERE id = ?;

-- name: ClearDeviceIcon :exec
UPDATE devices SET icon = NULL WHERE id = ?;

-- name: UpdateDeviceDisplayColor :exec
UPDATE devices SET display_color = ? WHERE id = ?;

-- name: ClearDeviceDisplayColor :exec
UPDATE devices SET display_color = NULL WHERE id = ?;

-- name: UpdateDeviceDisplayBrightness :exec
UPDATE devices SET display_brightness = ? WHERE id = ?;

-- name: ClearDeviceDisplayBrightness :exec
UPDATE devices SET display_brightness = NULL WHERE id = ?;

-- name: DeleteDevice :exec
DELETE FROM devices WHERE id = ?;
