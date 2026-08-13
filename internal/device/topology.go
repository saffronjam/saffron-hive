package device

import "time"

// TopologyRole classifies a node's job in its mesh network, independent of
// protocol: Zigbee's coordinator/router/end-device and Thread's border
// router/router/sleepy-end-device map onto the same three shapes.
type TopologyRole string

const (
	// RoleHub is the network's single point of entry (Zigbee coordinator,
	// Thread border router).
	RoleHub TopologyRole = "hub"
	// RoleRelay forwards traffic for others (router).
	RoleRelay TopologyRole = "relay"
	// RoleLeaf only speaks for itself, usually battery-powered and asleep
	// between reports (end device).
	RoleLeaf TopologyRole = "leaf"
)

// TopologyLinkKind classifies what a link between two nodes means.
type TopologyLinkKind string

const (
	// LinkParent joins a leaf to the relay or hub that speaks for it.
	LinkParent TopologyLinkKind = "parent"
	// LinkRoute is a relay's active next hop toward the hub — the uplink its
	// traffic actually takes.
	LinkRoute TopologyLinkKind = "route"
	// LinkNeighbour records that two nodes hear each other, with no claim
	// that traffic flows between them.
	LinkNeighbour TopologyLinkKind = "neighbour"
)

// TopologyNode is one device in a mesh snapshot.
type TopologyNode struct {
	// ID is the node's provider-scoped identity (Zigbee: IEEE address).
	ID string `json:"id"`
	// DeviceID is set when the node is a registered Hive device. For Zigbee
	// the two always coincide, but a provider may report nodes Hive does not
	// manage.
	DeviceID *DeviceID    `json:"deviceId,omitempty"`
	Role     TopologyRole `json:"role"`
}

// TopologyLink is one undirected edge in a mesh snapshot. Source and target
// reference TopologyNode.ID; for parent links the source is the child.
type TopologyLink struct {
	Source string           `json:"source"`
	Target string           `json:"target"`
	Kind   TopologyLinkKind `json:"kind"`
	// Quality is normalized to 0-1 across providers; RawQuality keeps the
	// provider's native scale (Zigbee LQI 0-255).
	Quality    float64 `json:"quality"`
	RawQuality int     `json:"rawQuality"`
	// Stale marks a link carried forward from an earlier scan because the
	// node slept through the latest one. ObservedAt is when the link was
	// actually seen, so a stale link keeps its original timestamp.
	Stale      bool      `json:"stale"`
	ObservedAt time.Time `json:"observedAt"`
}

// NetworkTopology is one provider's mesh snapshot: what a network scan
// reported, at the time it reported it.
type NetworkTopology struct {
	Provider  Source
	ScannedAt time.Time
	Nodes     []TopologyNode
	Links     []TopologyLink
}
