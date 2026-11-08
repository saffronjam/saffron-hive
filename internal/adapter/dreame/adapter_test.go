package dreame

import (
	"context"
	"encoding/json"
	"net/http"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/saffronjam/saffron-hive/internal/cleaning"
	"github.com/saffronjam/saffron-hive/internal/device"
	"github.com/saffronjam/saffron-hive/internal/eventbus"
	"github.com/saffronjam/saffron-hive/internal/store"
)

type adapterMemory struct {
	identities []store.DreameDevice
	snapshots  []cleaning.Snapshot
}

func (s *adapterMemory) RegisterDreameDevice(_ context.Context, _ device.Device, d store.DreameDevice) error {
	s.identities = []store.DreameDevice{d}
	return nil
}
func (s *adapterMemory) ListDreameDevices(context.Context) ([]store.DreameDevice, error) {
	return s.identities, nil
}
func (s *adapterMemory) ListCleaningSnapshots(context.Context) ([]cleaning.Snapshot, error) {
	return s.snapshots, nil
}
func (s *adapterMemory) SaveCleaningSnapshot(_ context.Context, d cleaning.Snapshot) error {
	s.snapshots = []cleaning.Snapshot{d}
	return nil
}

func TestAdapterIdentitySurvivesRenameAndPreservesUserFields(t *testing.T) {
	name := "Robot"
	session := sessionFixture(t, func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		if r.URL.Path == "/dreame-auth/oauth/token" {
			_, _ = w.Write([]byte(`{"access_token":"token","uid":"account-1","expires_in":7200}`))
			return
		}
		_ = json.NewEncoder(w).Encode(map[string]any{"code": 0, "data": map[string]any{"page": map[string]any{"records": []map[string]any{{"did": "robot-1", "model": "dreame.vacuum.r2423", "customName": name, "bindDomain": "10000.mt.eu.iot.dreame.tech:19973", "online": true}}}}})
	})
	state := device.NewMemoryStore()
	storage := &adapterMemory{}
	adapter := NewAdapter(session, eventbus.NewChannelBus(), state, storage)
	first, err := adapter.Sync(t.Context())
	if err != nil || len(first) != 1 {
		t.Fatalf("discovery failed: %+v %v", first, err)
	}
	expected := device.DeviceID(uuid.NewSHA1(uuid.NameSpaceURL, []byte("dreame:account-1:robot-1")).String())
	if first[0].ID != expected {
		t.Fatal("unstable device identity")
	}
	renamed := first[0]
	userName := "Sucker"
	renamed.Name = &userName
	renamed.Disabled = true
	state.UpdateUserFields(renamed)
	name = "Robot renamed in app"
	second, err := adapter.Sync(t.Context())
	if err != nil || second[0].ID != expected {
		t.Fatal("rename changed identity")
	}
	actual, _ := state.GetDevice(expected)
	if actual.DisplayName() != userName || !actual.Disabled || actual.FriendlyName != name {
		t.Fatalf("sync lost user metadata: %+v", actual)
	}
}

