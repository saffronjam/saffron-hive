-- Reverse the rewrite: convert new-shape event triggers back to old shape.
-- Schedule triggers cannot be represented in the old shape, so they are
-- downgraded to effectively-unconfigured triggers (empty event_type).

UPDATE automation_nodes
SET config = json_object(
    'event_type', COALESCE(json_extract(config, '$.event_type'), ''),
    'condition_expr', COALESCE(json_extract(config, '$.filter_expr'), '')
)
WHERE type = 'trigger'
  AND json_extract(config, '$.kind') IS NOT NULL;
