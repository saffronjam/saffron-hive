package graph

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"path/filepath"
	"strings"
	"testing"
	"time"

	"github.com/99designs/gqlgen/graphql/handler"
	"github.com/99designs/gqlgen/graphql/handler/transport"
	"github.com/saffronjam/saffron-hive/internal/auth"
	"github.com/saffronjam/saffron-hive/internal/cleaning"
	"github.com/saffronjam/saffron-hive/internal/device"
	"github.com/saffronjam/saffron-hive/internal/store"
	"github.com/saffronjam/saffron-hive/internal/testdb"
)

var cleaningTemplate = testdb.NewTemplate(store.Migrations, "migrations")

type cleaningTestOutput struct {
	count int
	store *store.DB
}

func (o *cleaningTestOutput) SubmitCleaning(ctx context.Context, op cleaning.Operation) error {
	o.count++
	snapshots, err := o.store.ListCleaningSnapshots(ctx)
	if err != nil {
		return err
	}
	if op.Action == "pause" && len(snapshots) > 0 {
		snapshots[0].Status = cleaning.StatusPaused
		snapshots[0].UpdatedAt = time.Now()
		return o.store.SaveCleaningSnapshot(ctx, snapshots[0])
	}
	return nil
}
func cleaningEnvironment(t *testing.T) (*testEnv, *store.DB, *cleaningTestOutput) {
	t.Helper()
	env := newTestEnv(t)
	db, err := cleaningTemplate.Open(filepath.Join(t.TempDir(), "cleaning.db"), "_pragma=foreign_keys(1)")
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { _ = db.Close() })
	storage := store.New(db)
	d := device.Device{ID: "robot", Source: device.SourceDreame, Type: device.Vacuum, Available: true, Capabilities: []device.Capability{{Name: device.CapCleaning}}}
	env.stateReader.addDevice(d)
	if err = storage.UpsertDevice(t.Context(), store.CreateDeviceParams{ID: d.ID, FriendlyName: "Vacuum", Source: d.Source, Type: d.Type, Capabilities: d.Capabilities}); err != nil {
		t.Fatal(err)
	}
	for _, id := range []string{"kitchen", "living"} {
		if _, err = storage.CreateRoom(t.Context(), store.CreateRoomParams{ID: id, Name: id}); err != nil {
			t.Fatal(err)
		}
	}
	snapshot := cleaning.Snapshot{DeviceID: "robot", Supported: true, Status: cleaning.StatusDocked, ActiveMapID: 7, UpdatedAt: time.Now(), Maps: []cleaning.MapSnapshot{{ID: 7, Revision: "geometry", Rooms: []cleaning.MapRoom{{ID: 1}}}}}
	if err = storage.SaveCleaningSnapshot(t.Context(), snapshot); err != nil {
		t.Fatal(err)
	}
	if err = storage.ReplaceCleaningRoomLinks(t.Context(), "robot", cleaning.RoomLinks{MapID: "7", MapRevision: "geometry", Links: []cleaning.RoomLink{{RoomID: "kitchen", AreaID: "1"}, {RoomID: "living", AreaID: "1"}}}); err != nil {
		t.Fatal(err)
	}
	output := &cleaningTestOutput{store: storage}
	env.resolver.Cleaning = cleaning.NewService(storage, env.stateReader, output, env.bus)
	return env, storage, output
}

const prepareCleaningQuery = `mutation($input:CleaningSelectionInput!){prepareCleaning(input:$input){revision roomIds areaIds}}`
const startCleaningQuery = `mutation($input:StartCleaningInput!){startCleaning(input:$input){id state roomIds}}`

