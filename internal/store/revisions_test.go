package store

import (
	"context"
	"errors"
	"testing"

	"github.com/saffronjam/saffron-hive/internal/device"
)

func TestConfigurationRevisionRejectsStaleAggregate(t *testing.T) {
	s := newTestStore(t)
	ctx := context.Background()
	a, err := s.CreateAutomation(ctx, CreateAutomationParams{ID: "a", Name: "Draft"})
	if err != nil {
		t.Fatal(err)
	}
	name := "Updated"
	saved, err := s.UpdateAutomation(ctx, a.ID, UpdateAutomationParams{ExpectedRevision: a.Revision, Name: &name})
	if err != nil {
		t.Fatal(err)
	}
	stale := "Stale"
	if _, err := s.UpdateAutomation(ctx, a.ID, UpdateAutomationParams{ExpectedRevision: a.Revision, Name: &stale}); !errors.Is(err, ErrRevisionConflict) {
		t.Fatalf("stale save: %v", err)
	}
	got, err := s.GetAutomation(ctx, a.ID)
	if err != nil || got.Name != name || got.Revision != saved.Revision {
		t.Fatalf("stale save changed configuration: %+v %v", got, err)
	}
}

func TestRoomMembershipAndMetadataCommitTogether(t *testing.T) {
	s := newTestStore(t)
	ctx := context.Background()
	r, err := s.CreateRoom(ctx, CreateRoomParams{ID: "r", Name: "Room"})
	if err != nil {
		t.Fatal(err)
	}
	if _, err := s.CreateDevice(ctx, CreateDeviceParams{ID: "d", FriendlyName: "Light", Source: device.SourceZigbee2MQTT, Type: device.Light}); err != nil {
		t.Fatal(err)
	}
	children := []Membership{{device.TargetDevice, "missing"}}
	if _, err := s.UpdateRoom(ctx, UpdateRoomParams{ID: r.ID, Name: "Renamed", ExpectedRevision: r.Revision, Members: &children}); err == nil {
		t.Fatal("missing member accepted")
	}
	current, err := s.GetRoom(ctx, r.ID)
	if err != nil || current.Name != r.Name || current.Revision != r.Revision {
		t.Fatalf("partial save: %+v %v", current, err)
	}
	children[0].ID = "d"
	saved, err := s.UpdateRoom(ctx, UpdateRoomParams{ID: r.ID, Name: "Renamed", ExpectedRevision: r.Revision, Members: &children})
	if err != nil {
		t.Fatal(err)
	}
	members, err := s.ListRoomMembers(ctx, r.ID)
	if err != nil || len(members) != 1 || members[0].MemberID != "d" || saved.Name != "Renamed" {
		t.Fatalf("saved aggregate: %+v %+v %v", saved, members, err)
	}
	if _, err := s.UpdateRoom(ctx, UpdateRoomParams{ID: r.ID, Name: "Stale", ExpectedRevision: r.Revision}); !errors.Is(err, ErrRevisionConflict) {
		t.Fatalf("membership did not invalidate editor: %v", err)
	}
}

func TestSingletonRevisionProtectsCreationAndSecrets(t *testing.T) {
	s := newTestStore(t)
	ctx := context.Background()
	original := ClaudeConfig{Token: "first", Model: "opus", Enabled: true}
	if err := s.SaveClaudeConfig(ctx, original); err != nil {
		t.Fatal(err)
	}
	original.Token = "second"
	if err := s.SaveClaudeConfig(ctx, original); !errors.Is(err, ErrRevisionConflict) {
		t.Fatalf("duplicate creation: %v", err)
	}
	loaded, err := s.GetClaudeConfig(ctx)
	if err != nil || loaded.Token != "first" || loaded.Revision != 1 {
		t.Fatalf("config: %+v %v", loaded, err)
	}
	loaded.Token = "second"
	if err := s.SaveClaudeConfig(ctx, *loaded); err != nil {
		t.Fatal(err)
	}
	if err := s.SaveClaudeConfig(ctx, *loaded); !errors.Is(err, ErrRevisionConflict) {
		t.Fatalf("stale config: %v", err)
	}
	if _, err := s.UpdateSetting(ctx, "timezone", "UTC", 1); !errors.Is(err, ErrRevisionConflict) {
		t.Fatalf("missing singleton accepted existing revision: %v", err)
	}
	setting, err := s.UpdateSetting(ctx, "timezone", "UTC", 0)
	if err != nil {
		t.Fatal(err)
	}
	if _, err := s.UpdateSetting(ctx, setting.Key, "Europe/Stockholm", 0); !errors.Is(err, ErrRevisionConflict) {
		t.Fatalf("stale setting: %v", err)
	}
}

func TestTelemetryDoesNotInvalidateDeviceConfiguration(t *testing.T) {
	s := newTestStore(t)
	ctx := context.Background()
	p := CreateDeviceParams{ID: "d", FriendlyName: "Light", Source: device.SourceZigbee2MQTT, Type: device.Light}
	if err := s.UpsertDevice(ctx, p); err != nil {
		t.Fatal(err)
	}
	before, err := s.GetDevice(ctx, p.ID)
	if err != nil {
		t.Fatal(err)
	}
	p.FriendlyName = "Reported name"
	if err := s.UpsertDevice(ctx, p); err != nil {
		t.Fatal(err)
	}
	after, err := s.GetDevice(ctx, p.ID)
	if err != nil || after.Revision != before.Revision {
		t.Fatalf("telemetry advanced configuration revision: %+v %v", after, err)
	}
}
