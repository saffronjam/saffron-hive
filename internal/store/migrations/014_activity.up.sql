CREATE TABLE activity_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    message TEXT NOT NULL,
    payload_json TEXT NOT NULL,

    device_id TEXT,
    device_name TEXT,
    device_type TEXT,
    room_id TEXT,
    room_name TEXT,

    scene_id TEXT,
    scene_name TEXT,

    automation_id TEXT,
    automation_name TEXT
);

CREATE INDEX idx_activity_timestamp ON activity_events(timestamp DESC);
CREATE INDEX idx_activity_type ON activity_events(type);
CREATE INDEX idx_activity_device_id ON activity_events(device_id);
CREATE INDEX idx_activity_room_id ON activity_events(room_id);
