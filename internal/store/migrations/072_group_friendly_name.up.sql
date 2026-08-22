ALTER TABLE groups RENAME COLUMN name TO friendly_name;
ALTER TABLE groups ADD COLUMN name TEXT;

UPDATE groups
SET name = CASE WHEN provider = 'hive' THEN friendly_name ELSE NULL END,
    friendly_name = CASE WHEN provider = 'hive' THEN '' ELSE friendly_name END;
