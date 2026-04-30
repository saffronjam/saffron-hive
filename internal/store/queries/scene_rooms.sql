-- name: ListSceneRooms :many
SELECT room_id FROM scene_rooms WHERE scene_id = ?;

-- name: ListAllSceneRooms :many
SELECT scene_id, room_id FROM scene_rooms;

-- name: InsertSceneRoom :exec
INSERT OR IGNORE INTO scene_rooms (scene_id, room_id) VALUES (?, ?);

-- name: DeleteSceneRooms :exec
DELETE FROM scene_rooms WHERE scene_id = ?;
