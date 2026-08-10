//go:build e2e

package graphql_test

import (
	"encoding/json"
	"testing"
	"time"

	"github.com/saffronjam/saffron-hive/e2e/infra"
)

// TestMotion_OccupancyState verifies that a motion sensor's occupancy report
// propagates into DeviceState and that the device classifies as a sensor with
// the occupancy capability.
func TestMotion_OccupancyState(t *testing.T) {
	motionState, err := infra.LoadMotionState()
	if err != nil {
		t.Fatalf("load fixture: %v", err)
	}

	if err := publisher.PublishDeviceState("Hallway Motion Sensor", motionState); err != nil {
		t.Fatalf("publish state: %v", err)
	}

	deviceID, err := queryDeviceIDByName("Hallway Motion Sensor")
	if err != nil {
		t.Fatalf("find device: %v", err)
	}

	ok := pollUntil(5*time.Second, 100*time.Millisecond, func() bool {
		data, err := graphqlQuery(`query($id: ID!) {
			device(id: $id) {
				type
				capabilities { name }
				state { occupancy battery }
			}
		}`, map[string]any{"id": deviceID})
		if err != nil {
			return false
		}
		var result struct {
			Device struct {
				Type         string `json:"type"`
				Capabilities []struct {
					Name string `json:"name"`
				} `json:"capabilities"`
				State struct {
					Occupancy *bool    `json:"occupancy"`
					Battery   *float64 `json:"battery"`
				} `json:"state"`
			} `json:"device"`
		}
		if json.Unmarshal(data, &result) != nil {
			return false
		}
		if result.Device.Type != "sensor" {
			t.Fatalf("type=%q, want sensor", result.Device.Type)
		}
		hasOccupancyCap := false
		for _, c := range result.Device.Capabilities {
			if c.Name == "occupancy" {
				hasOccupancyCap = true
				break
			}
		}
		if !hasOccupancyCap {
			t.Fatalf("capabilities missing occupancy: %+v", result.Device.Capabilities)
		}
		return result.Device.State.Occupancy != nil && *result.Device.State.Occupancy &&
			result.Device.State.Battery != nil && *result.Device.State.Battery == 95
	})
	if !ok {
		t.Fatal("timed out waiting for occupancy state to propagate")
	}
}

// TestMotion_OccupancyClearedSubscription verifies the deviceStateChanged
// subscription carries occupancy flipping to false.
func TestMotion_OccupancyClearedSubscription(t *testing.T) {
	motionState, err := infra.LoadMotionState()
	if err != nil {
		t.Fatalf("load fixture: %v", err)
	}
	if err := publisher.PublishDeviceState("Hallway Motion Sensor", motionState); err != nil {
		t.Fatalf("publish occupied state: %v", err)
	}

	ch, cleanup, err := wsSubscribe(
		`subscription { deviceStateChanged { deviceId state { occupancy } } }`,
		nil,
	)
	if err != nil {
		t.Fatalf("subscribe: %v", err)
	}
	defer cleanup()

	time.Sleep(200 * time.Millisecond)

	if err := publisher.PublishDeviceState("Hallway Motion Sensor", []byte(`{"occupancy":false}`)); err != nil {
		t.Fatalf("publish cleared state: %v", err)
	}

	ok := pollUntil(5*time.Second, 50*time.Millisecond, func() bool {
		select {
		case data := <-ch:
			var event struct {
				DeviceStateChanged struct {
					DeviceID string `json:"deviceId"`
					State    struct {
						Occupancy *bool `json:"occupancy"`
					} `json:"state"`
				} `json:"deviceStateChanged"`
			}
			if json.Unmarshal(data, &event) == nil &&
				event.DeviceStateChanged.State.Occupancy != nil &&
				!*event.DeviceStateChanged.State.Occupancy {
				return true
			}
		default:
		}
		return false
	})
	if !ok {
		t.Fatal("timed out waiting for occupancy=false subscription event")
	}
}
