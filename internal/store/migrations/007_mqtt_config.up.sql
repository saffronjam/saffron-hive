CREATE TABLE mqtt_config (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    broker TEXT NOT NULL,
    username TEXT NOT NULL DEFAULT '',
    password TEXT NOT NULL DEFAULT '',
    use_wss BOOLEAN NOT NULL DEFAULT 0
);
