UPDATE automation_nodes
SET config = (
    SELECT json_set(
        automation_nodes.config,
        '$.filter_expr',
        'trigger.device_id == "' || replace(devices.id, '"', '\"') ||
        '" && trigger.payload.state.' ||
        substr(
            json_extract(automation_nodes.config, '$.filter_expr'),
            9 + instr(substr(json_extract(automation_nodes.config, '$.filter_expr'), 9), '").') + 2,
            instr(
                substr(
                    json_extract(automation_nodes.config, '$.filter_expr'),
                    9 + instr(substr(json_extract(automation_nodes.config, '$.filter_expr'), 9), '").') + 2
                ),
                ' '
            ) - 1
        ) ||
        ' != nil && trigger.payload.state.' ||
        substr(
            json_extract(automation_nodes.config, '$.filter_expr'),
            9 + instr(substr(json_extract(automation_nodes.config, '$.filter_expr'), 9), '").') + 2
        )
    )
    FROM devices
    WHERE COALESCE(NULLIF(devices.name, ''), NULLIF(devices.friendly_name, ''), devices.id) = substr(
        json_extract(automation_nodes.config, '$.filter_expr'),
        9,
        instr(substr(json_extract(automation_nodes.config, '$.filter_expr'), 9), '").') - 1
    )
    LIMIT 1
)
WHERE type = 'trigger'
  AND json_extract(config, '$.event_type') = 'device.state_changed'
  AND json_extract(config, '$.filter_expr') LIKE 'device("%")%'
  AND EXISTS (
      SELECT 1
      FROM devices
      WHERE COALESCE(NULLIF(devices.name, ''), NULLIF(devices.friendly_name, ''), devices.id) = substr(
          json_extract(automation_nodes.config, '$.filter_expr'),
          9,
          instr(substr(json_extract(automation_nodes.config, '$.filter_expr'), 9), '").') - 1
      )
  );
