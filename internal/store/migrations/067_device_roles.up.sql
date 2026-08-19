ALTER TABLE devices
ADD COLUMN controlled_load_role TEXT
CHECK (controlled_load_role IN ('appliance', 'light'));

ALTER TABLE devices
ADD COLUMN contact_role TEXT
CHECK (contact_role IN ('general', 'door', 'window'));

UPDATE devices
SET controlled_load_role = CASE
    WHEN EXISTS (
        SELECT 1
        FROM json_each(devices.capabilities)
        WHERE json_extract(value, '$.name') = 'on_off'
          AND (COALESCE(json_extract(value, '$.access'), 0) & 2) != 0
    ) AND EXISTS (
        SELECT 1
        FROM device_tags
        WHERE device_tags.device_id = devices.id
          AND device_tags.tag = 'LIGHT'
    ) THEN 'light'
    ELSE 'appliance'
END
WHERE type = 'plug'
  AND EXISTS (
      SELECT 1
      FROM json_each(devices.capabilities)
      WHERE json_extract(value, '$.name') = 'on_off'
        AND (COALESCE(json_extract(value, '$.access'), 0) & 2) != 0
  );

UPDATE devices
SET contact_role = 'general'
WHERE EXISTS (
    SELECT 1
    FROM json_each(devices.capabilities)
    WHERE json_extract(value, '$.name') = 'contact'
      AND (COALESCE(json_extract(value, '$.access'), 0) & 1) != 0
);

DROP INDEX IF EXISTS idx_device_tags_tag;
DROP TABLE device_tags;
