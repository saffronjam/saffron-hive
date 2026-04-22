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

// healthyChecks returns stubs that represent a perfectly healthy system: no
// disk, memory, MQTT, or device issues. Tests that want to exercise a single
// failure override exactly one of the returned callables.
func healthyChecks() (diskFn func(string) (float64, error), heapFn func() uint64) {
	return func(string) (float64, error) { return 0.5, nil }, func() uint64 { return 10 * 1024 * 1024 }
}

func TestEvaluateAndApplyRaisesAndClears(t *testing.T) {
	ctx := context.Background()
	s := newTestStore(t)
	svc := NewService(s, NewBuffer())

	reader := &fakeReader{}
	probe := &fakeProbe{connected: false} // mqtt down → should raise
	diskFn, heapFn := healthyChecks()

	evaluateAndApply(ctx, svc, reader, probe, ".", diskFn, heapFn)

	list, err := svc.ListActive(ctx)
	if err != nil {
		t.Fatalf("list: %v", err)
	}
	var sawMQTT bool
	for _, a := range list {
		if a.ID == "system.mqtt_disconnected" {
			sawMQTT = true
			if a.Source != MonitorSource {
				t.Fatalf("expected source %q, got %q", MonitorSource, a.Source)
			}
		}
	}
	if !sawMQTT {
		t.Fatalf("expected system.mqtt_disconnected to be raised, got %+v", list)
	}

	probe.connected = true
	evaluateAndApply(ctx, svc, reader, probe, ".", diskFn, heapFn)

	list, err = svc.ListActive(ctx)
	if err != nil {
		t.Fatalf("list after recover: %v", err)
	}
	for _, a := range list {
		if a.ID == "system.mqtt_disconnected" {
			t.Fatalf("mqtt alarm still active after recovery: %+v", a)
		}
	}
}

// TestMonitorNeverBumpsCounter locks in the invariant at the heart of this
// bug fix: a monitor tick must raise an alarm at most once, no matter how
// many ticks observe the same sustained condition. The Count field is
// reserved for non-loop callers (API / automation actions) that legitimately
// need to record repeat occurrences.
func TestMonitorNeverBumpsCounter(t *testing.T) {
	ctx := context.Background()
	s := newTestStore(t)
	svc := NewService(s, NewBuffer())

	reader := &fakeReader{}
	probe := &fakeProbe{connected: false}
	diskFn, heapFn := healthyChecks()

	const ticks = 25
	for i := 0; i < ticks; i++ {
		evaluateAndApply(ctx, svc, reader, probe, ".", diskFn, heapFn)
	}

	list, err := svc.ListActive(ctx)
	if err != nil {
		t.Fatalf("list: %v", err)
	}
	var found *Alarm
	for i := range list {
		if list[i].ID == "system.mqtt_disconnected" {
			found = &list[i]
		}
	}
	if found == nil {
		t.Fatalf("expected mqtt alarm to be present after %d ticks, got %+v", ticks, list)
	}
	if found.Count != 1 {
		t.Fatalf("expected Count=1 after %d ticks with same condition, got %d", ticks, found.Count)
	}
}

// TestMonitorDoesNotTouchOneShotAlarms is the explicit regression test for
// the original bug report: an automation raised a one-shot alarm ("Test
// alarm!") and the monitor tick wiped it out. After the fix, the monitor
// filters its view to alarms it owns (Source == MonitorSource) so foreign
// alarms are invisible to it.
func TestMonitorDoesNotTouchOneShotAlarms(t *testing.T) {
	ctx := context.Background()
	s := newTestStore(t)
	svc := NewService(s, NewBuffer())

	if _, err := svc.Raise(ctx, RaiseParams{
		AlarmID:  "test5999",
		Severity: store.AlarmSeverityLow,
		Kind:     store.AlarmKindOneShot,
		Message:  "Test alarm!",
		Source:   "automation.658a8fad-285d-4ebb-bd46-78459ac5fb8f",
	}); err != nil {
		t.Fatalf("seed one-shot: %v", err)
	}

	reader := &fakeReader{}
	probe := &fakeProbe{connected: true} // healthy everything
	diskFn, heapFn := healthyChecks()

	for i := 0; i < 5; i++ {
		evaluateAndApply(ctx, svc, reader, probe, ".", diskFn, heapFn)
	}

	list, err := svc.ListActive(ctx)
	if err != nil {
		t.Fatalf("list: %v", err)
	}
	var found *Alarm
	for i := range list {
		if list[i].ID == "test5999" {
			found = &list[i]
		}
	}
	if found == nil {
		t.Fatalf("one-shot alarm was cleared by the monitor; remaining: %+v", list)
	}
	if found.Count != 1 {
		t.Fatalf("one-shot Count should be 1 (untouched), got %d", found.Count)
	}
	if found.Kind != store.AlarmKindOneShot {
		t.Fatalf("expected kind OneShot, got %s", found.Kind)
	}
}

