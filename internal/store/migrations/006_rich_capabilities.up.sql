UPDATE devices
SET capabilities = (
    SELECT json_group_array(json_object('Name', json_each.value))
    FROM json_each(devices.capabilities)
)
WHERE capabilities != '[]' AND capabilities IS NOT NULL
  AND json_type(capabilities, '$[0]') = 'text';
