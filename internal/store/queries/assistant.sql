-- name: GetClaudeConfig :one
SELECT revision, token, enabled, model FROM claude_config WHERE id = 1;

-- name: SaveClaudeConfig :execrows
INSERT INTO claude_config (revision, id, token, enabled, model) SELECT CAST(sqlc.arg('expected_revision') AS INTEGER)+1, 1, sqlc.arg('token'), sqlc.arg('enabled'), sqlc.arg('model') WHERE CAST(sqlc.arg('expected_revision') AS INTEGER) = 0 OR EXISTS (SELECT 1 FROM claude_config WHERE id=1 AND revision=sqlc.arg('expected_revision'))
ON CONFLICT(id) DO UPDATE SET token = excluded.token, enabled = excluded.enabled, model = excluded.model, revision=claude_config.revision+1 WHERE claude_config.revision=excluded.revision-1;

-- name: DeleteClaudeConfig :exec
DELETE FROM claude_config;

-- name: ListAssistantConversations :many
SELECT id, user_id, auto_title, title_override, revision, updated_at FROM assistant_conversations WHERE user_id = ? ORDER BY updated_at DESC;

-- name: GetAssistantConversation :one
SELECT * FROM assistant_conversations WHERE id = ? AND user_id = ?;

-- name: CreateAssistantConversation :exec
INSERT INTO assistant_conversations (id, user_id, auto_title, title_override, document, updated_at) VALUES (?, ?, ?, ?, ?, ?);

-- name: SaveAssistantConversation :execrows
UPDATE assistant_conversations SET auto_title = ?, title_override = ?, document = ?, revision = revision + 1, updated_at = ?
WHERE id = ? AND user_id = ? AND revision = ?;

-- name: DeleteAssistantConversation :exec
DELETE FROM assistant_conversations WHERE id = ? AND user_id = ?;

-- name: ListAssistantConversationOwners :many
SELECT id, user_id FROM assistant_conversations;

-- name: CreateAssistantAttachment :exec
INSERT INTO assistant_attachments (id, conversation_id, name, mime, content, created_at) VALUES (?, ?, ?, ?, ?, ?);

-- name: GetAssistantAttachment :one
SELECT a.* FROM assistant_attachments a JOIN assistant_conversations c ON c.id = a.conversation_id
WHERE a.id = ? AND c.user_id = ?;

-- name: DeleteAssistantAttachment :exec
DELETE FROM assistant_attachments WHERE assistant_attachments.id = ? AND conversation_id IN (SELECT assistant_conversations.id FROM assistant_conversations WHERE user_id = ?);
