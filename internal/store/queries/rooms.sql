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

-- name: ResolveRoomIDByName :one
SELECT id FROM rooms WHERE name = ? LIMIT 1;

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

-- name: AddRoomMember :exec
INSERT INTO room_members (id, room_id, member_type, member_id)
VALUES (?, ?, ?, ?);

-- name: AddRoomMemberIfMissing :execrows
INSERT OR IGNORE INTO room_members (id, room_id, member_type, member_id)
VALUES (?, ?, ?, ?);

-- name: ListRoomMembers :many
SELECT id, room_id, member_type, member_id
FROM room_members
WHERE room_id = ?;

-- name: RemoveRoomMember :exec
DELETE FROM room_members WHERE id = ?;

-- name: ListRoomsContainingMember :many
SELECT r.id, r.name, r.icon, r.created_at, r.updated_at,
       u.id   AS creator_id,
       u.username AS creator_username,
       u.name AS creator_name
FROM rooms r
INNER JOIN room_members rm ON r.id = rm.room_id
LEFT JOIN users u ON u.id = r.created_by
WHERE rm.member_type = ? AND rm.member_id = ?;

-- name: ListRoomMemberships :many
SELECT rm.id, rm.room_id, rm.member_type, rm.member_id, r.name AS room_name
FROM room_members rm
INNER JOIN rooms r ON r.id = rm.room_id;

-- Cleanup of dangling polymorphic group references when a group is deleted.
-- Mirrors group_members FK cascade for room-as-group-member; no FK because
-- member_id is polymorphic.
-- name: RemoveRoomMembersByGroup :exec
DELETE FROM room_members WHERE member_type = 'group' AND member_id = ?;
