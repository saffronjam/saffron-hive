package dreame

import (
	"context"
	"encoding/json"
	"net/http"
	"sync/atomic"
	"testing"
	"time"

	"github.com/saffronjam/saffron-hive/internal/cleaning"
	"github.com/saffronjam/saffron-hive/internal/device"
	"github.com/saffronjam/saffron-hive/internal/eventbus"
)

func dispatchFixture(t *testing.T, handler http.HandlerFunc) *Adapter {
	t.Helper()
	session := sessionFixture(t, handler)
	session.client.token = "token"
	state := device.NewMemoryStore()
	state.Register(device.Device{ID: "robot", Source: device.SourceDreame, Type: device.Vacuum, Available: true})
	adapter := NewAdapter(session, eventbus.NewChannelBus(), state, &adapterMemory{})
	adapter.devices["robot"] = DeviceInfo{ID: "external-robot", Model: "dreame.vacuum.r2423", Shard: "10000"}
	adapter.snapshots["robot"] = cleaning.Snapshot{DeviceID: "robot", Status: cleaning.StatusDocked, ActiveMapID: 7, LiveMap: &cleaning.MapSnapshot{ID: 7}, Maps: []cleaning.MapSnapshot{{ID: 7, Rooms: []cleaning.MapRoom{{ID: 2}}}}, HistoryAt: time.Now()}
	t.Cleanup(adapter.Stop)
	return adapter
}

func startOperation() cleaning.Operation {
	return cleaning.Operation{DeviceID: "robot", Action: "start", Plan: &cleaning.Plan{DeviceID: "robot", MapID: "7", AreaIDs: []string{"2"}, Options: cleaning.Options{Repeats: 1}}}
}

func TestStartVerifiesCurrentMap(t *testing.T) {
	for _, tc := range []struct {
		name, tail         string
		failMap, wantStart bool
	}{
		{name: "same map", tail: `{"saveMapId":7}`, wantStart: true},
		{name: "different map", tail: `{"saveMapId":8}`},
		{name: "map unavailable", failMap: true},
	} {
		t.Run(tc.name, func(t *testing.T) {
			var mapReads, starts atomic.Int32
			encoded := mapFixture(t, 3, 2, []byte{1, 1, 128, 1, 1, 128}, tc.tail)
			adapter := dispatchFixture(t, func(w http.ResponseWriter, r *http.Request) {
				var body struct {
					Data struct {
						Method string          `json:"method"`
						Params json.RawMessage `json:"params"`
					} `json:"data"`
				}
				if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
					t.Error(err)
					return
				}
				if body.Data.Method == "get_properties" {
					_, _ = w.Write([]byte(`{"code":0,"data":{"result":[{"siid":2,"piid":1,"value":13},{"siid":2,"piid":2,"value":0},{"siid":4,"piid":4,"value":1},{"siid":4,"piid":5,"value":1}]}}`))
					return
				}
				var action struct {
					SIID int `json:"siid"`
				}
				if err := json.Unmarshal(body.Data.Params, &action); err != nil {
					t.Error(err)
					return
				}
				if action.SIID == 6 {
					mapReads.Add(1)
					if tc.failMap {
						http.Error(w, "unavailable", http.StatusBadGateway)
						return
					}
					_ = json.NewEncoder(w).Encode(map[string]any{"code": 0, "data": map[string]any{"result": map[string]any{"code": 0, "out": []map[string]any{{"piid": 1, "value": encoded}}}}})
					return
				}
				starts.Add(1)
				_, _ = w.Write([]byte(`{"code":0,"data":{"result":{"code":0}}}`))
			})
			err := adapter.DispatchCleaning(t.Context(), startOperation())
			if (err == nil) != tc.wantStart || starts.Load() != map[bool]int32{true: 1, false: 0}[tc.wantStart] || mapReads.Load() != 1 {
				t.Fatalf("start=%d map reads=%d err=%v", starts.Load(), mapReads.Load(), err)
			}
		})
	}
}

func TestStopCancelsAndJoinsInFlightDispatch(t *testing.T) {
	readStarted, release := make(chan struct{}), make(chan struct{})
	var starts atomic.Int32
	adapter := dispatchFixture(t, func(w http.ResponseWriter, r *http.Request) {
		var body struct {
			Data struct {
				Method string `json:"method"`
			} `json:"data"`
		}
		_ = json.NewDecoder(r.Body).Decode(&body)
		if body.Data.Method == "get_properties" {
			close(readStarted)
			<-release
			_, _ = w.Write([]byte(`{"code":0,"data":{"result":[{"siid":2,"piid":1,"value":13},{"siid":2,"piid":2,"value":0},{"siid":4,"piid":4,"value":1},{"siid":4,"piid":5,"value":1}]}}`))
			return
		}
		starts.Add(1)
		_, _ = w.Write([]byte(`{"code":0,"data":{"result":{"code":0}}}`))
	})
	done := make(chan error, 1)
	go func() { done <- adapter.DispatchCleaning(context.Background(), startOperation()) }()
	<-readStarted
	stopped := make(chan struct{})
	go func() { adapter.Stop(); close(stopped) }()
	select {
	case <-stopped:
	case <-time.After(time.Second):
		close(release)
		t.Fatal("stop did not cancel its dispatch")
	}
	select {
	case err := <-done:
		close(release)
		if err == nil {
			t.Fatal("cancelled dispatch succeeded")
		}
	case <-time.After(time.Second):
		close(release)
		<-done
		t.Fatal("stop returned with a dispatch still running")
	}
	if starts.Load() != 0 {
		t.Fatal("stopped adapter sent an action")
	}
	found, _ := adapter.state.GetDevice("robot")
	if found.Available {
		t.Fatal("stopped adapter became available")
	}
	if err := adapter.DispatchCleaning(t.Context(), startOperation()); err == nil {
		t.Fatal("stopped adapter accepted another command")
	}
}
