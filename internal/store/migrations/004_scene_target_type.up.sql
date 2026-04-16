ALTER TABLE scene_actions ADD COLUMN target_type TEXT NOT NULL DEFAULT 'device';
ALTER TABLE scene_actions RENAME COLUMN device_id TO target_id;
