UPDATE assistant_conversations SET title_override = CASE
    WHEN title_override != '' THEN title_override
    WHEN auto_title != '' THEN auto_title
    ELSE 'New chat' END;
ALTER TABLE assistant_conversations DROP COLUMN auto_title;
ALTER TABLE assistant_conversations RENAME COLUMN title_override TO title;
