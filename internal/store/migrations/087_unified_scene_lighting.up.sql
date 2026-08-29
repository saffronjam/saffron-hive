ALTER TABLE scene_manual_lighting RENAME TO scene_lighting;
ALTER TABLE scene_vibes RENAME TO scene_dynamic_sources;
ALTER TABLE scene_vibe_samples RENAME TO scene_dynamic_samples;
ALTER TABLE scene_device_behaviors RENAME TO scene_light_overrides;

CREATE TABLE scene_supporting_states (
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

INSERT INTO scene_supporting_states (
    scene_id, device_id, on_state, brightness, color_temp,
    color_r, color_g, color_b, color_x, color_y, transition,
    target_temperature, hvac_mode, fan_mode, swing
)
SELECT b.scene_id, b.device_id, b.on_state, b.brightness, b.color_temp,
       b.color_r, b.color_g, b.color_b, b.color_x, b.color_y, b.transition,
       b.target_temperature, b.hvac_mode, b.fan_mode, b.swing
FROM scene_light_overrides b
JOIN devices d ON d.id = b.device_id
WHERE b.kind = 'state'
  AND d.type != 'light'
  AND d.type != 'sensor'
  AND COALESCE(d.controlled_load_role, '') != 'light';

DELETE FROM scene_light_overrides
WHERE device_id IN (
    SELECT d.id
    FROM devices d
    WHERE d.type != 'light'
      AND COALESCE(d.controlled_load_role, '') != 'light'
);

ALTER TABLE scenes DROP COLUMN lighting_mode;
ALTER TABLE active_scene_runs DROP COLUMN lighting_mode;
