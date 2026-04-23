-- name: InsertStateSample :one
INSERT INTO device_state_samples (device_id, field, value, recorded_at)
VALUES (?, ?, ?, ?)
RETURNING id;

-- name: QueryStateHistoryRaw :many
-- device_ids_json and fields_json are JSON-array strings. An empty array in
-- fields_json matches every field. device_ids_json must be non-empty (callers
-- always pick sources explicitly).
SELECT device_id, field, value, recorded_at
FROM device_state_samples
WHERE device_id IN (SELECT value FROM json_each(CAST(sqlc.arg('device_ids_json') AS TEXT)))
  AND (json_array_length(CAST(sqlc.arg('fields_json') AS TEXT)) = 0
       OR field IN (SELECT value FROM json_each(CAST(sqlc.arg('fields_json') AS TEXT))))
  AND recorded_at >= sqlc.arg('from_time')
  AND recorded_at <= sqlc.arg('to_time')
ORDER BY device_id ASC, field ASC, recorded_at ASC
LIMIT IIF(CAST(sqlc.arg('lim') AS INTEGER) > 0, CAST(sqlc.arg('lim') AS INTEGER), -1);

-- name: QueryStateHistoryBucketed :many
-- Groups samples into fixed-size time buckets. bucket_seconds must be > 0.
-- Per bucket returns AVG(value) and the earliest recorded_at (bucket_start).
-- The bucket key is computed once in the SELECT and grouped by alias so the
-- sqlc.arg substitution happens in a position sqlc reliably parses.
SELECT
    device_id,
    field,
    CAST(strftime('%s', substr(recorded_at, 1, 19)) AS INTEGER) / CAST(sqlc.arg('bucket_seconds') AS INTEGER) AS bucket_key,
    CAST(AVG(value) AS REAL)       AS bucket_value,
    CAST(MIN(recorded_at) AS TEXT) AS bucket_start
FROM device_state_samples
WHERE device_id IN (SELECT value FROM json_each(CAST(sqlc.arg('device_ids_json') AS TEXT)))
  AND (json_array_length(CAST(sqlc.arg('fields_json') AS TEXT)) = 0
       OR field IN (SELECT value FROM json_each(CAST(sqlc.arg('fields_json') AS TEXT))))
  AND recorded_at >= sqlc.arg('from_time')
  AND recorded_at <= sqlc.arg('to_time')
GROUP BY device_id, field, bucket_key
ORDER BY device_id ASC, field ASC, bucket_start ASC;

-- name: PruneDeviceStateSamplesOlderThan :execrows
DELETE FROM device_state_samples WHERE recorded_at < ?;
