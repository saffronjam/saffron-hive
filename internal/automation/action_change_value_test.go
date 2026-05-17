package automation

import (
	"context"
	"testing"
	"time"

	"github.com/saffronjam/saffron-hive/internal/device"
	"github.com/saffronjam/saffron-hive/internal/eventbus"
	"github.com/saffronjam/saffron-hive/internal/store"
)

func brightnessCap(min, max float64) device.Capability {
	mn, mx := min, max
	return device.Capability{
		Name:     device.CapBrightness,
		Type:     "numeric",
		Access:   7,
		ValueMin: &mn,
		ValueMax: &mx,
	}
}

func dimmableLight(id string, capMin, capMax float64) device.Device {
	return device.Device{
		ID:   device.DeviceID(id),
		Name: id,
		Capabilities: []device.Capability{
			{Name: device.CapOnOff, Type: "binary", Access: 7},
			brightnessCap(capMin, capMax),
		},
	}
}

func TestChangeValue_AbsoluteDelta_InRange(t *testing.T) {
	bus := eventbus.NewChannelBus()
	reader := newMockStateReader()
	s := newMockStore()

	reader.addDevice(dimmableLight("light-1", 0, 254))
	reader.setDeviceState("light-1", &device.DeviceState{Brightness: device.Ptr(100)})

	ch := bus.Subscribe(eventbus.EventCommandRequested)
	defer bus.Unsubscribe(ch)

	executor := NewActionExecutor(bus, reader, s, s, nil, nil)
	executor.ExecuteGraphAction(ActionConfig{
		ActionType: ActionChangeValue,
		TargetType: TargetDevice,
		TargetID:   "light-1",
		Payload:    `{"field":"brightness","delta":25,"mode":"absolute"}`,
	})

	select {
	case evt := <-ch:
		cmd := evt.Payload.(device.Command)
		if cmd.Brightness == nil || *cmd.Brightness != 125 {
			t.Fatalf("expected brightness=125, got %+v", cmd.Brightness)
		}
	case <-time.After(time.Second):
		t.Fatal("expected change_value command to be published")
	}
}

func TestChangeValue_PercentDelta_InRange(t *testing.T) {
	bus := eventbus.NewChannelBus()
	reader := newMockStateReader()
	s := newMockStore()

	reader.addDevice(dimmableLight("light-1", 0, 254))
	reader.setDeviceState("light-1", &device.DeviceState{Brightness: device.Ptr(100)})

	ch := bus.Subscribe(eventbus.EventCommandRequested)
	defer bus.Unsubscribe(ch)

	executor := NewActionExecutor(bus, reader, s, s, nil, nil)
	executor.ExecuteGraphAction(ActionConfig{
		ActionType: ActionChangeValue,
		TargetType: TargetDevice,
		TargetID:   "light-1",
		Payload:    `{"field":"brightness","delta":10,"mode":"percent"}`,
	})

	// 10% of (254-0) = 25.4; 100 + 25.4 = 125.4; buildCommand stores as int → 125.
	select {
	case evt := <-ch:
		cmd := evt.Payload.(device.Command)
		if cmd.Brightness == nil || *cmd.Brightness != 125 {
			t.Fatalf("expected brightness=125 (10%% of 254 added to 100), got %+v", cmd.Brightness)
		}
	case <-time.After(time.Second):
		t.Fatal("expected change_value command to be published")
	}
}

func TestChangeValue_ClampsAtMax(t *testing.T) {
	bus := eventbus.NewChannelBus()
	reader := newMockStateReader()
	s := newMockStore()

	reader.addDevice(dimmableLight("light-1", 0, 254))
	reader.setDeviceState("light-1", &device.DeviceState{Brightness: device.Ptr(250)})

	ch := bus.Subscribe(eventbus.EventCommandRequested)
	defer bus.Unsubscribe(ch)

	executor := NewActionExecutor(bus, reader, s, s, nil, nil)
	executor.ExecuteGraphAction(ActionConfig{
		ActionType: ActionChangeValue,
		TargetType: TargetDevice,
		TargetID:   "light-1",
		Payload:    `{"field":"brightness","delta":100,"mode":"absolute"}`,
	})

	select {
	case evt := <-ch:
		cmd := evt.Payload.(device.Command)
		if cmd.Brightness == nil || *cmd.Brightness != 254 {
			t.Fatalf("expected clamp to max=254, got %+v", cmd.Brightness)
		}
	case <-time.After(time.Second):
		t.Fatal("expected change_value command to be published")
	}
}