// TestMonitorDoesNotTouchAPIAlarms covers alarms raised through the GraphQL
// mutation path (source="api" by default). They must survive monitor ticks
// just like one-shots do.
func TestMonitorDoesNotTouchAPIAlarms(t *testing.T) {
	ctx := context.Background()
	s := newTestStore(t)
	svc := NewService(s, NewBuffer())

	if _, err := svc.Raise(ctx, RaiseParams{
		AlarmID:  "user.custom",
		Severity: store.AlarmSeverityMedium,
		Kind:     store.AlarmKindAuto,
		Message:  "Raised via GraphQL",
		// Source left empty — Raise() defaults to "api".
	}); err != nil {
		t.Fatalf("seed api alarm: %v", err)
	}

	reader := &fakeReader{}
	probe := &fakeProbe{connected: true}
	diskFn, heapFn := healthyChecks()

	for i := 0; i < 5; i++ {
		evaluateAndApply(ctx, svc, reader, probe, ".", diskFn, heapFn)
	}

	list, err := svc.ListActive(ctx)
	if err != nil {
		t.Fatalf("list: %v", err)
	}
	var found *Alarm
	for i := range list {
		if list[i].ID == "user.custom" {
			found = &list[i]
		}
	}
	if found == nil {
		t.Fatalf("api alarm was cleared by the monitor; remaining: %+v", list)
	}
	if found.Source != "api" {
		t.Fatalf("expected source api, got %q", found.Source)
	}
	if found.Count != 1 {
		t.Fatalf("api Count should be 1 (untouched), got %d", found.Count)
	}
}

// TestMonitorClearsOnlyOwnedAlarms pairs a foreign alarm with a real
// monitor-raised alarm whose condition resolves, and confirms the monitor
// clears only its own while leaving the foreign one in place.
func TestMonitorClearsOnlyOwnedAlarms(t *testing.T) {
	ctx := context.Background()
	s := newTestStore(t)
	svc := NewService(s, NewBuffer())

	if _, err := svc.Raise(ctx, RaiseParams{
		AlarmID:  "automation.tripped",
		Severity: store.AlarmSeverityHigh,
		Kind:     store.AlarmKindOneShot,
		Message:  "User rule fired",
		Source:   "automation.abc",
	}); err != nil {
		t.Fatalf("seed foreign: %v", err)
	}

	reader := &fakeReader{}
	probe := &fakeProbe{connected: false} // raise mqtt alarm
	diskFn, heapFn := healthyChecks()

	evaluateAndApply(ctx, svc, reader, probe, ".", diskFn, heapFn)

	probe.connected = true // condition resolves — monitor should clear its own
	evaluateAndApply(ctx, svc, reader, probe, ".", diskFn, heapFn)

	list, err := svc.ListActive(ctx)
	if err != nil {
		t.Fatalf("list: %v", err)
	}
	var sawForeign, sawMonitor bool
	for _, a := range list {
		if a.ID == "automation.tripped" {
			sawForeign = true
		}
		if a.ID == "system.mqtt_disconnected" {
			sawMonitor = true
		}
	}
	if !sawForeign {
		t.Fatalf("foreign alarm was cleared by monitor; remaining: %+v", list)
	}
	if sawMonitor {
		t.Fatalf("monitor-owned mqtt alarm should have cleared; remaining: %+v", list)
	}
}

// TestMonitorReRaisesAfterUserDelete exercises the full RunMonitor loop to
// confirm that when a user deletes a monitor-owned alarm whose underlying
// condition is still active, the next tick re-raises it. The DB is the
// single source of truth, so the monitor must not rely on in-memory state
// that would let a stale "I already raised this" belief skip the re-raise.
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

	if _, err := svc.DeleteByAlarmID(ctx, "system.mqtt_disconnected"); err != nil {
		t.Fatalf("delete: %v", err)
	}

	deadline = time.Now().Add(500 * time.Millisecond)
	for time.Now().Before(deadline) {
		list, _ := svc.ListActive(ctx)
		if len(list) == 1 && list[0].ID == "system.mqtt_disconnected" {
			return
		}
		time.Sleep(5 * time.Millisecond)
	}
	list, _ = svc.ListActive(ctx)
	t.Fatalf("expected re-raise after user delete, got %d alarms: %+v", len(list), list)
}

