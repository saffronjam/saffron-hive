CREATE TABLE dreame_config (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    revision INTEGER NOT NULL DEFAULT 1,
    email TEXT NOT NULL,
    password TEXT NOT NULL,
    region TEXT NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE cleaning_room_links (
    device_id TEXT NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    map_id TEXT NOT NULL,
    room_id TEXT NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    area_id TEXT NOT NULL,
    map_revision TEXT NOT NULL,
    PRIMARY KEY (device_id, map_id, room_id, area_id)
);

CREATE TABLE cleaning_calibrations (
    device_id TEXT NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    map_id TEXT NOT NULL,
    floorplan_id TEXT NOT NULL REFERENCES floorplans(id) ON DELETE CASCADE,
    revision INTEGER NOT NULL DEFAULT 1,
    map_revision TEXT NOT NULL,
    floorplan_revision INTEGER NOT NULL,
    anchors TEXT NOT NULL CHECK (json_valid(anchors)),
    PRIMARY KEY (device_id, map_id, floorplan_id)
);

CREATE TABLE cleaning_tasks (
    id TEXT PRIMARY KEY,
    device_id TEXT NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    request_id TEXT NOT NULL UNIQUE,
    plan TEXT NOT NULL CHECK (json_valid(plan)),
    state TEXT NOT NULL,
    origin TEXT NOT NULL,
    error TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    completed_at TEXT
);
CREATE INDEX cleaning_tasks_device_created ON cleaning_tasks (device_id, created_at DESC);
CREATE UNIQUE INDEX cleaning_tasks_active_device ON cleaning_tasks(device_id)
    WHERE state IN ('starting', 'running', 'paused', 'stopping', 'returning', 'unknown');
