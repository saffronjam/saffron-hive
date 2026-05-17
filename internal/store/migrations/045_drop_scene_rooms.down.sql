CREATE TABLE scene_rooms (
    scene_id TEXT NOT NULL REFERENCES scenes(id) ON DELETE CASCADE,
    room_id TEXT NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    PRIMARY KEY (scene_id, room_id)
);

CREATE INDEX idx_scene_rooms_room ON scene_rooms(room_id);
