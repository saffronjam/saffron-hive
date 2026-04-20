-- name: InsertSensorReading :one
-- Returns the auto-generated id; other fields echo the input.
INSERT INTO sensor_history (device_id, temperature, humidity, battery, pressure, illuminance, recorded_at)
VALUES (?, ?, ?, ?, ?, ?, ?)
RETURNING id;

-- name: QuerySensorHistory :many
-- Optional LIMIT collapsed into one query: SQLite treats LIMIT -1 as unbounded,
-- and IIF(lim > 0, lim, -1) turns a 0 sentinel into "no limit".
SELECT id, device_id, temperature, humidity, battery, pressure, illuminance, recorded_at
FROM sensor_history
WHERE device_id   = sqlc.arg('device_id')
  AND recorded_at >= sqlc.arg('from_time')
  AND recorded_at <= sqlc.arg('to_time')
ORDER BY recorded_at DESC
LIMIT IIF(CAST(sqlc.arg('lim') AS INTEGER) > 0, CAST(sqlc.arg('lim') AS INTEGER), -1);
