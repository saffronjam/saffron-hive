CREATE TABLE activity_events_with_message (
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
    automation_name TEXT,
    webhook_id TEXT,
    webhook_name TEXT
);

INSERT INTO activity_events_with_message (
    id, type, timestamp, message, payload_json,
    device_id, device_name, device_type, room_id, room_name,
    scene_id, scene_name, automation_id, automation_name, webhook_id, webhook_name
)
SELECT id, type, timestamp, type, payload_json,
       device_id, device_name, device_type, room_id, room_name,
       scene_id, scene_name, automation_id, automation_name, webhook_id, webhook_name
FROM activity_events;

DROP TABLE activity_events;
ALTER TABLE activity_events_with_message RENAME TO activity_events;

CREATE INDEX idx_activity_timestamp ON activity_events(timestamp DESC);
CREATE INDEX idx_activity_type ON activity_events(type);
CREATE INDEX idx_activity_device_id ON activity_events(device_id);
CREATE INDEX idx_activity_room_id ON activity_events(room_id);
CREATE INDEX idx_activity_webhook_id ON activity_events(webhook_id);
