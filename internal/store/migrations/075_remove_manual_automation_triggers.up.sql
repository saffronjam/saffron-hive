DELETE FROM automation_node_state
WHERE node_id IN (
  SELECT id FROM automation_nodes
  WHERE type = 'trigger'
    AND json_valid(config)
    AND json_extract(config, '$.kind') = 'manual'
);

DELETE FROM automation_edges
WHERE from_node_id IN (
    SELECT id FROM automation_nodes
    WHERE type = 'trigger'
      AND json_valid(config)
      AND json_extract(config, '$.kind') = 'manual'
  )
  OR to_node_id IN (
    SELECT id FROM automation_nodes
    WHERE type = 'trigger'
      AND json_valid(config)
      AND json_extract(config, '$.kind') = 'manual'
  );

DELETE FROM automation_nodes
WHERE type = 'trigger'
  AND json_valid(config)
  AND json_extract(config, '$.kind') = 'manual';