func cleaningSelection() map[string]any {
	return map[string]any{"deviceId": "robot", "mapId": "7", "roomIds": []string{"kitchen"}, "options": map[string]any{}}
}
func preparedRevision(t *testing.T, env *testEnv) string {
	t.Helper()
	response := env.query(t, prepareCleaningQuery, map[string]any{"input": cleaningSelection()})
	if len(response.Errors) > 0 {
		t.Fatalf("preparation: %+v", response.Errors)
	}
	var data struct {
		Prepare struct {
			Revision string   `json:"revision"`
			RoomIDs  []string `json:"roomIds"`
		} `json:"prepareCleaning"`
	}
	if err := json.Unmarshal(response.Data, &data); err != nil {
		t.Fatal(err)
	}
	if len(data.Prepare.RoomIDs) != 2 {
		t.Fatal("shared room expansion missing")
	}
	return data.Prepare.Revision
}
func TestCleaningAPIExpandsRoomsAndDeduplicatesStart(t *testing.T) {
	env, _, output := cleaningEnvironment(t)
	revision := preparedRevision(t, env)
	input := map[string]any{"selection": cleaningSelection(), "expectedRevision": revision, "requestId": "request-1"}
	first := env.query(t, startCleaningQuery, map[string]any{"input": input})
	if len(first.Errors) > 0 {
		t.Fatalf("start: %+v", first.Errors)
	}
	second := env.query(t, startCleaningQuery, map[string]any{"input": input})
	if len(second.Errors) > 0 || output.count != 1 {
		t.Fatalf("duplicate command dispatched: %d %+v", output.count, second.Errors)
	}
	input["requestId"] = "request-2"
	busy := env.query(t, startCleaningQuery, map[string]any{"input": input})
	if len(busy.Errors) == 0 || output.count != 1 {
		t.Fatal("busy robot was interrupted without consent")
	}
}
func TestCleaningAPIRejectsChangedLinks(t *testing.T) {
	env, storage, output := cleaningEnvironment(t)
	revision := preparedRevision(t, env)
	if err := storage.ReplaceCleaningRoomLinks(t.Context(), "robot", cleaning.RoomLinks{Revision: 1, MapID: "7", MapRevision: "geometry", Links: []cleaning.RoomLink{{RoomID: "kitchen", AreaID: "1"}}}); err != nil {
		t.Fatal(err)
	}
	result := env.query(t, startCleaningQuery, map[string]any{"input": map[string]any{"selection": cleaningSelection(), "expectedRevision": revision, "requestId": "request"}})
	if len(result.Errors) == 0 || output.count != 0 {
		t.Fatal("stale preparation sent a physical command")
	}
}
func TestCleaningAPIRequiresRegisteredAccount(t *testing.T) {
	for _, guest := range []bool{false, true} {
		srv := handler.New(NewExecutableSchema(Config{Resolvers: &Resolver{}, Directives: DirectiveRoot{Auth: AuthDirective}}))
		srv.AddTransport(transport.POST{})
		req := httptest.NewRequest(http.MethodPost, "/graphql", strings.NewReader(`{"query":"{cleaningDevices{deviceId}}"}`))
		req.Header.Set("Content-Type", "application/json")
		if guest {
			req = req.WithContext(auth.WithPrincipal(req.Context(), auth.Principal{ID: "guest", Guest: true}))
		}
		result := httptest.NewRecorder()
		srv.ServeHTTP(result, req)
		if !strings.Contains(result.Body.String(), `"errors"`) {
			t.Fatalf("cleaning data exposed: %s", result.Body.String())
		}
	}
}

type cleaningConfigController struct{ config store.DreameConfig }

func (c *cleaningConfigController) ReconnectDreame(context.Context) error { return nil }
func (c *cleaningConfigController) TestDreame(_ context.Context, cfg store.DreameConfig) error {
	c.config = cfg
	return nil
}
func (c *cleaningConfigController) DreameConnected() bool { return true }
func TestDreameConfigRedactsAndKeepsStoredPassword(t *testing.T) {
	env := newTestEnv(t)
	controller := &cleaningConfigController{}
	env.resolver.DreameIntegration = controller
	mutation := `mutation($input:DreameConfigInput!,$revision:Int!){updateDreameConfig(input:$input,expectedRevision:$revision){config{revision email password enabled}application{success}}}`
	input := map[string]any{"email": "owner@example.com", "password": "private-app-password", "region": "eu", "enabled": true}
	result := env.query(t, mutation, map[string]any{"input": input, "revision": 0})
	if len(result.Errors) != 0 || strings.Contains(string(result.Data), "private-app-password") || !strings.Contains(string(result.Data), redactedPasswordSentinel) {
		t.Fatalf("unsafe config response: %s %+v", result.Data, result.Errors)
	}
	input["password"] = redactedPasswordSentinel
	input["enabled"] = false
	result = env.query(t, mutation, map[string]any{"input": input, "revision": 1})
	if len(result.Errors) != 0 {
		t.Fatal(result.Errors)
	}
	result = env.query(t, `mutation($input:DreameConfigInput!){testDreameConnection(input:$input){success}}`, map[string]any{"input": input})
	if len(result.Errors) != 0 || controller.config.Password != "private-app-password" {
		t.Fatal("stored password was not retained for connection test")
	}
}

