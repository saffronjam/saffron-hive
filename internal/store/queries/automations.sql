-- Automations own three related tables: automations, automation_nodes,
-- automation_edges. GetAutomationGraph is composed in Go from three sqlc
-- queries since sqlc's SQLite parser doesn't support data-modifying CTEs.

-- name: CreateAutomation :exec
INSERT INTO automations (id, name, enabled, cooldown_seconds, created_by)
VALUES (?, ?, ?, ?, ?);

-- name: GetAutomation :one
SELECT a.id, a.name, a.icon, a.enabled, a.cooldown_seconds, a.created_at, a.updated_at,
       u.id   AS creator_id,
       u.username AS creator_username,
       u.name AS creator_name
FROM automations a
LEFT JOIN users u ON u.id = a.created_by
WHERE a.id = ?;

-- name: ListAutomations :many
SELECT a.id, a.name, a.icon, a.enabled, a.cooldown_seconds, a.created_at, a.updated_at,
       u.id   AS creator_id,
       u.username AS creator_username,
       u.name AS creator_name
FROM automations a
LEFT JOIN users u ON u.id = a.created_by;

-- name: ListEnabledAutomations :many
SELECT a.id, a.name, a.icon, a.enabled, a.cooldown_seconds, a.created_at, a.updated_at,
       u.id   AS creator_id,
       u.username AS creator_username,
       u.name AS creator_name
FROM automations a
LEFT JOIN users u ON u.id = a.created_by
WHERE a.enabled = true;

-- name: UpdateAutomationFields :exec
-- Partial update via COALESCE(narg, col) gate. Nil narg values leave their
-- column untouched. The nullable icon column can't be cleared through this
-- query; use ClearAutomationIcon for that. All args are named so sqlc's
-- SQLite emitter keeps a consistent indexing scheme (mixing named and bare
-- positional `?` produced off-by-one parameter indices in 1.31.0).
UPDATE automations SET
    name             = COALESCE(sqlc.narg('name'),     name),
    icon             = COALESCE(sqlc.narg('icon'),     icon),
    enabled          = COALESCE(sqlc.narg('enabled'),  enabled),
    cooldown_seconds = COALESCE(sqlc.narg('cooldown'), cooldown_seconds),
    updated_at       = CURRENT_TIMESTAMP
WHERE id = sqlc.arg('id');

-- name: ClearAutomationIcon :exec
UPDATE automations SET icon = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?;

-- name: UpdateAutomationEnabled :exec
UPDATE automations SET enabled = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?;

-- name: DeleteAutomation :exec
DELETE FROM automations WHERE id = ?;

-- name: CreateAutomationNode :exec
INSERT INTO automation_nodes (id, automation_id, type, config)
VALUES (?, ?, ?, ?);

-- name: ListAutomationNodes :many
SELECT id, automation_id, type, config
FROM automation_nodes
WHERE automation_id = ?;

-- name: DeleteAutomationNode :exec
DELETE FROM automation_nodes WHERE id = ?;

-- name: CreateAutomationEdge :exec
INSERT INTO automation_edges (id, automation_id, from_node_id, to_node_id)
VALUES (?, ?, ?, ?);

-- name: ListAutomationEdges :many
SELECT id, automation_id, from_node_id, to_node_id
FROM automation_edges
WHERE automation_id = ?;

-- name: DeleteAutomationEdge :exec
DELETE FROM automation_edges WHERE id = ?;
