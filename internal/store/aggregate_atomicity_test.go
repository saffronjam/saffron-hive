package store

import (
	"context"
	"testing"

	"github.com/saffronjam/saffron-hive/internal/device"
	"github.com/saffronjam/saffron-hive/internal/effect"
)

func TestAutomationAggregateRollbackAndPartialGraph(t *testing.T) {
	s := newTestStore(t)
	ctx := context.Background()
	nodes := []CreateAutomationNodeParams{{ID: "t", Type: "trigger", Config: `{"kind":"event"}`}, {ID: "a", Type: "action", Config: `{}`}}
	edges := []CreateAutomationEdgeParams{{FromNodeID: "t", ToNodeID: "a"}}
	_, err := s.CreateAutomation(ctx, CreateAutomationParams{ID: "a", Name: "Original", Nodes: nodes, Edges: edges})
	if err != nil {
		t.Fatal(err)
	}
	renamed := "Changed"
	duplicate := []CreateAutomationNodeParams{nodes[0], nodes[0]}
	if _, err := s.UpdateAutomation(ctx, "a", UpdateAutomationParams{ExpectedRevision: 1, Name: &renamed, Nodes: &duplicate}); err == nil {
		t.Fatal("duplicate node save succeeded")
	}
	g, err := s.GetAutomationGraph(ctx, "a")
	if err != nil {
		t.Fatal(err)
	}
	if g.Automation.Name != "Original" || len(g.Nodes) != 2 || len(g.Edges) != 1 {
		t.Fatalf("failed save changed aggregate: %+v", g)
	}
	nodes[0].Config = `{"kind":"event","event_type":"device.state_changed"}`
	if _, err := s.UpdateAutomation(ctx, "a", UpdateAutomationParams{ExpectedRevision: 1, Nodes: &nodes}); err != nil {
		t.Fatal(err)
	}
	g, _ = s.GetAutomationGraph(ctx, "a")
	if len(g.Edges) != 1 {
		t.Fatal("nodes-only patch lost edges")
	}
	empty := []CreateAutomationEdgeParams{}
	if _, err := s.UpdateAutomation(ctx, "a", UpdateAutomationParams{ExpectedRevision: 2, Edges: &empty}); err != nil {
		t.Fatal(err)
	}
	g, _ = s.GetAutomationGraph(ctx, "a")
	if len(g.Nodes) != 2 || len(g.Edges) != 0 {
		t.Fatal("edges-only patch did not preserve nodes")
	}
	if _, err := s.CreateAutomation(ctx, CreateAutomationParams{ID: "bad", Name: "Bad", Nodes: duplicate}); err == nil {
		t.Fatal("duplicate creation succeeded")
	}
	if _, err := s.GetAutomation(ctx, "bad"); err == nil {
		t.Fatal("failed create left metadata")
	}
}

func TestEffectMetadataRollsBackWithTracks(t *testing.T) {
	s := newTestStore(t)
	ctx := context.Background()
	if _, err := s.CreateEffect(ctx, CreateEffectParams{ID: "e", Name: "Original", Kind: effect.KindTimeline}); err != nil {
		t.Fatal(err)
	}
	tracks := []EffectTrackInput{{ID: "t", Index: 0, Name: "First"}, {ID: "t", Index: 1, Name: "Second"}}
	name := "Changed"
	if _, err := s.UpdateEffect(ctx, "e", UpdateEffectParams{ExpectedRevision: 1, Name: &name, Tracks: &tracks}); err == nil {
		t.Fatal("duplicate tracks accepted")
	}
	e, err := s.GetEffect(ctx, "e")
	if err != nil || e.Name != "Original" || len(e.Tracks) != 0 {
		t.Fatalf("failed save changed effect: %+v, %v", e, err)
	}
}

func TestDeviceMetadataFailureRetainsNameAndTelemetry(t *testing.T) {
	s := newTestStore(t)
	ctx := context.Background()
	if err := s.UpsertDevice(ctx, CreateDeviceParams{ID: "d", FriendlyName: "Device", Type: device.Light, Source: device.SourceZigbee2MQTT}); err != nil {
		t.Fatal(err)
	}
	name := "Changed"
	brightness := int64(255)
	if _, err := s.UpdateDeviceMetadata(ctx, UpdateDeviceMetadataParams{ExpectedRevision: 1, ID: "d", SetName: true, Name: &name, SetBrightness: true, Brightness: &brightness}); err == nil {
		t.Fatal("invalid brightness accepted")
	}
	d, err := s.GetDevice(ctx, "d")
	if err != nil || d.Name != nil {
		t.Fatalf("failed save changed device: %+v, %v", d, err)
	}
}
