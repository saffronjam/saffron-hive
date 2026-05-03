CREATE TABLE automation_node_state (
    automation_id TEXT NOT NULL REFERENCES automations(id) ON DELETE CASCADE,
    node_id       TEXT NOT NULL REFERENCES automation_nodes(id) ON DELETE CASCADE,
    key           TEXT NOT NULL,
    value         TEXT NOT NULL,
    updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (automation_id, node_id, key)
);
