CREATE TABLE dreame_devices (
 device_id TEXT PRIMARY KEY REFERENCES devices(id) ON DELETE CASCADE,
 account_id TEXT NOT NULL,
 external_id TEXT NOT NULL,
 model TEXT NOT NULL,
 shard TEXT NOT NULL,
 UNIQUE(account_id,external_id)
);
CREATE TABLE cleaning_snapshots (
 device_id TEXT PRIMARY KEY REFERENCES devices(id) ON DELETE CASCADE,
 snapshot TEXT NOT NULL CHECK(json_valid(snapshot))
);
CREATE TABLE cleaning_link_sets (
 device_id TEXT NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
 map_id TEXT NOT NULL,
 revision INTEGER NOT NULL DEFAULT 1,
 PRIMARY KEY(device_id,map_id)
);
INSERT INTO cleaning_link_sets(device_id,map_id) SELECT DISTINCT device_id,map_id FROM cleaning_room_links;
