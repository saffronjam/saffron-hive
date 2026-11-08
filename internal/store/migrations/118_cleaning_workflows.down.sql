ALTER TABLE cleaning_calibrations DROP COLUMN enabled;
UPDATE cleaning_tasks SET plan = json_remove(plan, '$.scope');
