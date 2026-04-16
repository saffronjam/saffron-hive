DROP TABLE IF EXISTS automation_edges;
DROP TABLE IF EXISTS automation_nodes;
DROP TABLE IF EXISTS automations;

CREATE TABLE automations (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT true,
    trigger_event TEXT NOT NULL,
    condition_expr TEXT NOT NULL,
    cooldown_seconds INTEGER NOT NULL DEFAULT 5,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE automation_actions (
    id TEXT PRIMARY KEY,
    automation_id TEXT NOT NULL REFERENCES automations(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL,
    device_id TEXT REFERENCES devices(id),
    payload TEXT NOT NULL
);
