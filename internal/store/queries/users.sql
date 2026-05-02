-- name: CreateUser :exec
INSERT INTO users (id, username, name, password_hash, must_change_password)
VALUES (?, ?, ?, ?, ?);

-- name: GetUserByID :one
SELECT id, username, name, password_hash, avatar_path, theme, time_format, temperature_unit, must_change_password, created_at
FROM users
WHERE id = ?;

-- name: GetUserByUsername :one
SELECT id, username, name, password_hash, avatar_path, theme, time_format, temperature_unit, must_change_password, created_at
FROM users
WHERE username = ?;

-- name: ListUsers :many
SELECT id, username, name, password_hash, avatar_path, theme, time_format, temperature_unit, must_change_password, created_at
FROM users
ORDER BY created_at ASC;

-- name: CountUsers :one
SELECT COUNT(*) FROM users;

-- name: UpdateUserProfile :exec
-- Partial update of mutable profile fields. Nil narg values leave their column
-- untouched. avatar_path can be set to a value here but cannot be cleared to
-- NULL; use ClearUserAvatar for that (COALESCE cannot distinguish "leave alone"
-- from "set to NULL"). theme is constrained by a CHECK in the migration.
UPDATE users SET
    name             = COALESCE(sqlc.narg('name'),             name),
    theme            = COALESCE(sqlc.narg('theme'),            theme),
    avatar_path      = COALESCE(sqlc.narg('avatar_path'),      avatar_path),
    time_format      = COALESCE(sqlc.narg('time_format'),      time_format),
    temperature_unit = COALESCE(sqlc.narg('temperature_unit'), temperature_unit)
WHERE id = sqlc.arg('id');

-- name: ClearUserAvatar :exec
UPDATE users SET avatar_path = NULL WHERE id = ?;

-- name: UpdateUserPasswordHash :exec
UPDATE users SET password_hash = ? WHERE id = ?;

-- name: CompleteFirstPasswordChange :execrows
-- Sets a fresh password hash and clears the must_change_password flag in one
-- statement. The WHERE clause guards against use outside the forced-change
-- flow: only rows where the flag is currently set will be updated.
UPDATE users
SET password_hash = sqlc.arg('password_hash'),
    must_change_password = false
WHERE id = sqlc.arg('id') AND must_change_password = true;

-- name: SetUserMustChangePassword :exec
UPDATE users SET must_change_password = sqlc.arg('must_change_password') WHERE id = sqlc.arg('id');

-- name: DeleteUser :exec
DELETE FROM users WHERE id = ?;

-- name: BatchDeleteUsers :execrows
DELETE FROM users
WHERE id IN (SELECT value FROM json_each(CAST(sqlc.arg('ids_json') AS TEXT)));

-- name: GetUserAvatarPath :one
SELECT avatar_path FROM users WHERE id = ?;

-- name: GetUserAvatarPathsByIDs :many
SELECT id, avatar_path FROM users
WHERE id IN (SELECT value FROM json_each(CAST(sqlc.arg('ids_json') AS TEXT)));
