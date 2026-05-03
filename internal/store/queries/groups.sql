-- Same join shape as rooms; member table is group_members with typed member_type.

-- name: CreateGroup :exec
INSERT INTO groups (id, name, created_by) VALUES (?, ?, ?);

-- name: GetGroup :one
SELECT g.id, g.name, g.icon, g.created_at, g.updated_at,
       u.id   AS creator_id,
       u.username AS creator_username,
       u.name AS creator_name
FROM groups g
LEFT JOIN users u ON u.id = g.created_by
WHERE g.id = ?;

-- name: ListGroups :many
SELECT g.id, g.name, g.icon, g.created_at, g.updated_at,
       u.id   AS creator_id,
       u.username AS creator_username,
       u.name AS creator_name
FROM groups g
LEFT JOIN users u ON u.id = g.created_by;

-- name: ResolveGroupIDByName :one
SELECT id FROM groups WHERE name = ? LIMIT 1;

-- name: UpdateGroupName :exec
UPDATE groups SET name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?;

-- name: UpdateGroupIcon :exec
UPDATE groups SET icon = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?;

-- name: ClearGroupIcon :exec
UPDATE groups SET icon = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?;

-- name: DeleteGroup :exec
DELETE FROM groups WHERE id = ?;

-- name: BatchDeleteGroups :execrows
DELETE FROM groups
WHERE id IN (SELECT value FROM json_each(CAST(sqlc.arg('ids_json') AS TEXT)));

-- name: AddGroupMember :exec
INSERT INTO group_members (id, group_id, member_type, member_id)
VALUES (?, ?, ?, ?);

-- name: AddGroupMemberIfMissing :execrows
INSERT OR IGNORE INTO group_members (id, group_id, member_type, member_id)
VALUES (?, ?, ?, ?);

-- name: ListGroupMembers :many
SELECT id, group_id, member_type, member_id
FROM group_members
WHERE group_id = ?;

-- name: RemoveGroupMember :exec
DELETE FROM group_members WHERE id = ?;

-- name: ListGroupsContainingMember :many
SELECT g.id, g.name, g.icon, g.created_at, g.updated_at,
       u.id   AS creator_id,
       u.username AS creator_username,
       u.name AS creator_name
FROM groups g
INNER JOIN group_members gm ON g.id = gm.group_id
LEFT JOIN users u ON u.id = g.created_by
WHERE gm.member_type = ? AND gm.member_id = ?;

-- name: ListAllGroupMemberships :many
SELECT id, group_id, member_type, member_id FROM group_members;

-- Cleanup of dangling polymorphic room references when a room is deleted.
-- group_members.member_id is polymorphic so no FK; mirror the same intent.
-- name: RemoveGroupMembersByRoom :exec
DELETE FROM group_members WHERE member_type = 'room' AND member_id = ?;
