CREATE TABLE maintenance_acknowledgements (
    task_key TEXT NOT NULL,
    condition_fingerprint TEXT NOT NULL,
    completed_at DATETIME NOT NULL,
    completed_by TEXT REFERENCES users(id) ON DELETE SET NULL,
    PRIMARY KEY (task_key, condition_fingerprint)
);

CREATE INDEX idx_maintenance_acknowledgements_task_key
    ON maintenance_acknowledgements(task_key);
