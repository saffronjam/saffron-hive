DROP TRIGGER localized_subject_scene_target_left_expression;
DROP TRIGGER localized_subject_scene_target_became_expression;
DROP TRIGGER localized_subject_scene_target_delete;
DROP TRIGGER localized_subject_scene_target_insert;

DELETE FROM localized_name_subjects WHERE entity_type = 'scene_target';

CREATE TABLE scene_targets_without_ids (
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

INSERT INTO scene_targets_without_ids (scene_id, position, target_type, target_id, expression, name)
SELECT scene_id, position, target_type, target_id, expression, name FROM scene_targets;

DROP INDEX idx_scene_targets_scene;
DROP TABLE scene_targets;
ALTER TABLE scene_targets_without_ids RENAME TO scene_targets;
CREATE INDEX idx_scene_targets_scene ON scene_targets(scene_id);
