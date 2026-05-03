-- Per-node runtime state for stateful automation nodes (e.g. cycle_scenes
-- index). Generic key/value JSON store keyed by (automation_id, node_id, key).
-- Cascades on automation and node deletion, so graph replacement wipes state
-- automatically.

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
