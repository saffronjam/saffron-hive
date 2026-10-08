package automation

import (
	"context"
	"testing"
	"time"

	"github.com/saffronjam/saffron-hive/internal/device"
	"github.com/saffronjam/saffron-hive/internal/eventbus"
	"github.com/saffronjam/saffron-hive/internal/store"
)

type functionFixture struct {
	reader  *mockStateReader
	store   *mockStore
	scenes  *mockSceneRunner
	changes *changeTracker
	now     time.Time
}

func newFunctionFixture() *functionFixture {
	f := &functionFixture{
		reader: newMockStateReader(),
		store:  newMockStore(),
		scenes: &mockSceneRunner{active: map[string]bool{}},
		now:    time.Date(2026, 10, 8, 23, 15, 0, 0, time.UTC),
	}
	f.changes = newChangeTracker(f.now.Add(-time.Hour))
	f.reader.addDevice(device.Device{ID: "lamp-1", FriendlyName: "Lamp one"})
	f.reader.addDevice(device.Device{ID: "lamp-2", FriendlyName: "Lamp two"})
	f.reader.addDevice(device.Device{ID: "sensor", FriendlyName: "Thermometer"})
	f.reader.setDeviceState("lamp-1", &device.DeviceState{On: device.Ptr(true), Temperature: device.Ptr(20.0)})
	f.reader.setDeviceState("lamp-2", &device.DeviceState{On: device.Ptr(false), Temperature: device.Ptr(24.0)})
	f.reader.setDeviceState("sensor", &device.DeviceState{Temperature: device.Ptr(19.0)})
	f.store.setRoomName("bedroom", "Bedroom")
	f.store.setRoomDevices("bedroom", []device.DeviceID{"lamp-1", "lamp-2"})
	f.store.setGroupName("all", "Everything")
	f.store.setGroupMembers("all", []store.GroupMember{
		{MemberType: device.GroupMemberDevice, MemberID: "lamp-1"},
		{MemberType: device.GroupMemberDevice, MemberID: "lamp-2"},
		{MemberType: device.GroupMemberDevice, MemberID: "sensor"},
	})
	f.store.setScene("cozy", store.Scene{Name: "Cozy"})
	return f
}

func (f *functionFixture) eval(t *testing.T, expression string) bool {
	t.Helper()
	program, err := compileExpr(expression)
	if err != nil {
		t.Fatalf("compile %q: %v", expression, err)
	}
	scope := exprScope{
		ctx:      context.Background(),
		reader:   f.reader,
		resolver: f.store,
		names:    f.store,
		scenes:   f.scenes,
		changes:  f.changes,
	}
	result, err := evalExpr(program, scope.env(&eventbus.Event{}, f.now))
	if err != nil {
		t.Fatalf("eval %q: %v", expression, err)
	}
	return result
}

func TestExprFunctions(t *testing.T) {
	f := newFunctionFixture()
	f.scenes.active["cozy"] = true
	f.changes.observe("lamp-1", &device.DeviceState{On: device.Ptr(false)}, f.now.Add(-50*time.Minute))
	f.changes.observe("lamp-1", &device.DeviceState{On: device.Ptr(true)}, f.now.Add(-10*time.Minute))

	cases := []struct {
		expression string
		want       bool
	}{
		{`time.between("22:00", "06:00")`, true},
		{`time.between("06:00", "22:00")`, false},
		{`time.between("23:15", "23:16")`, true},
		{`time.after("23:00") && time.before("23:30")`, true},
		{`time.between("bad", "06:00")`, false},
		{`day.in("thu")`, true},
		{`day.in("Monday", "fri")`, false},
		{`room("bedroom").on`, true},
		{`room("Bedroom").on`, true},
		{`group("Everything").on`, true},
		{`device("lamp-2").on == false`, true},
		{`device("Lamp two").on == false`, true},
		{`any_of({"room": "bedroom"}, "on", true)`, true},
		{`all_of({"room": "bedroom"}, "on", true)`, false},
		{`count_of({"group": "all"}, "on", false) == 1`, true},
		{`avg_of({"room": "Bedroom"}, "temperature") == 22`, true},
		{`min_of({"group": "all"}, "temperature") == 19`, true},
		{`max_of("Everything", "temperature") == 24`, true},
		{`avg_of({"room": "missing"}, "temperature") > 0`, false},
		{`avg_of({"room": "missing"}, "temperature") <= 0`, false},
		{`any_of({"where": [{"subject": "room", "op": "is", "values": ["bedroom"]}]}, "on", true)`, true},
		{`since({"device": "lamp-1"}, "on") == duration("10m")`, true},
		{`since({"device": "lamp-2"}, "on") == duration("1h")`, true},
		{`since({"room": "bedroom"}, "on") < duration("15m")`, true},
		{`duration("2d") == 172800`, true},
		{`scene_active("cozy")`, true},
		{`scene_active("Cozy")`, true},
		{`scene_active("missing")`, false},
	}
	for _, tc := range cases {
		if got := f.eval(t, tc.expression); got != tc.want {
			t.Errorf("%s = %v, want %v", tc.expression, got, tc.want)
		}
	}
}

