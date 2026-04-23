package store

import (
	"context"
	"database/sql"
	"errors"
	"testing"

	"github.com/saffronjam/saffron-hive/internal/device"
)

func TestCreateScene(t *testing.T) {
	s := newTestStore(t)
	ctx := context.Background()

	sc, err := s.CreateScene(ctx, CreateSceneParams{ID: "scene-1", Name: "Movie Night"})
	if err != nil {
		t.Fatalf("create scene: %v", err)
	}
	if sc.ID != "scene-1" {
		t.Errorf("got ID %q, want %q", sc.ID, "scene-1")
	}
	if sc.Name != "Movie Night" {
		t.Errorf("got Name %q, want %q", sc.Name, "Movie Night")
	}
	if sc.CreatedAt.IsZero() {
		t.Error("expected CreatedAt to be set")
	}
}

func TestAddSceneActions(t *testing.T) {
	s := newTestStore(t)
	ctx := context.Background()

	_, err := s.CreateScene(ctx, CreateSceneParams{ID: "scene-1", Name: "Test"})
	if err != nil {
		t.Fatalf("create scene: %v", err)
	}

	for i, devID := range []device.DeviceID{"dev-1", "dev-2", "dev-3"} {
		_, err := s.CreateDevice(ctx, CreateDeviceParams{
			ID: devID, Name: "Device", Source: "zigbee", Type: device.Light,
		})
		if err != nil {
			t.Fatalf("create device %d: %v", i, err)
		}
		_, err = s.CreateSceneAction(ctx, CreateSceneActionParams{
			ID:         "action-" + string(rune('1'+i)),
			SceneID:    "scene-1",
			TargetType: "device",
			TargetID:   string(devID),
		})
		if err != nil {
			t.Fatalf("create scene action %d: %v", i, err)
		}
	}

	actions, err := s.ListSceneActions(ctx, "scene-1")
	if err != nil {
		t.Fatalf("list scene actions: %v", err)
	}
	if len(actions) != 3 {
		t.Fatalf("got %d actions, want 3", len(actions))
	}
}

func TestDeleteSceneCascadesActions(t *testing.T) {
	s := newTestStore(t)
	ctx := context.Background()

	_, err := s.CreateScene(ctx, CreateSceneParams{ID: "scene-1", Name: "Test"})
	if err != nil {
		t.Fatalf("create scene: %v", err)
	}
	_, err = s.CreateDevice(ctx, CreateDeviceParams{
		ID: "dev-1", Name: "Device", Source: "zigbee", Type: device.Light,
	})
	if err != nil {
		t.Fatalf("create device: %v", err)
	}
	_, err = s.CreateSceneAction(ctx, CreateSceneActionParams{
		ID: "action-1", SceneID: "scene-1", TargetType: "device", TargetID: "dev-1",
	})
	if err != nil {
		t.Fatalf("create action: %v", err)
	}

	if err := s.DeleteScene(ctx, "scene-1"); err != nil {
		t.Fatalf("delete scene: %v", err)
	}

	actions, err := s.ListSceneActions(ctx, "scene-1")
	if err != nil {
		t.Fatalf("list actions: %v", err)
	}
	if len(actions) != 0 {
		t.Errorf("got %d actions after delete, want 0", len(actions))
	}
}

func TestListScenes(t *testing.T) {
	s := newTestStore(t)
	ctx := context.Background()

	for _, name := range []string{"A", "B", "C"} {
		_, err := s.CreateScene(ctx, CreateSceneParams{ID: "scene-" + name, Name: name})
		if err != nil {
			t.Fatalf("create scene %s: %v", name, err)
		}
	}

	scenes, err := s.ListScenes(ctx)
	if err != nil {
		t.Fatalf("list scenes: %v", err)
	}
	if len(scenes) != 3 {
		t.Fatalf("got %d scenes, want 3", len(scenes))
	}
}

func TestGetSceneNotFound(t *testing.T) {
	s := newTestStore(t)
	ctx := context.Background()

	_, err := s.GetScene(ctx, "nonexistent")
	if err == nil {
		t.Fatal("expected error for non-existent scene")
	}
	if !errors.Is(err, sql.ErrNoRows) {
		t.Errorf("expected sql.ErrNoRows, got: %v", err)
	}
}

