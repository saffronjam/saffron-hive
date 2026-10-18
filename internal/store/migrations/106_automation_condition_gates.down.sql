CREATE TEMP TABLE gate_downgrade_guard (
    conditional_nodes INTEGER CONSTRAINT restore_database_backup_before_downgrading_condition_gates CHECK (conditional_nodes = 0)
);
INSERT INTO gate_downgrade_guard SELECT count(*) FROM automation_nodes
WHERE type = 'condition' OR (type = 'operator' AND json_extract(config, '$.kind') = 'not');
DROP TABLE gate_downgrade_guard;
