-- Rooms share the same read-shape with scenes/groups/automations: the row is
-- joined against users to attach optional creator attribution, so each :one /
-- :many SELECT returns the room columns plus three nullable creator columns.
--
-- Partial updates use the COALESCE(sqlc.narg, col) gate pattern: nil means
-- "leave alone". The nullable `icon` column needs a dedicated ClearRoomIcon
-- because COALESCE can't distinguish "leave alone" from "set to NULL".

-- name: CreateRoom :exec
INSERT INTO rooms (id, name, created_by) VALUES (?, ?, ?);

-- name: GetRoom :one
SELECT r.id, r.name, r.icon, r.created_at, r.updated_at,
       u.id   AS creator_id,
       u.username AS creator_username,
       u.name AS creator_name
FROM rooms r
LEFT JOIN users u ON u.id = r.created_by
WHERE r.id = ?;

-- name: ListRooms :many
SELECT r.id, r.name, r.icon, r.created_at, r.updated_at,
       u.id   AS creator_id,
       u.username AS creator_username,
       u.name AS creator_name
FROM rooms r
LEFT JOIN users u ON u.id = r.created_by;

-- name: UpdateRoomName :exec
UPDATE rooms SET name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?;

-- name: UpdateRoomIcon :exec
UPDATE rooms SET icon = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?;

-- name: ClearRoomIcon :exec
UPDATE rooms SET icon = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?;

-- name: DeleteRoom :exec
DELETE FROM rooms WHERE id = ?;

-- name: BatchDeleteRooms :execrows
DELETE FROM rooms
WHERE id IN (SELECT value FROM json_each(CAST(sqlc.arg('ids_json') AS TEXT)));

-- name: AddRoomDevice :exec
INSERT INTO room_devices (room_id, device_id) VALUES (?, ?);

-- name: AddRoomDeviceIfMissing :execrows
INSERT OR IGNORE INTO room_devices (room_id, device_id) VALUES (?, ?);

-- name: ListRoomDevices :many
SELECT room_id, device_id FROM room_devices WHERE room_id = ?;

-- name: RemoveRoomDeviceByRoomAndDevice :exec
DELETE FROM room_devices WHERE room_id = ? AND device_id = ?;

-- name: ListRoomsContainingDevice :many
SELECT r.id, r.name, r.icon, r.created_at, r.updated_at,
       u.id   AS creator_id,
       u.username AS creator_username,
       u.name AS creator_name
FROM rooms r
INNER JOIN room_devices rd ON r.id = rd.room_id
LEFT JOIN users u ON u.id = r.created_by
WHERE rd.device_id = ?;

-- name: ListRoomDeviceMemberships :many
SELECT rd.room_id, rd.device_id, r.name AS room_name
FROM room_devices rd
INNER JOIN rooms r ON r.id = rd.room_id;
