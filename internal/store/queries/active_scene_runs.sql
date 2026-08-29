-- name: UpsertActiveSceneRun :exec
INSERT INTO active_scene_runs (scene_id, run_id, started_at, definition_updated_at)
VALUES (?, ?, ?, ?)
ON CONFLICT(scene_id) DO UPDATE SET
    run_id = excluded.run_id,
    started_at = excluded.started_at,
    definition_updated_at = excluded.definition_updated_at;

-- name: DeleteActiveSceneMembers :exec
DELETE FROM active_scene_members WHERE scene_id = ?;

-- name: InsertActiveSceneMember :exec
INSERT INTO active_scene_members (
    scene_id, device_id, behavior_kind,
    owns_on, owns_brightness, owns_color_temp, owns_color,
    owns_temperature, owns_hvac_mode, owns_fan_mode, owns_swing,
    expected_on, expected_brightness, expected_color_temp,
    expected_color_r, expected_color_g, expected_color_b,
    expected_color_x, expected_color_y,
    expected_temperature, expected_hvac_mode, expected_fan_mode, expected_swing,
    effect_run_id
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);

-- name: UpdateActiveSceneMemberExpected :exec
UPDATE active_scene_members
SET expected_on = ?,
    expected_brightness = ?,
    expected_color_temp = ?,
    expected_color_r = ?,
    expected_color_g = ?,
    expected_color_b = ?,
    expected_color_x = ?,
    expected_color_y = ?,
    expected_temperature = ?,
    expected_hvac_mode = ?,
    expected_fan_mode = ?,
    expected_swing = ?
WHERE scene_id = ? AND device_id = ?;

-- name: UpdateActiveSceneMemberEffectRun :exec
UPDATE active_scene_members SET effect_run_id = ? WHERE scene_id = ? AND device_id = ?;

-- name: DeleteActiveSceneRun :execrows
DELETE FROM active_scene_runs WHERE scene_id = ?;

-- name: ListActiveSceneRuns :many
SELECT scene_id, run_id, started_at, definition_updated_at
FROM active_scene_runs
ORDER BY started_at, scene_id;

-- name: ListActiveSceneMembers :many
SELECT * FROM active_scene_members ORDER BY scene_id, device_id;

-- name: GetActiveSceneRun :one
SELECT scene_id, run_id, started_at, definition_updated_at
FROM active_scene_runs WHERE scene_id = ?;
