ALTER TABLE groups ADD COLUMN provider TEXT NOT NULL DEFAULT 'hive';
ALTER TABLE groups ADD COLUMN provider_group_id TEXT;
ALTER TABLE groups ADD COLUMN removed BOOLEAN NOT NULL DEFAULT false;

CREATE UNIQUE INDEX idx_groups_provider_group
ON groups(provider, provider_group_id)
WHERE provider_group_id IS NOT NULL;

ALTER TABLE group_members RENAME TO group_members_old;

CREATE TABLE group_members (
    id TEXT PRIMARY KEY,
    group_id TEXT NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    member_type TEXT NOT NULL,
    member_id TEXT NOT NULL,
    provider_endpoint INTEGER
);

INSERT INTO group_members (id, group_id, member_type, member_id)
SELECT id, group_id, member_type, member_id
FROM group_members_old;

DROP TABLE group_members_old;

CREATE UNIQUE INDEX idx_group_members_structural
ON group_members(group_id, member_type, member_id)
WHERE provider_endpoint IS NULL;

CREATE UNIQUE INDEX idx_group_members_provider_endpoint
ON group_members(group_id, member_id, provider_endpoint)
WHERE provider_endpoint IS NOT NULL;

CREATE INDEX idx_group_members_member ON group_members(member_type, member_id);
