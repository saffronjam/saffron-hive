-- name: GetDreameConfig :one
SELECT revision, email, password, region, enabled FROM dreame_config WHERE id=1;

-- name: UpsertDreameConfig :execrows
INSERT INTO dreame_config(id, revision, email, password, region, enabled)
SELECT 1, CAST(sqlc.arg('expected_revision') AS INTEGER)+1, sqlc.arg('email'), sqlc.arg('password'), sqlc.arg('region'), sqlc.arg('enabled')
WHERE CAST(sqlc.arg('expected_revision') AS INTEGER)=0 OR EXISTS(SELECT 1 FROM dreame_config WHERE id=1 AND revision=sqlc.arg('expected_revision'))
ON CONFLICT(id) DO UPDATE SET revision=excluded.revision, email=excluded.email, password=excluded.password, region=excluded.region, enabled=excluded.enabled
WHERE dreame_config.revision=excluded.revision-1;

-- name: DeleteDreameConfig :exec
DELETE FROM dreame_config;

-- name: ListCleaningRoomLinks :many
SELECT sets.map_id, sets.revision, links.room_id, links.area_id, links.map_revision
FROM cleaning_link_sets AS sets
LEFT JOIN cleaning_room_links AS links ON links.device_id=sets.device_id AND links.map_id=sets.map_id
WHERE sets.device_id=sqlc.arg('device_id')
ORDER BY sets.map_id,links.room_id,links.area_id;

-- name: DeleteCleaningRoomLinks :exec
DELETE FROM cleaning_room_links WHERE device_id=sqlc.arg('device_id') AND map_id=sqlc.arg('map_id');

-- name: InsertCleaningRoomLink :exec
INSERT INTO cleaning_room_links(device_id,map_id,room_id,area_id,map_revision) VALUES(sqlc.arg('device_id'),sqlc.arg('map_id'),sqlc.arg('room_id'),sqlc.arg('area_id'),sqlc.arg('map_revision'));

-- name: GetCleaningCalibration :one
SELECT revision,map_revision,floorplan_revision,floorplan_geometry,anchors,enabled,map_rotation FROM cleaning_calibrations WHERE device_id=sqlc.arg('device_id') AND map_id=sqlc.arg('map_id') AND floorplan_id=sqlc.arg('floorplan_id');

-- name: UpsertCleaningCalibration :execrows
INSERT INTO cleaning_calibrations(device_id,map_id,floorplan_id,revision,map_revision,floorplan_revision,floorplan_geometry,anchors,enabled,map_rotation)
SELECT sqlc.arg('device_id'),sqlc.arg('map_id'),sqlc.arg('floorplan_id'),CAST(sqlc.arg('expected_revision') AS INTEGER)+1,sqlc.arg('map_revision'),sqlc.arg('floorplan_revision'),sqlc.arg('floorplan_geometry'),sqlc.arg('anchors'),sqlc.arg('enabled'),sqlc.arg('map_rotation')
WHERE CAST(sqlc.arg('expected_revision') AS INTEGER)=0 OR EXISTS(SELECT 1 FROM cleaning_calibrations WHERE device_id=sqlc.arg('device_id') AND map_id=sqlc.arg('map_id') AND floorplan_id=sqlc.arg('floorplan_id') AND revision=sqlc.arg('expected_revision'))
ON CONFLICT(device_id,map_id,floorplan_id) DO UPDATE SET revision=excluded.revision,map_revision=excluded.map_revision,floorplan_revision=excluded.floorplan_revision,floorplan_geometry=excluded.floorplan_geometry,anchors=excluded.anchors,enabled=excluded.enabled,map_rotation=excluded.map_rotation
WHERE cleaning_calibrations.revision=excluded.revision-1;

-- name: InsertCleaningTask :exec
INSERT INTO cleaning_tasks(id,device_id,request_id,plan,state,origin,error,created_at,updated_at) VALUES(sqlc.arg('id'),sqlc.arg('device_id'),sqlc.arg('request_id'),sqlc.arg('plan'),sqlc.arg('state'),sqlc.arg('origin'),'',sqlc.arg('created_at'),sqlc.arg('created_at'));

-- name: GetCleaningTaskByRequest :one
SELECT * FROM cleaning_tasks WHERE request_id=sqlc.arg('request_id');

-- name: ListCleaningTasks :many
SELECT * FROM cleaning_tasks WHERE device_id=sqlc.arg('device_id') AND (sqlc.arg('before')='' OR created_at<sqlc.arg('before')) ORDER BY created_at DESC LIMIT sqlc.arg('page_limit');

-- name: ListCleaningHistory :many
SELECT * FROM cleaning_tasks WHERE device_id=sqlc.arg('device_id') AND cleaned_area > 0 AND (sqlc.arg('before')='' OR created_at<sqlc.arg('before')) ORDER BY created_at DESC LIMIT sqlc.arg('page_limit');

