CREATE TABLE scene_targets_with_ids (
    id          TEXT PRIMARY KEY,
    scene_id    TEXT NOT NULL REFERENCES scenes(id) ON DELETE CASCADE,
    position    INTEGER NOT NULL CHECK (position >= 0),
    target_type TEXT NOT NULL CHECK (target_type IN ('device', 'group', 'room', 'expression')),
    target_id   TEXT,
    expression  TEXT,
    name        TEXT,
    UNIQUE(scene_id, position),
    CHECK (
        (target_type = 'expression' AND expression IS NOT NULL) OR
        (target_type != 'expression' AND target_id IS NOT NULL AND expression IS NULL)
    )
);

INSERT INTO scene_targets_with_ids (id, scene_id, position, target_type, target_id, expression, name)
SELECT scene_id || ':target:' || position, scene_id, position, target_type, target_id, expression,
       CASE WHEN target_type = 'expression' THEN name ELSE NULL END
FROM scene_targets;

DROP INDEX idx_scene_targets_scene;
DROP TABLE scene_targets;
ALTER TABLE scene_targets_with_ids RENAME TO scene_targets;
CREATE INDEX idx_scene_targets_scene ON scene_targets(scene_id);

INSERT INTO localized_name_subjects (entity_type, entity_id, source_language)
SELECT 'scene_target', id, 'en' FROM scene_targets WHERE target_type = 'expression';

CREATE TRIGGER localized_subject_scene_target_insert
AFTER INSERT ON scene_targets
WHEN NEW.target_type = 'expression'
BEGIN
  INSERT INTO localized_name_subjects VALUES ('scene_target', NEW.id, COALESCE((SELECT value FROM settings WHERE key = 'i18n.default_content_language'), 'en'));
END;

CREATE TRIGGER localized_subject_scene_target_delete
AFTER DELETE ON scene_targets
WHEN OLD.target_type = 'expression'
BEGIN
  DELETE FROM localized_name_subjects WHERE entity_type = 'scene_target' AND entity_id = OLD.id;
END;

CREATE TRIGGER localized_subject_scene_target_became_expression
AFTER UPDATE OF target_type ON scene_targets
WHEN OLD.target_type != 'expression' AND NEW.target_type = 'expression'
BEGIN
  INSERT INTO localized_name_subjects VALUES ('scene_target', NEW.id, COALESCE((SELECT value FROM settings WHERE key = 'i18n.default_content_language'), 'en'));
END;

CREATE TRIGGER localized_subject_scene_target_left_expression
AFTER UPDATE OF target_type ON scene_targets
WHEN OLD.target_type = 'expression' AND NEW.target_type != 'expression'
BEGIN
  DELETE FROM localized_name_subjects WHERE entity_type = 'scene_target' AND entity_id = OLD.id;
END;
