CREATE TABLE room_devices (
    room_id TEXT NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    device_id TEXT NOT NULL,
    PRIMARY KEY (room_id, device_id)
);
CREATE INDEX idx_room_devices_device_id ON room_devices(device_id);

INSERT INTO room_devices (room_id, device_id)
SELECT room_id, member_id FROM room_members WHERE member_type = 'device';

DROP TABLE room_members;
