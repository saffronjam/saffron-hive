-- name: CreateEffect :exec
INSERT INTO effects (id, name, icon, kind, native_name, loop, created_by)
VALUES (?, ?, ?, ?, ?, ?, ?);

-- name: GetEffect :one
SELECT e.id, e.name, e.icon, e.kind, e.native_name, e.loop,
       e.created_at, e.updated_at,
       u.id       AS creator_id,
       u.username AS creator_username,
       u.name     AS creator_name
FROM effects e
LEFT JOIN users u ON u.id = e.created_by
WHERE e.id = ?;

-- name: ListEffects :many
SELECT e.id, e.name, e.icon, e.kind, e.native_name, e.loop,
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
    updated_at  = CURRENT_TIMESTAMP
WHERE id = sqlc.arg('id');

-- name: ClearEffectIcon :exec
UPDATE effects SET icon = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?;

-- name: ClearEffectNativeName :exec
UPDATE effects SET native_name = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?;

-- name: DeleteEffect :exec
DELETE FROM effects WHERE id = ?;

-- name: CreateEffectStep :exec
INSERT INTO effect_steps (id, effect_id, step_index, kind, config)
VALUES (?, ?, ?, ?, ?);

-- name: ListEffectSteps :many
SELECT id, effect_id, step_index, kind, config
FROM effect_steps
WHERE effect_id = ?
ORDER BY step_index;

-- name: DeleteEffectStepsByEffect :exec
DELETE FROM effect_steps WHERE effect_id = ?;

-- name: UpsertActiveEffect :exec
INSERT INTO active_effects (id, effect_id, target_type, target_id, started_at, volatile)
VALUES (?, ?, ?, ?, ?, ?)
ON CONFLICT(target_type, target_id) DO UPDATE SET
    effect_id  = excluded.effect_id,
    started_at = excluded.started_at,
    volatile   = excluded.volatile;

-- name: DeleteActiveEffect :exec
DELETE FROM active_effects WHERE id = ?;

-- name: GetActiveEffectByTarget :one
SELECT id, effect_id, target_type, target_id, started_at, volatile
FROM active_effects
WHERE target_type = ? AND target_id = ?;

-- name: ListActiveEffects :many
SELECT id, effect_id, target_type, target_id, started_at, volatile
FROM active_effects;

-- name: DeleteVolatileActiveEffects :execrows
DELETE FROM active_effects WHERE volatile = 1;
