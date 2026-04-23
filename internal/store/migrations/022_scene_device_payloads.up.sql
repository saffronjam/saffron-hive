CREATE TABLE scene_device_payloads (
    scene_id  TEXT NOT NULL REFERENCES scenes(id) ON DELETE CASCADE,
    device_id TEXT NOT NULL,
    payload   TEXT NOT NULL,
    PRIMARY KEY (scene_id, device_id)
);

CREATE INDEX idx_scene_device_payloads_scene_id ON scene_device_payloads(scene_id);