func TestCleaningAutomationPayloadRoundTripsThroughGraphQL(t *testing.T) {
	env := newTestEnv(t)
	env.store.putDevice(device.Device{ID: "robot", Type: device.Vacuum, Capabilities: []device.Capability{{Name: device.CapCleaning}}})
	input := map[string]any{"name": "Clean kitchen", "enabled": false, "nodes": []map[string]any{{"id": "t1", "type": "trigger", "config": json.RawMessage(`{"trigger":{"mode":"custom","eventType":"device.state_changed","customExpr":"true"}}`)}, {"id": "a1", "type": "action", "config": json.RawMessage(`{"action":{"actionType":"start_cleaning","targetType":"device","targetId":"robot","payload":{"roomIds":["kitchen"],"options":{"repeats":2,"suction":1}}}}`)}}, "edges": []map[string]any{{"fromNodeId": "t1", "toNodeId": "a1"}}}
	result := env.query(t, `mutation($input:CreateAutomationInput!){createAutomation(input:$input){nodes{id config{action{payload{roomIds options{repeats suction}}}}}}}`, map[string]any{"input": input})
	if len(result.Errors) > 0 {
		t.Fatalf("cleaning action rejected: %+v", result.Errors)
	}
	if !strings.Contains(string(result.Data), `"roomIds":["kitchen"]`) || !strings.Contains(string(result.Data), `"repeats":2`) || !strings.Contains(string(result.Data), `"suction":1`) {
		t.Fatalf("selection lost: %s", result.Data)
	}
}

func TestCleaningApartmentScopeIncludesEveryNativeArea(t *testing.T) {
	env, storage, output := cleaningEnvironment(t)
	snaps, err := storage.ListCleaningSnapshots(t.Context())
	if err != nil {
		t.Fatal(err)
	}
	snaps[0].Maps[0].Rooms = append(snaps[0].Maps[0].Rooms, cleaning.MapRoom{ID: 2})
	if err := storage.SaveCleaningSnapshot(t.Context(), snaps[0]); err != nil {
		t.Fatal(err)
	}
	selection := cleaningSelection()
	selection["scope"] = "APARTMENT"
	selection["roomIds"] = []string{}
	response := env.query(t, `mutation($input:CleaningSelectionInput!){prepareCleaning(input:$input){scope areaIds roomIds revision}}`, map[string]any{"input": selection})
	if len(response.Errors) > 0 {
		t.Fatal(response.Errors)
	}
	var data struct {
		Plan struct {
			Scope    string
			AreaIDs  []string
			Revision string
		} `json:"prepareCleaning"`
	}
	if err := json.Unmarshal(response.Data, &data); err != nil {
		t.Fatal(err)
	}
	if data.Plan.Scope != "APARTMENT" || len(data.Plan.AreaIDs) != 2 || output.count != 0 {
		t.Fatalf("incorrect apartment preview: %s", response.Data)
	}
	response = env.query(t, `mutation($input:StartCleaningInput!){startCleaning(input:$input){scope}}`, map[string]any{"input": map[string]any{"selection": selection, "expectedRevision": data.Plan.Revision, "requestId": "apartment-request"}})
	if len(response.Errors) > 0 || output.count != 1 || !strings.Contains(string(response.Data), "APARTMENT") {
		t.Fatalf("apartment scope lost at start: %s %+v", response.Data, response.Errors)
	}
}

