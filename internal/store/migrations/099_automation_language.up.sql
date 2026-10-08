-- Stores per-automation macro definitions, scopes node ids to their
-- automation and gives every node a short id ("t1", "c2", "o1", "a3") numbered
-- per type from top to bottom, and stores activate_scene payloads as a JSON
-- object like every other action payload.

ALTER TABLE automations ADD COLUMN definitions TEXT NOT NULL DEFAULT '{}';

CREATE TABLE automation_node_id_map AS
SELECT automation_id,
       id AS old_id,
       CASE type WHEN 'trigger' THEN 't' WHEN 'condition' THEN 'c' WHEN 'operator' THEN 'o' WHEN 'action' THEN 'a' ELSE type || '_' END
         || ROW_NUMBER() OVER (PARTITION BY automation_id, type ORDER BY position_y, position_x, id) AS new_id
FROM automation_nodes;

CREATE TABLE automation_nodes_new (
    automation_id TEXT NOT NULL REFERENCES automations(id) ON DELETE CASCADE,
    id            TEXT NOT NULL,
    type          TEXT NOT NULL,
    config        TEXT NOT NULL,
    position_x    REAL NOT NULL DEFAULT 0,
    position_y    REAL NOT NULL DEFAULT 0,
    PRIMARY KEY (automation_id, id)
);
INSERT INTO automation_nodes_new (automation_id, id, type, config, position_x, position_y)
SELECT n.automation_id, m.new_id, n.type, n.config, n.position_x, n.position_y
FROM automation_nodes n
JOIN automation_node_id_map m ON m.automation_id = n.automation_id AND m.old_id = n.id;
DROP TABLE automation_nodes;
ALTER TABLE automation_nodes_new RENAME TO automation_nodes;

CREATE TABLE automation_edges_new (
    automation_id TEXT NOT NULL REFERENCES automations(id) ON DELETE CASCADE,
    from_node_id  TEXT NOT NULL,
    to_node_id    TEXT NOT NULL,
    PRIMARY KEY (automation_id, from_node_id, to_node_id),
    FOREIGN KEY (automation_id, from_node_id) REFERENCES automation_nodes(automation_id, id) ON DELETE CASCADE,
    FOREIGN KEY (automation_id, to_node_id) REFERENCES automation_nodes(automation_id, id) ON DELETE CASCADE
);
INSERT OR IGNORE INTO automation_edges_new (automation_id, from_node_id, to_node_id)
SELECT e.automation_id, f.new_id, t.new_id
FROM automation_edges e
JOIN automation_node_id_map f ON f.automation_id = e.automation_id AND f.old_id = e.from_node_id
JOIN automation_node_id_map t ON t.automation_id = e.automation_id AND t.old_id = e.to_node_id;
DROP TABLE automation_edges;
ALTER TABLE automation_edges_new RENAME TO automation_edges;
CREATE INDEX idx_automation_edges_to_node ON automation_edges(automation_id, to_node_id);

CREATE TABLE automation_node_state_new (
    automation_id TEXT NOT NULL REFERENCES automations(id) ON DELETE CASCADE,
    node_id       TEXT NOT NULL,
    key           TEXT NOT NULL,
    value         TEXT NOT NULL,
    updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (automation_id, node_id, key),
    FOREIGN KEY (automation_id, node_id) REFERENCES automation_nodes(automation_id, id) ON DELETE CASCADE
);
INSERT INTO automation_node_state_new (automation_id, node_id, key, value, updated_at)
SELECT s.automation_id, m.new_id, s.key, s.value, s.updated_at
FROM automation_node_state s
JOIN automation_node_id_map m ON m.automation_id = s.automation_id AND m.old_id = s.node_id;
DROP TABLE automation_node_state;
ALTER TABLE automation_node_state_new RENAME TO automation_node_state;

DROP TABLE automation_node_id_map;

UPDATE automation_nodes
SET config = json_set(config, '$.payload', json_object('scene_id', json_extract(config, '$.payload')) || '')
WHERE type = 'action'
  AND json_valid(config)
  AND json_extract(config, '$.action_type') = 'activate_scene'
  AND json_type(config, '$.payload') = 'text'
  AND NOT json_valid(json_extract(config, '$.payload'));
