CREATE TABLE effect_steps (
    id         TEXT PRIMARY KEY,
    effect_id  TEXT NOT NULL REFERENCES effects(id) ON DELETE CASCADE,
    step_index INTEGER NOT NULL,
    kind       TEXT NOT NULL,
    config     TEXT NOT NULL,
    UNIQUE(effect_id, step_index)
);

CREATE INDEX idx_effect_steps_effect ON effect_steps(effect_id);
