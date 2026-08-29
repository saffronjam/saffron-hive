CREATE TABLE scene_lighting (
    scene_id           TEXT PRIMARY KEY REFERENCES scenes(id) ON DELETE CASCADE,
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
    swing              TEXT
);

INSERT INTO scene_lighting (scene_id)
SELECT id FROM scenes;
