-- name: ListDeviceTags :many
SELECT tag FROM device_tags WHERE device_id = ?;

-- name: ListAllDeviceTags :many
SELECT device_id, tag FROM device_tags;

-- name: InsertDeviceTag :exec
INSERT OR IGNORE INTO device_tags (device_id, tag) VALUES (?, ?);

-- name: DeleteDeviceTags :exec
DELETE FROM device_tags WHERE device_id = ?;
