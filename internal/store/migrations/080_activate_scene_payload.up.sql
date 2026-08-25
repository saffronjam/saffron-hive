UPDATE automation_nodes
SET config = json_set(
    config,
    '$.payload', CASE
        WHEN COALESCE(json_extract(config, '$.payload'), '') != ''
            THEN json_extract(config, '$.payload')
        ELSE COALESCE(json_extract(config, '$.target_id'), '')
    END,
    '$.target_type', '',
    '$.target_id', '',
    '$.target_expr', json('[]')
)
WHERE type = 'action'
  AND json_valid(config)
  AND json_extract(config, '$.action_type') = 'activate_scene';
