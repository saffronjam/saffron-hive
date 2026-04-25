CREATE TABLE effects (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    icon        TEXT,
    kind        TEXT NOT NULL CHECK (kind IN ('timeline','native')),
    native_name TEXT,
    loop        INTEGER NOT NULL DEFAULT 0,
    created_by  TEXT REFERENCES users(id) ON DELETE SET NULL,
    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE effect_steps (
    id         TEXT PRIMARY KEY,
    effect_id  TEXT NOT NULL REFERENCES effects(id) ON DELETE CASCADE,
    step_index INTEGER NOT NULL,
    kind       TEXT NOT NULL,
    config     TEXT NOT NULL,
    UNIQUE(effect_id, step_index)
);

CREATE INDEX idx_effect_steps_effect ON effect_steps(effect_id);

CREATE TABLE active_effects (
    id           TEXT PRIMARY KEY,
    effect_id    TEXT NOT NULL REFERENCES effects(id) ON DELETE CASCADE,
    target_type  TEXT NOT NULL,
    target_id    TEXT NOT NULL,
    started_at   TIMESTAMP NOT NULL,
    volatile     INTEGER NOT NULL DEFAULT 1,
    UNIQUE(target_type, target_id)
);

CREATE INDEX idx_active_effects_effect ON active_effects(effect_id);
