package tuya

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestDoRefreshesTokenAfterTokenInvalidResponse(t *testing.T) {
	var tokenCalls int
	var statusCalls int

	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch r.URL.Path {
		case "/v1.0/token":
			tokenCalls++
			_ = json.NewEncoder(w).Encode(map[string]any{
				"success": true,
				"result": map[string]any{
					"access_token": "fresh-token",
				},
			})
		case "/v1.0/devices/ac-1/status":
			statusCalls++
			if r.Header.Get("access_token") == "stale-token" {
				_ = json.NewEncoder(w).Encode(map[string]any{
					"success": false,
					"code":    tuyaTokenInvalidCode,
					"msg":     "token invalid",
				})
				return
			}
			if got := r.Header.Get("access_token"); got != "fresh-token" {
				t.Fatalf("access token = %q, want fresh-token", got)
			}
			_ = json.NewEncoder(w).Encode(map[string]any{
				"success": true,
				"result": []map[string]any{
					{"code": "switch", "value": true},
				},
			})
		default:
			http.NotFound(w, r)
		}
	}))
	defer srv.Close()

	client := &CloudClient{
		cfg: Config{
			AccessID:     "id",
			AccessSecret: "secret",
			Region:       "eu",
			Enabled:      true,
		},
		host:  srv.URL,
		http:  srv.Client(),
		token: "stale-token",
	}

	status, err := client.DeviceStatus(context.Background(), "ac-1")
	if err != nil {
		t.Fatalf("DeviceStatus returned error: %v", err)
	}
	if len(status) != 1 || status[0].Code != "switch" || status[0].Value != true {
		t.Fatalf("status = %+v, want switch=true", status)
	}
	if tokenCalls != 1 {
		t.Fatalf("token calls = %d, want 1", tokenCalls)
	}
	if statusCalls != 2 {
		t.Fatalf("status calls = %d, want 2", statusCalls)
	}
}
