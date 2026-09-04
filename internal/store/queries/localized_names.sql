-- name: ListLocalizedNameSubjects :many
SELECT entity_type, entity_id, source_language
FROM localized_name_subjects
ORDER BY entity_type, entity_id;

-- name: GetLocalizedNameSubject :one
SELECT entity_type, entity_id, source_language
FROM localized_name_subjects
WHERE entity_type = ? AND entity_id = ?;

-- name: ListLocalizedNames :many
SELECT entity_type, entity_id, language, value
FROM localized_names
ORDER BY entity_type, entity_id, language;

-- name: ListLocalizedNamesForSubject :many
SELECT entity_type, entity_id, language, value
FROM localized_names
WHERE entity_type = ? AND entity_id = ?
ORDER BY language;

-- name: DeleteLocalizedNamesForSubject :exec
DELETE FROM localized_names WHERE entity_type = ? AND entity_id = ?;

-- name: UpsertLocalizedName :exec
INSERT INTO localized_names (entity_type, entity_id, language, value)
VALUES (?, ?, ?, ?)
ON CONFLICT(entity_type, entity_id, language) DO UPDATE SET value = excluded.value;
