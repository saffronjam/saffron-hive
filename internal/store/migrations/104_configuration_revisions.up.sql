ALTER TABLE rooms ADD COLUMN revision INTEGER NOT NULL DEFAULT 1;
ALTER TABLE groups ADD COLUMN revision INTEGER NOT NULL DEFAULT 1;
ALTER TABLE webhook_endpoints ADD COLUMN revision INTEGER NOT NULL DEFAULT 1;
ALTER TABLE devices ADD COLUMN revision INTEGER NOT NULL DEFAULT 1;
ALTER TABLE floorplans ADD COLUMN revision INTEGER NOT NULL DEFAULT 1;
CREATE TRIGGER room_membership_revision_insert AFTER INSERT ON room_members BEGIN UPDATE rooms SET revision=revision+1 WHERE id=NEW.room_id; END;
CREATE TRIGGER room_membership_revision_delete AFTER DELETE ON room_members BEGIN UPDATE rooms SET revision=revision+1 WHERE id=OLD.room_id; END;
CREATE TRIGGER room_membership_revision_update AFTER UPDATE ON room_members BEGIN UPDATE rooms SET revision=revision+1 WHERE id=NEW.room_id; END;
CREATE TRIGGER group_membership_revision_insert AFTER INSERT ON group_members BEGIN UPDATE groups SET revision=revision+1 WHERE id=NEW.group_id; END;
CREATE TRIGGER group_membership_revision_delete AFTER DELETE ON group_members BEGIN UPDATE groups SET revision=revision+1 WHERE id=OLD.group_id; END;
CREATE TRIGGER group_membership_revision_update AFTER UPDATE ON group_members BEGIN UPDATE groups SET revision=revision+1 WHERE id=NEW.group_id; END;
CREATE TRIGGER devices_configuration_revision AFTER UPDATE OF deleted, disabled ON devices BEGIN UPDATE devices SET revision=revision+1 WHERE id=NEW.id; END;
CREATE TRIGGER webhook_endpoints_configuration_revision AFTER UPDATE OF secret_hash ON webhook_endpoints BEGIN UPDATE webhook_endpoints SET revision=revision+1 WHERE id=NEW.id; END;
ALTER TABLE zigbee2mqtt_config ADD COLUMN revision INTEGER NOT NULL DEFAULT 1;
ALTER TABLE tuya_config ADD COLUMN revision INTEGER NOT NULL DEFAULT 1;
ALTER TABLE claude_config ADD COLUMN revision INTEGER NOT NULL DEFAULT 1;
ALTER TABLE settings ADD COLUMN revision INTEGER NOT NULL DEFAULT 1;
ALTER TABLE users ADD COLUMN revision INTEGER NOT NULL DEFAULT 1;
ALTER TABLE localized_name_subjects ADD COLUMN revision INTEGER NOT NULL DEFAULT 1;

DROP TRIGGER localized_subject_device_insert;
CREATE TRIGGER localized_subject_device_insert AFTER INSERT ON devices BEGIN
  INSERT INTO localized_name_subjects (entity_type,entity_id,source_language) VALUES ('device', NEW.id, COALESCE((SELECT value FROM settings WHERE key = 'i18n.default_content_language'), 'en'));
END;

DROP TRIGGER localized_subject_group_insert;
CREATE TRIGGER localized_subject_group_insert AFTER INSERT ON groups BEGIN
  INSERT INTO localized_name_subjects (entity_type,entity_id,source_language) VALUES ('group', NEW.id, COALESCE((SELECT value FROM settings WHERE key = 'i18n.default_content_language'), 'en'));
END;

DROP TRIGGER localized_subject_room_insert;
CREATE TRIGGER localized_subject_room_insert AFTER INSERT ON rooms BEGIN
  INSERT INTO localized_name_subjects (entity_type,entity_id,source_language) VALUES ('room', NEW.id, COALESCE((SELECT value FROM settings WHERE key = 'i18n.default_content_language'), 'en'));
END;

DROP TRIGGER localized_subject_scene_insert;
CREATE TRIGGER localized_subject_scene_insert AFTER INSERT ON scenes BEGIN
  INSERT INTO localized_name_subjects (entity_type,entity_id,source_language) VALUES ('scene', NEW.id, COALESCE((SELECT value FROM settings WHERE key = 'i18n.default_content_language'), 'en'));
END;