func TestChangeValue_ClampsAtMin(t *testing.T) {
	bus := eventbus.NewChannelBus()
	reader := newMockStateReader()
	s := newMockStore()

	reader.addDevice(dimmableLight("light-1", 0, 254))
	reader.setDeviceState("light-1", &device.DeviceState{Brightness: device.Ptr(10)})

	ch := bus.Subscribe(eventbus.EventCommandRequested)
	defer bus.Unsubscribe(ch)

	executor := NewActionExecutor(bus, reader, s, s, nil, nil)
	executor.ExecuteGraphAction(ActionConfig{
		ActionType: ActionChangeValue,
		TargetType: TargetDevice,
		TargetID:   "light-1",
		Payload:    `{"field":"brightness","delta":-50,"mode":"absolute"}`,
	})

	// 10 - 50 = -40 → clamped to 0. Note: zigbee adapter later turns
	// brightness=0 into state=OFF, but the automation executor's contract
	// is just "emit the clamped target value".
	select {
	case evt := <-ch:
		cmd := evt.Payload.(device.Command)
		if cmd.Brightness == nil || *cmd.Brightness != 0 {
			t.Fatalf("expected clamp to min=0, got %+v", cmd.Brightness)
		}
	case <-time.After(time.Second):
		t.Fatal("expected change_value command to be published")
	}
}

func TestChangeValue_UnknownState_NoCommand(t *testing.T) {
	bus := eventbus.NewChannelBus()
	reader := newMockStateReader()
	s := newMockStore()

	reader.addDevice(dimmableLight("light-1", 0, 254))
	// no setDeviceState — current value is unknown

	ch := bus.Subscribe(eventbus.EventCommandRequested)
	defer bus.Unsubscribe(ch)

	executor := NewActionExecutor(bus, reader, s, s, nil, nil)
	executor.ExecuteGraphAction(ActionConfig{
		ActionType: ActionChangeValue,
		TargetType: TargetDevice,
		TargetID:   "light-1",
		Payload:    `{"field":"brightness","delta":25,"mode":"absolute"}`,
	})

	select {
	case <-ch:
		t.Fatal("expected no command when current state is unknown")
	case <-time.After(100 * time.Millisecond):
	}
}

func TestChangeValue_StateAlreadyMatches_Skips(t *testing.T) {
	bus := eventbus.NewChannelBus()
	reader := newMockStateReader()
	s := newMockStore()

	reader.addDevice(dimmableLight("light-1", 0, 254))
	reader.setDeviceState("light-1", &device.DeviceState{Brightness: device.Ptr(254)})

	ch := bus.Subscribe(eventbus.EventCommandRequested)
	defer bus.Unsubscribe(ch)

	executor := NewActionExecutor(bus, reader, s, s, nil, nil)
	executor.ExecuteGraphAction(ActionConfig{
		ActionType: ActionChangeValue,
		TargetType: TargetDevice,
		TargetID:   "light-1",
		Payload:    `{"field":"brightness","delta":50,"mode":"absolute"}`,
	})

	// 254 + 50 → clamped to 254, which matches current state → skipped.
	select {
	case <-ch:
		t.Fatal("expected no command when clamped value matches current state")
	case <-time.After(100 * time.Millisecond):
	}
	if executor.stateMatchSkips.Load() != 1 {
		t.Fatalf("expected stateMatchSkips=1, got %d", executor.stateMatchSkips.Load())
	}
}

func TestChangeValue_FieldNotOnDevice_NoCommand(t *testing.T) {
	bus := eventbus.NewChannelBus()
	reader := newMockStateReader()
	s := newMockStore()

	// Plug: on/off only, no brightness cap.
	reader.addDevice(device.Device{
		ID:   "plug-1",
		Name: "plug-1",
		Capabilities: []device.Capability{
			{Name: device.CapOnOff, Type: "binary", Access: 7},
		},
	})
	reader.setDeviceState("plug-1", &device.DeviceState{On: device.Ptr(true)})

	ch := bus.Subscribe(eventbus.EventCommandRequested)
	defer bus.Unsubscribe(ch)

	executor := NewActionExecutor(bus, reader, s, s, nil, nil)
	executor.ExecuteGraphAction(ActionConfig{
		ActionType: ActionChangeValue,
		TargetType: TargetDevice,
		TargetID:   "plug-1",
		Payload:    `{"field":"brightness","delta":25,"mode":"absolute"}`,
	})

	select {
	case <-ch:
		t.Fatal("expected no command when device does not expose the field")
	case <-time.After(100 * time.Millisecond):
	}
}

