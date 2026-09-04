CREATE TABLE alarms_i18n (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    alarm_id TEXT NOT NULL,
    severity TEXT NOT NULL CHECK (severity IN ('high', 'medium', 'low')),
    kind TEXT NOT NULL CHECK (kind IN ('auto', 'one_shot')),
    message TEXT,
    message_code TEXT,
    message_arguments TEXT NOT NULL DEFAULT '{}',
    source TEXT NOT NULL,
    raised_at TIMESTAMP NOT NULL,
    CHECK ((message IS NOT NULL) <> (message_code IS NOT NULL))
);

INSERT INTO alarms_i18n (
    id, alarm_id, severity, kind, message, message_code, message_arguments, source, raised_at
)
SELECT id, alarm_id, severity, kind,
       CASE WHEN source = 'system.monitor' AND (
           alarm_id IN ('system.disk_low', 'system.memory_high', 'system.zigbee2mqtt_disconnected')
           OR alarm_id LIKE 'system.device_unavailable.%'
           OR alarm_id LIKE 'system.battery_low.%'
       ) THEN NULL ELSE message END,
       CASE
           WHEN source = 'system.monitor' AND alarm_id = 'system.disk_low' THEN 'disk_low'
           WHEN source = 'system.monitor' AND alarm_id = 'system.memory_high' THEN 'memory_high'
           WHEN source = 'system.monitor' AND alarm_id = 'system.zigbee2mqtt_disconnected' THEN 'broker_disconnected'
           WHEN source = 'system.monitor' AND alarm_id LIKE 'system.device_unavailable.%' THEN 'device_unavailable'
           WHEN source = 'system.monitor' AND alarm_id LIKE 'system.battery_low.%' THEN 'battery_low'
           ELSE NULL
       END,
       '{}', source, raised_at
FROM alarms;

DROP TABLE alarms;
ALTER TABLE alarms_i18n RENAME TO alarms;
CREATE INDEX idx_alarms_alarm_id ON alarms(alarm_id);
CREATE INDEX idx_alarms_raised_at ON alarms(raised_at DESC);
