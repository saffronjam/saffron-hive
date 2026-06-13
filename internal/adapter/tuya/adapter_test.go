package tuya

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/saffronjam/saffron-hive/internal/device"
	"github.com/saffronjam/saffron-hive/internal/eventbus"
)

func TestCommandLoopPublishesCommandedStateWithoutStatusRefresh(t *testing.T) {
	var statusCalls int
	var commandCalls int
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch r.URL.Path {
		case "/v1.0/devices/ac-1/commands":
			commandCalls++
			_ = json.NewEncoder(w).Encode(map[string]any{
				"success": true,
				"result":  true,
			})
		case "/v1.0/devices/ac-1/status":
			statusCalls++
			_ = json.NewEncoder(w).Encode(map[string]any{
				"success": true,
				"result": []map[string]any{
					{"code": "switch", "value": false},
				},
			})
		default:
			http.NotFound(w, r)
		}
	}))
	defer srv.Close()

	bus := eventbus.NewChannelBus()
	store := device.NewMemoryStore()
	store.Register(device.Device{
		ID:     "ac-1",
		Name:   "AC",
		Source: Source,
		Type:   device.Climate,
		Capabilities: []device.Capability{
			{Name: device.CapOnOff},
		},
	})
	store.UpdateDeviceState("ac-1", device.DeviceState{On: device.Ptr(false)})

	adapter := NewAdapter(&CloudClient{
		cfg: Config{
			AccessID:     "id",
			AccessSecret: "secret",
			Region:       "eu",
			Enabled:      true,
		},
		host:  srv.URL,
		http:  srv.Client(),
		token: "token",
	}, bus, store)
	adapter.cmdCh = bus.Subscribe(eventbus.EventCommandRequested)
	adapter.wg.Add(1)
	go adapter.commandLoop(context.Background())
	defer func() {
		close(adapter.stopCh)
		bus.Unsubscribe(adapter.cmdCh)
		adapter.wg.Wait()
	}()

	stateCh := bus.Subscribe(eventbus.EventDeviceStateChanged)
	defer bus.Unsubscribe(stateCh)

	bus.Publish(eventbus.Event{
		Type:      eventbus.EventCommandRequested,
		DeviceID:  "ac-1",
		Timestamp: time.Now(),
		Payload: device.Command{
			DeviceID: "ac-1",
			On:       device.Ptr(true),
			Origin:   device.OriginUser(),
		},
	})

	select {
	case evt := <-stateCh:
		change, ok := evt.Payload.(device.DeviceStateChange)
		if !ok {
			t.Fatalf("payload type = %T, want device.DeviceStateChange", evt.Payload)
		}
		if change.State.On == nil || !*change.State.On {
			t.Fatalf("published on state = %v, want true", change.State.On)
		}
		if change.Origin != device.OriginUser() {
			t.Fatalf("origin = %+v, want user", change.Origin)
		}
	case <-time.After(time.Second):
		t.Fatal("timed out waiting for state event")
	}

	st, ok := store.GetDeviceState("ac-1")
	if !ok || st.On == nil || !*st.On {
		t.Fatalf("stored on state = %+v, want true", st)
	}
	if commandCalls != 1 {
		t.Fatalf("command calls = %d, want 1", commandCalls)
	}
	if statusCalls != 0 {
		t.Fatalf("status calls = %d, want 0", statusCalls)
	}
}
