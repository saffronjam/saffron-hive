CREATE TABLE active_scene_runs (
    scene_id              TEXT PRIMARY KEY REFERENCES scenes(id) ON DELETE CASCADE,
    run_id                TEXT NOT NULL UNIQUE,
    started_at            TIMESTAMP NOT NULL,
    definition_updated_at TIMESTAMP NOT NULL,
    lighting_mode         TEXT NOT NULL CHECK (lighting_mode IN ('manual', 'vibe'))
);

CREATE TABLE active_scene_members (
    scene_id           TEXT NOT NULL REFERENCES active_scene_runs(scene_id) ON DELETE CASCADE,
    device_id          TEXT NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    behavior_kind      TEXT NOT NULL CHECK (behavior_kind IN ('field', 'state', 'effect', 'native_effect')),
    owns_on            INTEGER NOT NULL CHECK (owns_on IN (0, 1)),
    owns_brightness    INTEGER NOT NULL CHECK (owns_brightness IN (0, 1)),
    owns_color_temp    INTEGER NOT NULL CHECK (owns_color_temp IN (0, 1)),
    owns_color         INTEGER NOT NULL CHECK (owns_color IN (0, 1)),
    owns_temperature   INTEGER NOT NULL CHECK (owns_temperature IN (0, 1)),
    owns_hvac_mode     INTEGER NOT NULL CHECK (owns_hvac_mode IN (0, 1)),
    owns_fan_mode      INTEGER NOT NULL CHECK (owns_fan_mode IN (0, 1)),
    owns_swing         INTEGER NOT NULL CHECK (owns_swing IN (0, 1)),
    expected_on        INTEGER CHECK (expected_on IN (0, 1)),
    expected_brightness INTEGER,
    expected_color_temp INTEGER,
    expected_color_r   INTEGER,
    expected_color_g   INTEGER,
    expected_color_b   INTEGER,
    expected_color_x   REAL,
    expected_color_y   REAL,
    expected_temperature REAL,
    expected_hvac_mode TEXT,
    expected_fan_mode  TEXT,
    expected_swing     TEXT,
    effect_run_id      TEXT,
    PRIMARY KEY (scene_id, device_id)
);

CREATE INDEX idx_active_scene_members_device ON active_scene_members(device_id);

INSERT INTO active_scene_runs (
    scene_id, run_id, started_at, definition_updated_at, lighting_mode
)
SELECT id, lower(hex(randomblob(16))), activated_at, updated_at, lighting_mode
FROM scenes
WHERE activated_at IS NOT NULL;

INSERT INTO active_scene_members (
    scene_id, device_id, behavior_kind,
    owns_on, owns_brightness, owns_color_temp, owns_color,
    owns_temperature, owns_hvac_mode, owns_fan_mode, owns_swing,
    expected_on, expected_brightness, expected_color_temp,
    expected_color_r, expected_color_g, expected_color_b,
    expected_color_x, expected_color_y,
    expected_temperature, expected_hvac_mode, expected_fan_mode, expected_swing,
    effect_run_id
)
SELECT e.scene_id, e.device_id, 'state',
       e.on_state IS NOT NULL,
       e.brightness IS NOT NULL,
       e.color_temp IS NOT NULL,
       e.color_r IS NOT NULL AND e.color_g IS NOT NULL AND e.color_b IS NOT NULL,
       0, 0, 0, 0,
       e.on_state, e.brightness, e.color_temp,
       e.color_r, e.color_g, e.color_b,
       NULL, NULL,
       NULL, NULL, NULL, NULL,
       NULL
FROM scene_expected_states e
JOIN active_scene_runs r ON r.scene_id = e.scene_id;

DROP INDEX IF EXISTS idx_scene_expected_states_device;
DROP TABLE scene_expected_states;
ALTER TABLE scenes DROP COLUMN activated_at;
