UPDATE groups
SET friendly_name = COALESCE(NULLIF(name, ''), NULLIF(friendly_name, ''), id);

ALTER TABLE groups DROP COLUMN name;
ALTER TABLE groups RENAME COLUMN friendly_name TO name;
