package dreame

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"reflect"
	"sync/atomic"
	"testing"
	"time"
)

func sessionFixture(t *testing.T, handle func(http.ResponseWriter, *http.Request)) *Session {
	t.Helper()
	server := httptest.NewServer(http.HandlerFunc(handle))
	t.Cleanup(server.Close)
	return &Session{client: newClient(server.Client(), server.URL, "owner@example.com"), credentials: Credentials{Email: "owner@example.com", Password: "private-password", Region: "eu"}, expires: time.Now().Add(time.Hour)}
}
func TestSessionRoomCommandIsBoundedAndNotRetried(t *testing.T) {
	var calls atomic.Int32
	s := sessionFixture(t, func(w http.ResponseWriter, r *http.Request) {
		calls.Add(1)
		var envelope struct {
			Data struct {
				Method string `json:"method"`
				Params struct {
					SIID  int           `json:"siid"`
					AIID  int           `json:"aiid"`
					Input []actionValue `json:"in"`
				} `json:"params"`
			} `json:"data"`
		}
		if err := json.NewDecoder(r.Body).Decode(&envelope); err != nil {
			t.Fatal(err)
		}
		if envelope.Data.Method != "action" || envelope.Data.Params.SIID != 4 || envelope.Data.Params.AIID != 1 {
			t.Errorf("wrong command: %+v", envelope)
		}
		if len(envelope.Data.Params.Input) != 2 {
			t.Fatal("missing room action inputs")
		}
		var text string
		_ = json.Unmarshal(envelope.Data.Params.Input[1].Value, &text)
		var options struct {
			Selects [][5]int `json:"selects"`
		}
		_ = json.Unmarshal([]byte(text), &options)
		if !reflect.DeepEqual(options.Selects, [][5]int{{2, 1, 1, 2, 1}, {3, 2, 2, 1, 1}}) {
			t.Errorf("wrong selected rooms: %+v", options)
		}
		w.WriteHeader(http.StatusGatewayTimeout)
	})
	s.client.token = "test-token"
	err := s.StartSegments(context.Background(), DeviceInfo{ID: "robot", Model: "dreame.vacuum.r2423", Shard: "10000"}, []SegmentOptions{{3, 2, 2, 1}, {2, 1, 1, 2}, {2, 1, 1, 2}})
	if err == nil || calls.Load() != 1 {
		t.Fatalf("ambiguous command was accepted or retried: %v %d", err, calls.Load())
	}
}
func TestSessionRejectsWholeHomeAndUnsupportedCommands(t *testing.T) {
	s := sessionFixture(t, func(http.ResponseWriter, *http.Request) { t.Fatal("invalid command reached transport") })
	d := DeviceInfo{ID: "robot", Model: "dreame.vacuum.r2423", Shard: "10000"}
	if err := s.StartSegments(t.Context(), d, nil); err == nil {
		t.Fatal("accepted whole-home start")
	}
	if err := s.Control(t.Context(), d, "start"); err == nil {
		t.Fatal("exposed unscoped start")
	}
	d.Model = "unknown"
	if err := s.Control(t.Context(), d, "resume"); err == nil {
		t.Fatal("accepted unsupported model")
	}
}
func TestSessionReusesAuthentication(t *testing.T) {
	var logins atomic.Int32
	s := sessionFixture(t, func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		if r.URL.Path == "/dreame-auth/oauth/token" {
			logins.Add(1)
			_, _ = w.Write([]byte(`{"access_token":"token","expires_in":7200}`))
			return
		}
		_, _ = w.Write([]byte(`{"code":0,"data":{"page":{"records":[]}}}`))
	})
	for range 2 {
		if _, err := s.Discover(t.Context()); err != nil {
			t.Fatal(err)
		}
	}
	if logins.Load() != 1 {
		t.Fatalf("expected reused session, got %d logins", logins.Load())
	}
}

func TestDiscoveryKeepsProviderProductNameSeparateFromNickname(t *testing.T) {
	s := sessionFixture(t, func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]any{"code": 0, "data": map[string]any{"page": map[string]any{"records": []map[string]any{
			{"did": "robot-1", "model": "dreame.vacuum.unlisted-model", "customName": "Kitchen helper", "bindDomain": "10000.mt.eu.iot.dreame.tech:19973", "online": true, "vendor": "Vendor from API", "deviceInfo": map[string]any{"displayName": "Product name from API", "mainImage": map[string]any{"imageUrl": "https://example.com/product.png"}, "icon": map[string]any{"imageUrl": "https://example.com/icon.png"}}},
			{"did": "robot-2", "model": "dreame.vacuum.another-model", "customName": "Other nickname", "bindDomain": "10000.mt.eu.iot.dreame.tech:19973", "deviceInfo": map[string]any{}},
		}}}})
	})
	s.client.token = "test-token"
	devices, err := s.Discover(t.Context())
	if err != nil || len(devices) != 2 {
		t.Fatalf("discovery: %v %+v", err, devices)
	}
	if devices[0].ProductName != "Product name from API" || devices[0].Name != "Kitchen helper" || devices[0].Model != "dreame.vacuum.unlisted-model" || devices[0].Manufacturer != "Vendor from API" {
		t.Fatalf("metadata conflated: %+v", devices[0])
	}
	if !reflect.DeepEqual(devices[0].ImageSources, []string{"https://example.com/product.png", "https://example.com/icon.png"}) || len(devices[1].ImageSources) != 0 {
		t.Fatalf("unexpected image sources: %v / %v", devices[0].ImageSources, devices[1].ImageSources)
	}
	if devices[1].ProductName != "" || devices[1].Manufacturer != "" {
		t.Fatalf("metadata invented: %+v", devices[1])
	}
}

func TestResetConsumableUsesReportedMaintenanceAction(t *testing.T) {
	var calls int
	for name, want := range map[string]int{"main_brush": 9, "side_brush": 10, "filter": 11, "sensors": 16} {
		t.Run(name, func(t *testing.T) {
			s := sessionFixture(t, func(w http.ResponseWriter, r *http.Request) {
				calls++
				var envelope struct {
					Data struct {
						Method string `json:"method"`
						Params struct {
							SIID  int               `json:"siid"`
							AIID  int               `json:"aiid"`
							Input []json.RawMessage `json:"in"`
						} `json:"params"`
					} `json:"data"`
				}
				if err := json.NewDecoder(r.Body).Decode(&envelope); err != nil {
					t.Fatal(err)
				}
				if envelope.Data.Method != "action" || envelope.Data.Params.SIID != want || envelope.Data.Params.AIID != 1 || len(envelope.Data.Params.Input) != 0 {
					t.Fatalf("wrong reset action: %+v", envelope)
				}
				_, _ = w.Write([]byte(`{"code":0,"data":{"result":{"code":0}}}`))
			})
			s.client.token = "token"
			if err := s.ResetConsumable(t.Context(), DeviceInfo{ID: "robot", Model: "dreame.vacuum.r2423", Shard: "10000"}, name); err != nil {
				t.Fatal(err)
			}
		})
	}
	if calls != 4 {
		t.Fatalf("reset calls=%d", calls)
	}
}
