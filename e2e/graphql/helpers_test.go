//go:build e2e

package graphql_test

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"github.com/gorilla/websocket"
)

type graphqlRequest struct {
	Query     string         `json:"query"`
	Variables map[string]any `json:"variables,omitempty"`
}

type graphqlResponse struct {
	Data   json.RawMessage `json:"data"`
	Errors []graphqlError  `json:"errors"`
}

type graphqlError struct {
	Message string `json:"message"`
}

func graphqlQuery(query string, variables map[string]any) (json.RawMessage, error) {
	return graphqlPost(query, variables)
}

func graphqlMutation(query string, variables map[string]any) (json.RawMessage, error) {
	return graphqlPost(query, variables)
}

func graphqlPost(query string, variables map[string]any) (json.RawMessage, error) {
	body, err := json.Marshal(graphqlRequest{
		Query:     query,
		Variables: variables,
	})
	if err != nil {
		return nil, fmt.Errorf("marshal request: %w", err)
	}

	req, err := http.NewRequest(http.MethodPost, graphqlURL, bytes.NewReader(body))
	if err != nil {
		return nil, fmt.Errorf("new request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")
	if authToken != "" {
		req.Header.Set("Authorization", "Bearer "+authToken)
	}
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("post: %w", err)
	}
	defer func() { _ = resp.Body.Close() }()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("read response: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("unexpected status %d: %s", resp.StatusCode, string(respBody))
	}

	var gqlResp graphqlResponse
	if err := json.Unmarshal(respBody, &gqlResp); err != nil {
		return nil, fmt.Errorf("unmarshal response: %w", err)
	}

	if len(gqlResp.Errors) > 0 {
		return nil, fmt.Errorf("graphql errors: %v", gqlResp.Errors[0].Message)
	}

	return gqlResp.Data, nil
}

func graphqlPostRaw(query string, variables map[string]any) (graphqlResponse, error) {
	body, err := json.Marshal(graphqlRequest{
		Query:     query,
		Variables: variables,
	})
	if err != nil {
		return graphqlResponse{}, fmt.Errorf("marshal request: %w", err)
	}

	req, err := http.NewRequest(http.MethodPost, graphqlURL, bytes.NewReader(body))
	if err != nil {
		return graphqlResponse{}, fmt.Errorf("new request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")
	if authToken != "" {
		req.Header.Set("Authorization", "Bearer "+authToken)
	}
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return graphqlResponse{}, fmt.Errorf("post: %w", err)
	}
	defer func() { _ = resp.Body.Close() }()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return graphqlResponse{}, fmt.Errorf("read response: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		return graphqlResponse{}, fmt.Errorf("unexpected status %d: %s", resp.StatusCode, string(respBody))
	}

	var gqlResp graphqlResponse
	if err := json.Unmarshal(respBody, &gqlResp); err != nil {
		return graphqlResponse{}, fmt.Errorf("unmarshal response: %w", err)
	}

	return gqlResp, nil
}

func graphqlMutationExpectError(query string, variables map[string]any) error {
	gqlResp, err := graphqlPostRaw(query, variables)
	if err != nil {
		return fmt.Errorf("request failed at transport level: %w", err)
	}
	if len(gqlResp.Errors) == 0 {
		return fmt.Errorf("expected GraphQL errors but got none, data: %s", string(gqlResp.Data))
	}
	return nil
}

func wsSubscribe(query string, variables map[string]any) (<-chan json.RawMessage, func(), error) {
	wsURL := "ws" + strings.TrimPrefix(graphqlURL, "http")

	dialer := websocket.Dialer{}
	header := http.Header{}
	header.Set("Sec-WebSocket-Protocol", "graphql-ws")

	conn, _, err := dialer.DialContext(context.Background(), wsURL, header)
	if err != nil {
		return nil, nil, fmt.Errorf("dial: %w", err)
	}

	initPayload, _ := json.Marshal(map[string]string{"authToken": authToken})
	initMsg, _ := json.Marshal(wsMessage{Type: "connection_init", Payload: initPayload})
	if err := conn.WriteMessage(websocket.TextMessage, initMsg); err != nil {
		_ = conn.Close()
		return nil, nil, fmt.Errorf("send init: %w", err)
	}

	_ = conn.SetReadDeadline(time.Now().Add(5 * time.Second))
	_, raw, err := conn.ReadMessage()
	if err != nil {
		_ = conn.Close()
		return nil, nil, fmt.Errorf("read ack: %w", err)
	}
	var ack wsMessage
	_ = json.Unmarshal(raw, &ack)
	if ack.Type != "connection_ack" {
		_ = conn.Close()
		return nil, nil, fmt.Errorf("expected connection_ack, got %q", ack.Type)
	}

	subPayload := map[string]string{"query": query}
	if variables != nil {
		varsJSON, marshalErr := json.Marshal(variables)
		if marshalErr != nil {
			_ = conn.Close()
			return nil, nil, fmt.Errorf("marshal variables: %w", marshalErr)
		}
		subPayload = nil
		fullPayload := map[string]json.RawMessage{
			"query":     mustMarshalRaw(query),
			"variables": varsJSON,
		}
		payloadBytes, marshalErr := json.Marshal(fullPayload)
		if marshalErr != nil {
			_ = conn.Close()
			return nil, nil, fmt.Errorf("marshal payload: %w", marshalErr)
		}
		_ = subPayload
		subMsg, _ := json.Marshal(struct {
			ID      string          `json:"id"`
			Type    string          `json:"type"`
			Payload json.RawMessage `json:"payload"`
		}{ID: "1", Type: "start", Payload: payloadBytes})
		if err := conn.WriteMessage(websocket.TextMessage, subMsg); err != nil {
			_ = conn.Close()
			return nil, nil, fmt.Errorf("send start: %w", err)
		}
	} else {
		payloadBytes, _ := json.Marshal(subPayload)
		subMsg, _ := json.Marshal(struct {
			ID      string          `json:"id"`
			Type    string          `json:"type"`
			Payload json.RawMessage `json:"payload"`
		}{ID: "1", Type: "start", Payload: payloadBytes})
		if err := conn.WriteMessage(websocket.TextMessage, subMsg); err != nil {
			_ = conn.Close()
			return nil, nil, fmt.Errorf("send start: %w", err)
		}
	}

	ch := make(chan json.RawMessage, 16)
	done := make(chan struct{})

	go func() {
		defer close(ch)
		for {
			select {
			case <-done:
				return
			default:
			}
			_ = conn.SetReadDeadline(time.Now().Add(10 * time.Second))
			_, raw, readErr := conn.ReadMessage()
			if readErr != nil {
				return
			}
			var msg wsMessage
			if json.Unmarshal(raw, &msg) != nil {
				continue
			}
			if msg.Type == "data" {
				var envelope struct {
					Data json.RawMessage `json:"data"`
				}
				if json.Unmarshal(msg.Payload, &envelope) == nil {
					ch <- envelope.Data
				}
			}
		}
	}()

	cleanup := func() {
		close(done)
		stopMsg, _ := json.Marshal(wsMessage{ID: "1", Type: "stop"})
		_ = conn.WriteMessage(websocket.TextMessage, stopMsg)
		_ = conn.Close()
	}

	return ch, cleanup, nil
}

func mustMarshalRaw(v string) json.RawMessage {
	b, _ := json.Marshal(v)
	return b
}

func pollUntil(timeout time.Duration, interval time.Duration, fn func() bool) bool {
	deadline := time.Now().Add(timeout)
	for time.Now().Before(deadline) {
		if fn() {
			return true
		}
		time.Sleep(interval)
	}
	return false
}
