ALTER TABLE scenes
ADD COLUMN lighting_mode TEXT NOT NULL DEFAULT 'manual'
CHECK (lighting_mode IN ('manual', 'vibe'));

UPDATE scenes
SET lighting_mode = 'vibe'
WHERE id IN (SELECT scene_id FROM scene_dynamic_sources);

ALTER TABLE active_scene_runs
ADD COLUMN lighting_mode TEXT NOT NULL DEFAULT 'manual'
CHECK (lighting_mode IN ('manual', 'vibe'));

UPDATE active_scene_runs
SET lighting_mode = 'vibe'
WHERE scene_id IN (SELECT scene_id FROM scene_dynamic_sources);

INSERT INTO scene_light_overrides (
    scene_id, device_id, kind, on_state, brightness, color_temp,
    color_r, color_g, color_b, color_x, color_y, transition,
    target_temperature, hvac_mode, fan_mode, swing, effect_id, native_effect_name
)
SELECT scene_id, device_id, 'state', on_state, brightness, color_temp,
       color_r, color_g, color_b, color_x, color_y, transition,
       target_temperature, hvac_mode, fan_mode, swing, NULL, NULL
FROM scene_supporting_states;

DROP TABLE scene_supporting_states;
ALTER TABLE scene_light_overrides RENAME TO scene_device_behaviors;
ALTER TABLE scene_dynamic_samples RENAME TO scene_vibe_samples;
ALTER TABLE scene_dynamic_sources RENAME TO scene_vibes;
ALTER TABLE scene_lighting RENAME TO scene_manual_lighting;
