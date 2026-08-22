UPDATE automation_nodes
SET config = (
    SELECT json_set(
        automation_nodes.config,
        '$.filter_expr',
        'device("' || replace(
            COALESCE(NULLIF(devices.name, ''), NULLIF(devices.friendly_name, ''), devices.id),
            '"',
            '\"'
        ) || '").' ||
        substr(
            json_extract(automation_nodes.config, '$.filter_expr'),
            instr(
                json_extract(automation_nodes.config, '$.filter_expr'),
                ' != nil && trigger.payload.state.'
            ) + length(' != nil && trigger.payload.state.')
        )
    )
    FROM devices
    WHERE devices.id = substr(
        json_extract(automation_nodes.config, '$.filter_expr'),
        length('trigger.device_id == "') + 1,
        instr(
            substr(
                json_extract(automation_nodes.config, '$.filter_expr'),
                length('trigger.device_id == "') + 1
            ),
            '" && trigger.payload.state.'
        ) - 1
    )
    LIMIT 1
)
WHERE type = 'trigger'
  AND json_extract(config, '$.event_type') = 'device.state_changed'
  AND json_extract(config, '$.filter_expr') LIKE
      'trigger.device_id == "%" && trigger.payload.state.% != nil && trigger.payload.state.%'
  AND EXISTS (
      SELECT 1
      FROM devices
      WHERE devices.id = substr(
          json_extract(automation_nodes.config, '$.filter_expr'),
          length('trigger.device_id == "') + 1,
          instr(
              substr(
                  json_extract(automation_nodes.config, '$.filter_expr'),
                  length('trigger.device_id == "') + 1
              ),
              '" && trigger.payload.state.'
          ) - 1
      )
  );
