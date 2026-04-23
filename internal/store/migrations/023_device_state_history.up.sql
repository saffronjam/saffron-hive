DROP INDEX IF EXISTS idx_sensor_history_device_time;
DROP TABLE IF EXISTS sensor_history;

CREATE TABLE device_state_samples (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    device_id TEXT NOT NULL REFERENCES devices(id),
    field TEXT NOT NULL,
    value REAL NOT NULL,
    recorded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_device_state_samples_device_field_time
    ON device_state_samples(device_id, field, recorded_at);

CREATE INDEX idx_device_state_samples_recorded_at
    ON device_state_samples(recorded_at);

INSERT OR IGNORE INTO settings (key, value) VALUES ('history.retention_days', '365');
