-- Copy filter_expr back to the legacy condition_expr key for rollback. This
-- is a best-effort restore: we cannot distinguish rows that originally used
-- filter_expr from those that were migrated up from condition_expr.
UPDATE automation_nodes
SET config = json_set(
    config,
    '$.condition_expr',
    json_extract(config, '$.filter_expr')
)
WHERE type = 'trigger'
  AND COALESCE(json_extract(config, '$.filter_expr'), '') != '';
