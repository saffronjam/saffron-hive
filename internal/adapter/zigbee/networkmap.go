package zigbee

import (
	"encoding/json"
	"sort"
	"time"

	"github.com/saffronjam/saffron-hive/internal/device"
	"github.com/saffronjam/saffron-hive/internal/eventbus"
)

// RequestNetworkmap asks zigbee2mqtt for a raw topology scan with routing
// tables included. The scan walks every router on the mesh and takes minutes;
// the result arrives asynchronously on bridge/response/networkmap and is
// published on the bus as EventNetworkTopologyScanned.
func (a *ZigbeeAdapter) RequestNetworkmap() error {
	payload := []byte(`{"type":"raw","routes":true}`)
	if err := a.mqtt.Publish("zigbee2mqtt/bridge/request/networkmap", 0, false, payload); err != nil {
		logger.Error("failed to request networkmap", "error", err)
		return err
	}
	logger.Info("networkmap scan requested")
	return nil
}

func (a *ZigbeeAdapter) handleNetworkmapResponse(payload []byte) {
	var resp z2mNetworkmapResponse
	if err := json.Unmarshal(payload, &resp); err != nil {
		logger.Error("failed to parse networkmap response", "error", err)
		return
	}
	if resp.Status != "ok" {
		logger.Warn("networkmap scan failed", "error", resp.Error)
		return
	}
	if resp.Data.Type != "raw" {
		return
	}

	topo := parseNetworkmap(resp.Data.Value, time.Now())
	logger.Info("networkmap scan completed",
		"nodes", len(topo.Nodes), "links", len(topo.Links))
	a.bus.Publish(eventbus.Event{
		Type:      eventbus.EventNetworkTopologyScanned,
		Timestamp: topo.ScannedAt,
		Payload:   topo,
	})
}

// parseNetworkmap maps zigbee2mqtt's raw networkmap into the generic domain
// topology. Roles: Coordinator is the hub, Router a relay, everything else a
// leaf. Links collapse to one undirected edge per node pair with kind
// precedence parent > route > neighbour:
//
//   - a child neighbour-table entry (relationship 1) is a leaf's live
//     attachment — the parent maintains its child table actively, and a
//     sleeping leaf's parent entry is the only witness the mesh offers. The
//     link is normalized so Source is the child. Relationship 0 ("neighbour
//     is my parent") is NOT a parent link: routers keep their join-time
//     parent in the table indefinitely, so those entries describe history,
//     not the forwarding tree;
//   - an ACTIVE routing-table entry destined for the hub marks the edge as
//     part of a relay's real uplink path;
//   - every other heard-neighbour entry stays a neighbour: real radio
//     contact, no claim that traffic flows there.
func parseNetworkmap(v z2mNetworkmapValue, now time.Time) device.NetworkTopology {
	known := make(map[string]device.TopologyRole, len(v.Nodes))
	hubAddr := -1
	nodes := make([]device.TopologyNode, 0, len(v.Nodes))
	for _, n := range v.Nodes {
		role := device.RoleLeaf
		switch n.Type {
		case "Coordinator":
			role = device.RoleHub
			hubAddr = n.NetworkAddress
		case "Router":
			role = device.RoleRelay
		}
		id := device.DeviceID(n.IEEEAddr)
		nodes = append(nodes, device.TopologyNode{ID: n.IEEEAddr, DeviceID: &id, Role: role})
		known[n.IEEEAddr] = role
	}

	type edge struct {
		link device.TopologyLink
		rank int
	}
	rank := map[device.TopologyLinkKind]int{
		device.LinkParent:    3,
		device.LinkRoute:     2,
		device.LinkNeighbour: 1,
	}
	edges := make(map[[2]string]*edge)
	order := make([][2]string, 0, len(v.Links))

	for _, l := range v.Links {
		src, tgt := l.Source.IEEEAddr, l.Target.IEEEAddr
		if src == tgt {
			continue
		}
		if _, ok := known[src]; !ok {
			continue
		}
		if _, ok := known[tgt]; !ok {
			continue
		}

		kind := device.LinkNeighbour
		if l.Relationship == 1 {
			kind = device.LinkParent
		}
		if kind != device.LinkParent && routesToHub(l.Routes, hubAddr) {
			kind = device.LinkRoute
		}

		key := [2]string{src, tgt}
		if key[0] > key[1] {
			key[0], key[1] = key[1], key[0]
		}
		// A child entry already runs child-to-parent: the scanned parent
		// reports the neighbour (the source) as its child.
		link := device.TopologyLink{
			Source:     src,
			Target:     tgt,
			Kind:       kind,
			Quality:    float64(l.LQI) / 255,
			RawQuality: l.LQI,
			ObservedAt: now,
		}

		existing, ok := edges[key]
		if !ok {
			edges[key] = &edge{link: link, rank: rank[kind]}
			order = append(order, key)
			continue
		}
		// Reciprocal entries measure each direction separately; the edge
		// keeps the strongest reading regardless of which entry wins on kind.
		maxLQI := max(existing.link.RawQuality, l.LQI)
		if rank[kind] > existing.rank {
			existing.link, existing.rank = link, rank[kind]
		}
		existing.link.RawQuality = maxLQI
		existing.link.Quality = float64(maxLQI) / 255
	}

	sort.Slice(order, func(i, j int) bool {
		if order[i][0] != order[j][0] {
			return order[i][0] < order[j][0]
		}
		return order[i][1] < order[j][1]
	})
	links := make([]device.TopologyLink, 0, len(order))
	for _, key := range order {
		links = append(links, edges[key].link)
	}

	return device.NetworkTopology{
		Provider:  device.SourceZigbee2MQTT,
		ScannedAt: now,
		Nodes:     nodes,
		Links:     links,
	}
}

func routesToHub(routes []z2mNetworkmapRoute, hubAddr int) bool {
	if hubAddr < 0 {
		return false
	}
	for _, r := range routes {
		if r.Status == "ACTIVE" && r.DestinationAddress == hubAddr {
			return true
		}
	}
	return false
}
