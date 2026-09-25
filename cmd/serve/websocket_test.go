package serve

import (
	"errors"
	"fmt"
	"net"
	"testing"

	"github.com/99designs/gqlgen/graphql/handler/transport"
	"github.com/gorilla/websocket"
)

func TestWSRecoveryDiagnosticFromInit(t *testing.T) {
	t.Run("accepts a known reason and close code", func(t *testing.T) {
		diagnostic, ok := wsRecoveryDiagnosticFromInit(transport.InitPayload{
			"recoveryReason":    "heartbeat_timeout",
			"previousCloseCode": float64(4499),
		})

		if !ok {
			t.Fatal("expected recovery diagnostic")
		}
		if diagnostic.reason != "heartbeat_timeout" {
			t.Fatalf("reason = %q, want heartbeat_timeout", diagnostic.reason)
		}
		if diagnostic.previousCloseCode == nil || *diagnostic.previousCloseCode != 4499 {
			t.Fatalf("previous close code = %v, want 4499", diagnostic.previousCloseCode)
		}
	})

	t.Run("accepts every client recovery reason", func(t *testing.T) {
		for reason := range wsRecoveryReasons {
			diagnostic, ok := wsRecoveryDiagnosticFromInit(transport.InitPayload{
				"recoveryReason": reason,
			})
			if !ok || diagnostic.reason != reason {
				t.Fatalf("diagnostic for %q = %#v, %v", reason, diagnostic, ok)
			}
		}
	})

	t.Run("rejects an arbitrary reason", func(t *testing.T) {
		_, ok := wsRecoveryDiagnosticFromInit(transport.InitPayload{
			"recoveryReason": "token-value",
		})

		if ok {
			t.Fatal("expected arbitrary reason to be rejected")
		}
	})

	t.Run("ignores an invalid close code", func(t *testing.T) {
		diagnostic, ok := wsRecoveryDiagnosticFromInit(transport.InitPayload{
			"recoveryReason":    "foreground",
			"previousCloseCode": float64(5000),
		})

		if !ok {
			t.Fatal("expected recovery diagnostic")
		}
		if diagnostic.previousCloseCode != nil {
			t.Fatalf("previous close code = %d, want nil", *diagnostic.previousCloseCode)
		}
	})
}

func TestWSTransportErrorDetails(t *testing.T) {
	cases := []struct {
		name     string
		err      error
		read     bool
		code     int
		expected bool
	}{
		{name: "normal closure", err: &websocket.CloseError{Code: 1000}, read: true, code: 1000, expected: true},
		{name: "going away", err: &websocket.CloseError{Code: 1001}, read: true, code: 1001, expected: true},
		{name: "client termination", err: &websocket.CloseError{Code: 4499}, read: true, code: 4499, expected: true},
		{name: "abnormal closure", err: &websocket.CloseError{Code: 1006, Text: "unexpected EOF"}, read: true, code: 1006},
		{name: "policy violation", err: &websocket.CloseError{Code: 1008}, read: true, code: 1008},
		{name: "server failure", err: &websocket.CloseError{Code: 1011}, read: true, code: 1011},
		{name: "subscription cleanup", err: websocket.ErrCloseSent, expected: true},
		{name: "wrapped subscription cleanup", err: fmt.Errorf("complete subscription: %w", websocket.ErrCloseSent), expected: true},
		{name: "closed transport", err: net.ErrClosed, expected: true},
		{name: "gqlgen normal read closure", err: errors.New("websocket connection closed"), read: true, expected: true},
		{name: "write failure", err: errors.New("broken pipe")},
		{name: "read failure", err: errors.New("read timeout"), read: true},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			direction, code, expected := wsTransportErrorDetails(transport.WebsocketError{Err: tc.err, IsReadError: tc.read})
			wantDirection := "write"
			if tc.read {
				wantDirection = "read"
			}
			if direction != wantDirection || code != tc.code || expected != tc.expected {
				t.Fatalf("details = %q, %d, %v; want %q, %d, %v", direction, code, expected, wantDirection, tc.code, tc.expected)
			}
		})
	}
}