func TestCleaningAPIExposesNullableReportedProgress(t *testing.T) {
	env, storage, _ := cleaningEnvironment(t)
	snapshots, err := storage.ListCleaningSnapshots(t.Context())
	if err != nil {
		t.Fatal(err)
	}
	for _, value := range []*float64{nil, device.Ptr(0.0), device.Ptr(42.5), device.Ptr(100.0), nil} {
		snapshots[0].Progress = value
		if err := storage.SaveCleaningSnapshot(t.Context(), snapshots[0]); err != nil {
			t.Fatal(err)
		}
		response := env.query(t, `{cleaningDevice(deviceId:"robot"){progress}}`, nil)
		if len(response.Errors) > 0 {
			t.Fatalf("progress query: %+v", response.Errors)
		}
		var data struct {
			Device struct {
				Progress *float64 `json:"progress"`
			} `json:"cleaningDevice"`
		}
		if err := json.Unmarshal(response.Data, &data); err != nil {
			t.Fatal(err)
		}
		if value == nil {
			if data.Device.Progress != nil {
				t.Fatal("unavailable progress must be null")
			}
		} else if data.Device.Progress == nil || *data.Device.Progress != *value {
			t.Fatalf("reported progress was not preserved: %v", data.Device.Progress)
		}
	}
}

func TestCleaningAPIEstimatesProgressOnlyWithoutReportedValue(t *testing.T) {
	env, storage, _ := cleaningEnvironment(t)
	if err := storage.ReplaceFloorplan(t.Context(), store.ReplaceFloorplanParams{
		ID: "floor", Name: "Home",
		Vertices: []store.FloorplanVertex{{ID: "a"}, {ID: "b", X: 2}, {ID: "c", X: 5}, {ID: "d", X: 5, Y: 4}, {ID: "e", X: 2, Y: 4}, {ID: "f", Y: 4}},
		Walls:    []store.FloorplanWall{{ID: "ab", VertexA: "a", VertexB: "b"}, {ID: "bc", VertexA: "b", VertexB: "c"}, {ID: "cd", VertexA: "c", VertexB: "d"}, {ID: "de", VertexA: "d", VertexB: "e"}, {ID: "ef", VertexA: "e", VertexB: "f"}, {ID: "fa", VertexA: "f", VertexB: "a"}, {ID: "be", VertexA: "b", VertexB: "e"}},
		Rooms:    []store.FloorplanRoom{{ID: "k", RoomID: device.Ptr("kitchen"), VertexIDs: []string{"a", "b", "e", "f"}}, {ID: "l", RoomID: device.Ptr("living"), VertexIDs: []string{"b", "c", "d", "e"}}},
	}); err != nil {
		t.Fatal(err)
	}
	now := time.Now()
	task := cleaning.Task{ID: "estimate-task", DeviceID: "robot", RequestID: "estimate-request", State: cleaning.TaskStarting, Origin: "user", CreatedAt: now.Add(-time.Minute), UpdatedAt: now, Plan: cleaning.Plan{DeviceID: "robot", MapID: "7", RoomIDs: []string{"kitchen", "living"}, AreaIDs: []string{"1"}, Options: cleaning.Options{Repeats: 1}}}
	if err := storage.CreateCleaningTask(t.Context(), task); err != nil {
		t.Fatal(err)
	}
	if err := storage.TransitionCleaningTask(t.Context(), task.ID, cleaning.TaskStarting, cleaning.TaskRunning, "", now); err != nil {
		t.Fatal(err)
	}
	snapshots, err := storage.ListCleaningSnapshots(t.Context())
	if err != nil {
		t.Fatal(err)
	}
	snapshots[0].Maps[0].Rooms[0].Area = 20
	snapshots[0].Status = cleaning.StatusCleaning
	snapshots[0].UpdatedAt = now
	snapshots[0].CleanedArea = device.Ptr(5.0)
	for _, reported := range []*float64{nil, device.Ptr(0.0), device.Ptr(60.0), nil} {
		snapshots[0].Progress = reported
		if err := storage.SaveCleaningSnapshot(t.Context(), snapshots[0]); err != nil {
			t.Fatal(err)
		}
		response := env.query(t, `{cleaningDevice(deviceId:"robot"){progress estimatedProgress}}`, nil)
		if len(response.Errors) > 0 {
			t.Fatalf("progress query: %+v", response.Errors)
		}
		var data struct {
			Device struct {
				Progress          *float64
				EstimatedProgress *float64
			} `json:"cleaningDevice"`
		}
		if err := json.Unmarshal(response.Data, &data); err != nil {
			t.Fatal(err)
		}
		if reported == nil {
			if data.Device.Progress != nil || data.Device.EstimatedProgress == nil || *data.Device.EstimatedProgress != 25 {
				t.Fatalf("wrong fallback: %+v", data.Device)
			}
		} else if data.Device.EstimatedProgress != nil || data.Device.Progress == nil || *data.Device.Progress != *reported {
			t.Fatalf("reported percentage did not take precedence: %+v", data.Device)
		}
	}
}

