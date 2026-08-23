CREATE TABLE webhook_endpoints (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    enabled BOOLEAN NOT NULL DEFAULT true,
    secret_hash TEXT NOT NULL UNIQUE,
    rate_limit_count INTEGER NOT NULL DEFAULT 1 CHECK (rate_limit_count > 0),
    rate_limit_window_ms INTEGER NOT NULL DEFAULT 1000 CHECK (rate_limit_window_ms > 0),
    created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE webhook_deliveries (
    id TEXT PRIMARY KEY,
    endpoint_id TEXT NOT NULL REFERENCES webhook_endpoints(id) ON DELETE CASCADE,
    received_at TIMESTAMP NOT NULL,
    outcome TEXT NOT NULL,
    http_status INTEGER NOT NULL,
    client_ip TEXT NOT NULL DEFAULT '',
    user_agent TEXT NOT NULL DEFAULT '',
    content_type TEXT NOT NULL DEFAULT '',
    body_size INTEGER NOT NULL DEFAULT 0,
    duration_ms INTEGER NOT NULL DEFAULT 0,
    request_id TEXT,
    query_keys_json TEXT NOT NULL DEFAULT '[]',
    header_names_json TEXT NOT NULL DEFAULT '[]'
);

CREATE INDEX idx_webhook_deliveries_endpoint_time
    ON webhook_deliveries(endpoint_id, received_at DESC);

ALTER TABLE activity_events ADD COLUMN webhook_id TEXT;
ALTER TABLE activity_events ADD COLUMN webhook_name TEXT;

CREATE INDEX idx_activity_webhook_id ON activity_events(webhook_id);
