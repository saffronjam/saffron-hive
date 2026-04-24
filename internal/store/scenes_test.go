package store

import (
	"context"
	"database/sql"
	"errors"
	"testing"
	"time"

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
		SceneID: "scene-1", TargetType: "device", TargetID: "dev-1",
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

func TestSetAndClearSceneActivatedAt(t *testing.T) {
	s := newTestStore(t)
	ctx := context.Background()

	if _, err := s.CreateScene(ctx, CreateSceneParams{ID: "scene-1", Name: "Test"}); err != nil {
		t.Fatalf("create scene: %v", err)
	}

	sc, _ := s.GetScene(ctx, "scene-1")
	if sc.ActivatedAt != nil {
		t.Fatalf("new scene should not be active, got %v", sc.ActivatedAt)
	}

	now := time.Date(2026, 4, 24, 12, 0, 0, 0, time.UTC)
	if err := s.SetSceneActivatedAt(ctx, "scene-1", now); err != nil {
		t.Fatalf("set activated_at: %v", err)
	}
	sc, _ = s.GetScene(ctx, "scene-1")
	if sc.ActivatedAt == nil || !sc.ActivatedAt.Equal(now) {
		t.Fatalf("want activated_at = %v, got %v", now, sc.ActivatedAt)
	}

	if err := s.ClearSceneActivatedAt(ctx, "scene-1"); err != nil {
		t.Fatalf("clear activated_at: %v", err)
	}
	sc, _ = s.GetScene(ctx, "scene-1")
	if sc.ActivatedAt != nil {
		t.Fatalf("after clear want nil, got %v", sc.ActivatedAt)
	}
}

func TestReplaceSceneExpectedStatesAtomic(t *testing.T) {
	s := newTestStore(t)
	ctx := context.Background()

	if _, err := s.CreateScene(ctx, CreateSceneParams{ID: "scene-1", Name: "Test"}); err != nil {
		t.Fatalf("create scene: %v", err)
	}

	first := []SceneExpectedState{
		{SceneID: "scene-1", DeviceID: "dev-1", On: device.Ptr(true), Brightness: device.Ptr(200)},
		{SceneID: "scene-1", DeviceID: "dev-2", On: device.Ptr(false)},
	}
	if err := s.ReplaceSceneExpectedStates(ctx, "scene-1", first); err != nil {
		t.Fatalf("replace first: %v", err)
	}
	got, err := s.ListSceneExpectedStates(ctx, "scene-1")
	if err != nil {
		t.Fatalf("list: %v", err)
	}
	if len(got) != 2 {
		t.Fatalf("want 2 rows, got %d", len(got))
	}

	second := []SceneExpectedState{
		{SceneID: "scene-1", DeviceID: "dev-3", On: device.Ptr(true), ColorTemp: device.Ptr(370)},
	}
	if err := s.ReplaceSceneExpectedStates(ctx, "scene-1", second); err != nil {
		t.Fatalf("replace second: %v", err)
	}
	got, _ = s.ListSceneExpectedStates(ctx, "scene-1")
	if len(got) != 1 || got[0].DeviceID != "dev-3" {
		t.Fatalf("second round did not replace: %+v", got)
	}

	if err := s.ReplaceSceneExpectedStates(ctx, "scene-1", nil); err != nil {
		t.Fatalf("replace empty: %v", err)
	}
	got, _ = s.ListSceneExpectedStates(ctx, "scene-1")
	if len(got) != 0 {
		t.Fatalf("empty replace should clear rows, got %+v", got)
	}
}

func TestListActiveScenesWithExpectedStates(t *testing.T) {
	s := newTestStore(t)
	ctx := context.Background()

	for _, id := range []string{"s1", "s2", "s3"} {
		if _, err := s.CreateScene(ctx, CreateSceneParams{ID: id, Name: id}); err != nil {
			t.Fatalf("create %s: %v", id, err)
		}
	}

	now := time.Date(2026, 4, 24, 12, 0, 0, 0, time.UTC)
	if err := s.SetSceneActivatedAt(ctx, "s1", now); err != nil {
		t.Fatalf("set s1: %v", err)
	}
	if err := s.SetSceneActivatedAt(ctx, "s2", now.Add(time.Second)); err != nil {
		t.Fatalf("set s2: %v", err)
	}
	if err := s.ReplaceSceneExpectedStates(ctx, "s1", []SceneExpectedState{
		{SceneID: "s1", DeviceID: "dev-1", On: device.Ptr(true), Brightness: device.Ptr(200)},
	}); err != nil {
		t.Fatalf("expected for s1: %v", err)
	}
	if err := s.ReplaceSceneExpectedStates(ctx, "s2", []SceneExpectedState{
		{SceneID: "s2", DeviceID: "dev-2", On: device.Ptr(false)},
	}); err != nil {
		t.Fatalf("expected for s2: %v", err)
	}

	snap, err := s.ListActiveScenesWithExpectedStates(ctx)
	if err != nil {
		t.Fatalf("list active: %v", err)
	}
	if len(snap) != 2 {
		t.Fatalf("want 2 active scenes, got %d", len(snap))
	}
	byID := map[string]ActiveSceneSnapshot{}
	for _, a := range snap {
		byID[a.SceneID] = a
	}
	if len(byID["s1"].Expected) != 1 || byID["s1"].Expected[0].DeviceID != "dev-1" {
		t.Fatalf("s1 expected = %+v", byID["s1"])
	}
	if len(byID["s2"].Expected) != 1 || byID["s2"].Expected[0].DeviceID != "dev-2" {
		t.Fatalf("s2 expected = %+v", byID["s2"])
	}
	if _, ok := byID["s3"]; ok {
		t.Fatalf("s3 should not be active")
	}
}
