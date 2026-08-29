CREATE TEMP TABLE scene_composition_down_guard (
    vibe_count INTEGER NOT NULL CHECK (vibe_count = 0)
);

INSERT INTO scene_composition_down_guard (vibe_count)
SELECT COUNT(*) FROM scene_vibes;

DROP TABLE scene_composition_down_guard;

CREATE TABLE scene_actions (
    scene_id    TEXT NOT NULL REFERENCES scenes(id) ON DELETE CASCADE,
    target_type TEXT NOT NULL,
    target_id   TEXT NOT NULL,
    expression  TEXT,
    name        TEXT,
    PRIMARY KEY (scene_id, target_type, target_id)
);

INSERT INTO scene_actions (scene_id, target_type, target_id, expression, name)
SELECT scene_id,
       target_type,
       COALESCE(target_id, 'expression-' || position),
       expression,
       name
FROM scene_targets
ORDER BY scene_id, position;

CREATE TABLE scene_device_payloads (
    scene_id  TEXT NOT NULL REFERENCES scenes(id) ON DELETE CASCADE,
    device_id TEXT NOT NULL,
    payload   TEXT NOT NULL,
    PRIMARY KEY (scene_id, device_id)
);

CREATE INDEX idx_scene_device_payloads_scene_id ON scene_device_payloads(scene_id);

INSERT INTO scene_device_payloads (scene_id, device_id, payload)
SELECT scene_id,
       device_id,
       CASE kind
           WHEN 'effect' THEN json_object('kind', 'effect', 'effect_id', effect_id)
           WHEN 'native_effect' THEN json_object('kind', 'native_effect', 'native_name', native_effect_name)
           ELSE json_patch(
               json_object('kind', 'static'),
               json_object(
                   'on', CASE WHEN on_state IS NULL THEN NULL ELSE json(CASE on_state WHEN 1 THEN 'true' ELSE 'false' END) END,
                   'brightness', brightness,
                   'colorTemp', color_temp,
                   'color', CASE
                       WHEN color_r IS NOT NULL AND color_g IS NOT NULL AND color_b IS NOT NULL
                       THEN json_object('r', color_r, 'g', color_g, 'b', color_b, 'x', COALESCE(color_x, 0), 'y', COALESCE(color_y, 0))
                   END,
                   'transition', transition,
                   'targetTemperature', target_temperature,
                   'hvacMode', hvac_mode,
                   'fanMode', fan_mode,
                   'swing', swing
               )
           )
       END
FROM scene_device_behaviors;

DROP TABLE scene_device_behaviors;
DROP TABLE scene_vibe_samples;
DROP TABLE scene_vibes;
DROP TABLE scene_manual_lighting;
DROP INDEX idx_scene_targets_scene;
DROP TABLE scene_targets;

ALTER TABLE scenes DROP COLUMN lighting_mode;
