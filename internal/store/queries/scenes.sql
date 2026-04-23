-- name: CreateScene :exec
INSERT INTO scenes (id, name, created_by) VALUES (?, ?, ?);

-- name: GetScene :one
SELECT s.id, s.name, s.icon, s.created_at, s.updated_at,
       u.id   AS creator_id,
       u.username AS creator_username,
       u.name AS creator_name
FROM scenes s
LEFT JOIN users u ON u.id = s.created_by
WHERE s.id = ?;

-- name: ListScenes :many
SELECT s.id, s.name, s.icon, s.created_at, s.updated_at,
       u.id   AS creator_id,
       u.username AS creator_username,
       u.name AS creator_name
FROM scenes s
LEFT JOIN users u ON u.id = s.created_by;

-- name: UpdateSceneName :exec
UPDATE scenes SET name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?;

-- name: UpdateSceneIcon :exec
UPDATE scenes SET icon = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?;

-- name: ClearSceneIcon :exec
UPDATE scenes SET icon = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?;

-- name: DeleteScene :exec
DELETE FROM scenes WHERE id = ?;

-- name: BatchDeleteScenes :execrows
DELETE FROM scenes
WHERE id IN (SELECT value FROM json_each(CAST(sqlc.arg('ids_json') AS TEXT)));

-- name: CreateSceneAction :exec
INSERT INTO scene_actions (id, scene_id, target_type, target_id)
VALUES (?, ?, ?, ?);

-- name: ListSceneActions :many
SELECT id, scene_id, target_type, target_id
FROM scene_actions
WHERE scene_id = ?;

-- name: DeleteSceneAction :exec
DELETE FROM scene_actions WHERE id = ?;

-- name: DeleteSceneActionsByScene :exec
DELETE FROM scene_actions WHERE scene_id = ?;

-- name: UpsertSceneDevicePayload :exec
INSERT INTO scene_device_payloads (scene_id, device_id, payload)
VALUES (?, ?, ?)
ON CONFLICT(scene_id, device_id) DO UPDATE SET payload = excluded.payload;

-- name: ListSceneDevicePayloads :many
SELECT scene_id, device_id, payload
FROM scene_device_payloads
WHERE scene_id = ?;

-- name: DeleteSceneDevicePayloadsByScene :exec
DELETE FROM scene_device_payloads WHERE scene_id = ?;

-- name: DeleteSceneDevicePayloadsNotIn :execrows
DELETE FROM scene_device_payloads
WHERE scene_id = ?
  AND device_id NOT IN (SELECT value FROM json_each(CAST(sqlc.arg('keep_ids') AS TEXT)));
