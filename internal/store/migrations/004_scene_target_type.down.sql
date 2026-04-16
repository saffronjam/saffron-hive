ALTER TABLE scene_actions RENAME COLUMN target_id TO device_id;
ALTER TABLE scene_actions DROP COLUMN target_type;
