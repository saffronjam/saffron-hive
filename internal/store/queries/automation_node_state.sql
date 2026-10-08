-- Per-node runtime state for stateful automation nodes (e.g. cycle_scenes
-- index). Generic key/value JSON store keyed by (automation_id, node_id, key).
-- Node ids are short and reused within an automation, so a graph save
-- deletes the state of every node the new graph no longer contains.

-- name: GetAutomationNodeState :one
SELECT value FROM automation_node_state
WHERE automation_id = ? AND node_id = ? AND key = ?;

-- name: ListAutomationNodeStateByAutomation :many
SELECT node_id, key, value FROM automation_node_state
WHERE automation_id = ?;

-- name: SetAutomationNodeState :exec
INSERT INTO automation_node_state (automation_id, node_id, key, value, updated_at)
VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
ON CONFLICT(automation_id, node_id, key) DO UPDATE SET
    value      = excluded.value,
    updated_at = CURRENT_TIMESTAMP;

-- name: DeleteAutomationNodeStateByAutomation :exec
DELETE FROM automation_node_state WHERE automation_id = ?;

-- name: DeleteAutomationNodeStateExcept :exec
DELETE FROM automation_node_state
WHERE automation_id = sqlc.arg('automation_id')
  AND node_id NOT IN (SELECT value FROM json_each(CAST(sqlc.arg('node_ids_json') AS TEXT)));
