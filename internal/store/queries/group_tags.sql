-- name: ListGroupTags :many
SELECT tag FROM group_tags WHERE group_id = ?;

-- name: ListAllGroupTags :many
SELECT group_id, tag FROM group_tags;

-- name: InsertGroupTag :exec
INSERT OR IGNORE INTO group_tags (group_id, tag) VALUES (?, ?);

-- name: DeleteGroupTags :exec
DELETE FROM group_tags WHERE group_id = ?;
