ALTER TABLE guests ADD COLUMN language TEXT NOT NULL DEFAULT 'en'
    CHECK (language IN ('en', 'sv', 'ru'));
