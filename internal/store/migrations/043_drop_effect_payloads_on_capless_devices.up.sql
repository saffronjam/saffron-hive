DELETE FROM scene_device_payloads
WHERE json_extract(payload, '$.kind') IN ('effect', 'native_effect')
  AND device_id IN (
    SELECT d.id
    FROM devices d
    WHERE NOT EXISTS (
        SELECT 1
        FROM json_each(d.capabilities) c
        WHERE json_extract(c.value, '$.name') IN ('brightness', 'color', 'color_temp')
          AND (json_extract(c.value, '$.access') & 2) != 0
    )
  );
