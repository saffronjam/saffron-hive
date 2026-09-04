-- name: CreateScene :exec
INSERT INTO scenes (id, name, created_by) VALUES (?, ?, ?);

-- name: GetScene :one
SELECT s.id, s.name, s.icon, s.created_at, s.updated_at, r.started_at AS activated_at,
       u.id AS creator_id, u.username AS creator_username, u.name AS creator_name
FROM scenes s
LEFT JOIN users u ON u.id = s.created_by
LEFT JOIN active_scene_runs r ON r.scene_id = s.id
WHERE s.id = ?;

-- name: ListScenes :many
SELECT s.id, s.name, s.icon, s.created_at, s.updated_at, r.started_at AS activated_at,
       u.id AS creator_id, u.username AS creator_username, u.name AS creator_name
FROM scenes s
LEFT JOIN users u ON u.id = s.created_by
LEFT JOIN active_scene_runs r ON r.scene_id = s.id
ORDER BY s.created_at, s.id;

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

-- name: InsertSceneTarget :exec
INSERT INTO scene_targets (id, scene_id, position, target_type, target_id, expression, name)
VALUES (?, ?, ?, ?, ?, ?, ?);

-- name: ListSceneTargets :many
SELECT id, scene_id, position, target_type, target_id, expression, name
FROM scene_targets
WHERE scene_id = ?
ORDER BY position;

-- name: ParkSceneTargetPositions :exec
UPDATE scene_targets SET position = position + 1000000000 WHERE scene_id = ?;

-- name: DeleteSceneTargetsExcept :exec
DELETE FROM scene_targets
WHERE scene_id = sqlc.arg('scene_id')
  AND id NOT IN (SELECT value FROM json_each(CAST(sqlc.arg('ids_json') AS TEXT)));

-- name: UpdateSceneTarget :execrows
UPDATE scene_targets SET
    position = sqlc.arg('position'),
    target_type = sqlc.arg('target_type'),
    target_id = sqlc.narg('target_id'),
    expression = sqlc.narg('expression'),
    name = sqlc.narg('name')
WHERE id = sqlc.arg('id') AND scene_id = sqlc.arg('scene_id');

-- name: UpsertSceneDynamicSource :exec
INSERT INTO scene_dynamic_sources (
    scene_id, domain, source_kind, preset_id, guided_selected_ids,
    seed, brightness, movement, cycle_nanos, grid_width, grid_height
)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
ON CONFLICT(scene_id) DO UPDATE SET
    domain = excluded.domain,
    source_kind = excluded.source_kind,
    preset_id = excluded.preset_id,
    guided_selected_ids = excluded.guided_selected_ids,
    seed = excluded.seed,
    brightness = excluded.brightness,
    movement = excluded.movement,
    cycle_nanos = excluded.cycle_nanos,
    grid_width = excluded.grid_width,
    grid_height = excluded.grid_height;

-- name: GetSceneDynamicSource :one
SELECT * FROM scene_dynamic_sources WHERE scene_id = ?;

-- name: DeleteSceneDynamicSource :exec
DELETE FROM scene_dynamic_sources WHERE scene_id = ?;

-- name: InsertSceneDynamicSample :exec
INSERT INTO scene_dynamic_samples (
    scene_id, position, lightness, chroma, hue, brightness, mireds
)
VALUES (?, ?, ?, ?, ?, ?, ?);

-- name: ListSceneDynamicSamples :many
SELECT * FROM scene_dynamic_samples WHERE scene_id = ? ORDER BY position;

-- name: DeleteSceneDynamicSamples :exec
DELETE FROM scene_dynamic_samples WHERE scene_id = ?;

-- name: InsertSceneLightOverride :exec
INSERT INTO scene_light_overrides (
    scene_id, device_id, kind, on_state, brightness, color_temp,
    color_r, color_g, color_b, color_x, color_y, transition,
    target_temperature, hvac_mode, fan_mode, swing, effect_id, native_effect_name
)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);

-- name: ListSceneLightOverrides :many
SELECT * FROM scene_light_overrides WHERE scene_id = ? ORDER BY device_id;

-- name: DeleteSceneLightOverrides :exec
DELETE FROM scene_light_overrides WHERE scene_id = ?;

-- name: InsertSceneSupportingState :exec
INSERT INTO scene_supporting_states (
    scene_id, device_id, on_state, brightness, color_temp,
    color_r, color_g, color_b, color_x, color_y, transition,
    target_temperature, hvac_mode, fan_mode, swing
)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);

-- name: ListSceneSupportingStates :many
SELECT * FROM scene_supporting_states WHERE scene_id = ? ORDER BY device_id;

-- name: DeleteSceneSupportingStates :exec
DELETE FROM scene_supporting_states WHERE scene_id = ?;
