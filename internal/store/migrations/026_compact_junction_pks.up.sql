PRAGMA defer_foreign_keys = 1;

CREATE TABLE scene_actions_new (
    scene_id    TEXT NOT NULL REFERENCES scenes(id) ON DELETE CASCADE,
    target_type TEXT NOT NULL,
    target_id   TEXT NOT NULL,
    PRIMARY KEY (scene_id, target_type, target_id)
);
INSERT INTO scene_actions_new (scene_id, target_type, target_id)
SELECT DISTINCT scene_id, target_type, target_id FROM scene_actions;
DROP TABLE scene_actions;
ALTER TABLE scene_actions_new RENAME TO scene_actions;

CREATE TABLE room_devices_new (
    room_id   TEXT NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    device_id TEXT NOT NULL,
    PRIMARY KEY (room_id, device_id)
);
INSERT INTO room_devices_new (room_id, device_id)
SELECT DISTINCT room_id, device_id FROM room_devices;
DROP TABLE room_devices;
ALTER TABLE room_devices_new RENAME TO room_devices;
CREATE INDEX idx_room_devices_device_id ON room_devices(device_id);

CREATE TABLE automation_edges_new (
    automation_id TEXT NOT NULL REFERENCES automations(id) ON DELETE CASCADE,
    from_node_id  TEXT NOT NULL REFERENCES automation_nodes(id) ON DELETE CASCADE,
    to_node_id    TEXT NOT NULL REFERENCES automation_nodes(id) ON DELETE CASCADE,
    PRIMARY KEY (automation_id, from_node_id, to_node_id)
);
INSERT INTO automation_edges_new (automation_id, from_node_id, to_node_id)
SELECT DISTINCT automation_id, from_node_id, to_node_id FROM automation_edges;
DROP TABLE automation_edges;
ALTER TABLE automation_edges_new RENAME TO automation_edges;
CREATE INDEX idx_automation_edges_from_node_id ON automation_edges(from_node_id);
CREATE INDEX idx_automation_edges_to_node_id   ON automation_edges(to_node_id);

DROP INDEX IF EXISTS idx_scene_actions_scene_id;
DROP INDEX IF EXISTS idx_automation_edges_automation_id;

PRAGMA foreign_key_check;
