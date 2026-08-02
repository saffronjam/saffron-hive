package graph

import (
	"context"
	"sort"
	"testing"

	"github.com/saffronjam/saffron-hive/internal/device"
	"github.com/saffronjam/saffron-hive/internal/store"
)

// fakeRoomTargets resolves a room or device target to a fixed device list. The
// real resolver returns nothing for expression targets, so this one does too —
// an expression only contributes devices if the caller evaluates it.
type fakeRoomTargets map[string][]device.DeviceID

func (f fakeRoomTargets) ResolveTargetDeviceIDs(_ context.Context, targetType device.TargetType, targetID string) []device.DeviceID {
	if targetType == device.TargetExpression {
		return nil
	}
	return f[targetID]
}

type fakeRoomLister []store.Room

func (f fakeRoomLister) ListRooms(_ context.Context) ([]store.Room, error) {
	return []store.Room(f), nil
}

func sceneRoomsFixture() (device.StateReader, fakeRoomTargets, fakeRoomLister) {
	reader := device.NewMemoryStore()
	reader.Register(device.Device{ID: "d-light", FriendlyName: "Bulb", Source: device.SourceZigbee2MQTT, Type: device.Light})
	reader.Register(device.Device{ID: "d-plug", FriendlyName: "Plug", Source: device.SourceZigbee2MQTT, Type: device.Plug})

	targets := fakeRoomTargets{
		"r-living":  {"d-light"},
		"r-kitchen": {"d-plug"},
		"d-light":   {"d-light"},
		"d-plug":    {"d-plug"},
	}
	rooms := fakeRoomLister{
		{ID: "r-living", Name: "Living room"},
		{ID: "r-kitchen", Name: "Kitchen"},
	}
	return reader, targets, rooms
}

func presentRoomIDs(t *testing.T, actions []store.SceneAction) []string {
	t.Helper()
	reader, targets, rooms := sceneRoomsFixture()
	got := computeScenePresentRooms(context.Background(), reader, targets, rooms, actions)
	ids := make([]string, 0, len(got))
	for _, r := range got {
		ids = append(ids, r.ID)
	}
	sort.Strings(ids)
	return ids
}

// TestComputeScenePresentRoomsResolvesExpressions is the regression guard for
// selector scenes deriving no rooms at all. The room list drives the per-room
// dashboard drawer, so a scene targeting "every light" has to surface in the
// rooms those lights belong to, exactly as a direct device target would.
func TestComputeScenePresentRoomsResolvesExpressions(t *testing.T) {
	lightSelector := device.Expression{
		{Subject: device.SubjectDeviceType, Op: device.OpIs, Values: []string{string(device.Light)}},
	}

	got := presentRoomIDs(t, []store.SceneAction{
		{TargetType: string(device.TargetExpression), Expression: lightSelector},
	})
	if len(got) != 1 || got[0] != "r-living" {
		t.Fatalf("expression selector should surface the light's room, got %v", got)
	}
}

func TestComputeScenePresentRoomsResolvesDirectTargets(t *testing.T) {
	got := presentRoomIDs(t, []store.SceneAction{
		{TargetType: string(device.TargetDevice), TargetID: "d-plug"},
	})
	if len(got) != 1 || got[0] != "r-kitchen" {
		t.Fatalf("device target should surface only its own room, got %v", got)
	}
}

// A scene may mix a selector with direct targets; both must contribute.
func TestComputeScenePresentRoomsMixesTargetKinds(t *testing.T) {
	got := presentRoomIDs(t, []store.SceneAction{
		{TargetType: string(device.TargetExpression), Expression: device.Expression{
			{Subject: device.SubjectDeviceType, Op: device.OpIs, Values: []string{string(device.Light)}},
		}},
		{TargetType: string(device.TargetDevice), TargetID: "d-plug"},
	})
	if len(got) != 2 || got[0] != "r-kitchen" || got[1] != "r-living" {
		t.Fatalf("mixed action kinds should surface both rooms, got %v", got)
	}
}

func TestComputeScenePresentRoomsEmptyForNoMatches(t *testing.T) {
	got := presentRoomIDs(t, []store.SceneAction{
		{TargetType: string(device.TargetExpression), Expression: device.Expression{
			{Subject: device.SubjectDeviceType, Op: device.OpIs, Values: []string{string(device.Climate)}},
		}},
	})
	if len(got) != 0 {
		t.Fatalf("a selector matching nothing should surface no rooms, got %v", got)
	}

	if got := presentRoomIDs(t, nil); len(got) != 0 {
		t.Fatalf("a scene with no actions should surface no rooms, got %v", got)
	}
}
