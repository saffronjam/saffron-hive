CREATE TABLE native_effect_observations (
    device_id TEXT NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    effect_name TEXT NOT NULL,
    result TEXT NOT NULL CHECK (result IN ('confirmed', 'unsupported')),
    evidence_fingerprint TEXT NOT NULL,
    observed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (device_id, effect_name)
);