DROP TRIGGER localized_subject_automation_insert;
CREATE TRIGGER localized_subject_automation_insert AFTER INSERT ON automations BEGIN
  INSERT INTO localized_name_subjects (entity_type,entity_id,source_language) VALUES ('automation', NEW.id, COALESCE((SELECT value FROM settings WHERE key = 'i18n.default_content_language'), 'en'));
END;

DROP TRIGGER localized_subject_webhook_insert;
CREATE TRIGGER localized_subject_webhook_insert AFTER INSERT ON webhook_endpoints BEGIN
  INSERT INTO localized_name_subjects (entity_type,entity_id,source_language) VALUES ('webhook', NEW.id, COALESCE((SELECT value FROM settings WHERE key = 'i18n.default_content_language'), 'en'));
END;

DROP TRIGGER localized_subject_effect_insert;
CREATE TRIGGER localized_subject_effect_insert AFTER INSERT ON effects BEGIN
  INSERT INTO localized_name_subjects (entity_type,entity_id,source_language) VALUES ('effect', NEW.id, COALESCE((SELECT value FROM settings WHERE key = 'i18n.default_content_language'), 'en'));
END;

DROP TRIGGER localized_subject_effect_track_insert;
CREATE TRIGGER localized_subject_effect_track_insert AFTER INSERT ON effect_tracks BEGIN
  INSERT INTO localized_name_subjects (entity_type,entity_id,source_language) VALUES ('effect_track', NEW.id, COALESCE((SELECT value FROM settings WHERE key = 'i18n.default_content_language'), 'en'));
END;

DROP TRIGGER localized_subject_floorplan_insert;
CREATE TRIGGER localized_subject_floorplan_insert AFTER INSERT ON floorplans BEGIN
  INSERT INTO localized_name_subjects (entity_type,entity_id,source_language) VALUES ('floorplan', NEW.id, COALESCE((SELECT value FROM settings WHERE key = 'i18n.default_content_language'), 'en'));
END;

DROP TRIGGER localized_subject_floorplan_room_insert;
CREATE TRIGGER localized_subject_floorplan_room_insert AFTER INSERT ON floorplan_rooms BEGIN
  INSERT INTO localized_name_subjects (entity_type,entity_id,source_language) VALUES ('floorplan_room', NEW.id, COALESCE((SELECT value FROM settings WHERE key = 'i18n.default_content_language'), 'en'));
END;

DROP TRIGGER localized_subject_scene_target_insert;
CREATE TRIGGER localized_subject_scene_target_insert
AFTER INSERT ON scene_targets
WHEN NEW.target_type = 'expression'
BEGIN
  INSERT INTO localized_name_subjects (entity_type,entity_id,source_language) VALUES ('scene_target', NEW.id, COALESCE((SELECT value FROM settings WHERE key = 'i18n.default_content_language'), 'en'));
END;

DROP TRIGGER localized_subject_scene_target_became_expression;
CREATE TRIGGER localized_subject_scene_target_became_expression
AFTER UPDATE OF target_type ON scene_targets
WHEN OLD.target_type != 'expression' AND NEW.target_type = 'expression'
BEGIN
  INSERT INTO localized_name_subjects (entity_type,entity_id,source_language) VALUES ('scene_target', NEW.id, COALESCE((SELECT value FROM settings WHERE key = 'i18n.default_content_language'), 'en'));
END;

CREATE TRIGGER devices_floorplan_revision BEFORE DELETE ON devices BEGIN
 UPDATE floorplans SET revision=revision+1 WHERE id IN (SELECT floorplan_id FROM floorplan_placements WHERE member_type='device' AND member_id=OLD.id);
END;
CREATE TRIGGER groups_floorplan_revision BEFORE DELETE ON groups BEGIN
 UPDATE floorplans SET revision=revision+1 WHERE id IN (SELECT floorplan_id FROM floorplan_placements WHERE member_type='group' AND member_id=OLD.id);
END;
CREATE TRIGGER floorplan_room_link_revision AFTER UPDATE OF room_id ON floorplan_rooms WHEN NEW.room_id IS NOT OLD.room_id BEGIN UPDATE floorplans SET revision=revision+1 WHERE id=NEW.floorplan_id; END;
CREATE TRIGGER groups_removed_revision AFTER UPDATE OF removed ON groups WHEN NEW.removed != OLD.removed BEGIN UPDATE groups SET revision=revision+1 WHERE id=NEW.id; END;
