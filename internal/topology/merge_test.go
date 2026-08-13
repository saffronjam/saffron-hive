package topology

import (
	"testing"
	"time"

	"github.com/saffronjam/saffron-hive/internal/device"
)

var (
	t0 = time.Date(2026, 8, 1, 4, 0, 0, 0, time.UTC)
	t1 = time.Date(2026, 8, 2, 4, 0, 0, 0, time.UTC)
)

func node(id string, role device.TopologyRole) device.TopologyNode {
	return device.TopologyNode{ID: id, Role: role}
}

func parentLink(child, parent string, at time.Time) device.TopologyLink {
	return device.TopologyLink{
		Source: child, Target: parent, Kind: device.LinkParent,
		Quality: 0.8, RawQuality: 204, ObservedAt: at,
	}
}

func linksFor(topo device.NetworkTopology, nodeID string) []device.TopologyLink {
	var out []device.TopologyLink
	for _, l := range topo.Links {
		if l.Source == nodeID || l.Target == nodeID {
			out = append(out, l)
		}
	}
	return out
}

func TestMergeNilPreviousReturnsNext(t *testing.T) {
	next := device.NetworkTopology{
		Provider:  device.SourceZigbee2MQTT,
		ScannedAt: t1,
		Nodes:     []device.TopologyNode{node("hub", device.RoleHub)},
	}
	got := MergeTopology(nil, next)
	if len(got.Nodes) != 1 || got.ScannedAt != t1 {
		t.Fatalf("nil prev should pass next through, got %+v", got)
	}
}

func TestMergeCarriesSleepingLeafParentLink(t *testing.T) {
	prev := device.NetworkTopology{
		ScannedAt: t0,
		Nodes: []device.TopologyNode{
			node("hub", device.RoleHub), node("r1", device.RoleRelay), node("s1", device.RoleLeaf),
		},
		Links: []device.TopologyLink{parentLink("s1", "r1", t0)},
	}
	next := device.NetworkTopology{
		ScannedAt: t1,
		Nodes: []device.TopologyNode{
			node("hub", device.RoleHub), node("r1", device.RoleRelay), node("s1", device.RoleLeaf),
		},
	}

	got := MergeTopology(&prev, next)
	links := linksFor(got, "s1")
	if len(links) != 1 {
		t.Fatalf("want 1 carried link for s1, got %d", len(links))
	}
	if !links[0].Stale {
		t.Fatal("carried link must be marked stale")
	}
	if !links[0].ObservedAt.Equal(t0) {
		t.Fatalf("carried link must keep original ObservedAt %v, got %v", t0, links[0].ObservedAt)
	}
}

func TestMergeDoesNotCarryForActiveLeaf(t *testing.T) {
	prev := device.NetworkTopology{
		ScannedAt: t0,
		Nodes: []device.TopologyNode{
			node("r1", device.RoleRelay), node("s1", device.RoleLeaf),
		},
		Links: []device.TopologyLink{parentLink("s1", "r1", t0)},
	}
	next := device.NetworkTopology{
		ScannedAt: t1,
		Nodes: []device.TopologyNode{
			node("r1", device.RoleRelay), node("r2", device.RoleRelay), node("s1", device.RoleLeaf),
		},
		Links: []device.TopologyLink{parentLink("s1", "r2", t1)},
	}

	got := MergeTopology(&prev, next)
	links := linksFor(got, "s1")
	if len(links) != 1 {
		t.Fatalf("leaf that answered the scan must keep only its fresh link, got %d", len(links))
	}
	if links[0].Stale || links[0].Target != "r2" {
		t.Fatalf("want fresh link to r2, got %+v", links[0])
	}
}

