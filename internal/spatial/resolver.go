// Package spatial resolves selected physical devices to deterministic,
// normalized light-field coordinates.
package spatial

import (
	"context"
	"errors"
	"slices"
	"sync"

	"github.com/saffronjam/saffron-hive/internal/device"
	"github.com/saffronjam/saffron-hive/internal/eventbus"
	"github.com/saffronjam/saffron-hive/internal/lightfield"
	"github.com/saffronjam/saffron-hive/internal/store"
)

// Store is the structural data required by spatial resolution.
type Store interface {
	GetFloorplanGraph(context.Context) (*store.Floorplan, error)
	ListGroupMembers(context.Context, string) ([]store.GroupMember, error)
	ListRoomMembers(context.Context, string) ([]store.RoomMember, error)
	ResolveTargetDeviceIDs(context.Context, device.TargetType, string) []device.DeviceID
}

// StructuralRoot is a positive room, group, or device target that reached a
// selected physical device.
type StructuralRoot struct {
	Type device.TargetType
	ID   string
}

// TargetContext carries the already-deduplicated selected set and its positive
// structural provenance.
type TargetContext struct {
	DeviceIDs     []device.DeviceID
	PositiveRoots map[device.DeviceID][]StructuralRoot
}

// PointSource explains the placement tier used for a device.
type PointSource string

const (
	PointSourceDevice   PointSource = "device"
	PointSourceGroup    PointSource = "group"
	PointSourceRoom     PointSource = "room"
	PointSourceFallback PointSource = "fallback"
)

// DevicePoint is one final field-space coordinate.
type DevicePoint struct {
	DeviceID device.DeviceID
	Point    lightfield.Point
	Source   PointSource
}

// Diagnostics reports safe fallbacks without making placement a requirement.
type Diagnostics struct {
	MissingPositiveRoots []device.DeviceID
	DegenerateRoomIDs    []string
	FallbackDeviceIDs    []device.DeviceID
	CycleBranches        int
}

// Resolver caches structural topology while resolving each Scene target set
// afresh.
type Resolver struct {
	store Store

	mu        sync.RWMutex
	topology  *floorTopology
	topLoaded bool
	members   map[structuralNode][]structuralNode
}

// NewResolver constructs an empty spatial topology cache.
func NewResolver(store Store) *Resolver {
	return &Resolver{store: store, members: map[structuralNode][]structuralNode{}}
}

// Invalidate discards cached floor geometry and membership adjacency.
func (r *Resolver) Invalidate() {
	r.mu.Lock()
	r.topology = nil
	r.topLoaded = false
	r.members = map[structuralNode][]structuralNode{}
	r.mu.Unlock()
}

// Run invalidates cached topology when its underlying structural data changes.
func (r *Resolver) Run(ctx context.Context, subscriber eventbus.Subscriber) {
	ch := subscriber.Subscribe(
		eventbus.EventFloorplanUpdated,
		eventbus.EventRoomMembershipChanged,
		eventbus.EventGroupMembershipChanged,
		eventbus.EventDeviceUpdated,
		eventbus.EventDeviceSynced,
		eventbus.EventDeviceAvailabilityChanged,
		eventbus.EventProviderGroupsSynced,
		eventbus.EventGroupSynced,
	)
	defer subscriber.Unsubscribe(ch)
	for {
		select {
		case <-ctx.Done():
			return
		case <-ch:
			r.Invalidate()
		}
	}
}

// Resolve returns exactly one stable, normalized point for every selected
// device, sorted by device ID.
func (r *Resolver) Resolve(ctx context.Context, target TargetContext, seed int64) ([]DevicePoint, Diagnostics, error) {
	ids := deduplicateIDs(target.DeviceIDs)
	if len(ids) == 0 {
		return nil, Diagnostics{}, nil
	}
	topology, err := r.loadTopology(ctx)
	if err != nil {
		return nil, Diagnostics{}, err
	}
	fallback := fallbackPoints(ids, seed)
	points := make([]DevicePoint, 0, len(ids))
	diagnostics := Diagnostics{}
	for _, id := range ids {
		roots := deduplicateRoots(target.PositiveRoots[id])
		if len(roots) == 0 {
			diagnostics.MissingPositiveRoots = append(diagnostics.MissingPositiveRoots, id)
		}
		paths, cycles, err := r.devicePaths(ctx, id, roots)
		if err != nil {
			return nil, Diagnostics{}, err
		}
		diagnostics.CycleBranches += cycles
		if point, ok := topology.placements[structuralNode{kind: device.TargetDevice, id: string(id)}]; ok {
			points = append(points, DevicePoint{DeviceID: id, Point: point, Source: PointSourceDevice})
			continue
		}
		if point, ok := r.groupPoint(ctx, topology, id, paths, seed); ok {
			points = append(points, DevicePoint{DeviceID: id, Point: point, Source: PointSourceGroup})
			continue
		}
		if point, roomDiagnostics, ok := roomPoint(topology, id, paths, seed); ok {
			diagnostics.DegenerateRoomIDs = append(diagnostics.DegenerateRoomIDs, roomDiagnostics...)
			points = append(points, DevicePoint{DeviceID: id, Point: point, Source: PointSourceRoom})
			continue
		} else {
			diagnostics.DegenerateRoomIDs = append(diagnostics.DegenerateRoomIDs, roomDiagnostics...)
		}
		diagnostics.FallbackDeviceIDs = append(diagnostics.FallbackDeviceIDs, id)
		points = append(points, DevicePoint{DeviceID: id, Point: fallback[id], Source: PointSourceFallback})
	}
	normalizePointSet(points)
	slices.Sort(diagnostics.DegenerateRoomIDs)
	diagnostics.DegenerateRoomIDs = slices.Compact(diagnostics.DegenerateRoomIDs)
	return points, diagnostics, nil
}

func (r *Resolver) loadTopology(ctx context.Context) (*floorTopology, error) {
	r.mu.RLock()
	if r.topLoaded {
		topology := r.topology
		r.mu.RUnlock()
		return topology, nil
	}
	r.mu.RUnlock()
	floorplan, err := r.store.GetFloorplanGraph(ctx)
	if err != nil {
		return nil, err
	}
	topology := buildFloorTopology(floorplan)
	r.mu.Lock()
	if !r.topLoaded {
		r.topology = topology
		r.topLoaded = true
	}
	topology = r.topology
	r.mu.Unlock()
	return topology, nil
}

func deduplicateIDs(ids []device.DeviceID) []device.DeviceID {
	result := append([]device.DeviceID(nil), ids...)
	slices.Sort(result)
	return slices.Compact(result)
}

func deduplicateRoots(roots []StructuralRoot) []StructuralRoot {
	seen := map[StructuralRoot]bool{}
	result := make([]StructuralRoot, 0, len(roots))
	for _, root := range roots {
		if root.ID == "" || seen[root] {
			continue
		}
		if root.Type != device.TargetDevice && root.Type != device.TargetGroup && root.Type != device.TargetRoom {
			continue
		}
		seen[root] = true
		result = append(result, root)
	}
	slices.SortFunc(result, func(a, b StructuralRoot) int {
		if a.Type != b.Type {
			return compare(string(a.Type), string(b.Type))
		}
		return compare(a.ID, b.ID)
	})
	return result
}

func compare(left, right string) int {
	if left < right {
		return -1
	}
	if left > right {
		return 1
	}
	return 0
}

var errPathLimit = errors.New("membership graph exceeded safe path limit")
