-- A floorplan owns its graph, rooms, placements, furniture, and door bindings. GetFloorplanGraph
-- is composed in Go from these queries; ReplaceFloorplan swaps the whole plan
-- inside one tx. vertex_ids is a JSON TEXT array; the Go wrapper marshals it
-- before hitting these queries and unmarshals on read.

-- name: GetFloorplan :one
SELECT id, name, created_at, updated_at
FROM floorplans
ORDER BY created_at
LIMIT 1;

-- name: UpsertFloorplan :exec
INSERT INTO floorplans (id, name)
VALUES (sqlc.arg('id'), sqlc.arg('name'))
ON CONFLICT(id) DO UPDATE SET
    name       = excluded.name,
    updated_at = CURRENT_TIMESTAMP;

-- name: ListFloorplanVertices :many
SELECT id, floorplan_id, x, y
FROM floorplan_vertices
WHERE floorplan_id = sqlc.arg('floorplan_id');

-- name: ListFloorplanWalls :many
SELECT id, floorplan_id, vertex_a, vertex_b, thickness, curve_x, curve_y
FROM floorplan_walls
WHERE floorplan_id = sqlc.arg('floorplan_id');

-- name: ListFloorplanOpenings :many
SELECT id, floorplan_id, wall_id, t, width, kind
FROM floorplan_openings
WHERE floorplan_id = sqlc.arg('floorplan_id');

-- name: ListFloorplanDoorBindings :many
SELECT floorplan_id, opening_id, device_id, hinge_side, swing_side
FROM floorplan_door_bindings
WHERE floorplan_id = sqlc.arg('floorplan_id');

-- name: GetFloorplanDoorBindingByDevice :one
SELECT floorplan_id, opening_id, device_id, hinge_side, swing_side
FROM floorplan_door_bindings
WHERE device_id = sqlc.arg('device_id');

-- name: ListFloorplanRooms :many
SELECT id, floorplan_id, name, room_id, vertex_ids
FROM floorplan_rooms
WHERE floorplan_id = sqlc.arg('floorplan_id');

-- name: ListFloorplanPlacements :many
SELECT floorplan_id, member_type, member_id, x, y
FROM floorplan_placements
WHERE floorplan_id = sqlc.arg('floorplan_id');

-- name: ListFloorplanFurniture :many
SELECT id, floorplan_id, kind, x, y, width, height, rotation, occluder
FROM floorplan_furniture
WHERE floorplan_id = sqlc.arg('floorplan_id');

-- name: CreateFloorplanVertex :exec
INSERT INTO floorplan_vertices (id, floorplan_id, x, y)
VALUES (sqlc.arg('id'), sqlc.arg('floorplan_id'), sqlc.arg('x'), sqlc.arg('y'));

-- name: CreateFloorplanWall :exec
INSERT INTO floorplan_walls (id, floorplan_id, vertex_a, vertex_b, thickness, curve_x, curve_y)
VALUES (sqlc.arg('id'), sqlc.arg('floorplan_id'), sqlc.arg('vertex_a'), sqlc.arg('vertex_b'), sqlc.arg('thickness'), sqlc.narg('curve_x'), sqlc.narg('curve_y'));

-- name: CreateFloorplanOpening :exec
INSERT INTO floorplan_openings (id, floorplan_id, wall_id, t, width, kind)
VALUES (sqlc.arg('id'), sqlc.arg('floorplan_id'), sqlc.arg('wall_id'), sqlc.arg('t'), sqlc.arg('width'), sqlc.arg('kind'));

-- name: CreateFloorplanDoorBinding :exec
INSERT INTO floorplan_door_bindings (floorplan_id, opening_id, device_id, hinge_side, swing_side)
VALUES (sqlc.arg('floorplan_id'), sqlc.arg('opening_id'), sqlc.arg('device_id'), sqlc.arg('hinge_side'), sqlc.arg('swing_side'));

-- name: CreateFloorplanRoom :exec
INSERT INTO floorplan_rooms (id, floorplan_id, name, room_id, vertex_ids)
VALUES (sqlc.arg('id'), sqlc.arg('floorplan_id'), sqlc.narg('name'), sqlc.narg('room_id'), sqlc.arg('vertex_ids'));

-- name: CreateFloorplanPlacement :exec
INSERT INTO floorplan_placements (floorplan_id, member_type, member_id, x, y)
VALUES (sqlc.arg('floorplan_id'), sqlc.arg('member_type'), sqlc.arg('member_id'), sqlc.arg('x'), sqlc.arg('y'));

-- name: CreateFloorplanFurniture :exec
INSERT INTO floorplan_furniture (id, floorplan_id, kind, x, y, width, height, rotation, occluder)
VALUES (sqlc.arg('id'), sqlc.arg('floorplan_id'), sqlc.arg('kind'), sqlc.arg('x'), sqlc.arg('y'), sqlc.arg('width'), sqlc.arg('height'), sqlc.arg('rotation'), sqlc.arg('occluder'));

-- name: DeleteFloorplanFurnitureByFloorplan :exec
DELETE FROM floorplan_furniture WHERE floorplan_id = sqlc.arg('floorplan_id');

-- name: DeleteFloorplanVerticesByFloorplan :exec
DELETE FROM floorplan_vertices WHERE floorplan_id = sqlc.arg('floorplan_id');

-- name: DeleteFloorplanOpeningsByFloorplan :exec
DELETE FROM floorplan_openings WHERE floorplan_id = sqlc.arg('floorplan_id');

-- name: DeleteFloorplanDoorBindingsByFloorplan :exec
DELETE FROM floorplan_door_bindings WHERE floorplan_id = sqlc.arg('floorplan_id');

-- name: DeleteFloorplanWallsByFloorplan :exec
DELETE FROM floorplan_walls WHERE floorplan_id = sqlc.arg('floorplan_id');

-- name: DeleteFloorplanRoomsByFloorplan :exec
DELETE FROM floorplan_rooms WHERE floorplan_id = sqlc.arg('floorplan_id');

-- name: DeleteFloorplanPlacementsByFloorplan :exec
DELETE FROM floorplan_placements WHERE floorplan_id = sqlc.arg('floorplan_id');

-- DeleteFloorplanPlacementsByMember drops the map placement of a device or
-- group being deleted. The runtime connection does not enforce foreign keys,
-- so this sweep runs inside the DeleteDevice / DeleteGroup / BatchDeleteGroups
-- transactions rather than relying on a cascade.
-- name: DeleteFloorplanPlacementsByMember :exec
DELETE FROM floorplan_placements
WHERE member_type = sqlc.arg('member_type') AND member_id = sqlc.arg('member_id');

-- name: DeleteFloorplanDoorBindingsByDevice :exec
DELETE FROM floorplan_door_bindings WHERE device_id = sqlc.arg('device_id');

-- UnlinkFloorplanRoomsByRoom clears the Hive-room link on the faces that point
-- at a room being deleted. COALESCE copies the room's name into faces that have
-- no loose label yet, so the label survives the deletion; runs inside the
-- DeleteRoom / BatchDeleteRooms transactions before the rooms row goes away.
-- name: UnlinkFloorplanRoomsByRoom :exec
UPDATE floorplan_rooms
SET name    = COALESCE(name, (SELECT rooms.name FROM rooms WHERE rooms.id = sqlc.arg('room_id'))),
    room_id = NULL
WHERE room_id = sqlc.arg('room_id');
