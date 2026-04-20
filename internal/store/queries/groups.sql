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

-- name: UpdateGroupName :exec
UPDATE groups SET name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?;

-- name: UpdateGroupIcon :exec
UPDATE groups SET icon = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?;

-- name: ClearGroupIcon :exec
UPDATE groups SET icon = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?;

-- name: DeleteGroup :exec
DELETE FROM groups WHERE id = ?;

-- name: AddGroupMember :exec
INSERT INTO group_members (id, group_id, member_type, member_id)
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