func TestCleaningAPIReusesCompletedCoverageAfterServiceRecreation(t *testing.T) {
	env, storage, _ := cleaningEnvironment(t)
	at := time.Now().UTC().Add(-2 * time.Hour).Truncate(time.Second)
	plan := cleaning.Plan{DeviceID: "robot", MapID: "7", RoomIDs: []string{"kitchen", "living"}, AreaIDs: []string{"1"}, Options: cleaning.Options{Repeats: 1}}
	completed := cleaning.Task{ID: "completed", RequestID: "completed", DeviceID: "robot", Plan: plan, State: cleaning.TaskStarting, Origin: "user", CreatedAt: at}
	if err := storage.CreateCleaningTask(t.Context(), completed); err != nil {
		t.Fatal(err)
	}
	if err := storage.TransitionCleaningTask(t.Context(), completed.ID, cleaning.TaskStarting, cleaning.TaskRunning, "", at.Add(time.Second)); err != nil {
		t.Fatal(err)
	}
	yes := true
	record := cleaning.HistoryRecord{ID: "provider-completed", StartedAt: at, FinishedAt: at.Add(time.Hour), Completed: &yes, CleanedArea: 10, ElapsedMinutes: 16}
	if err := storage.IngestCleaningHistory(t.Context(), "robot", []cleaning.HistoryRecord{record}); err != nil {
		t.Fatal(err)
	}
	current := cleaning.Task{ID: "current", RequestID: "current", DeviceID: "robot", Plan: plan, State: cleaning.TaskStarting, Origin: "user", CreatedAt: at.Add(90 * time.Minute)}
	if err := storage.CreateCleaningTask(t.Context(), current); err != nil {
		t.Fatal(err)
	}
	if err := storage.TransitionCleaningTask(t.Context(), current.ID, cleaning.TaskStarting, cleaning.TaskRunning, "", current.CreatedAt.Add(time.Second)); err != nil {
		t.Fatal(err)
	}
	snapshots, err := storage.ListCleaningSnapshots(t.Context())
	if err != nil {
		t.Fatal(err)
	}
	snapshots[0].Status = cleaning.StatusCleaning
	snapshots[0].UpdatedAt = time.Now()
	snapshots[0].CleanedArea = device.Ptr(5.0)
	if err := storage.SaveCleaningSnapshot(t.Context(), snapshots[0]); err != nil {
		t.Fatal(err)
	}
	env.resolver.Cleaning = cleaning.NewService(storage, env.stateReader, &cleaningTestOutput{store: storage}, env.bus)
	for _, native := range []*float64{nil, device.Ptr(0.0), device.Ptr(70.0)} {
		snapshots[0].Progress = native
		if err := storage.SaveCleaningSnapshot(t.Context(), snapshots[0]); err != nil {
			t.Fatal(err)
		}
		response := env.query(t, `{cleaningDevice(deviceId:"robot"){progress estimatedProgress}}`, nil)
		if len(response.Errors) > 0 {
			t.Fatalf("progress query: %+v", response.Errors)
		}
		var data struct {
			Device struct {
				Progress          *float64
				EstimatedProgress *float64
			} `json:"cleaningDevice"`
		}
		if err := json.Unmarshal(response.Data, &data); err != nil {
			t.Fatal(err)
		}
		if native == nil {
			if data.Device.EstimatedProgress == nil || *data.Device.EstimatedProgress != 50 {
				t.Fatalf("learned estimate = %+v", data.Device)
			}
		} else if data.Device.EstimatedProgress != nil || data.Device.Progress == nil || *data.Device.Progress != *native {
			t.Fatalf("native progress lost priority: %+v", data.Device)
		}
	}
}

