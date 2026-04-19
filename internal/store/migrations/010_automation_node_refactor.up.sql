-- Rewrite existing trigger node configs from the old shape
-- {"event_type": "...", "condition_expr": "..."}
-- to the new shape
-- {"kind": "event", "event_type": "...", "filter_expr": "..."}
--
-- The Go engine also handles read-time migration as a safety net, but doing
-- the rewrite here keeps stored configs clean.

UPDATE automation_nodes
SET config = json_object(
    'kind', 'event',
    'event_type', COALESCE(json_extract(config, '$.event_type'), ''),
    'filter_expr', COALESCE(json_extract(config, '$.condition_expr'), '')
)
WHERE type = 'trigger'
  AND json_extract(config, '$.kind') IS NULL;
