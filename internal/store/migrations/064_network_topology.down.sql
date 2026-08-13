DROP TABLE IF EXISTS network_topology_snapshots;
ALTER TABLE zigbee2mqtt_config DROP COLUMN scan_schedule_enabled;
ALTER TABLE zigbee2mqtt_config DROP COLUMN scan_hour;
ALTER TABLE zigbee2mqtt_config DROP COLUMN scan_minute;
