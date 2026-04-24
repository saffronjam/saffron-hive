ALTER TABLE scenes ADD COLUMN activated_at TIMESTAMP;

CREATE TABLE scene_expected_states (
    scene_id   TEXT NOT NULL REFERENCES scenes(id) ON DELETE CASCADE,
    device_id  TEXT NOT NULL,
    on_state   INTEGER,
    brightness INTEGER,
    color_temp INTEGER,
    color_r    INTEGER,
    color_g    INTEGER,
    color_b    INTEGER,
    PRIMARY KEY (scene_id, device_id)
);

CREATE INDEX idx_scene_expected_states_device ON scene_expected_states(device_id);
