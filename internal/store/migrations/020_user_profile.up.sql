ALTER TABLE users ADD COLUMN avatar_path TEXT;
ALTER TABLE users ADD COLUMN theme TEXT NOT NULL DEFAULT 'dark'
    CHECK (theme IN ('light', 'dark'));
