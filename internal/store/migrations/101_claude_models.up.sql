CREATE TABLE claude_config_models (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    token TEXT NOT NULL,
    enabled INTEGER NOT NULL DEFAULT 0,
    model TEXT NOT NULL DEFAULT 'default'
);
INSERT INTO claude_config_models SELECT id, token, enabled, model FROM claude_config;
DROP TABLE claude_config;
ALTER TABLE claude_config_models RENAME TO claude_config;
