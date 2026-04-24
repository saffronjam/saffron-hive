-- name: UpsertSceneExpectedState :exec
INSERT INTO scene_expected_states (scene_id, device_id, on_state, brightness, color_temp, color_r, color_g, color_b)
VALUES (?, ?, ?, ?, ?, ?, ?, ?)
ON CONFLICT(scene_id, device_id) DO UPDATE SET
    on_state   = excluded.on_state,
    brightness = excluded.brightness,
    color_temp = excluded.color_temp,
    color_r    = excluded.color_r,
    color_g    = excluded.color_g,
    color_b    = excluded.color_b;

-- name: DeleteSceneExpectedStatesByScene :exec
DELETE FROM scene_expected_states WHERE scene_id = ?;

-- name: ListSceneExpectedStates :many
SELECT scene_id, device_id, on_state, brightness, color_temp, color_r, color_g, color_b
FROM scene_expected_states
WHERE scene_id = ?;

-- name: ListAllSceneExpectedStates :many
SELECT scene_id, device_id, on_state, brightness, color_temp, color_r, color_g, color_b
FROM scene_expected_states;
