ALTER TABLE zigbee2mqtt_config ADD COLUMN interactive_commands_per_second INTEGER NOT NULL DEFAULT 10;
ALTER TABLE zigbee2mqtt_config ADD COLUMN continuous_commands_per_second INTEGER NOT NULL DEFAULT 2;
