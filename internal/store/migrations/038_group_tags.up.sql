CREATE TABLE group_tags (
    group_id TEXT NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    tag TEXT NOT NULL,
    PRIMARY KEY (group_id, tag)
);

CREATE INDEX idx_group_tags_tag ON group_tags(tag);
