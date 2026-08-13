package zigbee

import (
	"encoding/json"
	"testing"
	"time"

	"github.com/saffronjam/saffron-hive/internal/device"
	"github.com/saffronjam/saffron-hive/internal/eventbus"
)

func testNetworkmapValue() z2mNetworkmapValue {
	return z2mNetworkmapValue{
		Nodes: []z2mNetworkmapNode{
			{IEEEAddr: "0xcoord", FriendlyName: "Coordinator", Type: "Coordinator", NetworkAddress: 0},
			{IEEEAddr: "0xrouter1", FriendlyName: "Lamp 1", Type: "Router", NetworkAddress: 100},
			{IEEEAddr: "0xrouter2", FriendlyName: "Lamp 2", Type: "Router", NetworkAddress: 200},
			{IEEEAddr: "0xsensor", FriendlyName: "Sensor", Type: "EndDevice", NetworkAddress: 300},
		},
		Links: []z2mNetworkmapLink{
			// Sensor reports itself a child of router1.
			{
				Source:       z2mNetworkmapEndpoint{IEEEAddr: "0xsensor", NetworkAddress: 300},
				Target:       z2mNetworkmapEndpoint{IEEEAddr: "0xrouter1", NetworkAddress: 100},
				LQI:          180,
				Relationship: 1,
			},
			// Router1 uplinks to the coordinator: sibling entry carrying an
			// ACTIVE route destined for the hub.
			{
				Source:       z2mNetworkmapEndpoint{IEEEAddr: "0xrouter1", NetworkAddress: 100},
				Target:       z2mNetworkmapEndpoint{IEEEAddr: "0xcoord", NetworkAddress: 0},
				LQI:          200,
				Relationship: 2,
				Routes:       []z2mNetworkmapRoute{{DestinationAddress: 0, Status: "ACTIVE"}},
			},
			// Router2 hears router1: plain sibling, and its only route entry
			// is for a non-hub destination, so it stays a neighbour.
			{
				Source:       z2mNetworkmapEndpoint{IEEEAddr: "0xrouter2", NetworkAddress: 200},
				Target:       z2mNetworkmapEndpoint{IEEEAddr: "0xrouter1", NetworkAddress: 100},
				LQI:          90,
				Relationship: 2,
				Routes:       []z2mNetworkmapRoute{{DestinationAddress: 300, Status: "ACTIVE"}},
			},
			// Relationship "none" is still real radio contact.
			{
				Source:       z2mNetworkmapEndpoint{IEEEAddr: "0xrouter2", NetworkAddress: 200},
				Target:       z2mNetworkmapEndpoint{IEEEAddr: "0xcoord", NetworkAddress: 0},
				LQI:          40,
				Relationship: 3,
			},
		},
	}
}

func linkByPair(links []device.TopologyLink, a, b string) *device.TopologyLink {
	for i, l := range links {
		if (l.Source == a && l.Target == b) || (l.Source == b && l.Target == a) {
			return &links[i]
		}
	}
	return nil
}

func TestParseNetworkmapRolesAndDeviceIDs(t *testing.T) {
	topo := parseNetworkmap(testNetworkmapValue(), time.Now())

	if topo.Provider != device.SourceZigbee2MQTT {
		t.Fatalf("provider = %q", topo.Provider)
	}
	roles := map[string]device.TopologyRole{}
	for _, n := range topo.Nodes {
		roles[n.ID] = n.Role
		if n.DeviceID == nil || string(*n.DeviceID) != n.ID {
			t.Fatalf("zigbee node %q must join its Hive device by IEEE", n.ID)
		}
	}
	want := map[string]device.TopologyRole{
		"0xcoord":   device.RoleHub,
		"0xrouter1": device.RoleRelay,
		"0xrouter2": device.RoleRelay,
		"0xsensor":  device.RoleLeaf,
	}
	for id, role := range want {
		if roles[id] != role {
			t.Fatalf("node %q role = %q, want %q", id, roles[id], role)
		}
	}
}

func TestParseNetworkmapLinkKinds(t *testing.T) {
	topo := parseNetworkmap(testNetworkmapValue(), time.Now())

	if len(topo.Links) != 4 {
		t.Fatalf("want 4 links, got %d: %+v", len(topo.Links), topo.Links)
	}

	parent := linkByPair(topo.Links, "0xsensor", "0xrouter1")
	if parent == nil || parent.Kind != device.LinkParent {
		t.Fatalf("sensor-router1 must be a parent link, got %+v", parent)
	}
	if parent.Source != "0xsensor" || parent.Target != "0xrouter1" {
		t.Fatalf("parent link must run child to parent, got %+v", parent)
	}

	route := linkByPair(topo.Links, "0xrouter1", "0xcoord")
	if route == nil || route.Kind != device.LinkRoute {
		t.Fatalf("router1-coord carries a hub-destined route, got %+v", route)
	}

	if l := linkByPair(topo.Links, "0xrouter2", "0xrouter1"); l == nil || l.Kind != device.LinkNeighbour {
		t.Fatalf("non-hub route destinations stay neighbours, got %+v", l)
	}
	if l := linkByPair(topo.Links, "0xrouter2", "0xcoord"); l == nil || l.Kind != device.LinkNeighbour {
		t.Fatalf("relationship-none stays a neighbour, got %+v", l)
	}
}

