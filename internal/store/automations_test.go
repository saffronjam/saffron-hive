package store

import (
	"context"
	"testing"

	"github.com/saffronjam/saffron-hive/internal/device"
)

func TestCreateAutomation(t *testing.T) {
	s := newTestStore(t)
	ctx := context.Background()

	a, err := s.CreateAutomation(ctx, CreateAutomationParams{
		ID:              "auto-1",
		Name:            "Night Light",
		Enabled:         true,
		TriggerEvent:    "device.state_changed",
		ConditionExpr:   "temperature < 20",
		CooldownSeconds: 10,
	})
	if err != nil {
		t.Fatalf("create automation: %v", err)
	}

	if a.ID != "auto-1" {
		t.Errorf("got ID %q, want %q", a.ID, "auto-1")
	}
	if a.Name != "Night Light" {
		t.Errorf("got Name %q, want %q", a.Name, "Night Light")
	}
	if !a.Enabled {
		t.Error("expected Enabled to be true")
	}
	if a.TriggerEvent != "device.state_changed" {
		t.Errorf("got TriggerEvent %q, want %q", a.TriggerEvent, "device.state_changed")
	}
	if a.ConditionExpr != "temperature < 20" {
		t.Errorf("got ConditionExpr %q, want %q", a.ConditionExpr, "temperature < 20")
	}
	if a.CooldownSeconds != 10 {
		t.Errorf("got CooldownSeconds %d, want %d", a.CooldownSeconds, 10)
	}
	if a.CreatedAt.IsZero() {
		t.Error("expected CreatedAt to be set")
	}
}

func TestAddAutomationActions(t *testing.T) {
	s := newTestStore(t)
	ctx := context.Background()

	_, err := s.CreateAutomation(ctx, CreateAutomationParams{
		ID: "auto-1", Name: "Test", Enabled: true,
		TriggerEvent: "device.state_changed", ConditionExpr: "true", CooldownSeconds: 5,
	})
	if err != nil {
		t.Fatalf("create automation: %v", err)
	}

	_, err = s.CreateDevice(ctx, CreateDeviceParams{
		ID: "dev-1", Name: "Light", Source: "zigbee", Type: device.Light,
	})
	if err != nil {
		t.Fatalf("create device: %v", err)
	}

	devID := device.DeviceID("dev-1")
	_, err = s.CreateAutomationAction(ctx, CreateAutomationActionParams{
		ID:           "aa-1",
		AutomationID: "auto-1",
		ActionType:   "set_device_state",
		DeviceID:     &devID,
		Payload:      `{"on":true}`,
	})
	if err != nil {
		t.Fatalf("create action: %v", err)
	}

	_, err = s.CreateAutomationAction(ctx, CreateAutomationActionParams{
		ID:           "aa-2",
		AutomationID: "auto-1",
		ActionType:   "activate_scene",
		DeviceID:     nil,
		Payload:      `{"scene_id":"scene-1"}`,
	})
	if err != nil {
		t.Fatalf("create action: %v", err)
	}

	actions, err := s.ListAutomationActions(ctx, "auto-1")
	if err != nil {
		t.Fatalf("list actions: %v", err)
	}
	if len(actions) != 2 {
		t.Fatalf("got %d actions, want 2", len(actions))
	}

	if actions[0].DeviceID == nil {
		t.Error("expected first action to have DeviceID")
	} else if *actions[0].DeviceID != "dev-1" {
		t.Errorf("got DeviceID %q, want %q", *actions[0].DeviceID, "dev-1")
	}

	if actions[1].DeviceID != nil {
		t.Error("expected second action to have nil DeviceID")
	}
}

func TestListEnabledAutomations(t *testing.T) {
	s := newTestStore(t)
	ctx := context.Background()

	for _, tc := range []struct {
		id      string
		enabled bool
	}{
		{"auto-1", true},
		{"auto-2", true},
		{"auto-3", false},
	} {
		_, err := s.CreateAutomation(ctx, CreateAutomationParams{
			ID: tc.id, Name: tc.id, Enabled: tc.enabled,
			TriggerEvent: "device.state_changed", ConditionExpr: "true", CooldownSeconds: 5,
		})
		if err != nil {
			t.Fatalf("create automation %s: %v", tc.id, err)
		}
	}

	enabled, err := s.ListEnabledAutomations(ctx)
	if err != nil {
		t.Fatalf("list enabled: %v", err)
	}
	if len(enabled) != 2 {
		t.Fatalf("got %d enabled automations, want 2", len(enabled))
	}
}

func TestToggleAutomation(t *testing.T) {
	s := newTestStore(t)
	ctx := context.Background()

	_, err := s.CreateAutomation(ctx, CreateAutomationParams{
		ID: "auto-1", Name: "Test", Enabled: true,
		TriggerEvent: "device.state_changed", ConditionExpr: "true", CooldownSeconds: 5,
	})
	if err != nil {
		t.Fatalf("create: %v", err)
	}

	if err := s.UpdateAutomationEnabled(ctx, "auto-1", false); err != nil {
		t.Fatalf("toggle: %v", err)
	}

	a, err := s.GetAutomation(ctx, "auto-1")
	if err != nil {
		t.Fatalf("get: %v", err)
	}
	if a.Enabled {
		t.Error("expected Enabled to be false")
	}
}

func TestDeleteAutomationCascadesActions(t *testing.T) {
	s := newTestStore(t)
	ctx := context.Background()

	_, err := s.CreateAutomation(ctx, CreateAutomationParams{
		ID: "auto-1", Name: "Test", Enabled: true,
		TriggerEvent: "device.state_changed", ConditionExpr: "true", CooldownSeconds: 5,
	})
	if err != nil {
		t.Fatalf("create automation: %v", err)
	}

	_, err = s.CreateAutomationAction(ctx, CreateAutomationActionParams{
		ID: "aa-1", AutomationID: "auto-1", ActionType: "activate_scene",
		Payload: `{"scene_id":"scene-1"}`,
	})
	if err != nil {
		t.Fatalf("create action: %v", err)
	}

	if err := s.DeleteAutomation(ctx, "auto-1"); err != nil {
		t.Fatalf("delete: %v", err)
	}

	actions, err := s.ListAutomationActions(ctx, "auto-1")
	if err != nil {
		t.Fatalf("list actions: %v", err)
	}
	if len(actions) != 0 {
		t.Errorf("got %d actions after delete, want 0", len(actions))
	}
}
