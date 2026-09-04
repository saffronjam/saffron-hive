CREATE TABLE alarms_with_message (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    alarm_id TEXT NOT NULL,
    severity TEXT NOT NULL CHECK (severity IN ('high', 'medium', 'low')),
    kind TEXT NOT NULL CHECK (kind IN ('auto', 'one_shot')),
    message TEXT NOT NULL,
    source TEXT NOT NULL,
    raised_at TIMESTAMP NOT NULL
);

INSERT INTO alarms_with_message (id, alarm_id, severity, kind, message, source, raised_at)
SELECT id, alarm_id, severity, kind, COALESCE(message, message_code), source, raised_at
FROM alarms;

DROP TABLE alarms;
ALTER TABLE alarms_with_message RENAME TO alarms;
CREATE INDEX idx_alarms_alarm_id ON alarms(alarm_id);
CREATE INDEX idx_alarms_raised_at ON alarms(raised_at DESC);
