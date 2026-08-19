ALTER TABLE device_state_samples RENAME TO device_state_samples_typed;

CREATE TABLE device_state_samples (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    device_id TEXT NOT NULL REFERENCES devices(id),
    field TEXT NOT NULL,
    value REAL NOT NULL,
    recorded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO device_state_samples (id, device_id, field, value, recorded_at)
SELECT id, device_id, field, numeric_value, recorded_at
FROM device_state_samples_typed
WHERE numeric_value IS NOT NULL;

DROP TABLE device_state_samples_typed;

CREATE INDEX idx_device_state_samples_device_field_time
    ON device_state_samples(device_id, field, recorded_at);

CREATE INDEX idx_device_state_samples_recorded_at
    ON device_state_samples(recorded_at);
