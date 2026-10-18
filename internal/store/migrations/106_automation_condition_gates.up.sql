CREATE TEMP TABLE gate_nodes AS
WITH RECURSIVE connected(automation_id, origin, id) AS (
    SELECT automation_id, id, id FROM automation_nodes
    UNION
    SELECT c.automation_id, c.origin,
           CASE WHEN e.from_node_id = c.id THEN e.to_node_id ELSE e.from_node_id END
    FROM connected c JOIN automation_edges e ON e.automation_id = c.automation_id
        AND (e.from_node_id = c.id OR e.to_node_id = c.id)
), components AS (
    SELECT automation_id, origin, min(id) AS component FROM connected GROUP BY automation_id, origin
)
SELECT n.*, c.component,
       CASE WHEN n.type = 'operator' THEN
           CASE WHEN json_valid(n.config) THEN json_extract(n.config, '$.kind') ELSE 'invalid' END
       ELSE n.type END AS role
FROM automation_nodes n JOIN components c ON c.automation_id = n.automation_id AND c.origin = n.id;

CREATE TEMP TABLE gate_components AS
SELECT automation_id, component,
       sum(role = 'trigger') AS triggers, sum(role = 'condition') AS conditions,
       sum(role = 'action') AS actions, sum(role = 'and') AS ands,
       sum(role = 'or') AS ors, sum(role = 'not') AS nots,
       sum(role IS NULL OR role NOT IN ('trigger','condition','action','and','or','not')) AS unknowns,
       '' AS pattern
FROM gate_nodes GROUP BY automation_id, component;

UPDATE gate_components SET pattern = 'and'
WHERE conditions >= 1 AND triggers >= 1 AND actions >= 1 AND ands = 1 AND nots = 0
    AND ors <= 1 AND unknowns = 0 AND (ors = 1 OR triggers = 1);
UPDATE gate_components SET pattern = 'gate'
WHERE conditions = 1 AND triggers >= 1 AND actions >= 1 AND ands = 0 AND nots <= 1
    AND ors <= 1 AND unknowns = 0;

UPDATE gate_components AS c SET pattern = ''
WHERE EXISTS (
    SELECT 1 FROM gate_nodes n WHERE n.automation_id = c.automation_id AND n.component = c.component
    AND CASE WHEN NOT json_valid(n.config) THEN 1
        WHEN json_type(n.config, '$.draft') IS NOT NULL THEN 1
        WHEN n.role = 'condition' THEN
            coalesce(json_type(n.config, '$.expr'), '') != 'text'
            AND coalesce(json_type(n.config, '$.use'), '') != 'text'
        ELSE 0 END
);

CREATE TEMP TABLE gate_expected AS
SELECT a.automation_id, a.component, a.id AS from_node_id, b.id AS to_node_id
FROM gate_nodes a JOIN gate_nodes b ON b.automation_id = a.automation_id AND b.component = a.component
JOIN gate_components c ON c.automation_id = a.automation_id AND c.component = a.component
WHERE (c.pattern = 'and' AND (
    (a.role = 'trigger' AND b.role = CASE WHEN c.ors = 1 THEN 'or' ELSE 'and' END)
    OR (a.role IN ('or','condition') AND b.role = 'and')
    OR (a.role = 'and' AND b.role = 'action')
)) OR (c.pattern = 'gate' AND (
    (a.role = 'trigger' AND b.role = CASE WHEN c.ors = 1 THEN 'or' ELSE 'condition' END)
    OR (a.role = 'or' AND b.role = 'condition')
    OR (a.role = 'condition' AND b.role = CASE WHEN c.nots = 1 THEN 'not' ELSE 'action' END)
    OR (a.role = 'not' AND b.role = 'action')
));

UPDATE gate_components AS c SET pattern = ''
WHERE EXISTS (
    SELECT 1 FROM automation_edges e JOIN gate_nodes n ON n.automation_id = e.automation_id AND n.id = e.from_node_id
    WHERE n.automation_id = c.automation_id AND n.component = c.component
    AND NOT EXISTS (SELECT 1 FROM gate_expected x WHERE x.automation_id = e.automation_id
        AND x.from_node_id = e.from_node_id AND x.to_node_id = e.to_node_id)
) OR EXISTS (
    SELECT 1 FROM gate_expected x WHERE x.automation_id = c.automation_id AND x.component = c.component
    AND NOT EXISTS (SELECT 1 FROM automation_edges e WHERE e.automation_id = x.automation_id
        AND e.from_node_id = x.from_node_id AND e.to_node_id = x.to_node_id)
);

