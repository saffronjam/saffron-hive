DROP INDEX IF EXISTS idx_activity_webhook_id;
ALTER TABLE activity_events DROP COLUMN webhook_name;
ALTER TABLE activity_events DROP COLUMN webhook_id;

DROP TABLE IF EXISTS webhook_deliveries;
DROP TABLE IF EXISTS webhook_endpoints;
