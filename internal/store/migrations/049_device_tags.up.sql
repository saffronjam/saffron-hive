CREATE TABLE device_tags (
    device_id TEXT NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    tag TEXT NOT NULL,
    PRIMARY KEY (device_id, tag)
);

CREATE INDEX idx_device_tags_tag ON device_tags(tag);
