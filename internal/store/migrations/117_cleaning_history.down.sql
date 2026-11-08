DROP INDEX cleaning_tasks_provider_history;
ALTER TABLE cleaning_tasks DROP COLUMN provider_history_id;
ALTER TABLE cleaning_tasks DROP COLUMN elapsed_minutes;
ALTER TABLE cleaning_tasks DROP COLUMN cleaned_area;