CREATE TEMP TABLE gate_unsafe AS
SELECT DISTINCT automation_id FROM gate_components WHERE (conditions > 0 OR nots > 0) AND pattern = '';
CREATE TEMP TABLE gate_convert AS
SELECT c.* FROM gate_components c
WHERE (pattern = 'and' OR (pattern = 'gate' AND nots = 1))
    AND NOT EXISTS (SELECT 1 FROM gate_unsafe u WHERE u.automation_id = c.automation_id);

CREATE TEMP TABLE gate_order AS
SELECT n.automation_id, n.component, n.id,
       row_number() OVER w AS ordinal, count(*) OVER (PARTITION BY n.automation_id, n.component) AS total,
       lead(n.id) OVER w AS next_id
FROM gate_nodes n JOIN gate_convert c ON c.automation_id = n.automation_id AND c.component = n.component
WHERE n.role = 'condition'
WINDOW w AS (PARTITION BY n.automation_id, n.component ORDER BY n.position_y, n.position_x, n.id);

UPDATE automations SET enabled = 0, revision = revision + 1, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
WHERE enabled = 1 AND id IN (SELECT automation_id FROM gate_unsafe);
UPDATE automations SET revision = revision + 1, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
WHERE id IN (SELECT automation_id FROM gate_convert);

DELETE FROM automation_edges AS e WHERE EXISTS (
    SELECT 1 FROM gate_nodes n JOIN gate_convert c ON c.automation_id = n.automation_id AND c.component = n.component
    WHERE n.automation_id = e.automation_id AND n.id = e.from_node_id
);

INSERT INTO automation_edges (automation_id, from_node_id, to_node_id)
SELECT n.automation_id, n.id, o.id FROM gate_nodes n
JOIN gate_convert c ON c.automation_id = n.automation_id AND c.component = n.component
JOIN gate_order o ON o.automation_id = n.automation_id AND o.component = n.component AND o.ordinal = 1
WHERE n.role = 'or' OR (n.role = 'trigger' AND c.ors = 0)
UNION ALL
SELECT a.automation_id, a.id, b.id FROM gate_nodes a JOIN gate_nodes b
    ON b.automation_id = a.automation_id AND b.component = a.component
JOIN gate_convert c ON c.automation_id = a.automation_id AND c.component = a.component
WHERE a.role = 'trigger' AND b.role = 'or'
UNION ALL
SELECT automation_id, id, next_id FROM gate_order WHERE next_id IS NOT NULL
UNION ALL
SELECT o.automation_id, o.id, n.id FROM gate_order o JOIN gate_nodes n
    ON n.automation_id = o.automation_id AND n.component = o.component
WHERE o.ordinal = o.total AND n.role = 'action';

UPDATE automation_nodes AS n SET config = json_set(n.config, '$.negate',
    json(CASE WHEN coalesce(json_extract(n.config, '$.negate'), 0) THEN 'false' ELSE 'true' END))
WHERE n.type = 'condition' AND EXISTS (
    SELECT 1 FROM gate_nodes g JOIN gate_convert c ON c.automation_id = g.automation_id AND c.component = g.component
    WHERE g.automation_id = n.automation_id AND g.id = n.id AND c.pattern = 'gate' AND c.nots = 1
);

DELETE FROM automation_node_state AS s WHERE EXISTS (
    SELECT 1 FROM gate_nodes n JOIN gate_convert c ON c.automation_id = n.automation_id AND c.component = n.component
    WHERE n.automation_id = s.automation_id AND n.id = s.node_id AND n.role IN ('and','not')
);
DELETE FROM automation_nodes AS n WHERE EXISTS (
    SELECT 1 FROM gate_nodes g JOIN gate_convert c ON c.automation_id = g.automation_id AND c.component = g.component
    WHERE g.automation_id = n.automation_id AND g.id = n.id AND g.role IN ('and','not')
);

DROP TABLE gate_order;
DROP TABLE gate_convert;
DROP TABLE gate_unsafe;
DROP TABLE gate_expected;
DROP TABLE gate_components;
DROP TABLE gate_nodes;
