DELETE FROM settings WHERE key = 'history.retention_days';

DROP INDEX IF EXISTS idx_device_state_samples_recorded_at;
DROP INDEX IF EXISTS idx_device_state_samples_device_field_time;
DROP TABLE IF EXISTS device_state_samples;

CREATE TABLE sensor_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    device_id TEXT NOT NULL REFERENCES devices(id),
    temperature REAL,
    humidity REAL,
    battery INTEGER,
    pressure REAL,
    illuminance REAL,
    recorded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sensor_history_device_time ON sensor_history(device_id, recorded_at);
