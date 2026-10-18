CREATE TABLE claude_config_fixed (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    token TEXT NOT NULL,
    enabled INTEGER NOT NULL DEFAULT 0,
    model TEXT NOT NULL DEFAULT 'opus' CHECK (model IN ('opus', 'sonnet'))
);
INSERT INTO claude_config_fixed SELECT id, token, enabled, CASE WHEN model = 'sonnet' THEN 'sonnet' ELSE 'opus' END FROM claude_config;
DROP TABLE claude_config;
ALTER TABLE claude_config_fixed RENAME TO claude_config;
