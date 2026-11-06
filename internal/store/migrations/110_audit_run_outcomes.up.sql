ALTER TABLE audit_events ADD COLUMN details_json TEXT NOT NULL DEFAULT '{}';
CREATE TABLE audit_run_targets (
 operation_id TEXT NOT NULL REFERENCES audit_operations(id) ON DELETE CASCADE,
 device_id TEXT NOT NULL,
 dispatched INTEGER NOT NULL DEFAULT 0,
 confirmed INTEGER NOT NULL DEFAULT 0,
 failed INTEGER NOT NULL DEFAULT 0,
 last_status TEXT NOT NULL DEFAULT '',
 before_json TEXT NOT NULL DEFAULT 'null',
 after_json TEXT NOT NULL DEFAULT 'null',
 PRIMARY KEY(operation_id,device_id)
);
