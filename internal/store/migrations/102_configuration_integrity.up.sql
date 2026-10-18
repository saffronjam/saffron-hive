PRAGMA foreign_keys = OFF;

DELETE FROM "active_effects" WHERE "effect_id" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "effects" p WHERE p."id" = "active_effects"."effect_id");

DELETE FROM "effect_tracks" WHERE "effect_id" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "effects" p WHERE p."id" = "effect_tracks"."effect_id");

DELETE FROM "floorplan_door_bindings" WHERE "device_id" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "devices" p WHERE p."id" = "floorplan_door_bindings"."device_id");

DELETE FROM "floorplan_door_bindings" WHERE "floorplan_id" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "floorplans" p WHERE p."id" = "floorplan_door_bindings"."floorplan_id");

DELETE FROM "floorplan_furniture" WHERE "floorplan_id" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "floorplans" p WHERE p."id" = "floorplan_furniture"."floorplan_id");

DELETE FROM "floorplan_openings" WHERE "floorplan_id" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "floorplans" p WHERE p."id" = "floorplan_openings"."floorplan_id");

DELETE FROM "floorplan_placements" WHERE "floorplan_id" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "floorplans" p WHERE p."id" = "floorplan_placements"."floorplan_id");

DELETE FROM "floorplan_rooms" WHERE "floorplan_id" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "floorplans" p WHERE p."id" = "floorplan_rooms"."floorplan_id");

DELETE FROM "floorplan_vertices" WHERE "floorplan_id" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "floorplans" p WHERE p."id" = "floorplan_vertices"."floorplan_id");

DELETE FROM "floorplan_walls" WHERE "floorplan_id" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "floorplans" p WHERE p."id" = "floorplan_walls"."floorplan_id");

DELETE FROM "group_tags" WHERE "group_id" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "groups" p WHERE p."id" = "group_tags"."group_id");

DELETE FROM "room_members" WHERE "room_id" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "rooms" p WHERE p."id" = "room_members"."room_id");

DELETE FROM "group_members" WHERE "group_id" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "groups" p WHERE p."id" = "group_members"."group_id");

DELETE FROM "zigbee_device_metadata" WHERE "device_id" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "devices" p WHERE p."id" = "zigbee_device_metadata"."device_id");

DELETE FROM "webhook_deliveries" WHERE "endpoint_id" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "webhook_endpoints" p WHERE p."id" = "webhook_deliveries"."endpoint_id");

DELETE FROM "native_effect_observations" WHERE "device_id" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "devices" p WHERE p."id" = "native_effect_observations"."device_id");

DELETE FROM "scene_dynamic_sources" WHERE "scene_id" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "scenes" p WHERE p."id" = "scene_dynamic_sources"."scene_id");

DELETE FROM "scene_light_overrides" WHERE "scene_id" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "scenes" p WHERE p."id" = "scene_light_overrides"."scene_id");

DELETE FROM "active_scene_runs" WHERE "scene_id" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "scenes" p WHERE p."id" = "active_scene_runs"."scene_id");

DELETE FROM "active_scene_members" WHERE "device_id" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "devices" p WHERE p."id" = "active_scene_members"."device_id");

DELETE FROM "scene_supporting_states" WHERE "scene_id" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "scenes" p WHERE p."id" = "scene_supporting_states"."scene_id");

DELETE FROM "localized_names" WHERE "entity_type" IS NOT NULL AND "entity_id" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "localized_name_subjects" p WHERE p."entity_type" = "localized_names"."entity_type" AND p."entity_id" = "localized_names"."entity_id");

DELETE FROM "scene_targets" WHERE "scene_id" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "scenes" p WHERE p."id" = "scene_targets"."scene_id");

DELETE FROM "automation_nodes" WHERE "automation_id" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "automations" p WHERE p."id" = "automation_nodes"."automation_id");

DELETE FROM "automation_edges" WHERE "automation_id" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "automations" p WHERE p."id" = "automation_edges"."automation_id");

DELETE FROM "automation_node_state" WHERE "automation_id" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "automations" p WHERE p."id" = "automation_node_state"."automation_id");

DELETE FROM "assistant_conversations" WHERE "user_id" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "users" p WHERE p."id" = "assistant_conversations"."user_id");

DELETE FROM "effect_clips" WHERE "track_id" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "effect_tracks" p WHERE p."id" = "effect_clips"."track_id");

DELETE FROM "floorplan_walls" WHERE "vertex_b" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "floorplan_vertices" p WHERE p."id" = "floorplan_walls"."vertex_b");

DELETE FROM "floorplan_walls" WHERE "vertex_a" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "floorplan_vertices" p WHERE p."id" = "floorplan_walls"."vertex_a");

