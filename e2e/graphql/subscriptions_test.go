//go:build e2e

package graphql_test

import (
	"context"
	"encoding/json"
	"net/http"
	"strings"
	"testing"
	"time"

	"github.com/gorilla/websocket"
)

type wsMessage struct {
	ID      string          `json:"id,omitempty"`
	Type    string          `json:"type"`
	Payload json.RawMessage `json:"payload,omitempty"`
}

func TestSubscriptions_DeviceStateChanged(t *testing.T) {
	wsURL := "ws" + strings.TrimPrefix(graphqlURL, "http")

	dialer := websocket.Dialer{}
	header := http.Header{}
	header.Set("Sec-WebSocket-Protocol", "graphql-ws")

	conn, _, err := dialer.DialContext(context.Background(), wsURL, header)
	if err != nil {
		t.Fatalf("dial: %v", err)
	}
	defer func() { _ = conn.Close() }()

	initMsg, _ := json.Marshal(wsMessage{Type: "connection_init"})
	if err := conn.WriteMessage(websocket.TextMessage, initMsg); err != nil {
		t.Fatalf("send init: %v", err)
	}

	_ = conn.SetReadDeadline(time.Now().Add(5 * time.Second))
	_, raw, err := conn.ReadMessage()
	if err != nil {
		t.Fatalf("read ack: %v", err)
	}
	var ack wsMessage
	_ = json.Unmarshal(raw, &ack)
	if ack.Type != "connection_ack" {
		t.Fatalf("expected connection_ack, got %q", ack.Type)
	}

	subMsg, _ := json.Marshal(wsMessage{
		ID:   "1",
		Type: "start",
		Payload: mustMarshal(map[string]string{
			"query": `subscription { deviceStateChanged { deviceId state { ... on LightState { brightness } } } }`,
		}),
	})
	if err := conn.WriteMessage(websocket.TextMessage, subMsg); err != nil {
		t.Fatalf("send sub: %v", err)
	}

	time.Sleep(200 * time.Millisecond)

	statePayload := []byte(`{"state":"ON","brightness":180,"color_temp":300}`)
	if err := publisher.PublishDeviceState("Kitchen Light", statePayload); err != nil {
		t.Fatalf("publish: %v", err)
	}

	_ = conn.SetReadDeadline(time.Now().Add(5 * time.Second))
	_, raw, err = conn.ReadMessage()
	if err != nil {
		t.Fatalf("read data: %v", err)
	}

	var dataMsg wsMessage
	if err := json.Unmarshal(raw, &dataMsg); err != nil {
		t.Fatalf("unmarshal: %v", err)
	}

	if dataMsg.Type != "data" {
		t.Fatalf("expected type=data, got %q: %s", dataMsg.Type, string(raw))
	}

	var payload struct {
		Data struct {
			DeviceStateChanged struct {
				DeviceID string `json:"deviceId"`
				State    struct {
					Brightness *int `json:"brightness"`
				} `json:"state"`
			} `json:"deviceStateChanged"`
		} `json:"data"`
	}
	if err := json.Unmarshal(dataMsg.Payload, &payload); err != nil {
		t.Fatalf("unmarshal payload: %v", err)
	}

	if payload.Data.DeviceStateChanged.DeviceID == "" {
		t.Error("expected non-empty deviceId")
	}
	if payload.Data.DeviceStateChanged.State.Brightness == nil {
		t.Error("expected brightness to be set")
	} else if *payload.Data.DeviceStateChanged.State.Brightness != 180 {
		t.Errorf("brightness=%d, want 180", *payload.Data.DeviceStateChanged.State.Brightness)
	}

	stopMsg, _ := json.Marshal(wsMessage{ID: "1", Type: "stop"})
	_ = conn.WriteMessage(websocket.TextMessage, stopMsg)
}

func mustMarshal(v map[string]string) json.RawMessage {
	b, _ := json.Marshal(v)
	return b
}
