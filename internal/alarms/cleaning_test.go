package alarms

import (
	"testing"

	"github.com/saffronjam/saffron-hive/internal/cleaning"
	"github.com/saffronjam/saffron-hive/internal/device"
	"github.com/saffronjam/saffron-hive/internal/store"
)

func TestCleaningMaintenanceAlarmLifecycle(t *testing.T) {
	ctx := t.Context()
	storage := newTestStore(t)
	svc := NewService(storage, NewBuffer())
	reader := device.NewMemoryStore()
	reader.Register(device.Device{ID: "robot", Name: device.Ptr("Vacuum"), Available: true})
	snapshot := cleaning.Snapshot{DeviceID: "robot", Consumables: []cleaning.Consumable{{Name: "filter", Percent: 9}, {Name: "sensors", Percent: 0}}}
	sync := func() {
		t.Helper()
		if err := syncCleaningMaintenance(ctx, svc, reader, []cleaning.Snapshot{snapshot}); err != nil {
			t.Fatal(err)
		}
	}
	sync()
	sync()
	active, err := svc.ListActive(ctx)
	if err != nil || len(active) != 2 {
		t.Fatalf("alarms=%+v err=%v", active, err)
	}
	for _, alarm := range active {
		if alarm.Count != 1 {
			t.Fatal("polling duplicated a maintenance alert")
		}
	}
	snapshot.Consumables[0].Percent = 0
	sync()
	active, err = svc.ListActive(ctx)
	if err != nil {
		t.Fatal(err)
	}
	for _, alarm := range active {
		if alarm.MessageCode != "cleaning_maintenance_due" || alarm.Severity != store.AlarmSeverityMedium || alarm.Count != 1 {
			t.Fatalf("due alarm=%+v", alarm)
		}
	}
	snapshot.Consumables = nil
	sync()
	active, _ = svc.ListActive(ctx)
	if len(active) != 2 {
		t.Fatal("missing readings cleared maintenance")
	}
	snapshot.Consumables = []cleaning.Consumable{{Name: "filter", Percent: 100}, {Name: "sensors", Percent: 100}}
	sync()
	active, _ = svc.ListActive(ctx)
	if len(active) != 0 {
		t.Fatal("counter resets did not clear reminders")
	}
	snapshot.Consumables = []cleaning.Consumable{{Name: "filter", Percent: 0}}
	sync()
	reader.UpdateUserFields(device.Device{ID: "robot", Disabled: true})
	sync()
	active, _ = svc.ListActive(ctx)
	if len(active) != 0 {
		t.Fatal("disabled vacuum retained active maintenance reminders")
	}
}
