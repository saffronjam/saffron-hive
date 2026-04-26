CREATE TABLE effect_tracks (
    id          TEXT PRIMARY KEY,
    effect_id   TEXT NOT NULL REFERENCES effects(id) ON DELETE CASCADE,
    track_index INTEGER NOT NULL,
    UNIQUE(effect_id, track_index)
);

CREATE INDEX idx_effect_tracks_effect ON effect_tracks(effect_id);

CREATE TABLE effect_clips (
    id                TEXT PRIMARY KEY,
    track_id          TEXT NOT NULL REFERENCES effect_tracks(id) ON DELETE CASCADE,
    start_ms          INTEGER NOT NULL,
    transition_min_ms INTEGER NOT NULL DEFAULT 0,
    transition_max_ms INTEGER NOT NULL DEFAULT 0,
    kind              TEXT NOT NULL,
    config            TEXT NOT NULL,
    CHECK (transition_min_ms >= 0),
    CHECK (transition_max_ms >= transition_min_ms),
    CHECK (start_ms >= 0)
);

CREATE INDEX idx_effect_clips_track ON effect_clips(track_id);

ALTER TABLE effects ADD COLUMN duration_ms INTEGER NOT NULL DEFAULT 0;
