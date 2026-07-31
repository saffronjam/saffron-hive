CREATE TABLE mqtt_config (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    broker TEXT NOT NULL,
    username TEXT NOT NULL DEFAULT '',
    password TEXT NOT NULL DEFAULT '',
    use_wss BOOLEAN NOT NULL DEFAULT 0
);

INSERT INTO mqtt_config (id, broker, username, password, use_wss)
SELECT id, broker, username, password, use_wss FROM zigbee2mqtt_config;

DROP TABLE zigbee2mqtt_config;

UPDATE devices SET source = 'zigbee' WHERE source = 'zigbee2mqtt';

DELETE FROM alarms WHERE alarm_id = 'system.zigbee2mqtt_disconnected';