func TestAdapterPublishesCurrentPositionSeparatelyFromSavedMap(t *testing.T) {
	encoded := mapFixture(t, 3, 2, []byte{1, 1, 128, 1, 1, 128}, `{"saveMapId":7}`)
	session := sessionFixture(t, func(w http.ResponseWriter, r *http.Request) {
		var body struct {
			Data struct {
				Method string `json:"method"`
			} `json:"data"`
		}
		_ = json.NewDecoder(r.Body).Decode(&body)
		w.Header().Set("Content-Type", "application/json")
		if body.Data.Method == "action" {
			_ = json.NewEncoder(w).Encode(map[string]any{"code": 0, "data": map[string]any{"result": map[string]any{"code": 0, "out": []map[string]any{{"piid": 1, "value": encoded}, {"piid": 5, "value": time.Now().UnixMilli()}}}}})
			return
		}
		_, _ = w.Write([]byte(`{"code":0,"data":{"result":[{"siid":2,"piid":1,"code":0,"value":13},{"siid":2,"piid":2,"code":0,"value":0},{"siid":3,"piid":1,"code":0,"value":100},{"siid":4,"piid":4,"code":0,"value":1},{"siid":4,"piid":5,"code":0,"value":2}]}}`))
	})
	session.client.token = "token"
	state := device.NewMemoryStore()
	state.Register(device.Device{ID: "robot", Source: device.SourceDreame, Type: device.Vacuum})
	storage := &adapterMemory{}
	bus := eventbus.NewChannelBus()
	events := bus.Subscribe(eventbus.EventCleaningUpdated)
	defer bus.Unsubscribe(events)
	adapter := NewAdapter(session, bus, state, storage)
	snapshot, err := adapter.poll(t.Context(), "robot", DeviceInfo{ID: "robot-1", Model: "dreame.vacuum.r2423", Shard: "10000"}, false)
	if err != nil {
		t.Fatal(err)
	}
	if snapshot.Status != cleaning.StatusDocked || snapshot.LiveMap == nil || snapshot.LiveAt == nil || snapshot.ActiveMapID != 7 || snapshot.Battery == nil || *snapshot.Battery != 100 {
		t.Fatalf("incomplete current snapshot: %+v", snapshot)
	}
	if snapshot.Model != "dreame.vacuum.r2423" || snapshot.Manufacturer != "" || !snapshot.Supports(cleaning.ActionEmptyBin) {
		t.Fatalf("missing vacuum identity or controls: %+v", snapshot)
	}
	if !adapter.Connected() {
		t.Fatal("successful poll was not reflected in connection state")
	}
	state.UpdateDeviceState("robot", device.DeviceState{Battery: snapshot.Battery, CleaningStatus: device.Ptr(string(snapshot.Status))})
	unchanged := bus.Subscribe(eventbus.EventDeviceStateChanged, eventbus.EventDeviceAvailabilityChanged)
	defer bus.Unsubscribe(unchanged)
	if _, err := adapter.poll(t.Context(), "robot", DeviceInfo{ID: "robot-1", Model: "dreame.vacuum.r2423", Shard: "10000"}, false); err != nil {
		t.Fatal(err)
	}
	select {
	case event := <-unchanged:
		t.Fatalf("unchanged poll generated activity: %s", event.Type)
	default:
	}

	select {
	case event := <-events:
		if _, ok := event.Payload.(cleaning.Snapshot); !ok {
			t.Fatal("wrong event payload")
		}
	case <-time.After(time.Second):
		t.Fatal("cleaning update missing")
	}
}

func TestAdapterReadsFinalMapWhenCleaningStops(t *testing.T) {
	for name, initialState := range map[string]int{"active": 1, "docked": 13} {
		t.Run(name, func(t *testing.T) {
			stateCode, mapReads := initialState, 0
			encoded := mapFixture(t, 3, 2, []byte{1, 1, 128, 1, 1, 128}, `{"saveMapId":7}`)
			session := sessionFixture(t, func(w http.ResponseWriter, r *http.Request) {
				var body struct {
					Data struct {
						Method string `json:"method"`
					} `json:"data"`
				}
				_ = json.NewDecoder(r.Body).Decode(&body)
				w.Header().Set("Content-Type", "application/json")
				if body.Data.Method == "action" {
					mapReads++
					_ = json.NewEncoder(w).Encode(map[string]any{"code": 0, "data": map[string]any{"result": map[string]any{"code": 0, "out": []map[string]any{{"piid": 1, "value": encoded}, {"piid": 5, "value": time.Now().UnixMilli()}}}}})
					return
				}
				_ = json.NewEncoder(w).Encode(map[string]any{"code": 0, "data": map[string]any{"result": []map[string]any{{"siid": 2, "piid": 1, "code": 0, "value": stateCode}, {"siid": 2, "piid": 2, "code": 0, "value": 0}}}})
			})
			session.client.token = "token"
			state := device.NewMemoryStore()
			state.Register(device.Device{ID: "robot", Source: device.SourceDreame, Type: device.Vacuum})
			adapter := NewAdapter(session, eventbus.NewChannelBus(), state, &adapterMemory{})
			info := DeviceInfo{ID: "robot-1", Model: "dreame.vacuum.r2423", Shard: "10000"}
			if _, err := adapter.poll(t.Context(), "robot", info, false); err != nil {
				t.Fatal(err)
			}
			stateCode = 2
			final, err := adapter.poll(t.Context(), "robot", info, false)
			if err != nil {
				t.Fatal(err)
			}
			if final.Status != cleaning.StatusIdle || final.LiveMap == nil || mapReads != 2 {
				t.Fatalf("final map not read: status=%s reads=%d", final.Status, mapReads)
			}
			if _, err = adapter.poll(t.Context(), "robot", info, false); err != nil {
				t.Fatal(err)
			}
			if mapReads != 2 {
				t.Fatalf("idle poll repeated the final map read: %d", mapReads)
			}

		})
	}
}

