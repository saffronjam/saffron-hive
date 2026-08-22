-- name: ListMaintenanceAcknowledgements :many
SELECT task_key, condition_fingerprint, completed_at, completed_by
FROM maintenance_acknowledgements
ORDER BY task_key, condition_fingerprint;

-- name: InsertMaintenanceAcknowledgement :exec
INSERT INTO maintenance_acknowledgements (
    task_key, condition_fingerprint, completed_at, completed_by
) VALUES (?, ?, ?, ?)
ON CONFLICT(task_key, condition_fingerprint) DO NOTHING;

-- name: DeleteMaintenanceAcknowledgementsByTaskKey :execrows
DELETE FROM maintenance_acknowledgements WHERE task_key = ?;

-- name: DeleteMaintenanceAcknowledgementsByFingerprints :execrows
DELETE FROM maintenance_acknowledgements
WHERE task_key = sqlc.arg('task_key')
  AND condition_fingerprint IN (
      SELECT value FROM json_each(CAST(sqlc.arg('fingerprints_json') AS TEXT))
  );
