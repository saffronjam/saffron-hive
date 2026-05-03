package automation

import (
	"context"
	"testing"
	"time"

	"github.com/saffronjam/saffron-hive/internal/device"
	"github.com/saffronjam/saffron-hive/internal/eventbus"
	"github.com/saffronjam/saffron-hive/internal/store"
)

// fixtureCycleScenes registers three single-action scenes named A, B, C, each
// producing an on=true command for a distinct device. Returns the scene IDs.
func fixtureCycleScenes(s *mockStore, reader *mockStateReader) []string {
	devices := []string{"dev-a", "dev-b", "dev-c"}
	for _, id := range devices {
		reader.addDevice(device.Device{
			ID:   device.DeviceID(id),
			Name: id,
			Capabilities: []device.Capability{
				{Name: device.CapOnOff, Type: "binary", Access: 3},
			},
		})
		reader.setDeviceState(device.DeviceID(id), &device.DeviceState{On: device.Ptr(false)})
	}
	sceneIDs := []string{"scene-a", "scene-b", "scene-c"}
	for i, sid := range sceneIDs {
		s.setScene(sid, store.Scene{ID: sid, Name: sid})
		s.setSceneActions(sid, []store.SceneAction{
			{TargetType: string(device.TargetDevice), TargetID: devices[i]},
		})
	}
	return sceneIDs
}

func TestCycleScenes_AdvancesAndWraps(t *testing.T) {
	bus := eventbus.NewChannelBus()
	reader := newMockStateReader()
	s := newMockStore()
	scenes := fixtureCycleScenes(s, reader)

	ch := bus.Subscribe(eventbus.EventCommandRequested)
	defer bus.Unsubscribe(ch)

	executor := NewActionExecutor(bus, reader, s, s, nil, nil)
	executor.SetBaseContext(context.Background())

	cfg := ActionConfig{
		AutomationID: "auto-1",
		NodeID:       "n1",
		ActionType:   ActionCycleScenes,
		Payload:      `{"scenes":["scene-a","scene-b","scene-c"]}`,
	}

	got := make([]device.DeviceID, 0, 4)
	for i := 0; i < 4; i++ {
		executor.ExecuteGraphAction(cfg)
		select {
		case evt := <-ch:
			cmd := evt.Payload.(device.Command)
			got = append(got, cmd.DeviceID)
		case <-time.After(time.Second):
			t.Fatalf("iter %d: expected command", i)
		}
	}

	want := []device.DeviceID{
		device.DeviceID("dev-a"),
		device.DeviceID("dev-b"),
		device.DeviceID("dev-c"),
		device.DeviceID("dev-a"),
	}
	for i, w := range want {
		if got[i] != w {
			t.Fatalf("iter %d: expected %s, got %s (full sequence: %v)", i, w, got[i], got)
		}
	}
	_ = scenes
}

func TestCycleScenes_FilterDeletedScene(t *testing.T) {
	bus := eventbus.NewChannelBus()
	reader := newMockStateReader()
	s := newMockStore()
	fixtureCycleScenes(s, reader)
	delete(s.scenes, "scene-b")

	ch := bus.Subscribe(eventbus.EventCommandRequested)
	defer bus.Unsubscribe(ch)

	executor := NewActionExecutor(bus, reader, s, s, nil, nil)
	executor.SetBaseContext(context.Background())

	cfg := ActionConfig{
		AutomationID: "auto-1",
		NodeID:       "n1",
		ActionType:   ActionCycleScenes,
		Payload:      `{"scenes":["scene-a","scene-b","scene-c"]}`,
	}

	got := make([]device.DeviceID, 0, 4)
	for i := 0; i < 4; i++ {
		executor.ExecuteGraphAction(cfg)
		select {
		case evt := <-ch:
			cmd := evt.Payload.(device.Command)
			got = append(got, cmd.DeviceID)
		case <-time.After(time.Second):
			t.Fatalf("iter %d: expected command", i)
		}
	}

	// scene-b is filtered; cycle alternates A → C → A → C.
	want := []device.DeviceID{"dev-a", "dev-c", "dev-a", "dev-c"}
	for i, w := range want {
		if got[i] != w {
			t.Fatalf("iter %d: expected %s, got %s (full sequence: %v)", i, w, got[i], got)
		}
	}
}

func TestCycleScenes_AllDeleted_NoOp(t *testing.T) {
	bus := eventbus.NewChannelBus()
	reader := newMockStateReader()
	s := newMockStore()
	fixtureCycleScenes(s, reader)
	delete(s.scenes, "scene-a")
	delete(s.scenes, "scene-b")
	delete(s.scenes, "scene-c")

	ch := bus.Subscribe(eventbus.EventCommandRequested)
	defer bus.Unsubscribe(ch)

	executor := NewActionExecutor(bus, reader, s, s, nil, nil)
	executor.SetBaseContext(context.Background())

	executor.ExecuteGraphAction(ActionConfig{
		AutomationID: "auto-1",
		NodeID:       "n1",
		ActionType:   ActionCycleScenes,
		Payload:      `{"scenes":["scene-a","scene-b","scene-c"]}`,
	})

	select {
	case <-ch:
		t.Fatal("expected no command when all scenes are deleted")
	case <-time.After(100 * time.Millisecond):
	}
}

func TestCycleScenes_PersistsAcrossExecutions(t *testing.T) {
	bus := eventbus.NewChannelBus()
	reader := newMockStateReader()
	s := newMockStore()
	fixtureCycleScenes(s, reader)

	ch := bus.Subscribe(eventbus.EventCommandRequested)
	defer bus.Unsubscribe(ch)

	executor := NewActionExecutor(bus, reader, s, s, nil, nil)
	executor.SetBaseContext(context.Background())

	cfg := ActionConfig{
		AutomationID: "auto-1",
		NodeID:       "n1",
		ActionType:   ActionCycleScenes,
		Payload:      `{"scenes":["scene-a","scene-b"]}`,
	}

	executor.ExecuteGraphAction(cfg)
	<-ch

	v, ok, _ := s.GetAutomationNodeState(context.Background(), "auto-1", "n1", cycleIndexStateKey)
	if !ok || v != "1" {
		t.Fatalf("expected cycle_index=1 after first fire, got %q (ok=%v)", v, ok)
	}

	executor.ExecuteGraphAction(cfg)
	<-ch

	v, ok, _ = s.GetAutomationNodeState(context.Background(), "auto-1", "n1", cycleIndexStateKey)
	if !ok || v != "0" {
		t.Fatalf("expected cycle_index=0 after wrap, got %q", v)
	}
}
