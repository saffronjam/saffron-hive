-- name: CreateUser :exec
INSERT INTO users (id, username, name, password_hash)
VALUES (?, ?, ?, ?);

-- name: GetUserByID :one
SELECT id, username, name, password_hash, created_at
FROM users
WHERE id = ?;

-- name: GetUserByUsername :one
SELECT id, username, name, password_hash, created_at
FROM users
WHERE username = ?;

-- name: ListUsers :many
SELECT id, username, name, password_hash, created_at
FROM users
ORDER BY created_at ASC;

-- name: CountUsers :one
SELECT COUNT(*) FROM users;
