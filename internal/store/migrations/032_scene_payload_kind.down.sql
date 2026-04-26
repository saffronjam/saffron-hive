UPDATE scene_device_payloads
SET payload = json_remove(payload, '$.kind')
WHERE json_extract(payload, '$.kind') IS NOT NULL;
