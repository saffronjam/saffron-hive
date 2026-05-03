package automation

import (
	"context"
	"testing"
	"time"

	"github.com/saffronjam/saffron-hive/internal/device"
	"github.com/saffronjam/saffron-hive/internal/eventbus"
	"github.com/saffronjam/saffron-hive/internal/store"
)

func TestToggleAction_DeviceCurrentlyOn_FlipsOff(t *testing.T) {
	bus := eventbus.NewChannelBus()
	reader := newMockStateReader()
	s := newMockStore()

	reader.addDevice(device.Device{ID: "light-1", Name: "light-1"})
	reader.setDeviceState("light-1", &device.DeviceState{On: device.Ptr(true)})

	ch := bus.Subscribe(eventbus.EventCommandRequested)
	defer bus.Unsubscribe(ch)

	executor := NewActionExecutor(bus, reader, s, s, nil, nil)
	executor.ExecuteGraphAction(ActionConfig{
		ActionType: ActionToggleDeviceState,
		TargetType: TargetDevice,
		TargetID:   "light-1",
	})

	select {
	case evt := <-ch:
		cmd := evt.Payload.(device.Command)
		if cmd.On == nil || *cmd.On != false {
			t.Fatalf("expected on=false, got %+v", cmd.On)
		}
	case <-time.After(time.Second):
		t.Fatal("expected toggle command to be published")
	}
}

func TestToggleAction_DeviceCurrentlyOff_FlipsOn(t *testing.T) {
	bus := eventbus.NewChannelBus()
	reader := newMockStateReader()
	s := newMockStore()

	reader.addDevice(device.Device{ID: "light-1", Name: "light-1"})
	reader.setDeviceState("light-1", &device.DeviceState{On: device.Ptr(false)})

	ch := bus.Subscribe(eventbus.EventCommandRequested)
	defer bus.Unsubscribe(ch)

	executor := NewActionExecutor(bus, reader, s, s, nil, nil)
	executor.ExecuteGraphAction(ActionConfig{
		ActionType: ActionToggleDeviceState,
		TargetType: TargetDevice,
		TargetID:   "light-1",
	})

	select {
	case evt := <-ch:
		cmd := evt.Payload.(device.Command)
		if cmd.On == nil || *cmd.On != true {
			t.Fatalf("expected on=true, got %+v", cmd.On)
		}
	case <-time.After(time.Second):
		t.Fatal("expected toggle command to be published")
	}
}

func TestToggleAction_DeviceUnknownState_DefaultsOn(t *testing.T) {
	bus := eventbus.NewChannelBus()
	reader := newMockStateReader()
	s := newMockStore()

	reader.addDevice(device.Device{ID: "light-1", Name: "light-1"})

	ch := bus.Subscribe(eventbus.EventCommandRequested)
	defer bus.Unsubscribe(ch)

	executor := NewActionExecutor(bus, reader, s, s, nil, nil)
	executor.ExecuteGraphAction(ActionConfig{
		ActionType: ActionToggleDeviceState,
		TargetType: TargetDevice,
		TargetID:   "light-1",
	})

	select {
	case evt := <-ch:
		cmd := evt.Payload.(device.Command)
		if cmd.On == nil || *cmd.On != true {
			t.Fatalf("expected on=true (unknown state default), got %+v", cmd.On)
		}
	case <-time.After(time.Second):
		t.Fatal("expected toggle command to be published")
	}
}

func TestToggleAction_GroupAnyOn_FlipsAllOff(t *testing.T) {
	reader := newMockStateReader()
	reader.addDevice(device.Device{ID: "light-1", Name: "light-1"})
	reader.addDevice(device.Device{ID: "light-2", Name: "light-2"})
	reader.setDeviceState("light-1", &device.DeviceState{On: device.Ptr(true)})
	reader.setDeviceState("light-2", &device.DeviceState{On: device.Ptr(false)})

	s := newMockStore()
	s.setGroupMembers("group-1", []store.GroupMember{
		{MemberType: device.GroupMemberDevice, MemberID: "light-1"},
		{MemberType: device.GroupMemberDevice, MemberID: "light-2"},
	})
	s.addAutomationGraph(
		store.Automation{ID: "auto-1", Name: "toggle-group", Enabled: true},
		[]store.AutomationNode{
			{ID: "t1", AutomationID: "auto-1", Type: "trigger", Config: `{"kind":"manual"}`},
			{ID: "a1", AutomationID: "auto-1", Type: "action", Config: `{"action_type":"toggle_device_state","target_type":"group","target_id":"group-1","payload":""}`},
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

	// Aggregate: any-on → desired all-off. Loop-prevention skips the redundant
	// off-command on light-2 (already off); only light-1 gets a command.
	got := collectCommands(t, ch, 2, 500*time.Millisecond)
	if len(got) != 1 {
		t.Fatalf("expected 1 command (loop-prevention skip on already-off member), got %d", len(got))
	}
	if got[0].DeviceID != "light-1" {
		t.Fatalf("expected command for light-1 (previously on), got %s", got[0].DeviceID)
	}
	if got[0].On == nil || *got[0].On != false {
		t.Fatalf("expected on=false, got %+v", got[0].On)
	}
}

func TestToggleAction_GroupAllOff_FlipsAllOn(t *testing.T) {
	reader := newMockStateReader()
	reader.addDevice(device.Device{ID: "light-1", Name: "light-1"})
	reader.addDevice(device.Device{ID: "light-2", Name: "light-2"})
	reader.setDeviceState("light-1", &device.DeviceState{On: device.Ptr(false)})
	reader.setDeviceState("light-2", &device.DeviceState{On: device.Ptr(false)})

	s := newMockStore()
	s.setGroupMembers("group-1", []store.GroupMember{
		{MemberType: device.GroupMemberDevice, MemberID: "light-1"},
		{MemberType: device.GroupMemberDevice, MemberID: "light-2"},
	})
	s.addAutomationGraph(
		store.Automation{ID: "auto-1", Name: "toggle-group", Enabled: true},
		[]store.AutomationNode{
			{ID: "t1", AutomationID: "auto-1", Type: "trigger", Config: `{"kind":"manual"}`},
			{ID: "a1", AutomationID: "auto-1", Type: "action", Config: `{"action_type":"toggle_device_state","target_type":"group","target_id":"group-1","payload":""}`},
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

	got := collectCommands(t, ch, 2, 500*time.Millisecond)
	if len(got) != 2 {
		t.Fatalf("expected 2 commands, got %d", len(got))
	}
	for _, cmd := range got {
		if cmd.On == nil || *cmd.On != true {
			t.Fatalf("expected on=true for all members (all-off → all-on), got %+v on %s", cmd.On, cmd.DeviceID)
		}
	}
}

func collectCommands(t *testing.T, ch <-chan eventbus.Event, want int, timeout time.Duration) []device.Command {
	t.Helper()
	deadline := time.After(timeout)
	var out []device.Command
	for len(out) < want {
		select {
		case evt := <-ch:
			if cmd, ok := evt.Payload.(device.Command); ok {
				out = append(out, cmd)
			}
		case <-deadline:
			return out
		}
	}
	return out
}
