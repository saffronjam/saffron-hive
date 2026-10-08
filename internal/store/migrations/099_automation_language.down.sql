UPDATE automation_nodes
SET config = json_set(config, '$.payload', COALESCE(json_extract(json_extract(config, '$.payload'), '$.scene_id'), ''))
WHERE type = 'action'
  AND json_valid(config)
  AND json_extract(config, '$.action_type') = 'activate_scene'
  AND json_valid(json_extract(config, '$.payload'));

CREATE TABLE automation_nodes_old (
    id TEXT PRIMARY KEY,
    automation_id TEXT NOT NULL REFERENCES automations(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    config TEXT NOT NULL,
    position_x REAL NOT NULL DEFAULT 0,
    position_y REAL NOT NULL DEFAULT 0
);
-- Node ids are unique only within their automation here, so they are
-- prefixed with the automation id to be unique across all automations.
INSERT INTO automation_nodes_old (id, automation_id, type, config, position_x, position_y)
SELECT automation_id || ':' || id, automation_id, type, config, position_x, position_y FROM automation_nodes;
DROP TABLE automation_nodes;
ALTER TABLE automation_nodes_old RENAME TO automation_nodes;
CREATE INDEX idx_automation_nodes_automation_id ON automation_nodes(automation_id);

CREATE TABLE automation_edges_old (
    automation_id TEXT NOT NULL REFERENCES automations(id) ON DELETE CASCADE,
    from_node_id  TEXT NOT NULL REFERENCES automation_nodes(id) ON DELETE CASCADE,
    to_node_id    TEXT NOT NULL REFERENCES automation_nodes(id) ON DELETE CASCADE,
    PRIMARY KEY (automation_id, from_node_id, to_node_id)
);
INSERT INTO automation_edges_old (automation_id, from_node_id, to_node_id)
SELECT automation_id, automation_id || ':' || from_node_id, automation_id || ':' || to_node_id FROM automation_edges;
DROP TABLE automation_edges;
ALTER TABLE automation_edges_old RENAME TO automation_edges;
CREATE INDEX idx_automation_edges_from_node_id ON automation_edges(from_node_id);
CREATE INDEX idx_automation_edges_to_node_id   ON automation_edges(to_node_id);

CREATE TABLE automation_node_state_old (
    automation_id TEXT NOT NULL REFERENCES automations(id) ON DELETE CASCADE,
    node_id       TEXT NOT NULL REFERENCES automation_nodes(id) ON DELETE CASCADE,
    key           TEXT NOT NULL,
    value         TEXT NOT NULL,
    updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (automation_id, node_id, key)
);
INSERT INTO automation_node_state_old (automation_id, node_id, key, value, updated_at)
SELECT automation_id, automation_id || ':' || node_id, key, value, updated_at FROM automation_node_state;
DROP TABLE automation_node_state;
ALTER TABLE automation_node_state_old RENAME TO automation_node_state;

ALTER TABLE automations DROP COLUMN definitions;
