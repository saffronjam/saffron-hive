-- Splits a device's name in two. `name` is the user's override and is now
-- nullable, where NULL means unset. `friendly_name` is what the integration
-- reports and is refreshed on every adapter sync. Readers resolve
-- name -> friendly_name -> id.
--
-- SQLite cannot drop a NOT NULL constraint in place, so `devices` is rebuilt.
-- Foreign keys are deferred rather than disabled because a migration runs
-- inside a transaction, where PRAGMA foreign_keys is a no-op.

PRAGMA defer_foreign_keys = 1;

CREATE TABLE devices_new (
    id TEXT PRIMARY KEY,
    name TEXT,
    friendly_name TEXT NOT NULL DEFAULT '',
    source TEXT NOT NULL,
    type TEXT NOT NULL,
    capabilities TEXT NOT NULL DEFAULT '[]',
    icon TEXT,
    available BOOLEAN NOT NULL DEFAULT false,
    removed BOOLEAN NOT NULL DEFAULT false,
    disabled BOOLEAN NOT NULL DEFAULT false,
    last_seen TIMESTAMP
);

-- zigbee_devices.friendly_name holds the name each Zigbee device carried at
-- discovery, so it is the adapter's value even where the user has since renamed
-- the device in Hive. Devices from other integrations have no such row and take
-- their current name as the adapter value.
--
-- A name still identical to the adapter's was never a user choice, so it is
-- unset here. Those devices start tracking their integration again, which is
-- the point of the split.
INSERT INTO devices_new (
    id, name, friendly_name, source, type,
    capabilities, icon, available, removed, disabled, last_seen
)
SELECT
    d.id,
    CASE WHEN d.name = COALESCE(z.friendly_name, d.name) THEN NULL ELSE d.name END,
    COALESCE(z.friendly_name, d.name, ''),
    d.source,
    d.type,
    d.capabilities,
    d.icon,
    d.available,
    d.removed,
    d.disabled,
    d.last_seen
FROM devices d
LEFT JOIN zigbee_devices z ON z.device_id = d.id;

DROP TABLE devices;
ALTER TABLE devices_new RENAME TO devices;

-- Both of its columns are now redundant: ieee_address always equalled
-- devices.id, and friendly_name has moved onto devices. Nothing outside the
-- store package ever read the table.
DROP TABLE zigbee_devices;
