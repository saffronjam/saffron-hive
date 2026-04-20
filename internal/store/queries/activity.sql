-- Activity event persistence. QueryActivityEvents is the only query in the
-- codebase with fully-dynamic filters, so it uses every gate trick we have:
--
--   - json_array_length + json_each: a single JSON-array param covers both
--     "match all" (empty array) and "match listed values" without a combinatorial
--     explosion of generated queries.
--   - CAST(narg AS TEXT) IS NULL OR col = CAST(narg AS TEXT): optional filter
--     on a nullable column. The CAST is there to pin the Go type to *string;
--     without it sqlc emits interface{}.
--   - COALESCE(narg, col): optional filter on a NOT NULL column (timestamp,
--     id). Self-neutral when narg is NULL, since col >= col is always true.
--   - IIF(lim > 0, lim, -1): single-query optional LIMIT; SQLite treats -1 as
--     unbounded.

-- name: InsertActivityEvent :one
INSERT INTO activity_events (
    type, timestamp, message, payload_json,
    device_id, device_name, device_type, room_id, room_name,
    scene_id, scene_name,
    automation_id, automation_name
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
RETURNING id;

-- name: QueryActivityEvents :many
SELECT id, type, timestamp, message, payload_json,
       device_id, device_name, device_type, room_id, room_name,
       scene_id, scene_name,
       automation_id, automation_name
FROM activity_events
WHERE
    (json_array_length(CAST(sqlc.arg('types_json') AS TEXT)) = 0
     OR type IN (SELECT value FROM json_each(CAST(sqlc.arg('types_json') AS TEXT))))
  AND type NOT IN (SELECT value FROM json_each(CAST(sqlc.arg('excluded_types_json') AS TEXT)))
  AND (CAST(sqlc.narg('device_id') AS TEXT) IS NULL OR device_id = CAST(sqlc.narg('device_id') AS TEXT))
  AND (CAST(sqlc.narg('room_id')   AS TEXT) IS NULL OR room_id   = CAST(sqlc.narg('room_id')   AS TEXT))
  AND timestamp >= COALESCE(sqlc.narg('since'),  timestamp)
  AND id        <  COALESCE(sqlc.narg('before'), id + 1)
ORDER BY timestamp DESC, id DESC
LIMIT IIF(CAST(sqlc.arg('lim') AS INTEGER) > 0, CAST(sqlc.arg('lim') AS INTEGER), -1);

-- name: PruneActivityEventsOlderThan :execrows
DELETE FROM activity_events WHERE timestamp < ?;