-- name: UpdateCleaningTask :execrows
UPDATE cleaning_tasks SET state=sqlc.arg('state'),error=sqlc.arg('error'),updated_at=sqlc.arg('updated_at'),completed_at=sqlc.narg('completed_at') WHERE id=sqlc.arg('id') AND state=sqlc.arg('expected_state');

-- name: ListCleaningAreaHistory :many
WITH samples AS (
    SELECT t.id, ROW_NUMBER() OVER (
        PARTITION BY json_extract(t.plan, '$.roomIds'), json_extract(t.plan, '$.areaIds'), COALESCE(json_extract(t.plan, '$.options.repeats'), 1)
        ORDER BY t.completed_at DESC, t.id
    ) AS sample_number
    FROM cleaning_tasks t
    WHERE t.device_id = sqlc.arg('device_id') AND json_extract(t.plan, '$.mapId') = sqlc.arg('map_id')
        AND t.state = 'completed' AND t.cleaned_area > 0 AND t.completed_at IS NOT NULL
        AND json_array_length(t.plan, '$.roomIds') > 0 AND json_array_length(t.plan, '$.areaIds') > 0
)
SELECT cleaning_tasks.* FROM cleaning_tasks JOIN samples ON samples.id = cleaning_tasks.id
WHERE samples.sample_number <= 5 ORDER BY cleaning_tasks.completed_at DESC, cleaning_tasks.id;

-- name: UpsertDreameDevice :exec
INSERT INTO dreame_devices(device_id,account_id,external_id,model,shard) VALUES(sqlc.arg('device_id'),sqlc.arg('account_id'),sqlc.arg('external_id'),sqlc.arg('model'),sqlc.arg('shard'))
ON CONFLICT(device_id) DO UPDATE SET model=excluded.model,shard=excluded.shard;

-- name: ListDreameDevices :many
SELECT device_id,account_id,external_id,model,shard FROM dreame_devices ORDER BY device_id;

-- name: SaveCleaningSnapshot :exec
INSERT INTO cleaning_snapshots(device_id,snapshot) VALUES(sqlc.arg('device_id'),sqlc.arg('snapshot')) ON CONFLICT(device_id) DO UPDATE SET snapshot=excluded.snapshot;

-- name: ListCleaningSnapshots :many
SELECT device_id,snapshot FROM cleaning_snapshots ORDER BY device_id;

-- name: AdvanceCleaningLinkRevision :execrows
INSERT INTO cleaning_link_sets(device_id,map_id,revision)
SELECT sqlc.arg('device_id'),sqlc.arg('map_id'),CAST(sqlc.arg('expected_revision') AS INTEGER)+1
WHERE CAST(sqlc.arg('expected_revision') AS INTEGER)=0 OR EXISTS(SELECT 1 FROM cleaning_link_sets WHERE device_id=sqlc.arg('device_id') AND map_id=sqlc.arg('map_id') AND revision=sqlc.arg('expected_revision'))
ON CONFLICT(device_id,map_id) DO UPDATE SET revision=excluded.revision WHERE cleaning_link_sets.revision=excluded.revision-1;

-- name: GetActiveCleaningTask :one
SELECT * FROM cleaning_tasks WHERE device_id=sqlc.arg('device_id') AND state IN ('starting','running','paused','stopping','returning','unknown') LIMIT 1;

-- name: GetCleaningTaskByProviderHistory :one
SELECT * FROM cleaning_tasks WHERE device_id=sqlc.arg('device_id') AND provider_history_id=sqlc.arg('provider_history_id');

-- name: AttachCleaningHistory :execrows
UPDATE cleaning_tasks SET provider_history_id=sqlc.arg('provider_history_id'), elapsed_minutes=sqlc.arg('elapsed_minutes'), cleaned_area=sqlc.arg('cleaned_area'), error=CASE WHEN sqlc.arg('state')='completed' THEN '' ELSE error END, state=sqlc.arg('state'), completed_at=sqlc.arg('completed_at'), updated_at=sqlc.arg('completed_at') WHERE id=sqlc.arg('id') AND (provider_history_id IS NULL OR provider_history_id=sqlc.arg('provider_history_id'));

-- name: InsertHistoricalCleaningTask :exec
INSERT INTO cleaning_tasks(id,device_id,request_id,plan,state,origin,error,created_at,updated_at,completed_at,provider_history_id,elapsed_minutes,cleaned_area)
VALUES(sqlc.arg('id'),sqlc.arg('device_id'),sqlc.arg('request_id'),sqlc.arg('plan'),sqlc.arg('state'),'external','',sqlc.arg('created_at'),sqlc.arg('completed_at'),sqlc.arg('completed_at'),sqlc.arg('provider_history_id'),sqlc.arg('elapsed_minutes'),sqlc.arg('cleaned_area'));
