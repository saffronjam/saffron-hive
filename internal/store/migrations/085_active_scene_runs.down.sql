ALTER TABLE scenes ADD COLUMN activated_at TIMESTAMP;

UPDATE scenes
SET activated_at = (
    SELECT started_at FROM active_scene_runs WHERE active_scene_runs.scene_id = scenes.id
);

CREATE TABLE scene_expected_states (
    scene_id   TEXT NOT NULL REFERENCES scenes(id) ON DELETE CASCADE,
    device_id  TEXT NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    on_state   INTEGER,
    brightness INTEGER,
    color_temp INTEGER,
    color_r    INTEGER,
    color_g    INTEGER,
    color_b    INTEGER,
    PRIMARY KEY (scene_id, device_id)
);

CREATE INDEX idx_scene_expected_states_device ON scene_expected_states(device_id);

INSERT INTO scene_expected_states (
    scene_id, device_id, on_state, brightness, color_temp, color_r, color_g, color_b
)
SELECT scene_id, device_id,
       expected_on, expected_brightness, expected_color_temp,
       expected_color_r, expected_color_g, expected_color_b
FROM active_scene_members
WHERE behavior_kind IN ('field', 'state');

DROP INDEX IF EXISTS idx_active_scene_members_device;
DROP TABLE active_scene_members;
DROP TABLE active_scene_runs;
