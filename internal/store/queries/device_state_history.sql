-- name: InsertStateSample :one
INSERT INTO device_state_samples (device_id, field, numeric_value, text_value, recorded_at)
VALUES (
    sqlc.arg('device_id'),
    sqlc.arg('field'),
    sqlc.narg('numeric_value'),
    sqlc.narg('text_value'),
    CAST(sqlc.arg('recorded_at') AS TEXT)
)
RETURNING id;

-- name: LatestStateSample :one
SELECT numeric_value, text_value
FROM device_state_samples
WHERE device_id = sqlc.arg('device_id')
  AND field = sqlc.arg('field')
ORDER BY recorded_at DESC, id DESC
LIMIT 1;

-- name: QueryStateHistoryRaw :many
SELECT device_id, field, numeric_value, text_value, recorded_at
FROM device_state_samples
WHERE device_id IN (SELECT value FROM json_each(CAST(sqlc.arg('device_ids_json') AS TEXT)))
  AND (json_array_length(CAST(sqlc.arg('fields_json') AS TEXT)) = 0
       OR field IN (SELECT value FROM json_each(CAST(sqlc.arg('fields_json') AS TEXT))))
  AND recorded_at >= CAST(sqlc.arg('from_time') AS TEXT)
  AND recorded_at <= CAST(sqlc.arg('to_time') AS TEXT)
ORDER BY device_id ASC, field ASC, recorded_at ASC
LIMIT IIF(CAST(sqlc.arg('lim') AS INTEGER) > 0, CAST(sqlc.arg('lim') AS INTEGER), -1);

-- name: QueryStateHistoryNumericBucketed :many
SELECT
    device_id,
    field,
    CAST(strftime('%s', substr(recorded_at, 1, 19)) AS INTEGER) / CAST(sqlc.arg('bucket_seconds') AS INTEGER) AS bucket_key,
    CAST(AVG(numeric_value) AS REAL) AS bucket_value,
    CAST(strftime('%s', substr(MIN(recorded_at), 1, 19)) AS INTEGER) AS bucket_start_unix
FROM device_state_samples
WHERE device_id IN (SELECT value FROM json_each(CAST(sqlc.arg('device_ids_json') AS TEXT)))
  AND (json_array_length(CAST(sqlc.arg('fields_json') AS TEXT)) = 0
       OR field IN (SELECT value FROM json_each(CAST(sqlc.arg('fields_json') AS TEXT))))
  AND field NOT IN (SELECT value FROM json_each(CAST(sqlc.arg('stateful_fields_json') AS TEXT)))
  AND numeric_value IS NOT NULL
  AND recorded_at >= CAST(sqlc.arg('from_time') AS TEXT)
  AND recorded_at <= CAST(sqlc.arg('to_time') AS TEXT)
GROUP BY device_id, field, bucket_key
ORDER BY device_id ASC, field ASC, bucket_start_unix ASC;

-- name: QueryStateHistoryStatefulBucketed :many
WITH bucketed AS (
    SELECT
        device_id,
        field,
        numeric_value,
        text_value,
        recorded_at,
        id,
        CAST(strftime('%s', substr(recorded_at, 1, 19)) AS INTEGER) / CAST(sqlc.arg('bucket_seconds') AS INTEGER) AS bucket_key
    FROM device_state_samples
    WHERE device_id IN (SELECT value FROM json_each(CAST(sqlc.arg('device_ids_json') AS TEXT)))
      AND (json_array_length(CAST(sqlc.arg('fields_json') AS TEXT)) = 0
           OR field IN (SELECT value FROM json_each(CAST(sqlc.arg('fields_json') AS TEXT))))
      AND field IN (SELECT value FROM json_each(CAST(sqlc.arg('stateful_fields_json') AS TEXT)))
      AND recorded_at >= CAST(sqlc.arg('from_time') AS TEXT)
      AND recorded_at <= CAST(sqlc.arg('to_time') AS TEXT)
), ranked AS (
    SELECT
        device_id,
        field,
        numeric_value,
        text_value,
        recorded_at,
        ROW_NUMBER() OVER (
            PARTITION BY device_id, field, bucket_key
            ORDER BY recorded_at DESC, id DESC
        ) AS row_num
    FROM bucketed
)
SELECT device_id, field, numeric_value, text_value, recorded_at
FROM ranked
WHERE row_num = 1
ORDER BY device_id ASC, field ASC, recorded_at ASC;

-- name: QueryStateHistoryAnchors :many
WITH ranked AS (
    SELECT
        device_id,
        field,
        numeric_value,
        text_value,
        ROW_NUMBER() OVER (
            PARTITION BY device_id, field
            ORDER BY recorded_at DESC, id DESC
        ) AS row_num
    FROM device_state_samples
    WHERE device_id IN (SELECT value FROM json_each(CAST(sqlc.arg('device_ids_json') AS TEXT)))
      AND (json_array_length(CAST(sqlc.arg('fields_json') AS TEXT)) = 0
           OR field IN (SELECT value FROM json_each(CAST(sqlc.arg('fields_json') AS TEXT))))
      AND field IN (SELECT value FROM json_each(CAST(sqlc.arg('stateful_fields_json') AS TEXT)))
      AND recorded_at < CAST(sqlc.arg('from_time') AS TEXT)
)
SELECT device_id, field, numeric_value, text_value
FROM ranked
WHERE row_num = 1
ORDER BY device_id ASC, field ASC;

-- name: PruneDeviceStateSamplesOlderThan :execrows
DELETE FROM device_state_samples
WHERE recorded_at < CAST(sqlc.arg('cutoff') AS TEXT)
  AND id NOT IN (
    SELECT id
    FROM (
      SELECT
        id,
        ROW_NUMBER() OVER (
          PARTITION BY device_id, field
          ORDER BY recorded_at DESC, id DESC
        ) AS row_num
      FROM device_state_samples
      WHERE recorded_at < CAST(sqlc.arg('cutoff') AS TEXT)
    )
    WHERE row_num = 1
  );
