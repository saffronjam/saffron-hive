-- name: CreateWebhookEndpoint :exec
INSERT INTO webhook_endpoints (
    id, name, enabled, secret_hash,
    rate_limit_count, rate_limit_window_ms, created_by
) VALUES (?, ?, ?, ?, ?, ?, ?);

-- name: GetWebhookEndpoint :one
SELECT w.id, w.name, w.enabled,
       w.rate_limit_count, w.rate_limit_window_ms,
       w.created_at, w.updated_at,
       u.id AS creator_id, u.username AS creator_username, u.name AS creator_name,
       d.received_at AS last_delivery_at
FROM webhook_endpoints w
LEFT JOIN users u ON u.id = w.created_by
LEFT JOIN webhook_deliveries d ON d.id = (
    SELECT latest.id FROM webhook_deliveries latest
    WHERE latest.endpoint_id = w.id
    ORDER BY latest.received_at DESC, latest.id DESC LIMIT 1
)
WHERE w.id = ?;

-- name: GetWebhookEndpointBySecretHash :one
SELECT id, name, enabled, secret_hash,
       rate_limit_count, rate_limit_window_ms, created_by, created_at, updated_at
FROM webhook_endpoints
WHERE secret_hash = ?;

-- name: ListWebhookEndpoints :many
SELECT w.id, w.name, w.enabled,
       w.rate_limit_count, w.rate_limit_window_ms,
       w.created_at, w.updated_at,
       u.id AS creator_id, u.username AS creator_username, u.name AS creator_name,
       d.received_at AS last_delivery_at
FROM webhook_endpoints w
LEFT JOIN users u ON u.id = w.created_by
LEFT JOIN webhook_deliveries d ON d.id = (
    SELECT latest.id FROM webhook_deliveries latest
    WHERE latest.endpoint_id = w.id
    ORDER BY latest.received_at DESC, latest.id DESC LIMIT 1
)
ORDER BY lower(w.name), w.id;

-- name: UpdateWebhookEndpoint :exec
UPDATE webhook_endpoints SET
    name = ?,
    enabled = ?,
    rate_limit_count = ?,
    rate_limit_window_ms = ?,
    updated_at = CURRENT_TIMESTAMP
WHERE id = ?;

-- name: UpdateWebhookEndpointSecretHash :exec
UPDATE webhook_endpoints
SET secret_hash = ?, updated_at = CURRENT_TIMESTAMP
WHERE id = ?;

-- name: DeleteWebhookEndpoint :exec
DELETE FROM webhook_endpoints WHERE id = ?;

-- name: BatchDeleteWebhookEndpoints :execrows
DELETE FROM webhook_endpoints
WHERE id IN (SELECT value FROM json_each(CAST(sqlc.arg('ids_json') AS TEXT)))
  AND NOT EXISTS (
      SELECT 1 FROM automation_nodes n
      WHERE n.type = 'trigger'
        AND json_valid(n.config)
        AND json_extract(n.config, '$.event_type') = 'webhook.received'
        AND json_extract(n.config, '$.endpoint_id') = webhook_endpoints.id
  );

-- name: ListWebhookEndpointAutomationReferences :many
SELECT DISTINCT a.id, a.name
FROM automations a
JOIN automation_nodes n ON n.automation_id = a.id
WHERE n.type = 'trigger'
  AND json_valid(n.config)
  AND json_extract(n.config, '$.event_type') = 'webhook.received'
  AND json_extract(n.config, '$.endpoint_id') = ?
ORDER BY lower(a.name), a.id;

-- name: InsertWebhookDelivery :exec
INSERT INTO webhook_deliveries (
    id, endpoint_id, received_at, outcome, http_status,
    client_ip, user_agent, content_type, body_size, body, duration_ms,
    request_id, query_keys_json, header_names_json
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);

-- name: GetWebhookDelivery :one
SELECT * FROM webhook_deliveries WHERE id = ?;

-- name: ListWebhookDeliveries :many
SELECT * FROM webhook_deliveries
WHERE webhook_deliveries.endpoint_id = sqlc.arg('endpoint_id')
  AND (CAST(sqlc.narg('before') AS TIMESTAMP) IS NULL
       OR received_at < CAST(sqlc.narg('before') AS TIMESTAMP))
ORDER BY received_at DESC, id DESC
LIMIT IIF(CAST(sqlc.arg('lim') AS INTEGER) > 0, CAST(sqlc.arg('lim') AS INTEGER), 100);

-- name: CountWebhookDeliveriesSince :one
SELECT COUNT(*) FROM webhook_deliveries
WHERE endpoint_id = ? AND received_at >= ? AND outcome != 'rate_limited';

-- name: HasWebhookRateLimitDeliverySince :one
SELECT EXISTS(
    SELECT 1 FROM webhook_deliveries
    WHERE endpoint_id = ? AND received_at >= ? AND outcome = 'rate_limited'
);

-- name: PruneWebhookDeliveriesOlderThan :execrows
DELETE FROM webhook_deliveries WHERE received_at < ?;

-- name: PruneWebhookDeliveriesOverLimit :execrows
DELETE FROM webhook_deliveries
WHERE webhook_deliveries.endpoint_id = sqlc.arg('endpoint_id')
  AND webhook_deliveries.id IN (
      SELECT kept.id FROM webhook_deliveries AS kept
      WHERE kept.endpoint_id = sqlc.arg('endpoint_id')
      ORDER BY kept.received_at DESC, kept.id DESC
      LIMIT -1 OFFSET sqlc.arg('keep_count')
  );
