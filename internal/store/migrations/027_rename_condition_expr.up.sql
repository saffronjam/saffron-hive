-- Move any legacy trigger-node `condition_expr` values into `filter_expr`
-- when filter_expr is empty or missing, so the Go side can drop the legacy
-- field without silently losing an expression.
UPDATE automation_nodes
SET config = json_set(
    json_remove(config, '$.condition_expr'),
    '$.filter_expr',
    json_extract(config, '$.condition_expr')
)
WHERE type = 'trigger'
  AND json_extract(config, '$.condition_expr') IS NOT NULL
  AND COALESCE(json_extract(config, '$.filter_expr'), '') = '';

-- Strip the legacy key from any remaining trigger rows that had both set;
-- filter_expr already carries the canonical value.
UPDATE automation_nodes
SET config = json_remove(config, '$.condition_expr')
WHERE type = 'trigger'
  AND json_extract(config, '$.condition_expr') IS NOT NULL;
