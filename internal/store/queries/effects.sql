-- name: CreateEffect :exec
INSERT INTO effects (id, name, icon, kind, native_name, loop, duration_ms, created_by)
VALUES (?, ?, ?, ?, ?, ?, ?, ?);

-- name: GetEffect :one
SELECT e.id, e.name, e.icon, e.kind, e.native_name, e.loop, e.duration_ms,
       e.created_at, e.updated_at,
       u.id       AS creator_id,
       u.username AS creator_username,
       u.name     AS creator_name
FROM effects e
LEFT JOIN users u ON u.id = e.created_by
WHERE e.id = ?;

-- name: ListEffects :many
SELECT e.id, e.name, e.icon, e.kind, e.native_name, e.loop, e.duration_ms,
       e.created_at, e.updated_at,
       u.id       AS creator_id,
       u.username AS creator_username,
       u.name     AS creator_name
FROM effects e
LEFT JOIN users u ON u.id = e.created_by;

-- name: UpdateEffect :exec
UPDATE effects SET
    name        = COALESCE(sqlc.narg('name'),        name),
    icon        = COALESCE(sqlc.narg('icon'),        icon),
    kind        = COALESCE(sqlc.narg('kind'),        kind),
    native_name = COALESCE(sqlc.narg('native_name'), native_name),
    loop        = COALESCE(sqlc.narg('loop'),        loop),
    duration_ms = COALESCE(sqlc.narg('duration_ms'), duration_ms),
    updated_at  = CURRENT_TIMESTAMP
WHERE id = sqlc.arg('id');

-- name: ClearEffectIcon :exec
UPDATE effects SET icon = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?;

-- name: ClearEffectNativeName :exec
UPDATE effects SET native_name = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?;

-- name: UpdateEffectDuration :exec
UPDATE effects SET duration_ms = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?;

-- name: DeleteEffect :exec
DELETE FROM effects WHERE id = ?;

-- name: CreateEffectTrack :exec
INSERT INTO effect_tracks (id, effect_id, track_index, name)
VALUES (?, ?, ?, ?);

-- name: ListEffectTracks :many
SELECT id, effect_id, track_index, name
FROM effect_tracks
WHERE effect_id = ?
ORDER BY track_index;

-- name: DeleteEffectTracksByEffect :exec
DELETE FROM effect_tracks WHERE effect_id = ?;

-- name: CreateEffectClip :exec
INSERT INTO effect_clips (id, track_id, start_ms, transition_min_ms, transition_max_ms, kind, config)
VALUES (?, ?, ?, ?, ?, ?, ?);

-- name: ListEffectClips :many
SELECT id, track_id, start_ms, transition_min_ms, transition_max_ms, kind, config
FROM effect_clips
WHERE track_id = ?
ORDER BY start_ms, id;

-- name: UpsertActiveEffect :exec
INSERT INTO active_effects (id, effect_id, target_type, target_id, started_at, volatile)
VALUES (?, ?, ?, ?, ?, ?)
ON CONFLICT(target_type, target_id) DO UPDATE SET
    effect_id  = excluded.effect_id,
    started_at = excluded.started_at,
    volatile   = excluded.volatile;

-- name: DeleteActiveEffectByTarget :exec
DELETE FROM active_effects WHERE target_type = ? AND target_id = ?;

-- name: ListActiveEffects :many
SELECT id, effect_id, target_type, target_id, started_at, volatile
FROM active_effects;

-- name: DeleteVolatileActiveEffects :execrows
DELETE FROM active_effects WHERE volatile = 1;
