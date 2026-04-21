package alarms

import (
	"context"
	"testing"
	"time"

	"github.com/saffronjam/saffron-hive/internal/device"
	"github.com/saffronjam/saffron-hive/internal/store"
)

type fakeReader struct {
	devices []device.Device
	states  map[device.DeviceID]*device.DeviceState
}

func (f *fakeReader) GetDevice(device.DeviceID) (device.Device, bool) { return device.Device{}, false }
func (f *fakeReader) GetDeviceState(id device.DeviceID) (*device.DeviceState, bool) {
	if s, ok := f.states[id]; ok {
		return s, true
	}
	return nil, false
}
func (f *fakeReader) ListDevices() []device.Device                         { return f.devices }
func (f *fakeReader) GetGroup(device.GroupID) (device.Group, bool)         { return device.Group{}, false }
func (f *fakeReader) ListGroups() []device.Group                           { return nil }
func (f *fakeReader) ListGroupMembers(device.GroupID) []device.GroupMember { return nil }
func (f *fakeReader) ResolveGroupDevices(device.GroupID) []device.DeviceID { return nil }

type fakeProbe struct{ connected bool }

func (p *fakeProbe) MQTTConnected() bool { return p.connected }

func TestEvaluateAndApplyRaisesAndClears(t *testing.T) {
	ctx := context.Background()
	s := newTestStore(t)
	svc := NewService(s, NewBuffer())

	reader := &fakeReader{}
	probe := &fakeProbe{connected: false} // mqtt down → should raise
	diskFn := func(string) (float64, error) { return 0.5, nil }
	heapFn := func() uint64 { return 10 * 1024 * 1024 } // low heap → no memory alarm

	lastActive := map[string]struct{}{}

	evaluateAndApply(ctx, svc, reader, probe, ".", diskFn, heapFn, lastActive)

	list, err := svc.ListActive(ctx)
	if err != nil {
		t.Fatalf("list: %v", err)
	}
	var sawMQTT bool
	for _, a := range list {
		if a.ID == "system.mqtt_disconnected" {
			sawMQTT = true
		}
	}
	if !sawMQTT {
		t.Fatalf("expected system.mqtt_disconnected to be raised, got %+v", list)
	}
	if _, ok := lastActive["system.mqtt_disconnected"]; !ok {
		t.Fatal("lastActive should contain mqtt_disconnected after first tick")
	}

	// Recover: broker back up, next tick should clear the alarm.
	probe.connected = true
	evaluateAndApply(ctx, svc, reader, probe, ".", diskFn, heapFn, lastActive)

	list, err = svc.ListActive(ctx)
	if err != nil {
		t.Fatalf("list after recover: %v", err)
	}
	for _, a := range list {
		if a.ID == "system.mqtt_disconnected" {
			t.Fatalf("mqtt alarm still active after recovery: %+v", a)
		}
	}
	if _, ok := lastActive["system.mqtt_disconnected"]; ok {
		t.Fatal("lastActive should no longer contain mqtt_disconnected after recovery")
	}
}

func TestEvaluateAndApplyDoesNotReRaiseWhileActive(t *testing.T) {
	ctx := context.Background()
	s := newTestStore(t)
	svc := NewService(s, NewBuffer())

	reader := &fakeReader{}
	probe := &fakeProbe{connected: false}
	diskFn := func(string) (float64, error) { return 0.5, nil }
	heapFn := func() uint64 { return 10 * 1024 * 1024 }
	lastActive := map[string]struct{}{}

	for i := 0; i < 3; i++ {
		evaluateAndApply(ctx, svc, reader, probe, ".", diskFn, heapFn, lastActive)
	}

	list, err := svc.ListActive(ctx)
	if err != nil {
		t.Fatalf("list: %v", err)
	}
	for _, a := range list {
		if a.ID == "system.mqtt_disconnected" && a.Count != 1 {
			t.Fatalf("expected mqtt alarm count 1 after 3 ticks with same condition, got %d", a.Count)
		}
	}
}

// TestMonitorReRaisesAfterUserDelete exercises the full RunMonitor loop to
// confirm that when a user deletes an alarm whose underlying condition is
// still active, the next tick re-raises it (rather than skipping because the
// in-memory lastActive set still contains the id).
func TestMonitorReRaisesAfterUserDelete(t *testing.T) {
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	s := newTestStore(t)
	svc := NewService(s, NewBuffer())
	probe := &fakeProbe{connected: false} // mqtt stays down throughout

	cfg := MonitorConfig{
		TickInterval:  10 * time.Millisecond,
		StartupSettle: 1 * time.Millisecond,
		DiskStatPath:  ".",
		DiskStatFn:    func(string) (float64, error) { return 0.9, nil },
		HeapFn:        func() uint64 { return 1 * 1024 * 1024 },
	}

	go runMonitor(ctx, svc, &fakeReader{}, probe, cfg)

	// Wait for the first raise to land.
	deadline := time.Now().Add(500 * time.Millisecond)
	for time.Now().Before(deadline) {
		list, _ := svc.ListActive(ctx)
		if len(list) == 1 && list[0].ID == "system.mqtt_disconnected" {
			break
		}
		time.Sleep(5 * time.Millisecond)
	}
	list, _ := svc.ListActive(ctx)
	if len(list) != 1 {
		t.Fatalf("expected initial raise, got %d alarms", len(list))
	}

	// Simulate the user deleting the alarm while the condition is still
	// active. Without the re-hydrate, the next tick would skip raising.
	if _, err := svc.DeleteByAlarmID(ctx, "system.mqtt_disconnected"); err != nil {
		t.Fatalf("delete: %v", err)
	}

	// Next tick should re-raise because the DB is the source of truth.
	deadline = time.Now().Add(500 * time.Millisecond)
	for time.Now().Before(deadline) {
		list, _ := svc.ListActive(ctx)
		if len(list) == 1 && list[0].ID == "system.mqtt_disconnected" {
			return // success
		}
		time.Sleep(5 * time.Millisecond)
	}
	list, _ = svc.ListActive(ctx)
	t.Fatalf("expected re-raise after user delete, got %d alarms: %+v", len(list), list)
}

func TestEvaluateAndApplyBatteryLowPerDevice(t *testing.T) {
	ctx := context.Background()
	s := newTestStore(t)
	svc := NewService(s, NewBuffer())

	lowBattery := 5
	reader := &fakeReader{
		devices: []device.Device{
			{ID: "sensor-1", Name: "Kitchen sensor", Type: device.Sensor, Available: true, LastSeen: time.Now()},
		},
		states: map[device.DeviceID]*device.DeviceState{
			"sensor-1": {Battery: &lowBattery},
		},
	}
	probe := &fakeProbe{connected: true}
	diskFn := func(string) (float64, error) { return 0.5, nil }
	heapFn := func() uint64 { return 10 * 1024 * 1024 }
	lastActive := map[string]struct{}{}

	evaluateAndApply(ctx, svc, reader, probe, ".", diskFn, heapFn, lastActive)

	list, err := svc.ListActive(ctx)
	if err != nil {
		t.Fatalf("list: %v", err)
	}
	var found *Alarm
	for i := range list {
		if list[i].ID == "system.battery_low.sensor-1" {
			found = &list[i]
		}
	}
	if found == nil {
		t.Fatalf("expected battery alarm for sensor-1, got %+v", list)
	}
	if found.Severity != store.AlarmSeverityLow {
		t.Fatalf("expected low severity, got %s", found.Severity)
	}
}
