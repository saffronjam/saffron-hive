-- One mesh-topology snapshot per integration provider: the nodes and links a
-- network scan reported, as JSON documents, plus when the scan ran.
CREATE TABLE network_topology_snapshots (
    provider   TEXT PRIMARY KEY,
    nodes      TEXT NOT NULL DEFAULT '[]',
    links      TEXT NOT NULL DEFAULT '[]',
    scanned_at TIMESTAMP NOT NULL
);

-- Opt-in daily topology scan. The time survives the schedule being switched
-- off, so re-enabling restores it; NULL means never set.
ALTER TABLE zigbee2mqtt_config ADD COLUMN scan_schedule_enabled BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE zigbee2mqtt_config ADD COLUMN scan_hour INTEGER;
ALTER TABLE zigbee2mqtt_config ADD COLUMN scan_minute INTEGER;
