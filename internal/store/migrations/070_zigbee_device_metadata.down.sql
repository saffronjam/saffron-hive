ALTER TABLE zigbee2mqtt_config DROP COLUMN frontend_url;

DROP INDEX IF EXISTS idx_zigbee_device_metadata_firmware;
DROP TABLE IF EXISTS zigbee_device_metadata;