func TestChangeValue_ZeroDelta_NoCommand(t *testing.T) {
	bus := eventbus.NewChannelBus()
	reader := newMockStateReader()
	s := newMockStore()

	reader.addDevice(dimmableLight("light-1", 0, 254))
	reader.setDeviceState("light-1", &device.DeviceState{Brightness: device.Ptr(100)})

	ch := bus.Subscribe(eventbus.EventCommandRequested)
	defer bus.Unsubscribe(ch)

	executor := NewActionExecutor(bus, reader, s, s, nil, nil)
	executor.ExecuteGraphAction(ActionConfig{
		ActionType: ActionChangeValue,
		TargetType: TargetDevice,
		TargetID:   "light-1",
		Payload:    `{"field":"brightness","delta":0,"mode":"absolute"}`,
	})

	select {
	case <-ch:
		t.Fatal("expected no command on zero-delta")
	case <-time.After(100 * time.Millisecond):
	}
}

func TestChangeValue_GroupFanOut_PerDeviceCurrentValue(t *testing.T) {
	reader := newMockStateReader()
	reader.addDevice(dimmableLight("light-1", 0, 254))
	reader.addDevice(dimmableLight("light-2", 0, 254))
	reader.addDevice(device.Device{
		ID:   "plug-1",
		Name: "plug-1",
		Capabilities: []device.Capability{
			{Name: device.CapOnOff, Type: "binary", Access: 7},
		},
	})
	reader.setDeviceState("light-1", &device.DeviceState{Brightness: device.Ptr(50)})
	reader.setDeviceState("light-2", &device.DeviceState{Brightness: device.Ptr(200)})
	reader.setDeviceState("plug-1", &device.DeviceState{On: device.Ptr(true)})

	s := newMockStore()
	s.setGroupMembers("group-1", []store.GroupMember{
		{MemberType: device.GroupMemberDevice, MemberID: "light-1"},
		{MemberType: device.GroupMemberDevice, MemberID: "light-2"},
		{MemberType: device.GroupMemberDevice, MemberID: "plug-1"},
	})
	s.addAutomationGraph(
		store.Automation{ID: "auto-1", Name: "bump-group", Enabled: true},
		[]store.AutomationNode{
			{ID: "t1", AutomationID: "auto-1", Type: "trigger", Config: `{"kind":"manual"}`},
			{ID: "a1", AutomationID: "auto-1", Type: "action", Config: `{"action_type":"change_value","target_type":"group","target_id":"group-1","payload":"{\"field\":\"brightness\",\"delta\":25,\"mode\":\"absolute\"}"}`},
		},
		[]store.AutomationEdge{
			{AutomationID: "auto-1", FromNodeID: "t1", ToNodeID: "a1"},
		},
	)

	engine, bus, cancel := setupEngine(t, reader, s)
	defer cancel()

	ch := bus.Subscribe(eventbus.EventCommandRequested)
	defer bus.Unsubscribe(ch)

	if err := engine.FireManualTrigger(context.Background(), "auto-1", "t1"); err != nil {
		t.Fatalf("FireManualTrigger: %v", err)
	}

	// Expect 2 commands (light-1: 75, light-2: 225). plug-1 has no
	// brightness capability so the executor drops it.
	got := collectCommands(t, ch, 3, 500*time.Millisecond)
	if len(got) != 2 {
		t.Fatalf("expected 2 commands (lights only), got %d: %+v", len(got), got)
	}
	byID := map[device.DeviceID]int{}
	for _, c := range got {
		if c.Brightness == nil {
			t.Fatalf("command for %s missing brightness", c.DeviceID)
		}
		byID[c.DeviceID] = *c.Brightness
	}
	if byID["light-1"] != 75 {
		t.Fatalf("expected light-1 brightness=75, got %d", byID["light-1"])
	}
	if byID["light-2"] != 225 {
		t.Fatalf("expected light-2 brightness=225, got %d", byID["light-2"])
	}
}
