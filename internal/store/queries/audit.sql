-- name: BeginAuditOperation :execrows
INSERT INTO audit_operations(id,started_at,actor_id,actor_name,source,field,proposed,owner_id,conversation_id,run_id,action_id,parent_id)
VALUES(?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO NOTHING;

-- name: FinishAuditOperation :execrows
UPDATE audit_operations SET status=sqlc.arg('status'), finished_at=sqlc.narg('finished_at'), error_code=sqlc.narg('error_code') WHERE id=sqlc.arg('id') AND status<>sqlc.arg('status');

-- name: SetAuditWriteContext :exec
UPDATE audit_write_context SET operation_id=? WHERE id=1;

-- name: AuditEvents :many
SELECT e.*, COALESCE(o.actor_id,'') AS actor_id, COALESCE(o.actor_name,'System') AS actor_name,
 COALESCE(o.source,'system') AS source, COALESCE(o.field,'') AS field,
 COALESCE(o.status,'succeeded') AS status, o.owner_id, o.conversation_id, o.parent_id, o.run_id, o.action_id,
 CASE WHEN o.owner_id IS NULL OR o.owner_id=CAST(sqlc.arg('reader_id') AS TEXT) THEN COALESCE(o.proposed,'{}') ELSE '{}' END AS proposed
FROM audit_events e LEFT JOIN audit_operations o ON o.id=e.operation_id
WHERE (e.owner_id IS NULL OR e.owner_id=CAST(sqlc.arg('reader_id') AS TEXT))
 AND (CAST(sqlc.arg('operation_id') AS TEXT)='' OR e.operation_id=CAST(sqlc.arg('operation_id') AS TEXT))
 AND e.sequence > CAST(sqlc.arg('after_sequence') AS INTEGER)
 AND (CAST(sqlc.arg('before_sequence') AS INTEGER)=0 OR e.sequence < CAST(sqlc.arg('before_sequence') AS INTEGER))
 AND (CAST(sqlc.arg('entity_type') AS TEXT)='' OR (e.entity_type=CAST(sqlc.arg('entity_type') AS TEXT) OR e.entity_type GLOB CASE CAST(sqlc.arg('entity_type') AS TEXT) WHEN 'automations' THEN 'automation_*' WHEN 'scenes' THEN 'scene_*' WHEN 'effects' THEN 'effect_*' WHEN 'rooms' THEN 'room_*' WHEN 'groups' THEN 'group_*' WHEN 'floorplans' THEN 'floorplan_*' ELSE '' END))
 AND (CAST(sqlc.arg('entity_id') AS TEXT)='' OR e.entity_id=CAST(sqlc.arg('entity_id') AS TEXT) OR COALESCE(json_extract(e.after_json,'$.automationId'),json_extract(e.before_json,'$.automationId'))=CAST(sqlc.arg('entity_id') AS TEXT) OR COALESCE(json_extract(e.after_json,'$.sceneId'),json_extract(e.before_json,'$.sceneId'))=CAST(sqlc.arg('entity_id') AS TEXT) OR COALESCE(json_extract(e.after_json,'$.effectId'),json_extract(e.before_json,'$.effectId'))=CAST(sqlc.arg('entity_id') AS TEXT) OR COALESCE(json_extract(e.after_json,'$.roomId'),json_extract(e.before_json,'$.roomId'))=CAST(sqlc.arg('entity_id') AS TEXT) OR COALESCE(json_extract(e.after_json,'$.groupId'),json_extract(e.before_json,'$.groupId'))=CAST(sqlc.arg('entity_id') AS TEXT) OR COALESCE(json_extract(e.after_json,'$.floorplanId'),json_extract(e.before_json,'$.floorplanId'))=CAST(sqlc.arg('entity_id') AS TEXT))
 AND (CAST(sqlc.arg('actor_id') AS TEXT)='' OR o.actor_id=CAST(sqlc.arg('actor_id') AS TEXT))
 AND (CAST(sqlc.arg('status') AS TEXT)='' OR COALESCE(o.status,'succeeded')=CAST(sqlc.arg('status') AS TEXT))
 AND (CAST(sqlc.arg('source') AS TEXT)='' OR COALESCE(o.source,'system')=CAST(sqlc.arg('source') AS TEXT))
 AND (CAST(sqlc.arg('action') AS TEXT)='' OR e.action=CAST(sqlc.arg('action') AS TEXT))
 AND (CAST(sqlc.arg('since') AS TEXT)='' OR e.recorded_at >= CAST(sqlc.arg('since') AS TEXT))
 AND (CAST(sqlc.arg('search') AS TEXT)='' OR instr(lower(e.entity_name || ' ' || e.before_json || ' ' || e.after_json || ' ' || COALESCE(o.actor_name,'') || ' ' || COALESCE(o.field,'') || ' ' || CASE WHEN o.owner_id IS NULL OR o.owner_id=CAST(sqlc.arg('reader_id') AS TEXT) THEN COALESCE(o.proposed,'') ELSE '' END),lower(CAST(sqlc.arg('search') AS TEXT)))>0)
ORDER BY e.sequence DESC LIMIT CAST(sqlc.arg('lim') AS INTEGER);

-- name: ReplayAuditEvents :many
SELECT e.*, COALESCE(o.actor_id,'') AS actor_id, COALESCE(o.actor_name,'System') AS actor_name,
 COALESCE(o.source,'system') AS source, COALESCE(o.field,'') AS field,
 COALESCE(o.status,'succeeded') AS status, o.owner_id, o.conversation_id, o.parent_id, o.run_id, o.action_id,
 CASE WHEN o.owner_id IS NULL OR o.owner_id=CAST(sqlc.arg('reader_id') AS TEXT) THEN COALESCE(o.proposed,'{}') ELSE '{}' END AS proposed
FROM audit_events e LEFT JOIN audit_operations o ON o.id=e.operation_id
WHERE (e.owner_id IS NULL OR e.owner_id=CAST(sqlc.arg('reader_id') AS TEXT))
 AND (CAST(sqlc.arg('operation_id') AS TEXT)='' OR e.operation_id=CAST(sqlc.arg('operation_id') AS TEXT))
 AND e.sequence > CAST(sqlc.arg('after_sequence') AS INTEGER)
 AND (CAST(sqlc.arg('before_sequence') AS INTEGER)=0 OR e.sequence < CAST(sqlc.arg('before_sequence') AS INTEGER))
 AND (CAST(sqlc.arg('entity_type') AS TEXT)='' OR (e.entity_type=CAST(sqlc.arg('entity_type') AS TEXT) OR e.entity_type GLOB CASE CAST(sqlc.arg('entity_type') AS TEXT) WHEN 'automations' THEN 'automation_*' WHEN 'scenes' THEN 'scene_*' WHEN 'effects' THEN 'effect_*' WHEN 'rooms' THEN 'room_*' WHEN 'groups' THEN 'group_*' WHEN 'floorplans' THEN 'floorplan_*' ELSE '' END))
 AND (CAST(sqlc.arg('entity_id') AS TEXT)='' OR e.entity_id=CAST(sqlc.arg('entity_id') AS TEXT) OR COALESCE(json_extract(e.after_json,'$.automationId'),json_extract(e.before_json,'$.automationId'))=CAST(sqlc.arg('entity_id') AS TEXT) OR COALESCE(json_extract(e.after_json,'$.sceneId'),json_extract(e.before_json,'$.sceneId'))=CAST(sqlc.arg('entity_id') AS TEXT) OR COALESCE(json_extract(e.after_json,'$.effectId'),json_extract(e.before_json,'$.effectId'))=CAST(sqlc.arg('entity_id') AS TEXT) OR COALESCE(json_extract(e.after_json,'$.roomId'),json_extract(e.before_json,'$.roomId'))=CAST(sqlc.arg('entity_id') AS TEXT) OR COALESCE(json_extract(e.after_json,'$.groupId'),json_extract(e.before_json,'$.groupId'))=CAST(sqlc.arg('entity_id') AS TEXT) OR COALESCE(json_extract(e.after_json,'$.floorplanId'),json_extract(e.before_json,'$.floorplanId'))=CAST(sqlc.arg('entity_id') AS TEXT))
 AND (CAST(sqlc.arg('actor_id') AS TEXT)='' OR o.actor_id=CAST(sqlc.arg('actor_id') AS TEXT))
 AND (CAST(sqlc.arg('status') AS TEXT)='' OR COALESCE(o.status,'succeeded')=CAST(sqlc.arg('status') AS TEXT))
 AND (CAST(sqlc.arg('source') AS TEXT)='' OR COALESCE(o.source,'system')=CAST(sqlc.arg('source') AS TEXT))
 AND (CAST(sqlc.arg('action') AS TEXT)='' OR e.action=CAST(sqlc.arg('action') AS TEXT))
 AND (CAST(sqlc.arg('since') AS TEXT)='' OR e.recorded_at >= CAST(sqlc.arg('since') AS TEXT))
 AND (CAST(sqlc.arg('search') AS TEXT)='' OR instr(lower(e.entity_name || ' ' || e.before_json || ' ' || e.after_json || ' ' || COALESCE(o.actor_name,'') || ' ' || COALESCE(o.field,'') || ' ' || CASE WHEN o.owner_id IS NULL OR o.owner_id=CAST(sqlc.arg('reader_id') AS TEXT) THEN COALESCE(o.proposed,'') ELSE '' END),lower(CAST(sqlc.arg('search') AS TEXT)))>0)
ORDER BY e.sequence ASC LIMIT CAST(sqlc.arg('lim') AS INTEGER);

-- name: AuditHighWater :one
SELECT CAST(COALESCE((SELECT sequence FROM audit_watermark WHERE id=1),0) AS INTEGER);

-- name: AppendAuditEvent :exec
INSERT INTO audit_events(operation_id,entity_type,entity_id,entity_name,action,before_json,after_json,owner_id) VALUES(?,?,?,?,?,?,?,?);

-- name: PruneAuditEvents :exec
DELETE FROM audit_events WHERE recorded_at < ?;

-- name: PruneAuditOperations :exec
DELETE FROM audit_operations WHERE finished_at IS NOT NULL AND finished_at < ? AND NOT EXISTS(SELECT 1 FROM audit_events WHERE operation_id=audit_operations.id);

-- name: AuditSnapshot :one
SELECT CAST(snapshot AS TEXT) FROM audit_snapshots WHERE entity_type=? AND entity_id=?;

-- name: InterruptedAuditOperations :many
SELECT * FROM audit_operations o WHERE status='running' AND (
 id NOT LIKE 'run:%' OR (
 NOT EXISTS(SELECT 1 FROM active_scene_runs s WHERE o.id='run:scene:'||s.run_id)
 AND NOT EXISTS(SELECT 1 FROM active_effects e WHERE o.id='run:effect:'||e.id AND e.volatile=0)
 ));

-- name: AuditFloor :one
SELECT CAST(COALESCE(MIN(sequence),(SELECT sequence+1 FROM audit_watermark WHERE id=1),1) AS INTEGER) FROM audit_events;

-- name: UpsertAuditRunOutcome :exec
INSERT INTO audit_run_targets(operation_id,device_id,dispatched,confirmed,failed,last_status)
VALUES(?,?,?,?,?,?) ON CONFLICT(operation_id,device_id) DO UPDATE SET
 dispatched=dispatched+excluded.dispatched, confirmed=confirmed+excluded.confirmed, failed=failed+excluded.failed, last_status=excluded.last_status;

-- name: UpsertAuditRunState :exec
INSERT INTO audit_run_targets(operation_id,device_id,before_json,after_json) VALUES(?,?,?,?)
ON CONFLICT(operation_id,device_id) DO UPDATE SET before_json=IIF(before_json='null',excluded.before_json,before_json), after_json=excluded.after_json;

-- name: AuditRunTargets :many
SELECT * FROM audit_run_targets WHERE operation_id=? ORDER BY device_id;

-- name: SetAuditEventDetails :exec
UPDATE audit_events SET details_json=? WHERE sequence=(SELECT MAX(sequence) FROM audit_events);

-- name: GetAuditOrigin :one
SELECT * FROM audit_operations WHERE id=?;

-- name: IdentifyAuditActor :exec
UPDATE audit_operations SET actor_id=?,actor_name=?,source='human' WHERE id=? AND source='anonymous';

-- name: CountAuditCommittedChanges :one
SELECT CAST(COUNT(*) AS INTEGER) FROM audit_events WHERE operation_id=? AND action IN ('created','updated','deleted','confirmed') AND entity_type<>'delivery';

-- name: CountAuditSharedEvents :one
SELECT CAST(COUNT(*) AS INTEGER) FROM audit_events WHERE operation_id=? AND owner_id IS NULL AND entity_type<>'operation';
