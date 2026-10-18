PRAGMA foreign_keys = OFF;

CREATE TABLE device_state_samples_replacement (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    device_id TEXT NOT NULL REFERENCES devices(id),
    field TEXT NOT NULL,
    numeric_value REAL,
    text_value TEXT,
    recorded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CHECK ((numeric_value IS NOT NULL) != (text_value IS NOT NULL))
);

INSERT INTO device_state_samples_replacement SELECT * FROM device_state_samples;

DROP TABLE device_state_samples;

ALTER TABLE device_state_samples_replacement RENAME TO device_state_samples;

CREATE INDEX idx_device_state_samples_device_field_time
    ON device_state_samples(device_id, field, recorded_at);

CREATE INDEX idx_device_state_samples_recorded_at
    ON device_state_samples(recorded_at);

CREATE TABLE scene_light_overrides_replacement (
    scene_id           TEXT NOT NULL REFERENCES scenes(id) ON DELETE CASCADE,
    device_id          TEXT NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    kind               TEXT NOT NULL CHECK (kind IN ('state', 'effect', 'native_effect')),
    on_state           INTEGER CHECK (on_state IN (0, 1)),
    brightness         INTEGER,
    color_temp         INTEGER,
    color_r            INTEGER,
    color_g            INTEGER,
    color_b            INTEGER,
    color_x            REAL,
    color_y            REAL,
    transition         REAL,
    target_temperature REAL,
    hvac_mode          TEXT,
    fan_mode           TEXT,
    swing              TEXT,
    effect_id          TEXT REFERENCES effects(id) ON DELETE CASCADE,
    native_effect_name TEXT,
    PRIMARY KEY (scene_id, device_id),
    CHECK (
        (kind = 'state' AND effect_id IS NULL AND native_effect_name IS NULL) OR
        (kind = 'effect' AND effect_id IS NOT NULL AND native_effect_name IS NULL) OR
        (kind = 'native_effect' AND effect_id IS NULL AND native_effect_name IS NOT NULL)
    )
);

INSERT INTO scene_light_overrides_replacement SELECT * FROM scene_light_overrides;

DROP TABLE scene_light_overrides;

ALTER TABLE scene_light_overrides_replacement RENAME TO scene_light_overrides;

CREATE TABLE scene_supporting_states_replacement (
    scene_id           TEXT NOT NULL REFERENCES scenes(id) ON DELETE CASCADE,
    device_id          TEXT NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    on_state           INTEGER CHECK (on_state IN (0, 1)),
    brightness         INTEGER,
    color_temp         INTEGER,
    color_r            INTEGER,
    color_g            INTEGER,
    color_b            INTEGER,
    color_x            REAL,
    color_y            REAL,
    transition         REAL,
    target_temperature REAL,
    hvac_mode          TEXT,
    fan_mode           TEXT,
    swing              TEXT,
    PRIMARY KEY (scene_id, device_id),
    CHECK (
        on_state IS NOT NULL OR brightness IS NOT NULL OR color_temp IS NOT NULL OR
        color_r IS NOT NULL OR color_g IS NOT NULL OR color_b IS NOT NULL OR
        transition IS NOT NULL OR target_temperature IS NOT NULL OR
        hvac_mode IS NOT NULL OR fan_mode IS NOT NULL OR swing IS NOT NULL
    )
);

INSERT INTO scene_supporting_states_replacement SELECT * FROM scene_supporting_states;

DROP TABLE scene_supporting_states;

ALTER TABLE scene_supporting_states_replacement RENAME TO scene_supporting_states;

PRAGMA foreign_keys = ON;