// TestMonitorLoopPreservesOneShotAcrossManyTicks reproduces the original bug
// scenario end-to-end via RunMonitor: a one-shot alarm raised once survives
// dozens of monitor ticks while other, monitor-owned conditions are being
// evaluated. This is the headline regression guard.
func TestMonitorLoopPreservesOneShotAcrossManyTicks(t *testing.T) {
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	s := newTestStore(t)
	svc := NewService(s, NewBuffer())

	if _, err := svc.Raise(ctx, RaiseParams{
		AlarmID:  "test5999",
		Severity: store.AlarmSeverityLow,
		Kind:     store.AlarmKindOneShot,
		Message:  "Test alarm!",
		Source:   "automation.658a8fad-285d-4ebb-bd46-78459ac5fb8f",
	}); err != nil {
		t.Fatalf("seed one-shot: %v", err)
	}

	probe := &fakeProbe{connected: false} // keep monitor busy raising+holding mqtt alarm
	cfg := MonitorConfig{
		TickInterval:  5 * time.Millisecond,
		StartupSettle: 1 * time.Millisecond,
		DiskStatPath:  ".",
		DiskStatFn:    func(string) (float64, error) { return 0.9, nil },
		HeapFn:        func() uint64 { return 1 * 1024 * 1024 },
	}
	go runMonitor(ctx, svc, &fakeReader{}, probe, cfg)

	// Let many ticks elapse.
	time.Sleep(150 * time.Millisecond)

	list, err := svc.ListActive(ctx)
	if err != nil {
		t.Fatalf("list: %v", err)
	}
	var foundOneShot *Alarm
	for i := range list {
		if list[i].ID == "test5999" {
			foundOneShot = &list[i]
		}
	}
	if foundOneShot == nil {
		t.Fatalf("one-shot alarm wiped by monitor loop; remaining: %+v", list)
	}
	if foundOneShot.Count != 1 {
		t.Fatalf("one-shot Count should be 1 (never touched), got %d", foundOneShot.Count)
	}
}

// TestDeviceUnavailableRequiresBothSignals pins the AND semantics of the
// device staleness check. Each combination of (Available, LastSeen) must
// yield the expected alarm state — in particular, an idle-but-acknowledged
// device (Available=true, stale LastSeen) must NOT alarm.
func TestDeviceUnavailableRequiresBothSignals(t *testing.T) {
	now := time.Now()
	fresh := now.Add(-time.Minute)
	old := now.Add(-2 * DeviceStaleAfter)

	cases := []struct {
		name      string
		available bool
		lastSeen  time.Time
		wantAlarm bool
	}{
		{"available+fresh", true, fresh, false},
		{"available+stale", true, old, false},        // idle ceiling light scenario
		{"available+zero", true, time.Time{}, false}, // newly registered, z2m confirms
		{"unavailable+fresh", false, fresh, false},   // brief ping miss but data still flowing
		{"unavailable+stale", false, old, true},
		{"unavailable+zero", false, time.Time{}, true}, // never reported, z2m unreachable
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			ctx := context.Background()
			s := newTestStore(t)
			svc := NewService(s, NewBuffer())

			reader := &fakeReader{
				devices: []device.Device{
					{ID: "d1", Name: "Gaming room ceiling", Type: device.Light, Available: tc.available, LastSeen: tc.lastSeen},
				},
			}
			probe := &fakeProbe{connected: true}
			diskFn, heapFn := healthyChecks()

			evaluateAndApply(ctx, svc, reader, probe, ".", diskFn, heapFn)

			list, err := svc.ListActive(ctx)
			if err != nil {
				t.Fatalf("list: %v", err)
			}
			var gotAlarm bool
			for _, a := range list {
				if a.ID == "system.device_unavailable.d1" {
					gotAlarm = true
				}
			}
			if gotAlarm != tc.wantAlarm {
				t.Fatalf("available=%v lastSeen=%v: expected alarm=%v, got %v (alarms=%+v)",
					tc.available, tc.lastSeen, tc.wantAlarm, gotAlarm, list)
			}
		})
	}
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
	diskFn, heapFn := healthyChecks()

	evaluateAndApply(ctx, svc, reader, probe, ".", diskFn, heapFn)

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
