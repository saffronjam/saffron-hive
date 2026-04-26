DROP INDEX IF EXISTS idx_effect_clips_track;
DROP TABLE IF EXISTS effect_clips;
DROP INDEX IF EXISTS idx_effect_tracks_effect;
DROP TABLE IF EXISTS effect_tracks;
ALTER TABLE effects DROP COLUMN duration_ms;
