//go:build e2e

package graphql_test

import (
	"encoding/json"
	"testing"
	"time"

	"github.com/saffronjam/saffron-hive/e2e/infra"
)

// TestButton_ActionFiredSubscription verifies the deviceActionFired
// subscription emits an event when a button publishes an action payload.
func TestButton_ActionFiredSubscription(t *testing.T) {
	ch, cleanup, err := wsSubscribe(
		`subscription { deviceActionFired { deviceId action firedAt } }`,
		nil,
	)
	if err != nil {
		t.Fatalf("subscribe: %v", err)
	}
	defer cleanup()

	time.Sleep(200 * time.Millisecond)

	buttonState, err := infra.LoadButtonState()
	if err != nil {
		t.Fatalf("load fixture: %v", err)
	}
	if err := publisher.PublishDeviceState("Office Button", buttonState); err != nil {
		t.Fatalf("publish: %v", err)
	}

	ok := pollUntil(5*time.Second, 50*time.Millisecond, func() bool {
		select {
		case data := <-ch:
			var event struct {
				DeviceActionFired struct {
					DeviceID string `json:"deviceId"`
					Action   string `json:"action"`
					FiredAt  string `json:"firedAt"`
				} `json:"deviceActionFired"`
			}
			if json.Unmarshal(data, &event) != nil {
				return false
			}
			return event.DeviceActionFired.Action == "single" &&
				event.DeviceActionFired.DeviceID != "" &&
				event.DeviceActionFired.FiredAt != ""
		default:
		}
		return false
	})
	if !ok {
		t.Fatal("timed out waiting for deviceActionFired event")
	}
}