func TestParseNetworkmapQuality(t *testing.T) {
	topo := parseNetworkmap(testNetworkmapValue(), time.Now())
	route := linkByPair(topo.Links, "0xrouter1", "0xcoord")
	if route.RawQuality != 200 {
		t.Fatalf("raw quality = %d, want 200", route.RawQuality)
	}
	if route.Quality < 0.78 || route.Quality > 0.79 {
		t.Fatalf("quality = %f, want 200/255", route.Quality)
	}
}

func TestParseNetworkmapReciprocalDedupe(t *testing.T) {
	v := testNetworkmapValue()
	// The parent side of the same edge, reported from router1's table with a
	// stronger reading: relationship 0 means "source is target's parent".
	v.Links = append(v.Links, z2mNetworkmapLink{
		Source:       z2mNetworkmapEndpoint{IEEEAddr: "0xrouter1", NetworkAddress: 100},
		Target:       z2mNetworkmapEndpoint{IEEEAddr: "0xsensor", NetworkAddress: 300},
		LQI:          220,
		Relationship: 0,
	})

	topo := parseNetworkmap(v, time.Now())
	if len(topo.Links) != 4 {
		t.Fatalf("reciprocal entries must collapse to one edge, got %d", len(topo.Links))
	}
	parent := linkByPair(topo.Links, "0xsensor", "0xrouter1")
	if parent.Kind != device.LinkParent || parent.Source != "0xsensor" {
		t.Fatalf("collapsed edge must stay child-to-parent, got %+v", parent)
	}
	if parent.RawQuality != 220 {
		t.Fatalf("collapsed edge keeps the strongest reading, got %d", parent.RawQuality)
	}
}

func TestParseNetworkmapDropsUnknownAndSelfLinks(t *testing.T) {
	v := testNetworkmapValue()
	v.Links = append(v.Links,
		z2mNetworkmapLink{
			Source: z2mNetworkmapEndpoint{IEEEAddr: "0xghost"},
			Target: z2mNetworkmapEndpoint{IEEEAddr: "0xcoord"},
			LQI:    100,
		},
		z2mNetworkmapLink{
			Source: z2mNetworkmapEndpoint{IEEEAddr: "0xrouter1", NetworkAddress: 100},
			Target: z2mNetworkmapEndpoint{IEEEAddr: "0xrouter1", NetworkAddress: 100},
			LQI:    100,
		},
	)
	topo := parseNetworkmap(v, time.Now())
	if len(topo.Links) != 4 {
		t.Fatalf("ghost and self links must be dropped, got %d links", len(topo.Links))
	}
}

func TestRequestNetworkmapPublishes(t *testing.T) {
	adapter, mqtt, _, _ := newTestAdapter()
	if err := adapter.Start(); err != nil {
		t.Fatal(err)
	}
	defer adapter.Stop()

	if err := adapter.RequestNetworkmap(); err != nil {
		t.Fatal(err)
	}

	pubs := mqtt.GetPublished()
	if len(pubs) != 1 {
		t.Fatalf("want 1 publish, got %d", len(pubs))
	}
	if pubs[0].Topic != "zigbee2mqtt/bridge/request/networkmap" {
		t.Fatalf("topic = %q", pubs[0].Topic)
	}
	var req struct {
		Type   string `json:"type"`
		Routes bool   `json:"routes"`
	}
	if err := json.Unmarshal(pubs[0].Payload, &req); err != nil {
		t.Fatalf("payload not JSON: %v", err)
	}
	if req.Type != "raw" || !req.Routes {
		t.Fatalf("want raw scan with routes, got %+v", req)
	}
}

func TestHandleNetworkmapResponsePublishesScan(t *testing.T) {
	adapter, mqtt, bus, _ := newTestAdapter()
	if err := adapter.Start(); err != nil {
		t.Fatal(err)
	}
	defer adapter.Stop()

	payload, err := json.Marshal(map[string]any{
		"status": "ok",
		"data": map[string]any{
			"type":  "raw",
			"value": testNetworkmapValue(),
		},
	})
	if err != nil {
		t.Fatal(err)
	}
	injectSync(adapter, mqtt, "zigbee2mqtt/bridge/response/networkmap", payload)

	events := bus.getEvents()
	if len(events) != 1 {
		t.Fatalf("want 1 event, got %d", len(events))
	}
	if events[0].Type != eventbus.EventNetworkTopologyScanned {
		t.Fatalf("event type = %q", events[0].Type)
	}
	topo, ok := events[0].Payload.(device.NetworkTopology)
	if !ok {
		t.Fatalf("payload is %T", events[0].Payload)
	}
	if len(topo.Nodes) != 4 || len(topo.Links) != 4 {
		t.Fatalf("parsed topology wrong shape: %d nodes / %d links", len(topo.Nodes), len(topo.Links))
	}
}

func TestHandleNetworkmapResponseErrorPublishesNothing(t *testing.T) {
	adapter, mqtt, bus, _ := newTestAdapter()
	if err := adapter.Start(); err != nil {
		t.Fatal(err)
	}
	defer adapter.Stop()

	injectSync(adapter, mqtt, "zigbee2mqtt/bridge/response/networkmap",
		[]byte(`{"status":"error","error":"Failed to execute LQI for some device"}`))

	if events := bus.getEvents(); len(events) != 0 {
		t.Fatalf("failed scan must publish nothing, got %+v", events)
	}
}
