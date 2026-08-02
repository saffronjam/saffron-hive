-- Collapses the split name back into a single NOT NULL column and restores the
-- zigbee_devices table. A device with no override falls back to its adapter
-- name, and then to its id, so the column can be NOT NULL again.

PRAGMA defer_foreign_keys = 1;

CREATE TABLE devices_old (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    source TEXT NOT NULL,
    type TEXT NOT NULL,
    capabilities TEXT NOT NULL DEFAULT '[]',
    icon TEXT,
    available BOOLEAN NOT NULL DEFAULT false,
    removed BOOLEAN NOT NULL DEFAULT false,
    disabled BOOLEAN NOT NULL DEFAULT false,
    last_seen TIMESTAMP
);

INSERT INTO devices_old (
    id, name, source, type,
    capabilities, icon, available, removed, disabled, last_seen
)
SELECT
    id,
    COALESCE(NULLIF(name, ''), NULLIF(friendly_name, ''), id),
    source,
    type,
    capabilities,
    icon,
    available,
    removed,
    disabled,
    last_seen
FROM devices;

CREATE TABLE zigbee_devices (
    device_id TEXT PRIMARY KEY REFERENCES devices(id),
    ieee_address TEXT UNIQUE NOT NULL,
    friendly_name TEXT NOT NULL
);

INSERT INTO zigbee_devices (device_id, ieee_address, friendly_name)
SELECT id, id, COALESCE(NULLIF(friendly_name, ''), COALESCE(name, id))
FROM devices
WHERE source = 'zigbee2mqtt';

DROP TABLE devices;
ALTER TABLE devices_old RENAME TO devices;
