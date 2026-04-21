ALTER TABLE automations ADD COLUMN cooldown_seconds_old INTEGER NOT NULL DEFAULT 5;
UPDATE automations SET cooldown_seconds_old = CAST(cooldown_seconds AS INTEGER);
ALTER TABLE automations DROP COLUMN cooldown_seconds;
ALTER TABLE automations RENAME COLUMN cooldown_seconds_old TO cooldown_seconds;
