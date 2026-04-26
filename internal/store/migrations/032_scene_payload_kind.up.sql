UPDATE scene_device_payloads
SET payload = json_insert(payload, '$.kind', 'static')
WHERE json_extract(payload, '$.kind') IS NULL;
