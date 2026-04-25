CREATE TABLE room_members (
    id TEXT PRIMARY KEY,
    room_id TEXT NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    member_type TEXT NOT NULL,
    member_id TEXT NOT NULL,
    UNIQUE(room_id, member_type, member_id)
);

CREATE INDEX idx_room_members_member ON room_members(member_type, member_id);

INSERT INTO room_members (id, room_id, member_type, member_id)
SELECT lower(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-' || hex(randomblob(2)) || '-' || hex(randomblob(2)) || '-' || hex(randomblob(6))),
       room_id, 'device', device_id
FROM room_devices;

DROP TABLE room_devices;
