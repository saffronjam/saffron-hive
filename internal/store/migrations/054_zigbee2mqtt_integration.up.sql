ALTER TABLE mqtt_config RENAME TO zigbee2mqtt_config;
ALTER TABLE zigbee2mqtt_config ADD COLUMN enabled BOOLEAN NOT NULL DEFAULT true;

UPDATE devices SET source = 'zigbee2mqtt' WHERE source IN ('zigbee', '');

DELETE FROM alarms WHERE alarm_id = 'system.mqtt_disconnected';
