ALTER TABLE cleaning_tasks ADD COLUMN provider_history_id TEXT;
ALTER TABLE cleaning_tasks ADD COLUMN elapsed_minutes REAL;
ALTER TABLE cleaning_tasks ADD COLUMN cleaned_area REAL;
CREATE UNIQUE INDEX cleaning_tasks_provider_history ON cleaning_tasks(device_id, provider_history_id) WHERE provider_history_id IS NOT NULL;
