-- name: InsertStateSample :one
INSERT INTO device_state_samples (device_id, field, value, recorded_at)
VALUES (
    sqlc.arg('device_id'),
    sqlc.arg('field'),
    sqlc.arg('value'),
    CAST(sqlc.arg('recorded_at') AS TEXT)
)
RETURNING id;

-- name: QueryStateHistoryRaw :many
-- device_ids_json and fields_json are JSON-array strings. An empty array in
-- fields_json matches every field. device_ids_json must be non-empty (callers
-- always pick sources explicitly). Time bounds are RFC3339Nano UTC strings so
-- lexicographic comparison matches chronological order.
SELECT device_id, field, value, recorded_at
FROM device_state_samples
WHERE device_id IN (SELECT value FROM json_each(CAST(sqlc.arg('device_ids_json') AS TEXT)))
  AND (json_array_length(CAST(sqlc.arg('fields_json') AS TEXT)) = 0
       OR field IN (SELECT value FROM json_each(CAST(sqlc.arg('fields_json') AS TEXT))))
  AND recorded_at >= CAST(sqlc.arg('from_time') AS TEXT)
  AND recorded_at <= CAST(sqlc.arg('to_time') AS TEXT)
ORDER BY device_id ASC, field ASC, recorded_at ASC
LIMIT IIF(CAST(sqlc.arg('lim') AS INTEGER) > 0, CAST(sqlc.arg('lim') AS INTEGER), -1);

-- name: QueryStateHistoryBucketed :many
-- Groups samples into fixed-size time buckets. bucket_seconds must be > 0.
-- Per bucket returns AVG(value) and the Unix epoch of the earliest recorded_at
-- (bucket_start_unix). Returning an INTEGER epoch sidesteps the sqlite driver's
-- re-serialisation of TIMESTAMP aggregates. The substr(..., 1, 19) keeps
-- strftime happy across the stored RFC3339Nano form.
SELECT
    device_id,
    field,
    CAST(strftime('%s', substr(recorded_at, 1, 19)) AS INTEGER) / CAST(sqlc.arg('bucket_seconds') AS INTEGER) AS bucket_key,
    CAST(AVG(value) AS REAL) AS bucket_value,
    CAST(strftime('%s', substr(MIN(recorded_at), 1, 19)) AS INTEGER) AS bucket_start_unix
FROM device_state_samples
WHERE device_id IN (SELECT value FROM json_each(CAST(sqlc.arg('device_ids_json') AS TEXT)))
  AND (json_array_length(CAST(sqlc.arg('fields_json') AS TEXT)) = 0
       OR field IN (SELECT value FROM json_each(CAST(sqlc.arg('fields_json') AS TEXT))))
  AND recorded_at >= CAST(sqlc.arg('from_time') AS TEXT)
  AND recorded_at <= CAST(sqlc.arg('to_time') AS TEXT)
GROUP BY device_id, field, bucket_key
ORDER BY device_id ASC, field ASC, bucket_start_unix ASC;

-- name: PruneDeviceStateSamplesOlderThan :execrows
DELETE FROM device_state_samples WHERE recorded_at < CAST(sqlc.arg('cutoff') AS TEXT);