func TestCleaningGeometryRefreshPreservesPreparedSelection(t *testing.T) {
	env, storage, output := cleaningEnvironment(t)
	revision := preparedRevision(t, env)
	snapshots, err := storage.ListCleaningSnapshots(t.Context())
	if err != nil {
		t.Fatal(err)
	}
	snapshots[0].Maps[0].Width = 500
	snapshots[0].Maps[0].Left = -2000
	snapshots[0].Maps[0].Rooms[0].Area = 17.97
	snapshots[0].Maps[0].Layers = []cleaning.MapLayer{{Kind: "room", RoomID: 1, Path: "M1 1h20v20z"}}
	snapshots[0].Maps[0].Revision = cleaning.MapRevision(snapshots[0].Maps[0])
	if err := storage.SaveCleaningSnapshot(t.Context(), snapshots[0]); err != nil {
		t.Fatal(err)
	}
	if refreshed := preparedRevision(t, env); refreshed != revision {
		t.Fatal("scan refinement invalidated the selected rooms")
	}
	result := env.query(t, startCleaningQuery, map[string]any{"input": map[string]any{"selection": cleaningSelection(), "expectedRevision": revision, "requestId": "after-scan"}})
	if len(result.Errors) > 0 || output.count != 1 {
		t.Fatalf("prepared clean failed after scan: %+v, calls=%d", result.Errors, output.count)
	}
}

func TestCleaningCalibrationAndLinkEditsSurviveScanRefinement(t *testing.T) {
	env, storage, _ := cleaningEnvironment(t)
	env.resolver.Store = storage
	ctx := t.Context()
	floor := store.ReplaceFloorplanParams{ID: "floor", Name: "Home", Vertices: []store.FloorplanVertex{{ID: "a"}, {ID: "b", X: 4}}, Walls: []store.FloorplanWall{{ID: "wall", VertexA: "a", VertexB: "b"}}}
	if err := storage.ReplaceFloorplan(ctx, floor); err != nil {
		t.Fatal(err)
	}
	calibration := cleaning.Calibration{DeviceID: "robot", MapID: "7", MapRevision: "geometry", FloorplanID: "floor", FloorplanRevision: 1, Enabled: true, MapRotation: 90,
		Anchors: []cleaning.Anchor{{Robot: cleaning.Point{X: 0, Y: 0}, Hive: cleaning.Point{X: 2, Y: 3}}, {Robot: cleaning.Point{X: 1, Y: 0}, Hive: cleaning.Point{X: 3, Y: 3}}}}
	if err := env.resolver.Cleaning.SaveCalibration(ctx, calibration); err != nil {
		t.Fatal(err)
	}
	calibration.Revision = 1
	snapshots, err := storage.ListCleaningSnapshots(ctx)
	if err != nil {
		t.Fatal(err)
	}
	snapshots[0].Maps[0].Revision = "refined-scan"
	snapshots[0].Maps[0].Left = -6000
	if err := storage.SaveCleaningSnapshot(ctx, snapshots[0]); err != nil {
		t.Fatal(err)
	}
	query := `{cleaningCalibration(deviceId:"robot",mapId:"7",floorplanId:"floor"){valid enabled mapRotation transform{a b x y}}}`
	response := env.query(t, query, nil)
	if len(response.Errors) > 0 {
		t.Fatalf("calibration: %+v", response.Errors)
	}
	var data struct {
		Calibration struct {
			Valid       bool
			Enabled     bool
			MapRotation float64
			Transform   struct{ A, B, X, Y float64 }
		} `json:"cleaningCalibration"`
	}
	if err := json.Unmarshal(response.Data, &data); err != nil {
		t.Fatal(err)
	}
	if !data.Calibration.Valid || !data.Calibration.Enabled || data.Calibration.MapRotation != 90 || data.Calibration.Transform.A != 1 || data.Calibration.Transform.X != 2 || data.Calibration.Transform.Y != 3 {
		t.Fatalf("scan changed saved calibration: %+v", data.Calibration)
	}
	if err := env.resolver.Cleaning.SaveCalibration(ctx, calibration); err != nil {
		t.Fatalf("scan blocked an open alignment editor: %v", err)
	}
	if err := env.resolver.Cleaning.SaveCalibration(ctx, calibration); err == nil {
		t.Fatal("concurrent alignment edit was accepted")
	}
	links := cleaning.RoomLinks{Revision: 1, MapID: "7", MapRevision: "geometry", Links: []cleaning.RoomLink{{RoomID: "kitchen", AreaID: "1"}, {RoomID: "living", AreaID: "1"}}}
	if err := env.resolver.Cleaning.SaveLinks(ctx, "robot", links); err != nil {
		t.Fatalf("scan blocked an open links editor: %v", err)
	}
	if err := env.resolver.Cleaning.SaveLinks(ctx, "robot", links); err == nil {
		t.Fatal("concurrent room-link edit was accepted")
	}
	snapshots[0].Maps[0].ID = 8
	if err := storage.SaveCleaningSnapshot(ctx, snapshots[0]); err != nil {
		t.Fatal(err)
	}
	response = env.query(t, query, nil)
	if err := json.Unmarshal(response.Data, &data); err != nil {
		t.Fatal(err)
	}
	if data.Calibration.Valid {
		t.Fatal("missing map retained a valid alignment")
	}
	if err := env.resolver.Cleaning.SaveCalibration(ctx, calibration); err == nil {
		t.Fatal("saved alignment to a missing map")
	}
}

