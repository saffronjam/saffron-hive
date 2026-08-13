// Package topology persists mesh network snapshots published by protocol
// adapters, merging each new scan with the stored one so devices that slept
// through a scan keep their last-known links.
package topology

import (
	"github.com/saffronjam/saffron-hive/internal/device"
)

// MergeTopology carries last-known parent links forward for leaf nodes the
// new scan heard nothing from. A sleeping end device answers no neighbour
// query, so it arrives linkless (or entirely absent) in an otherwise complete
// scan; its previous parent link is copied in marked stale, keeping its
// original ObservedAt so the link's age stays honest. Hub and relay nodes are
// never carried — a silent router is a real gap, not a nap.
func MergeTopology(prev *device.NetworkTopology, next device.NetworkTopology) device.NetworkTopology {
	if prev == nil {
		return next
	}

	linked := make(map[string]struct{}, len(next.Links)*2)
	for _, l := range next.Links {
		linked[l.Source] = struct{}{}
		linked[l.Target] = struct{}{}
	}
	present := make(map[string]struct{}, len(next.Nodes))
	for _, n := range next.Nodes {
		present[n.ID] = struct{}{}
	}

	prevParents := make(map[string][]device.TopologyLink)
	for _, l := range prev.Links {
		if l.Kind != device.LinkParent {
			continue
		}
		prevParents[l.Source] = append(prevParents[l.Source], l)
	}

	merged := next
	merged.Nodes = append([]device.TopologyNode(nil), next.Nodes...)
	merged.Links = append([]device.TopologyLink(nil), next.Links...)

	carry := func(nodeID string) int {
		carried := 0
		for _, l := range prevParents[nodeID] {
			// Only re-attach to a parent the new scan still knows about.
			if _, ok := present[l.Target]; !ok {
				continue
			}
			l.Stale = true
			merged.Links = append(merged.Links, l)
			carried++
		}
		return carried
	}

	for _, n := range next.Nodes {
		if n.Role != device.RoleLeaf {
			continue
		}
		if _, ok := linked[n.ID]; ok {
			continue
		}
		carry(n.ID)
	}

	// A leaf missing from the scan entirely comes back only when at least one
	// of its old parents survived — a linkless carried node would float.
	for _, n := range prev.Nodes {
		if n.Role != device.RoleLeaf {
			continue
		}
		if _, ok := present[n.ID]; ok {
			continue
		}
		if carry(n.ID) > 0 {
			merged.Nodes = append(merged.Nodes, n)
			present[n.ID] = struct{}{}
		}
	}

	return merged
}