func TestSaveSceneContentReplacesAtomically(t *testing.T) {
	s := newTestStore(t)
	ctx := context.Background()

	_, err := s.CreateScene(ctx, CreateSceneParams{ID: "scene-1", Name: "Test"})
	if err != nil {
		t.Fatalf("create scene: %v", err)
	}

	for _, devID := range []device.DeviceID{"dev-1", "dev-2"} {
		if _, err := s.CreateDevice(ctx, CreateDeviceParams{
			ID: devID, Name: "d", Source: "zigbee", Type: device.Light,
		}); err != nil {
			t.Fatalf("create device: %v", err)
		}
	}

	if err := s.SaveSceneContent(ctx, SaveSceneContentParams{
		SceneID: "scene-1",
		Targets: []SceneTargetRef{{TargetType: "device", TargetID: "dev-1"}},
		Payloads: []SceneDevicePayload{
			{SceneID: "scene-1", DeviceID: "dev-1", Payload: `{"on":true,"brightness":50}`},
		},
	}); err != nil {
		t.Fatalf("save first round: %v", err)
	}

	actions, _ := s.ListSceneActions(ctx, "scene-1")
	payloads, _ := s.ListSceneDevicePayloads(ctx, "scene-1")
	if len(actions) != 1 || actions[0].TargetID != "dev-1" {
		t.Fatalf("first round actions = %+v", actions)
	}
	if len(payloads) != 1 || payloads[0].DeviceID != "dev-1" {
		t.Fatalf("first round payloads = %+v", payloads)
	}

	if err := s.SaveSceneContent(ctx, SaveSceneContentParams{
		SceneID: "scene-1",
		Targets: []SceneTargetRef{{TargetType: "device", TargetID: "dev-2"}},
		Payloads: []SceneDevicePayload{
			{SceneID: "scene-1", DeviceID: "dev-2", Payload: `{"on":false}`},
		},
	}); err != nil {
		t.Fatalf("save second round: %v", err)
	}

	actions, _ = s.ListSceneActions(ctx, "scene-1")
	payloads, _ = s.ListSceneDevicePayloads(ctx, "scene-1")
	if len(actions) != 1 || actions[0].TargetID != "dev-2" {
		t.Fatalf("second round actions didn't replace: %+v", actions)
	}
	if len(payloads) != 1 || payloads[0].DeviceID != "dev-2" {
		t.Fatalf("second round payloads didn't replace: %+v", payloads)
	}
}

func TestSaveSceneContentRollsBackOnInvalidTarget(t *testing.T) {
	s := newTestStore(t)
	ctx := context.Background()

	_, err := s.CreateScene(ctx, CreateSceneParams{ID: "scene-1", Name: "Test"})
	if err != nil {
		t.Fatalf("create scene: %v", err)
	}

	if _, err := s.CreateDevice(ctx, CreateDeviceParams{
		ID: "dev-1", Name: "d", Source: "zigbee", Type: device.Light,
	}); err != nil {
		t.Fatalf("create device: %v", err)
	}
	if err := s.SaveSceneContent(ctx, SaveSceneContentParams{
		SceneID: "scene-1",
		Targets: []SceneTargetRef{{TargetType: "device", TargetID: "dev-1"}},
		Payloads: []SceneDevicePayload{
			{SceneID: "scene-1", DeviceID: "dev-1", Payload: `{"on":true}`},
		},
	}); err != nil {
		t.Fatalf("save seed: %v", err)
	}

	err = s.SaveSceneContent(ctx, SaveSceneContentParams{
		SceneID: "unknown-scene",
		Targets: []SceneTargetRef{{TargetType: "device", TargetID: "dev-1"}},
		Payloads: []SceneDevicePayload{
			{SceneID: "unknown-scene", DeviceID: "dev-1", Payload: `{"on":false}`},
		},
	})
	if err == nil {
		t.Fatal("expected FK error for unknown scene id")
	}

	actions, _ := s.ListSceneActions(ctx, "scene-1")
	payloads, _ := s.ListSceneDevicePayloads(ctx, "scene-1")
	if len(actions) != 1 || actions[0].TargetID != "dev-1" {
		t.Fatalf("seeded actions were mutated by failed save: %+v", actions)
	}
	if len(payloads) != 1 || payloads[0].Payload != `{"on":true}` {
		t.Fatalf("seeded payloads were mutated by failed save: %+v", payloads)
	}
}
