CREATE TABLE claude_config (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    token TEXT NOT NULL,
    enabled INTEGER NOT NULL DEFAULT 0,
    model TEXT NOT NULL DEFAULT 'opus' CHECK (model IN ('opus', 'sonnet'))
);
CREATE TABLE assistant_conversations (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    document TEXT NOT NULL DEFAULT '{}',
    revision INTEGER NOT NULL DEFAULT 0,
    updated_at TEXT NOT NULL
);
CREATE INDEX assistant_conversations_user ON assistant_conversations(user_id, updated_at DESC);
CREATE TABLE assistant_attachments (
    id TEXT PRIMARY KEY,
    conversation_id TEXT NOT NULL REFERENCES assistant_conversations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    mime TEXT NOT NULL,
    content BLOB NOT NULL,
    created_at TEXT NOT NULL
);
