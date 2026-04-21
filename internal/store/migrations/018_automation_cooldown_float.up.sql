ALTER TABLE automations ADD COLUMN cooldown_seconds_new REAL NOT NULL DEFAULT 0.5;
UPDATE automations SET cooldown_seconds_new = CAST(cooldown_seconds AS REAL);
ALTER TABLE automations DROP COLUMN cooldown_seconds;
ALTER TABLE automations RENAME COLUMN cooldown_seconds_new TO cooldown_seconds;
