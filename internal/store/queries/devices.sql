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
SELECT id, name, friendly_name, icon, display_color, display_brightness, source, type, controlled_load_role, contact_role, capabilities, available, removed, disabled, deleted, seen, last_seen
FROM devices
WHERE id = ?;

-- name: ListDevices :many
SELECT id, name, friendly_name, icon, display_color, display_brightness, source, type, controlled_load_role, contact_role, capabilities, available, removed, disabled, deleted, seen, last_seen
FROM devices;

-- name: ListDevicesBySource :many
SELECT id, name, friendly_name, icon, display_color, display_brightness, source, type, controlled_load_role, contact_role, capabilities, available, removed, disabled, deleted, seen, last_seen
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

-- The disabled and deleted flags, name override and seen flag are user-owned.
-- Their focused mutations keep adapter writes from changing them. UpsertDevice
-- preserves user-owned values and reconciles role categories against the
-- adapter-owned type and capabilities.

-- name: SetDeviceName :exec
UPDATE devices SET name = ? WHERE id = ?;

-- name: SetDeviceDisabled :exec
UPDATE devices SET disabled = ? WHERE id = ?;

-- name: SetDeviceRoles :exec
UPDATE devices
SET controlled_load_role = sqlc.narg('controlled_load_role'),
    contact_role = sqlc.narg('contact_role')
WHERE id = sqlc.arg('id');

-- name: ListRuntimeDisabledDeviceIDs :many
SELECT id FROM devices WHERE disabled = true OR deleted = true;

-- name: MarkDevicesDeleted :many
UPDATE devices
SET deleted = true, disabled = true
WHERE deleted = false
  AND id IN (SELECT value FROM json_each(CAST(sqlc.arg('ids_json') AS TEXT)))
RETURNING id;

-- name: RestoreDevices :many
UPDATE devices
SET deleted = false
WHERE deleted = true
  AND id IN (SELECT value FROM json_each(CAST(sqlc.arg('ids_json') AS TEXT)))
RETURNING id;

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

-- name: PurgeDevice :exec
DELETE FROM devices WHERE id = ?;
