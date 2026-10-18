ALTER TABLE assistant_conversations RENAME COLUMN title TO title_override;
ALTER TABLE assistant_conversations ADD COLUMN auto_title TEXT NOT NULL DEFAULT '';
UPDATE assistant_conversations SET title_override = '' WHERE title_override IN ('New chat', 'Ny chatt', 'Новый чат');
UPDATE assistant_conversations SET document = json_remove(document, '$.title');
