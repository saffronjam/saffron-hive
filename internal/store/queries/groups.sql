-- Same join shape as rooms; member table is group_members with typed member_type.

-- name: CreateGroup :exec
INSERT INTO groups (id, name, friendly_name, created_by) VALUES (?, ?, '', ?);

-- name: GetGroup :one
SELECT g.id, g.name, g.friendly_name, g.icon, g.provider, g.provider_group_id, g.removed,
       g.created_at, g.updated_at,
       u.id   AS creator_id,
       u.username AS creator_username,
       u.name AS creator_name
FROM groups g
LEFT JOIN users u ON u.id = g.created_by
WHERE g.id = ?;

-- name: ListGroups :many
SELECT g.id, g.name, g.friendly_name, g.icon, g.provider, g.provider_group_id, g.removed,
       g.created_at, g.updated_at,
       u.id   AS creator_id,
       u.username AS creator_username,
       u.name AS creator_name
FROM groups g
LEFT JOIN users u ON u.id = g.created_by
WHERE g.removed = false;

-- name: ResolveGroupIDByName :one
SELECT id
FROM groups
WHERE COALESCE(NULLIF(name, ''), NULLIF(friendly_name, ''), id) = ?
  AND removed = false
LIMIT 1;

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
SELECT id, group_id, member_type, member_id, provider_endpoint
FROM group_members
WHERE group_id = ?;

-- name: GetGroupMemberGroupID :one
SELECT group_id FROM group_members WHERE id = ?;

-- name: RemoveGroupMember :exec
DELETE FROM group_members WHERE id = ?;

-- name: ListGroupsContainingMember :many
SELECT g.id, g.name, g.friendly_name, g.icon, g.provider, g.provider_group_id, g.removed,
       g.created_at, g.updated_at,
       u.id   AS creator_id,
       u.username AS creator_username,
       u.name AS creator_name
FROM groups g
INNER JOIN group_members gm ON g.id = gm.group_id
LEFT JOIN users u ON u.id = g.created_by
WHERE gm.member_type = ? AND gm.member_id = ?;

-- name: ListAllGroupMemberships :many
SELECT id, group_id, member_type, member_id, provider_endpoint FROM group_members;

-- name: ListProviderGroups :many
SELECT id, name, friendly_name, icon, provider, provider_group_id, removed,
       created_at, updated_at, created_by
FROM groups
WHERE provider = ?
ORDER BY id;

-- name: ListProviderGroupMembers :many
SELECT gm.id, gm.group_id, gm.member_type, gm.member_id, gm.provider_endpoint
FROM group_members gm
JOIN groups g ON g.id = gm.group_id
WHERE g.provider = ?
ORDER BY gm.group_id, gm.member_id, gm.provider_endpoint;

-- name: UpsertProviderGroup :exec
INSERT INTO groups (id, friendly_name, provider, provider_group_id, removed)
VALUES (sqlc.arg('id'), sqlc.arg('friendly_name'), sqlc.arg('provider'), sqlc.arg('provider_group_id'), false)
ON CONFLICT(id) DO UPDATE SET
    friendly_name = excluded.friendly_name,
    provider = excluded.provider,
    provider_group_id = excluded.provider_group_id,
    removed = false,
    updated_at = CASE
        WHEN groups.friendly_name != excluded.friendly_name
          OR groups.provider != excluded.provider
          OR groups.provider_group_id != excluded.provider_group_id
          OR groups.removed != false
        THEN CURRENT_TIMESTAMP
        ELSE groups.updated_at
    END;

-- name: MarkProviderGroupsRemovedExcept :exec
UPDATE groups
SET removed = true,
    updated_at = CASE WHEN removed = false THEN CURRENT_TIMESTAMP ELSE updated_at END
WHERE provider = sqlc.arg('provider')
  AND id NOT IN (
      SELECT value FROM json_each(CAST(sqlc.arg('ids_json') AS TEXT))
  );

-- name: DeleteProviderGroupMembers :exec
DELETE FROM group_members
WHERE group_id = ?;

-- name: InsertProviderGroupMember :exec
INSERT INTO group_members (id, group_id, member_type, member_id, provider_endpoint)
VALUES (?, ?, 'device', ?, ?);

-- Cleanup of dangling polymorphic room references when a room is deleted.
-- group_members.member_id is polymorphic so no FK; mirror the same intent.
-- name: RemoveGroupMembersByRoom :exec
DELETE FROM group_members WHERE member_type = 'room' AND member_id = ?;
