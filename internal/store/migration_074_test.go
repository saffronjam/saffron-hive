package store

import (
	"database/sql"
	"testing"

	_ "modernc.org/sqlite"
)

func TestMigration074RemovesPostureAlarms(t *testing.T) {
	db, err := sql.Open("sqlite", "file:migration074?mode=memory&cache=shared")
	if err != nil {
		t.Fatal(err)
	}
	defer func() { _ = db.Close() }()

	m := newMigrate(t, db)
	if err := m.Migrate(73); err != nil {
		t.Fatal(err)
	}
	if _, err := db.Exec(`INSERT INTO alarms (alarm_id, severity, kind, message, source, raised_at) VALUES
		('system.device_posture_abnormal.sensor-1', 'medium', 'auto', 'Device reports abnormal posture', 'system.monitor', '2026-08-21T06:00:00Z'),
		('system.device_posture_abnormal.sensor-1', 'medium', 'one_shot', 'User alarm with the same id', 'automation.custom', '2026-08-21T06:01:00Z'),
		('system.disk_low', 'high', 'auto', 'Disk space is low', 'system.monitor', '2026-08-21T06:02:00Z')`); err != nil {
		t.Fatal(err)
	}

	if err := m.Migrate(74); err != nil {
		t.Fatal(err)
	}

	if got := alarmIDs(t, db); got != "system.device_posture_abnormal.sensor-1,system.disk_low" {
		t.Fatalf("alarms after migration = %q", got)
	}
}
