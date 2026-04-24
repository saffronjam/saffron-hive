PRAGMA defer_foreign_keys = 1;

CREATE TABLE scene_actions_old (
    id          TEXT PRIMARY KEY,
    scene_id    TEXT NOT NULL REFERENCES scenes(id) ON DELETE CASCADE,
    target_type TEXT NOT NULL DEFAULT 'device',
    target_id   TEXT NOT NULL
);
INSERT INTO scene_actions_old (id, scene_id, target_type, target_id)
SELECT lower(hex(randomblob(16))), scene_id, target_type, target_id FROM scene_actions;
DROP TABLE scene_actions;
ALTER TABLE scene_actions_old RENAME TO scene_actions;
CREATE INDEX idx_scene_actions_scene_id ON scene_actions(scene_id);

CREATE TABLE room_devices_old (
    id        TEXT PRIMARY KEY,
    room_id   TEXT NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    device_id TEXT NOT NULL,
    UNIQUE(room_id, device_id)
);
INSERT INTO room_devices_old (id, room_id, device_id)
SELECT lower(hex(randomblob(16))), room_id, device_id FROM room_devices;
DROP TABLE room_devices;
ALTER TABLE room_devices_old RENAME TO room_devices;
CREATE INDEX idx_room_devices_device_id ON room_devices(device_id);

CREATE TABLE automation_edges_old (
    id            TEXT PRIMARY KEY,
    automation_id TEXT NOT NULL REFERENCES automations(id) ON DELETE CASCADE,
    from_node_id  TEXT NOT NULL REFERENCES automation_nodes(id) ON DELETE CASCADE,
    to_node_id    TEXT NOT NULL REFERENCES automation_nodes(id) ON DELETE CASCADE
);
INSERT INTO automation_edges_old (id, automation_id, from_node_id, to_node_id)
SELECT lower(hex(randomblob(16))), automation_id, from_node_id, to_node_id FROM automation_edges;
DROP TABLE automation_edges;
ALTER TABLE automation_edges_old RENAME TO automation_edges;
CREATE INDEX idx_automation_edges_automation_id ON automation_edges(automation_id);
CREATE INDEX idx_automation_edges_from_node_id  ON automation_edges(from_node_id);
CREATE INDEX idx_automation_edges_to_node_id    ON automation_edges(to_node_id);

PRAGMA foreign_key_check;
