CREATE TABLE alarms (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    alarm_id   TEXT NOT NULL,
    severity   TEXT NOT NULL CHECK (severity IN ('high', 'medium', 'low')),
    kind       TEXT NOT NULL CHECK (kind IN ('auto', 'one_shot')),
    message    TEXT NOT NULL,
    source     TEXT NOT NULL,
    raised_at  TIMESTAMP NOT NULL
);

CREATE INDEX idx_alarms_alarm_id ON alarms(alarm_id);
CREATE INDEX idx_alarms_raised_at ON alarms(raised_at DESC);
