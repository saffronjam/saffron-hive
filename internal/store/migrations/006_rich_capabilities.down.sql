UPDATE devices
SET capabilities = (
    SELECT json_group_array(json_extract(json_each.value, '$.Name'))
    FROM json_each(devices.capabilities)
)
WHERE capabilities != '[]' AND capabilities IS NOT NULL
  AND json_type(capabilities, '$[0]') = 'object';
