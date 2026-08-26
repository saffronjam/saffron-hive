package serve

import (
	"errors"
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
	t.Run("extracts a read close code", func(t *testing.T) {
		direction, code := wsTransportErrorDetails(transport.WebsocketError{
			Err:         &websocket.CloseError{Code: 1006, Text: "unexpected EOF"},
			IsReadError: true,
		})

		if direction != "read" || code != 1006 {
			t.Fatalf("details = %q, %d; want read, 1006", direction, code)
		}
	})

	t.Run("reports a non-close write failure", func(t *testing.T) {
		direction, code := wsTransportErrorDetails(transport.WebsocketError{
			Err: errors.New("broken pipe"),
		})

		if direction != "write" || code != 0 {
			t.Fatalf("details = %q, %d; want write, 0", direction, code)
		}
	})
}
