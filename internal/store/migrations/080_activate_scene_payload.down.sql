UPDATE automation_nodes
SET config = json_set(
    config,
    '$.target_type', 'scene',
    '$.target_id', COALESCE(json_extract(config, '$.payload'), ''),
    '$.target_expr', json('[]'),
    '$.payload', ''
)
WHERE type = 'action'
  AND json_valid(config)
  AND json_extract(config, '$.action_type') = 'activate_scene';
