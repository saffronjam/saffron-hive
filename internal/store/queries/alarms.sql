-- Alarms persistence. One row per raise; grouping by alarm_id happens in Go.
-- Deletion is by alarm_id, removing every row belonging to a logical alarm
-- in one shot. The user-facing identity is alarm_id, not the row id.

-- name: InsertAlarm :one
INSERT INTO alarms (alarm_id, severity, kind, message, source, raised_at)
VALUES (?, ?, ?, ?, ?, ?)
RETURNING id, alarm_id, severity, kind, message, source, raised_at;

-- name: CountAlarmsByAlarmID :one
SELECT COUNT(*) FROM alarms WHERE alarm_id = ?;

-- name: DeleteAlarmsByAlarmID :execrows
DELETE FROM alarms WHERE alarm_id = ?;

-- name: BatchDeleteAlarmsByAlarmIDs :execrows
DELETE FROM alarms
WHERE alarm_id IN (SELECT value FROM json_each(CAST(sqlc.arg('alarm_ids_json') AS TEXT)));

-- name: ListAlarms :many
SELECT id, alarm_id, severity, kind, message, source, raised_at
FROM alarms
ORDER BY raised_at DESC, id DESC;
