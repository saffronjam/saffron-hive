INSERT INTO settings (key, value) VALUES ('i18n.default_content_language', 'en')
ON CONFLICT(key) DO NOTHING;

CREATE TABLE localized_name_subjects (
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    source_language TEXT NOT NULL CHECK (source_language IN ('en', 'sv', 'ru')),
    PRIMARY KEY (entity_type, entity_id)
);

CREATE TABLE localized_names (
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    language TEXT NOT NULL CHECK (language IN ('en', 'sv', 'ru')),
    value TEXT NOT NULL CHECK (length(trim(value)) > 0),
    PRIMARY KEY (entity_type, entity_id, language),
    FOREIGN KEY (entity_type, entity_id)
        REFERENCES localized_name_subjects(entity_type, entity_id) ON DELETE CASCADE
);

CREATE TRIGGER localized_names_reject_source_language
BEFORE INSERT ON localized_names
WHEN NEW.language = (SELECT source_language FROM localized_name_subjects
                     WHERE entity_type = NEW.entity_type AND entity_id = NEW.entity_id)
BEGIN
    SELECT RAISE(ABORT, 'source language belongs in the entity name column');
END;

INSERT INTO localized_name_subjects SELECT 'device', id, 'en' FROM devices;
INSERT INTO localized_name_subjects SELECT 'group', id, 'en' FROM groups;
INSERT INTO localized_name_subjects SELECT 'room', id, 'en' FROM rooms;
INSERT INTO localized_name_subjects SELECT 'scene', id, 'en' FROM scenes;
INSERT INTO localized_name_subjects SELECT 'automation', id, 'en' FROM automations;
INSERT INTO localized_name_subjects SELECT 'webhook', id, 'en' FROM webhook_endpoints;
INSERT INTO localized_name_subjects SELECT 'effect', id, 'en' FROM effects;
INSERT INTO localized_name_subjects SELECT 'effect_track', id, 'en' FROM effect_tracks;
INSERT INTO localized_name_subjects SELECT 'floorplan', id, 'en' FROM floorplans;
INSERT INTO localized_name_subjects SELECT 'floorplan_room', id, 'en' FROM floorplan_rooms;

CREATE TRIGGER localized_subject_device_insert AFTER INSERT ON devices BEGIN
  INSERT INTO localized_name_subjects VALUES ('device', NEW.id, COALESCE((SELECT value FROM settings WHERE key = 'i18n.default_content_language'), 'en'));
END;
CREATE TRIGGER localized_subject_group_insert AFTER INSERT ON groups BEGIN
  INSERT INTO localized_name_subjects VALUES ('group', NEW.id, COALESCE((SELECT value FROM settings WHERE key = 'i18n.default_content_language'), 'en'));
END;
CREATE TRIGGER localized_subject_room_insert AFTER INSERT ON rooms BEGIN
  INSERT INTO localized_name_subjects VALUES ('room', NEW.id, COALESCE((SELECT value FROM settings WHERE key = 'i18n.default_content_language'), 'en'));
END;
CREATE TRIGGER localized_subject_scene_insert AFTER INSERT ON scenes BEGIN
  INSERT INTO localized_name_subjects VALUES ('scene', NEW.id, COALESCE((SELECT value FROM settings WHERE key = 'i18n.default_content_language'), 'en'));
END;
CREATE TRIGGER localized_subject_automation_insert AFTER INSERT ON automations BEGIN
  INSERT INTO localized_name_subjects VALUES ('automation', NEW.id, COALESCE((SELECT value FROM settings WHERE key = 'i18n.default_content_language'), 'en'));
END;
CREATE TRIGGER localized_subject_webhook_insert AFTER INSERT ON webhook_endpoints BEGIN
  INSERT INTO localized_name_subjects VALUES ('webhook', NEW.id, COALESCE((SELECT value FROM settings WHERE key = 'i18n.default_content_language'), 'en'));
END;
CREATE TRIGGER localized_subject_effect_insert AFTER INSERT ON effects BEGIN
  INSERT INTO localized_name_subjects VALUES ('effect', NEW.id, COALESCE((SELECT value FROM settings WHERE key = 'i18n.default_content_language'), 'en'));
END;
CREATE TRIGGER localized_subject_effect_track_insert AFTER INSERT ON effect_tracks BEGIN
  INSERT INTO localized_name_subjects VALUES ('effect_track', NEW.id, COALESCE((SELECT value FROM settings WHERE key = 'i18n.default_content_language'), 'en'));
END;
CREATE TRIGGER localized_subject_floorplan_insert AFTER INSERT ON floorplans BEGIN
  INSERT INTO localized_name_subjects VALUES ('floorplan', NEW.id, COALESCE((SELECT value FROM settings WHERE key = 'i18n.default_content_language'), 'en'));
END;
CREATE TRIGGER localized_subject_floorplan_room_insert AFTER INSERT ON floorplan_rooms BEGIN
  INSERT INTO localized_name_subjects VALUES ('floorplan_room', NEW.id, COALESCE((SELECT value FROM settings WHERE key = 'i18n.default_content_language'), 'en'));
END;

CREATE TRIGGER localized_subject_device_delete AFTER DELETE ON devices BEGIN DELETE FROM localized_name_subjects WHERE entity_type = 'device' AND entity_id = OLD.id; END;
CREATE TRIGGER localized_subject_group_delete AFTER DELETE ON groups BEGIN DELETE FROM localized_name_subjects WHERE entity_type = 'group' AND entity_id = OLD.id; END;
CREATE TRIGGER localized_subject_room_delete AFTER DELETE ON rooms BEGIN DELETE FROM localized_name_subjects WHERE entity_type = 'room' AND entity_id = OLD.id; END;
CREATE TRIGGER localized_subject_scene_delete AFTER DELETE ON scenes BEGIN DELETE FROM localized_name_subjects WHERE entity_type = 'scene' AND entity_id = OLD.id; END;
CREATE TRIGGER localized_subject_automation_delete AFTER DELETE ON automations BEGIN DELETE FROM localized_name_subjects WHERE entity_type = 'automation' AND entity_id = OLD.id; END;
CREATE TRIGGER localized_subject_webhook_delete AFTER DELETE ON webhook_endpoints BEGIN DELETE FROM localized_name_subjects WHERE entity_type = 'webhook' AND entity_id = OLD.id; END;
CREATE TRIGGER localized_subject_effect_delete AFTER DELETE ON effects BEGIN DELETE FROM localized_name_subjects WHERE entity_type = 'effect' AND entity_id = OLD.id; END;
CREATE TRIGGER localized_subject_effect_track_delete AFTER DELETE ON effect_tracks BEGIN DELETE FROM localized_name_subjects WHERE entity_type = 'effect_track' AND entity_id = OLD.id; END;
CREATE TRIGGER localized_subject_floorplan_delete AFTER DELETE ON floorplans BEGIN DELETE FROM localized_name_subjects WHERE entity_type = 'floorplan' AND entity_id = OLD.id; END;
CREATE TRIGGER localized_subject_floorplan_room_delete AFTER DELETE ON floorplan_rooms BEGIN DELETE FROM localized_name_subjects WHERE entity_type = 'floorplan_room' AND entity_id = OLD.id; END;
