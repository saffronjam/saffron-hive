package store

import (
	"context"
	"testing"
	"time"

	"github.com/saffronjam/saffron-hive/internal/device"
)

func sampleTopology(scannedAt time.Time) device.NetworkTopology {
	hubID := device.DeviceID("0xhub")
	sensorID := device.DeviceID("0xsensor")
	return device.NetworkTopology{
		Provider:  device.SourceZigbee2MQTT,
		ScannedAt: scannedAt,
		Nodes: []device.TopologyNode{
			{ID: "0xhub", DeviceID: &hubID, Role: device.RoleHub},
			{ID: "0xsensor", DeviceID: &sensorID, Role: device.RoleLeaf},
		},
		Links: []device.TopologyLink{
			{
				Source: "0xsensor", Target: "0xhub", Kind: device.LinkParent,
				Quality: 0.69, RawQuality: 176, Stale: true, ObservedAt: scannedAt.Add(-24 * time.Hour),
			},
		},
	}
}

func TestNetworkTopologyRoundTrip(t *testing.T) {
	ctx := context.Background()
	s := newTestStore(t)

	got, err := s.GetNetworkTopology(ctx, device.SourceZigbee2MQTT)
	if err != nil {
		t.Fatalf("get on empty table: %v", err)
	}
	if got != nil {
		t.Fatalf("want nil before any scan, got %+v", got)
	}

	scannedAt := time.Date(2026, 8, 12, 4, 0, 0, 0, time.UTC)
	want := sampleTopology(scannedAt)
	if err := s.UpsertNetworkTopology(ctx, want); err != nil {
		t.Fatalf("upsert: %v", err)
	}

	got, err = s.GetNetworkTopology(ctx, device.SourceZigbee2MQTT)
	if err != nil {
		t.Fatalf("get: %v", err)
	}
	if got == nil {
		t.Fatal("want stored topology, got nil")
	}
	if got.Provider != want.Provider || !got.ScannedAt.Equal(want.ScannedAt) {
		t.Fatalf("envelope mismatch: %+v", got)
	}
	if len(got.Nodes) != 2 || len(got.Links) != 1 {
		t.Fatalf("want 2 nodes / 1 link, got %d / %d", len(got.Nodes), len(got.Links))
	}
	if got.Nodes[1].DeviceID == nil || *got.Nodes[1].DeviceID != "0xsensor" {
		t.Fatalf("node deviceId lost in round trip: %+v", got.Nodes[1])
	}
	link := got.Links[0]
	if link.Kind != device.LinkParent || !link.Stale || link.RawQuality != 176 {
		t.Fatalf("link fields lost in round trip: %+v", link)
	}
	if !link.ObservedAt.Equal(want.Links[0].ObservedAt) {
		t.Fatalf("link ObservedAt mismatch: want %v, got %v", want.Links[0].ObservedAt, link.ObservedAt)
	}
}

func TestNetworkTopologyUpsertReplaces(t *testing.T) {
	ctx := context.Background()
	s := newTestStore(t)

	first := sampleTopology(time.Date(2026, 8, 10, 4, 0, 0, 0, time.UTC))
	if err := s.UpsertNetworkTopology(ctx, first); err != nil {
		t.Fatalf("first upsert: %v", err)
	}
	second := device.NetworkTopology{
		Provider:  device.SourceZigbee2MQTT,
		ScannedAt: time.Date(2026, 8, 12, 4, 0, 0, 0, time.UTC),
		Nodes:     []device.TopologyNode{{ID: "0xhub", Role: device.RoleHub}},
	}
	if err := s.UpsertNetworkTopology(ctx, second); err != nil {
		t.Fatalf("second upsert: %v", err)
	}

	got, err := s.GetNetworkTopology(ctx, device.SourceZigbee2MQTT)
	if err != nil {
		t.Fatalf("get: %v", err)
	}
	if len(got.Nodes) != 1 || len(got.Links) != 0 || !got.ScannedAt.Equal(second.ScannedAt) {
		t.Fatalf("second upsert must replace the first wholesale, got %+v", got)
	}

	all, err := s.ListNetworkTopologies(ctx)
	if err != nil {
		t.Fatalf("list: %v", err)
	}
	if len(all) != 1 {
		t.Fatalf("upsert must stay one row per provider, got %d", len(all))
	}
}

func TestNetworkTopologyDelete(t *testing.T) {
	ctx := context.Background()
	s := newTestStore(t)

	if err := s.UpsertNetworkTopology(ctx, sampleTopology(time.Now().UTC())); err != nil {
		t.Fatalf("upsert: %v", err)
	}
	if err := s.DeleteNetworkTopology(ctx, device.SourceZigbee2MQTT); err != nil {
		t.Fatalf("delete: %v", err)
	}
	got, err := s.GetNetworkTopology(ctx, device.SourceZigbee2MQTT)
	if err != nil {
		t.Fatalf("get after delete: %v", err)
	}
	if got != nil {
		t.Fatalf("want nil after delete, got %+v", got)
	}
}
