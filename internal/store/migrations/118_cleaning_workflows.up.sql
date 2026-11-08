ALTER TABLE cleaning_calibrations ADD COLUMN enabled BOOLEAN NOT NULL DEFAULT FALSE;
UPDATE cleaning_tasks SET plan = json_set(plan, '$.scope', 0);
