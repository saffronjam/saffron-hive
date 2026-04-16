DROP TABLE IF EXISTS automation_actions;
DROP TABLE IF EXISTS automations;

CREATE TABLE automations (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT true,
    cooldown_seconds INTEGER NOT NULL DEFAULT 5,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE automation_nodes (
    id TEXT PRIMARY KEY,
    automation_id TEXT NOT NULL REFERENCES automations(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    config TEXT NOT NULL
);

CREATE TABLE automation_edges (
    id TEXT PRIMARY KEY,
    automation_id TEXT NOT NULL REFERENCES automations(id) ON DELETE CASCADE,
    from_node_id TEXT NOT NULL REFERENCES automation_nodes(id) ON DELETE CASCADE,
    to_node_id TEXT NOT NULL REFERENCES automation_nodes(id) ON DELETE CASCADE
);