DELETE FROM "scene_dynamic_samples" WHERE "scene_id" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "scene_dynamic_sources" p WHERE p."scene_id" = "scene_dynamic_samples"."scene_id");

DELETE FROM "active_scene_members" WHERE "scene_id" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "active_scene_runs" p WHERE p."scene_id" = "active_scene_members"."scene_id");

DELETE FROM "automation_edges" WHERE "automation_id" IS NOT NULL AND "to_node_id" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "automation_nodes" p WHERE p."automation_id" = "automation_edges"."automation_id" AND p."id" = "automation_edges"."to_node_id");

DELETE FROM "automation_edges" WHERE "automation_id" IS NOT NULL AND "from_node_id" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "automation_nodes" p WHERE p."automation_id" = "automation_edges"."automation_id" AND p."id" = "automation_edges"."from_node_id");

DELETE FROM "automation_node_state" WHERE "automation_id" IS NOT NULL AND "node_id" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "automation_nodes" p WHERE p."automation_id" = "automation_node_state"."automation_id" AND p."id" = "automation_node_state"."node_id");

DELETE FROM "assistant_attachments" WHERE "conversation_id" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "assistant_conversations" p WHERE p."id" = "assistant_attachments"."conversation_id");

DELETE FROM "floorplan_openings" WHERE "wall_id" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "floorplan_walls" p WHERE p."id" = "floorplan_openings"."wall_id");

DELETE FROM "floorplan_door_bindings" WHERE "opening_id" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "floorplan_openings" p WHERE p."id" = "floorplan_door_bindings"."opening_id");

CREATE TABLE device_state_samples_replacement (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    device_id TEXT NOT NULL,
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
    device_id          TEXT NOT NULL,
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
    effect_id          TEXT,
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
    device_id          TEXT NOT NULL,
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

UPDATE floorplan_walls SET curve_x = NULL, curve_y = NULL WHERE (curve_x IS NULL) != (curve_y IS NULL);

UPDATE settings SET value = upper(value) WHERE key = 'log_level' AND upper(value) IN ('DEBUG','INFO','WARN','ERROR');

UPDATE scene_light_overrides SET brightness = min(254, max(0, brightness)) WHERE brightness IS NOT NULL;

UPDATE scene_light_overrides SET color_r = min(255, max(0, color_r)) WHERE color_r IS NOT NULL;

UPDATE scene_light_overrides SET color_g = min(255, max(0, color_g)) WHERE color_g IS NOT NULL;

UPDATE scene_light_overrides SET color_b = min(255, max(0, color_b)) WHERE color_b IS NOT NULL;

UPDATE scene_light_overrides SET color_temp = max(0,color_temp) WHERE color_temp IS NOT NULL;

UPDATE scene_supporting_states SET brightness = min(254, max(0, brightness)) WHERE brightness IS NOT NULL;

UPDATE scene_supporting_states SET color_r = min(255, max(0, color_r)) WHERE color_r IS NOT NULL;

UPDATE scene_supporting_states SET color_g = min(255, max(0, color_g)) WHERE color_g IS NOT NULL;

UPDATE scene_supporting_states SET color_b = min(255, max(0, color_b)) WHERE color_b IS NOT NULL;

UPDATE scene_supporting_states SET color_temp = max(0,color_temp) WHERE color_temp IS NOT NULL;

UPDATE effect_clips SET config = json_set(config, '$.value', min(254,max(0,json_extract(config,'$.value')))) WHERE kind='set_brightness' AND json_valid(config) AND json_type(config,'$.value')='integer';

UPDATE effect_clips SET config = json_set(config, '$.rgb.r', min(255,max(0,json_extract(config,'$.rgb.r')))) WHERE kind='set_color' AND json_valid(config) AND json_type(config,'$.rgb.r')='integer';

UPDATE effect_clips SET config = json_set(config, '$.rgb.g', min(255,max(0,json_extract(config,'$.rgb.g')))) WHERE kind='set_color' AND json_valid(config) AND json_type(config,'$.rgb.g')='integer';

UPDATE effect_clips SET config = json_set(config, '$.rgb.b', min(255,max(0,json_extract(config,'$.rgb.b')))) WHERE kind='set_color' AND json_valid(config) AND json_type(config,'$.rgb.b')='integer';

UPDATE devices SET display_brightness = min(254,max(0,display_brightness)) WHERE display_brightness IS NOT NULL;

UPDATE effect_clips SET config = json_set(config, '$.temp.mireds', max(0,json_extract(config,'$.temp.mireds'))) WHERE kind='set_color' AND json_valid(config) AND json_type(config,'$.temp.mireds')='integer';

PRAGMA foreign_keys = ON;