func TestAdapterReportsOptionalCleaningProgress(t *testing.T) {
	for _, tc := range []struct {
		name  string
		value json.RawMessage
		code  int
		want  *float64
	}{
		{"zero", json.RawMessage(`0`), 0, device.Ptr(0.0)},
		{"partial", json.RawMessage(`42.5`), 0, device.Ptr(42.5)},
		{"complete", json.RawMessage(`100`), 0, device.Ptr(100.0)},
		{"unavailable", json.RawMessage(`null`), -1, nil},
		{"invalid", json.RawMessage(`"unknown"`), 0, nil},
		{"negative", json.RawMessage(`-1`), 0, nil},
		{"above range", json.RawMessage(`101`), 0, nil},
	} {
		t.Run(tc.name, func(t *testing.T) {
			requested := false
			session := sessionFixture(t, func(w http.ResponseWriter, r *http.Request) {
				var body struct {
					Data struct {
						Params []PropertyKey `json:"params"`
					} `json:"data"`
				}
				if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
					t.Fatal(err)
				}
				for _, key := range body.Data.Params {
					if key.SIID == 4 && key.PIID == 63 {
						requested = true
					}
				}
				w.Header().Set("Content-Type", "application/json")
				_ = json.NewEncoder(w).Encode(map[string]any{"code": 0, "data": map[string]any{"result": []PropertyValue{
					{SIID: 2, PIID: 1, Value: json.RawMessage(`13`)},
					{SIID: 4, PIID: 63, Code: tc.code, Value: tc.value},
				}}})
			})
			session.client.token = "token"
			state := device.NewMemoryStore()
			state.Register(device.Device{ID: "robot", Source: device.SourceDreame, Type: device.Vacuum})
			storage := &adapterMemory{}
			adapter := NewAdapter(session, eventbus.NewChannelBus(), state, storage)
			adapter.snapshots["robot"] = cleaning.Snapshot{Status: cleaning.StatusDocked, Progress: device.Ptr(73.0), LiveMap: &cleaning.MapSnapshot{}, HistoryAt: time.Now()}
			got, err := adapter.poll(t.Context(), "robot", DeviceInfo{ID: "robot-1", Model: "dreame.vacuum.r2423", Shard: "10000"}, false)
			if err != nil {
				t.Fatal(err)
			}
			if !requested {
				t.Fatal("progress property was not requested")
			}
			if tc.want == nil {
				if got.Progress != nil {
					t.Fatalf("unavailable progress retained: %v", *got.Progress)
				}
			} else if got.Progress == nil || *got.Progress != *tc.want {
				t.Fatalf("progress = %v, want %v", got.Progress, *tc.want)
			}
		})
	}
}

func TestDiscoveryPersistsImagesWithoutADeviceStateRead(t *testing.T) {
	session := sessionFixture(t, func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/dreame-auth/oauth/token" {
			_, _ = w.Write([]byte(`{"access_token":"token","uid":"account","expires_in":7200}`))
			return
		}
		if r.URL.Path != "/dreame-user-iot/iotuserbind/device/listV2" {
			t.Fatal("metadata discovery requested a physical device command")
		}
		_, _ = w.Write([]byte(`{"code":0,"data":{"page":{"records":[{"did":"offline-vacuum","model":"dreame.vacuum.other","bindDomain":"10000.mt.eu.iot.dreame.tech:19973","online":false,"deviceInfo":{"mainImage":{"imageUrl":"https://example.com/product.png"}}}]}}}`))
	})
	storage := &adapterMemory{}
	adapter := NewAdapter(session, eventbus.NewChannelBus(), device.NewMemoryStore(), storage)
	devices, err := adapter.Sync(t.Context())
	if err != nil || len(devices) != 1 {
		t.Fatalf("discovery: %v", err)
	}
	if len(storage.snapshots) != 1 || len(storage.snapshots[0].ImageSources) != 1 || storage.snapshots[0].ImageSources[0] != "https://example.com/product.png" {
		t.Fatalf("image was not retained: %+v", storage.snapshots)
	}
	if devices[0].Available {
		t.Fatal("offline device was marked online")
	}
}
