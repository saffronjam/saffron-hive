ALTER TABLE scenes
ADD COLUMN lighting_mode TEXT NOT NULL DEFAULT 'manual'
CHECK (lighting_mode IN ('manual', 'vibe'));

CREATE TABLE scene_targets (
    scene_id    TEXT NOT NULL REFERENCES scenes(id) ON DELETE CASCADE,
    position    INTEGER NOT NULL CHECK (position >= 0),
    target_type TEXT NOT NULL CHECK (target_type IN ('device', 'group', 'room', 'expression')),
    target_id   TEXT,
    expression  TEXT,
    name        TEXT,
    PRIMARY KEY (scene_id, position),
    CHECK (
        (target_type = 'expression' AND expression IS NOT NULL) OR
        (target_type != 'expression' AND target_id IS NOT NULL AND expression IS NULL)
    )
);

CREATE INDEX idx_scene_targets_scene ON scene_targets(scene_id);

INSERT INTO scene_targets (scene_id, position, target_type, target_id, expression, name)
SELECT scene_id,
       ROW_NUMBER() OVER (PARTITION BY scene_id ORDER BY rowid) - 1,
       target_type,
       CASE WHEN target_type = 'expression' THEN NULL ELSE target_id END,
       CASE
           WHEN target_type = 'expression' AND json_valid(expression) THEN expression
           WHEN target_type = 'expression' THEN '[]'
           ELSE NULL
       END,
       name
FROM scene_actions;

CREATE TABLE scene_manual_lighting (
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

INSERT INTO scene_manual_lighting (
    scene_id, on_state, brightness, color_temp, transition
)
SELECT id, 1, 200, 370, 0.6 FROM scenes;

CREATE TABLE scene_vibes (
    scene_id             TEXT PRIMARY KEY REFERENCES scenes(id) ON DELETE CASCADE,
    domain               TEXT NOT NULL CHECK (domain IN ('full_color', 'white_ambience')),
    source_kind          TEXT NOT NULL CHECK (source_kind IN ('preset', 'photo', 'guided')),
    preset_id            TEXT,
    preset_title         TEXT,
    guided_selected_ids  TEXT,
    seed                 INTEGER NOT NULL,
    brightness           REAL NOT NULL CHECK (brightness >= 0 AND brightness <= 1),
    movement             REAL NOT NULL CHECK (movement >= 0 AND movement <= 1),
    cycle_nanos          INTEGER NOT NULL CHECK (cycle_nanos > 0),
    grid_width           INTEGER NOT NULL CHECK (grid_width BETWEEN 2 AND 64),
    grid_height          INTEGER NOT NULL CHECK (grid_height BETWEEN 2 AND 64),
    CHECK (guided_selected_ids IS NULL OR json_valid(guided_selected_ids))
);

CREATE TABLE scene_vibe_samples (
    scene_id   TEXT NOT NULL REFERENCES scene_vibes(scene_id) ON DELETE CASCADE,
    position   INTEGER NOT NULL CHECK (position >= 0),
    lightness  REAL,
    chroma     REAL,
    hue        REAL,
    brightness REAL,
    mireds     REAL,
    PRIMARY KEY (scene_id, position),
    CHECK (
        (lightness IS NOT NULL AND chroma IS NOT NULL AND hue IS NOT NULL AND brightness IS NULL AND mireds IS NULL) OR
        (lightness IS NULL AND chroma IS NULL AND hue IS NULL AND brightness IS NOT NULL AND mireds IS NOT NULL)
    )
);

CREATE TABLE scene_device_behaviors (
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

INSERT INTO scene_device_behaviors (
    scene_id, device_id, kind,
    on_state, brightness, color_temp,
    color_r, color_g, color_b, color_x, color_y, transition,
    target_temperature, hvac_mode, fan_mode, swing,
    effect_id, native_effect_name
)
SELECT scene_id,
       device_id,
       CASE
           WHEN json_valid(payload) AND json_extract(payload, '$.kind') = 'effect'
                AND COALESCE(json_extract(payload, '$.effect_id'), '') != '' THEN 'effect'
           WHEN json_valid(payload) AND json_extract(payload, '$.kind') = 'native_effect'
                AND COALESCE(json_extract(payload, '$.native_name'), '') != '' THEN 'native_effect'
           ELSE 'state'
       END,
       CASE WHEN json_valid(payload) AND json_type(payload, '$.on') IN ('true', 'false') THEN json_extract(payload, '$.on') END,
       CASE WHEN json_valid(payload) AND json_type(payload, '$.brightness') IN ('integer', 'real') THEN CAST(json_extract(payload, '$.brightness') AS INTEGER) END,
       CASE WHEN json_valid(payload) AND json_type(payload, '$.colorTemp') IN ('integer', 'real') THEN CAST(json_extract(payload, '$.colorTemp') AS INTEGER) END,
       CASE WHEN json_valid(payload) AND json_type(payload, '$.color.r') IN ('integer', 'real') THEN CAST(json_extract(payload, '$.color.r') AS INTEGER) END,
       CASE WHEN json_valid(payload) AND json_type(payload, '$.color.g') IN ('integer', 'real') THEN CAST(json_extract(payload, '$.color.g') AS INTEGER) END,
       CASE WHEN json_valid(payload) AND json_type(payload, '$.color.b') IN ('integer', 'real') THEN CAST(json_extract(payload, '$.color.b') AS INTEGER) END,
       CASE WHEN json_valid(payload) AND json_type(payload, '$.color.x') IN ('integer', 'real') THEN CAST(json_extract(payload, '$.color.x') AS REAL) END,
       CASE WHEN json_valid(payload) AND json_type(payload, '$.color.y') IN ('integer', 'real') THEN CAST(json_extract(payload, '$.color.y') AS REAL) END,
       CASE WHEN json_valid(payload) AND json_type(payload, '$.transition') IN ('integer', 'real') THEN CAST(json_extract(payload, '$.transition') AS REAL) END,
       CASE WHEN json_valid(payload) AND json_type(payload, '$.targetTemperature') IN ('integer', 'real') THEN CAST(json_extract(payload, '$.targetTemperature') AS REAL) END,
       CASE WHEN json_valid(payload) AND json_type(payload, '$.hvacMode') = 'text' THEN json_extract(payload, '$.hvacMode') END,
       CASE WHEN json_valid(payload) AND json_type(payload, '$.fanMode') = 'text' THEN json_extract(payload, '$.fanMode') END,
       CASE WHEN json_valid(payload) AND json_type(payload, '$.swing') = 'text' THEN json_extract(payload, '$.swing') END,
       CASE
           WHEN json_valid(payload) AND json_extract(payload, '$.kind') = 'effect'
                AND EXISTS (SELECT 1 FROM effects WHERE effects.id = json_extract(payload, '$.effect_id'))
           THEN json_extract(payload, '$.effect_id')
       END,
       CASE
           WHEN json_valid(payload) AND json_extract(payload, '$.kind') = 'native_effect'
           THEN NULLIF(json_extract(payload, '$.native_name'), '')
       END
FROM scene_device_payloads
WHERE NOT (
    json_valid(payload) AND json_extract(payload, '$.kind') = 'effect' AND
    NOT EXISTS (SELECT 1 FROM effects WHERE effects.id = json_extract(payload, '$.effect_id'))
);

DROP TABLE scene_actions;
DROP TABLE scene_device_payloads;
