DROP INDEX IF EXISTS idx_group_members_member;
DROP INDEX IF EXISTS idx_group_members_provider_endpoint;
DROP INDEX IF EXISTS idx_group_members_structural;

ALTER TABLE group_members RENAME TO group_members_provider;

CREATE TABLE group_members (
    id TEXT PRIMARY KEY,
    group_id TEXT NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    member_type TEXT NOT NULL,
    member_id TEXT NOT NULL,
    UNIQUE(group_id, member_type, member_id)
);

INSERT INTO group_members (id, group_id, member_type, member_id)
SELECT MIN(id), group_id, member_type, member_id
FROM group_members_provider
GROUP BY group_id, member_type, member_id;

DROP TABLE group_members_provider;

CREATE INDEX idx_group_members_member ON group_members(member_type, member_id);

DROP INDEX IF EXISTS idx_groups_provider_group;
ALTER TABLE groups DROP COLUMN removed;
ALTER TABLE groups DROP COLUMN provider_group_id;
ALTER TABLE groups DROP COLUMN provider;