func TestCleaningMissingRoomDestinationsStillRequireReview(t *testing.T) {
	env, storage, output := cleaningEnvironment(t)
	revision := preparedRevision(t, env)
	snapshots, err := storage.ListCleaningSnapshots(t.Context())
	if err != nil {
		t.Fatal(err)
	}
	snapshots[0].Maps[0].Rooms = []cleaning.MapRoom{{ID: 2}}
	if err := storage.SaveCleaningSnapshot(t.Context(), snapshots[0]); err != nil {
		t.Fatal(err)
	}
	result := env.query(t, startCleaningQuery, map[string]any{"input": map[string]any{"selection": cleaningSelection(), "expectedRevision": revision, "requestId": "missing-area"}})
	if len(result.Errors) == 0 || output.count != 0 {
		t.Fatal("missing destination was sent to the vacuum")
	}
	if err := env.resolver.Cleaning.SaveLinks(t.Context(), "robot", cleaning.RoomLinks{Revision: 1, MapID: "7", MapRevision: "geometry", Links: []cleaning.RoomLink{{RoomID: "kitchen", AreaID: "1"}}}); err == nil {
		t.Fatal("linked a missing cleaning area")
	}
}

func TestCleaningOptionalActionsAndModel(t *testing.T) {
	env, storage, output := cleaningEnvironment(t)
	snapshots, err := storage.ListCleaningSnapshots(t.Context())
	if err != nil {
		t.Fatal(err)
	}
	snapshots[0].Actions = []cleaning.Action{cleaning.ActionLocate}
	snapshots[0].Model = "vacuum.test"
	snapshots[0].Manufacturer = "Test vendor"
	if err := storage.SaveCleaningSnapshot(t.Context(), snapshots[0]); err != nil {
		t.Fatal(err)
	}
	result := env.query(t, `{cleaningDevice(deviceId:"robot"){controls {action enabled} model manufacturer}}`, nil)
	if len(result.Errors) > 0 {
		t.Fatalf("capabilities: %+v", result.Errors)
	}
	var data struct {
		Device struct {
			Controls []struct {
				Action  string
				Enabled bool
			}
			Model, Manufacturer string
		} `json:"cleaningDevice"`
	}
	if err := json.Unmarshal(result.Data, &data); err != nil {
		t.Fatal(err)
	}
	if len(data.Device.Controls) != 1 || data.Device.Controls[0].Action != "LOCATE" || data.Device.Model != "vacuum.test" {
		t.Fatalf("capabilities: %+v", data.Device)
	}
	denied := env.query(t, `mutation{controlCleaning(deviceId:"robot",action:EMPTY_BIN)}`, nil)
	if len(denied.Errors) == 0 || output.count != 0 {
		t.Fatal("unsupported control was sent")
	}
	allowed := env.query(t, `mutation{controlCleaning(deviceId:"robot",action:LOCATE)}`, nil)
	if len(allowed.Errors) > 0 || output.count != 1 {
		t.Fatalf("advertised control failed: %+v", allowed.Errors)
	}
}
