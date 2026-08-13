//go:build e2e

package graphql_test

import (
	"context"
	"encoding/json"
	"testing"
	"time"

	"github.com/saffronjam/saffron-hive/e2e/infra"
	"github.com/saffronjam/saffron-hive/internal/device"
)

func TestTopology_CoordinatorRegistersAsHubDevice(t *testing.T) {
	data, err := graphqlQuery(`query { devices { id type name friendlyName } }`, nil)
	if err != nil {
		t.Fatalf("devices query: %v", err)
	}
	var result struct {
		Devices []struct {
			ID           string `json:"id"`
			Type         string `json:"type"`
			FriendlyName string `json:"friendlyName"`
		} `json:"devices"`
	}
	if err := json.Unmarshal(data, &result); err != nil {
		t.Fatalf("unmarshal: %v", err)
	}
	for _, d := range result.Devices {
		if d.ID == "0x00124b0000000000" {
			if d.Type != "hub" {
				t.Fatalf("coordinator type = %q, want hub", d.Type)
			}
			return
		}
	}
	t.Fatal("coordinator not present in devices query")
}

func TestTopology_ScanRoundTrip(t *testing.T) {
	requests, err := publisher.SubscribeNetworkmapRequests()
	if err != nil {
		t.Fatalf("subscribe requests: %v", err)
	}

	events, cleanup, err := wsSubscribe(
		`subscription { networkTopologyUpdated { provider scannedAt nodeCount linkCount } }`,
		nil,
	)
	if err != nil {
		t.Fatalf("subscribe: %v", err)
	}
	defer cleanup()

	time.Sleep(200 * time.Millisecond)

	data, err := graphqlMutation(`mutation { scanZigbee2MqttNetwork }`, nil)
	if err != nil {
		t.Fatalf("scan mutation: %v", err)
	}
	var scanResult struct {
		ScanZigbee2MqttNetwork bool `json:"scanZigbee2MqttNetwork"`
	}
	if err := json.Unmarshal(data, &scanResult); err != nil || !scanResult.ScanZigbee2MqttNetwork {
		t.Fatalf("scan mutation result: %s err=%v", data, err)
	}

	select {
	case req := <-requests:
		var body struct {
			Type   string `json:"type"`
			Routes bool   `json:"routes"`
		}
		if err := json.Unmarshal(req.Payload, &body); err != nil || body.Type != "raw" || !body.Routes {
			t.Fatalf("scan request payload: %s", req.Payload)
		}
	case <-time.After(5 * time.Second):
		t.Fatal("no networkmap request reached MQTT")
	}

	fixture, err := infra.LoadNetworkmapResponse()
	if err != nil {
		t.Fatalf("load fixture: %v", err)
	}
	if err := publisher.PublishNetworkmapResponse(fixture); err != nil {
		t.Fatalf("publish response: %v", err)
	}

	gotEvent := pollUntil(5*time.Second, 50*time.Millisecond, func() bool {
		select {
		case data := <-events:
			var event struct {
				NetworkTopologyUpdated struct {
					Provider  string `json:"provider"`
					NodeCount int    `json:"nodeCount"`
					LinkCount int    `json:"linkCount"`
				} `json:"networkTopologyUpdated"`
			}
			if json.Unmarshal(data, &event) != nil {
				return false
			}
			e := event.NetworkTopologyUpdated
			return e.Provider == "zigbee2mqtt" && e.NodeCount == 4 && e.LinkCount == 4
		default:
			return false
		}
	})
	if !gotEvent {
		t.Fatal("timed out waiting for networkTopologyUpdated")
	}

	data, err = graphqlQuery(`query {
		networkTopologies { provider nodes { id deviceId role } links { source target kind stale rawQuality } }
	}`, nil)
	if err != nil {
		t.Fatalf("topologies query: %v", err)
	}
	var topoResult struct {
		NetworkTopologies []struct {
			Provider string `json:"provider"`
			Nodes    []struct {
				ID       string  `json:"id"`
				DeviceID *string `json:"deviceId"`
				Role     string  `json:"role"`
			} `json:"nodes"`
			Links []struct {
				Source     string `json:"source"`
				Target     string `json:"target"`
				Kind       string `json:"kind"`
				Stale      bool   `json:"stale"`
				RawQuality int    `json:"rawQuality"`
			} `json:"links"`
		} `json:"networkTopologies"`
	}
	if err := json.Unmarshal(data, &topoResult); err != nil {
		t.Fatalf("unmarshal: %v", err)
	}
	if len(topoResult.NetworkTopologies) != 1 {
		t.Fatalf("want 1 topology, got %d", len(topoResult.NetworkTopologies))
	}
	topo := topoResult.NetworkTopologies[0]
	kinds := map[string]int{}
	for _, l := range topo.Links {
		kinds[l.Kind]++
		if l.Stale {
			t.Fatalf("fresh scan must have no stale links: %+v", l)
		}
	}
	if kinds["parent"] != 1 || kinds["route"] != 1 || kinds["neighbour"] != 2 {
		t.Fatalf("link kinds = %v", kinds)
	}
	roles := map[string]string{}
	for _, n := range topo.Nodes {
		roles[n.ID] = n.Role
		if n.DeviceID == nil {
			t.Fatalf("zigbee node %q must carry its device id", n.ID)
		}
	}
	if roles["0x00124b0000000000"] != "hub" {
		t.Fatalf("coordinator role = %q", roles["0x00124b0000000000"])
	}

	// A second scan the end device sleeps through: its parent link must be
	// carried forward stale, end to end through merge and persistence.
	var second struct {
		Data struct {
			Value json.RawMessage `json:"value"`
		} `json:"data"`
	}
	if err := json.Unmarshal(fixture, &second); err != nil {
		t.Fatalf("parse fixture: %v", err)
	}
	var rawValue map[string]json.RawMessage
	if err := json.Unmarshal(second.Data.Value, &rawValue); err != nil {
		t.Fatalf("parse fixture value: %v", err)
	}
	var links []map[string]any
	if err := json.Unmarshal(rawValue["links"], &links); err != nil {
		t.Fatalf("parse fixture links: %v", err)
	}
	kept := links[:0]
	for _, l := range links {
		src := l["source"].(map[string]any)["ieeeAddr"].(string)
		tgt := l["target"].(map[string]any)["ieeeAddr"].(string)
		if src == "0x00158d0004d5e6f7" || tgt == "0x00158d0004d5e6f7" {
			continue
		}
		kept = append(kept, l)
	}
	linksJSON, _ := json.Marshal(kept)
	rawValue["links"] = linksJSON
	valueJSON, _ := json.Marshal(rawValue)
	secondPayload, _ := json.Marshal(map[string]any{
		"status": "ok",
		"data": map[string]any{
			"type":   "raw",
			"routes": true,
			"value":  json.RawMessage(valueJSON),
		},
	})
	if err := publisher.PublishNetworkmapResponse(secondPayload); err != nil {
		t.Fatalf("publish second response: %v", err)
	}

	staleCarried := pollUntil(5*time.Second, 50*time.Millisecond, func() bool {
		topo, err := sqlStore.GetNetworkTopology(context.Background(), device.SourceZigbee2MQTT)
		if err != nil || topo == nil {
			return false
		}
		for _, l := range topo.Links {
			if l.Source == "0x00158d0004d5e6f7" && l.Stale {
				return true
			}
		}
		return false
	})
	if !staleCarried {
		t.Fatal("sleeping end device's parent link was not carried forward stale")
	}
}
