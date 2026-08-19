CREATE TABLE device_tags (
    device_id TEXT NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    tag TEXT NOT NULL,
    PRIMARY KEY (device_id, tag)
);

CREATE INDEX idx_device_tags_tag ON device_tags(tag);

INSERT INTO device_tags (device_id, tag)
SELECT id, 'LIGHT'
FROM devices
WHERE type = 'plug' AND controlled_load_role = 'light';

ALTER TABLE devices DROP COLUMN contact_role;
ALTER TABLE devices DROP COLUMN controlled_load_role;
