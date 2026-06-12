CREATE TABLE tuya_config (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    access_id TEXT NOT NULL,
    access_secret TEXT NOT NULL DEFAULT '',
    region TEXT NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT true
);