func TestMergeRepeatMissKeepsOriginalTimestamp(t *testing.T) {
	scan0 := device.NetworkTopology{
		ScannedAt: t0,
		Nodes: []device.TopologyNode{
			node("r1", device.RoleRelay), node("s1", device.RoleLeaf),
		},
		Links: []device.TopologyLink{parentLink("s1", "r1", t0)},
	}
	scanShape := device.NetworkTopology{
		Nodes: []device.TopologyNode{
			node("r1", device.RoleRelay), node("s1", device.RoleLeaf),
		},
	}

	miss1 := scanShape
	miss1.ScannedAt = t1
	after1 := MergeTopology(&scan0, miss1)

	miss2 := scanShape
	miss2.ScannedAt = t1.Add(24 * time.Hour)
	after2 := MergeTopology(&after1, miss2)

	links := linksFor(after2, "s1")
	if len(links) != 1 {
		t.Fatalf("want 1 link after two misses, got %d", len(links))
	}
	if !links[0].ObservedAt.Equal(t0) {
		t.Fatalf("link observed at %v must survive repeat misses, got %v", t0, links[0].ObservedAt)
	}
}

func TestMergeCarriesLeafNodeAbsentFromScan(t *testing.T) {
	prev := device.NetworkTopology{
		ScannedAt: t0,
		Nodes: []device.TopologyNode{
			node("r1", device.RoleRelay), node("s1", device.RoleLeaf),
		},
		Links: []device.TopologyLink{parentLink("s1", "r1", t0)},
	}
	next := device.NetworkTopology{
		ScannedAt: t1,
		Nodes:     []device.TopologyNode{node("r1", device.RoleRelay)},
	}

	got := MergeTopology(&prev, next)
	if len(got.Nodes) != 2 {
		t.Fatalf("absent leaf must be carried as a node, got %d nodes", len(got.Nodes))
	}
	links := linksFor(got, "s1")
	if len(links) != 1 || !links[0].Stale {
		t.Fatalf("absent leaf must keep its stale parent link, got %+v", links)
	}
}

func TestMergeDropsAbsentLeafWhoseParentAlsoVanished(t *testing.T) {
	prev := device.NetworkTopology{
		ScannedAt: t0,
		Nodes: []device.TopologyNode{
			node("r1", device.RoleRelay), node("s1", device.RoleLeaf),
		},
		Links: []device.TopologyLink{parentLink("s1", "r1", t0)},
	}
	next := device.NetworkTopology{
		ScannedAt: t1,
		Nodes:     []device.TopologyNode{node("r2", device.RoleRelay)},
	}

	got := MergeTopology(&prev, next)
	if len(got.Nodes) != 1 {
		t.Fatalf("leaf with no surviving parent must not float, got %d nodes", len(got.Nodes))
	}
	if len(got.Links) != 0 {
		t.Fatalf("want no links, got %+v", got.Links)
	}
}

func TestMergeNeverCarriesRelays(t *testing.T) {
	prev := device.NetworkTopology{
		ScannedAt: t0,
		Nodes: []device.TopologyNode{
			node("hub", device.RoleHub), node("r1", device.RoleRelay), node("r2", device.RoleRelay),
		},
		Links: []device.TopologyLink{
			{Source: "r2", Target: "hub", Kind: device.LinkRoute, Quality: 0.9, RawQuality: 230, ObservedAt: t0},
			parentLink("r2", "r1", t0),
		},
	}
	next := device.NetworkTopology{
		ScannedAt: t1,
		Nodes: []device.TopologyNode{
			node("hub", device.RoleHub), node("r1", device.RoleRelay),
		},
	}

	got := MergeTopology(&prev, next)
	if len(got.Nodes) != 2 {
		t.Fatalf("silent relay must not be carried, got %d nodes", len(got.Nodes))
	}
	if len(got.Links) != 0 {
		t.Fatalf("relay links must not be carried, got %+v", got.Links)
	}
}

func TestMergeLinklessLeafInBothScansStaysLinkless(t *testing.T) {
	prev := device.NetworkTopology{
		ScannedAt: t0,
		Nodes: []device.TopologyNode{
			node("r1", device.RoleRelay), node("s1", device.RoleLeaf),
		},
	}
	next := prev
	next.ScannedAt = t1

	got := MergeTopology(&prev, next)
	if len(got.Links) != 0 {
		t.Fatalf("nothing to carry, got %+v", got.Links)
	}
}