func TestChangeTrackerStampsOnlyChangedValues(t *testing.T) {
	started := time.Date(2026, 10, 8, 12, 0, 0, 0, time.UTC)
	tracker := newChangeTracker(started)
	tracker.observe("d", &device.DeviceState{Presence: device.Ptr(true)}, started.Add(time.Minute))
	if got := tracker.lastChange([]device.DeviceID{"d"}, "presence"); !got.Equal(started) {
		t.Fatalf("first observation = %v, want start", got)
	}
	tracker.observe("d", &device.DeviceState{Presence: device.Ptr(true)}, started.Add(2*time.Minute))
	if got := tracker.lastChange([]device.DeviceID{"d"}, "presence"); !got.Equal(started) {
		t.Fatalf("repeated value = %v, want start", got)
	}
	tracker.observe("d", &device.DeviceState{Presence: device.Ptr(false)}, started.Add(3*time.Minute))
	if got := tracker.lastChange([]device.DeviceID{"d"}, "presence"); !got.Equal(started.Add(3 * time.Minute)) {
		t.Fatalf("changed value = %v", got)
	}
}

func TestEngineTimeZoneAppliesToConditions(t *testing.T) {
	reader := newMockStateReader()
	reader.addDevice(device.Device{ID: "light-1", FriendlyName: "light-1"})

	s := newMockStore()
	s.addAutomationGraph(
		store.Automation{ID: "auto-1", Name: "night", Enabled: true},
		[]store.AutomationNode{
			{ID: "t1", AutomationID: "auto-1", Type: "trigger", Config: `{"kind":"event","event_type":"device.state_changed","filter_expr":"true"}`},
			{ID: "c1", AutomationID: "auto-1", Type: "condition", Config: `{"expr":"time.between(\"23:00\", \"23:59\")"}`},
			{ID: "a1", AutomationID: "auto-1", Type: "action", Config: `{"action_type":"set_device_state","target_type":"device","target_id":"light-1","payload":"{\"on\":true}"}`},
		},
		[]store.AutomationEdge{
			{AutomationID: "auto-1", FromNodeID: "t1", ToNodeID: "c1"},
			{AutomationID: "auto-1", FromNodeID: "c1", ToNodeID: "a1"},
		},
	)

	stockholm, err := time.LoadLocation("Europe/Stockholm")
	if err != nil {
		t.Fatal(err)
	}
	engine, bus, cancel := setupEngine(t, reader, s)
	defer cancel()
	ch := bus.Subscribe(eventbus.EventCommandRequested)
	defer bus.Unsubscribe(ch)

	// The engine clock reads 22:30 UTC, which is 23:30 in Stockholm in January.
	bus.Publish(eventbus.Event{Type: eventbus.EventDeviceStateChanged, DeviceID: "x", Timestamp: time.Now()})
	select {
	case <-ch:
		t.Fatal("condition should not hold at 22:30 UTC")
	case <-time.After(150 * time.Millisecond):
	}

	engine.SetLocation(stockholm)
	bus.Publish(eventbus.Event{Type: eventbus.EventDeviceStateChanged, DeviceID: "y", Timestamp: time.Now()})
	select {
	case <-ch:
	case <-time.After(time.Second):
		t.Fatal("condition should hold at 23:30 Stockholm time")
	}
}
