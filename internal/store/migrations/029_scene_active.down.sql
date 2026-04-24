DROP INDEX IF EXISTS idx_scene_expected_states_device;
DROP TABLE IF EXISTS scene_expected_states;
ALTER TABLE scenes DROP COLUMN activated_at;
