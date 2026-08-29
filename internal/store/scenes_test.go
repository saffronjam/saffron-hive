package store

import (
	"context"
	"database/sql"
	"errors"
	"reflect"
	"testing"
	"time"

	"github.com/saffronjam/saffron-hive/internal/device"
	"github.com/saffronjam/saffron-hive/internal/lightfield"
)

func manualDefinition() SceneDefinition {
	return SceneDefinition{
		Targets: []SceneTarget{
			{Type: device.TargetRoom, ID: "living"},
			{Type: device.TargetExpression, Name: "Colour lights", Expression: device.Expression{{Subject: device.SubjectWritableCapability, Op: device.OpIs, Values: []string{device.CapColor}}}},
		},
	}
}

func createSceneDevice(t *testing.T, s *DB, id device.DeviceID, deviceType device.DeviceType) {
	t.Helper()
	if err := s.UpsertDevice(context.Background(), CreateDeviceParams{ID: id, FriendlyName: string(id), Source: device.SourceZigbee2MQTT, Type: deviceType}); err != nil {
		t.Fatal(err)
	}
}

func TestSceneDefinitionRoundTrip(t *testing.T) {
	s := newTestStore(t)
	createSceneDevice(t, s, "light-1", device.Light)
	createSceneDevice(t, s, "plug-1", device.Plug)
	definition := manualDefinition()
	definition.Lighting.Overrides = []SceneLightOverride{{
		DeviceID: "light-1", Kind: SceneLightOverrideState,
		State: &DesiredState{
			On: device.Ptr(true), Brightness: device.Ptr(123), ColorTemp: device.Ptr(250),
			Color: &device.Color{R: 20, G: 40, B: 60, X: 0.2, Y: 0.3}, Transition: device.Ptr(1.2),
		},
	}}
	definition.Supporting = []SceneSupportingState{{DeviceID: "plug-1", State: DesiredState{On: device.Ptr(false)}}}
	scene, err := s.CreateScene(context.Background(), CreateSceneParams{ID: "scene-1", Name: "Evening", Definition: definition})
	if err != nil {
		t.Fatal(err)
	}
	if scene.ID != "scene-1" || scene.Name != "Evening" || !reflect.DeepEqual(scene.Definition, definition) {
		t.Fatalf("round trip = %#v", scene)
	}
	listed, err := s.ListScenes(context.Background())
	if err != nil || len(listed) != 1 || !reflect.DeepEqual(listed[0].Definition, definition) {
		t.Fatalf("list = %#v, %v", listed, err)
	}
}

func TestSceneDynamicSourceRoundTripAndAtomicReplacement(t *testing.T) {
	s := newTestStore(t)
	createSceneDevice(t, s, "d1", device.Light)
	if _, err := s.CreateScene(context.Background(), CreateSceneParams{ID: "scene-1", Name: "Vibe", Definition: manualDefinition()}); err != nil {
		t.Fatal(err)
	}
	field := lightfield.NewWhiteAmbience(2, 2, []lightfield.WhiteSample{
		{Brightness: 0.4, Mireds: 200}, {Brightness: 0.6, Mireds: 280},
		{Brightness: 0.7, Mireds: 360}, {Brightness: 0.8, Mireds: 440},
	})
	definition := SceneDefinition{
		Targets: []SceneTarget{{Type: device.TargetDevice, ID: "d1"}},
		Lighting: SceneLighting{
			Dynamic: &DynamicLighting{
				Field: field, Seed: -42, Brightness: 0.76, Movement: 0.3, Cycle: 12 * time.Minute,
				Provenance: lightfield.Provenance{Kind: lightfield.SourceGuided, GuidedDomain: lightfield.DomainWhiteAmbience, GuidedSelectedIDs: []string{"g1", "g2", "g3"}},
			},
		},
	}
	if err := s.SaveSceneDefinition(context.Background(), "scene-1", definition); err != nil {
		t.Fatal(err)
	}
	loaded, err := s.GetScene(context.Background(), "scene-1")
	if err != nil || !reflect.DeepEqual(loaded.Definition, definition) {
		t.Fatalf("dynamic round trip = %#v, %v", loaded.Definition, err)
	}

	broken := definition
	broken.Lighting.Overrides = []SceneLightOverride{{DeviceID: "d1", Kind: SceneLightOverrideEffect, EffectID: "missing"}}
	if err := s.SaveSceneDefinition(context.Background(), "scene-1", broken); err == nil {
		t.Fatal("missing effect reference saved")
	}
	after, _ := s.GetScene(context.Background(), "scene-1")
	if !reflect.DeepEqual(after.Definition, definition) {
		t.Fatalf("failed save mutated definition: %#v", after.Definition)
	}
}

func TestSceneDeleteCascadesComposition(t *testing.T) {
	s := newTestStore(t)
	createSceneDevice(t, s, "light-1", device.Light)
	createSceneDevice(t, s, "plug-1", device.Plug)
	definition := manualDefinition()
	definition.Lighting.Overrides = []SceneLightOverride{{DeviceID: "light-1", Kind: SceneLightOverrideState, State: &DesiredState{On: device.Ptr(true)}}}
	definition.Supporting = []SceneSupportingState{{DeviceID: "plug-1", State: DesiredState{On: device.Ptr(true)}}}
	if _, err := s.CreateScene(context.Background(), CreateSceneParams{ID: "scene-1", Name: "Delete", Definition: definition}); err != nil {
		t.Fatal(err)
	}
	if err := s.DeleteScene(context.Background(), "scene-1"); err != nil {
		t.Fatal(err)
	}
	for _, table := range []string{"scene_targets", "scene_dynamic_sources", "scene_light_overrides", "scene_supporting_states"} {
		var count int
		if err := s.db.QueryRow("SELECT count(*) FROM " + table + " WHERE scene_id = 'scene-1'").Scan(&count); err != nil || count != 0 {
			t.Fatalf("%s count=%d err=%v", table, count, err)
		}
	}
}

func TestSceneValidationAndNotFound(t *testing.T) {
	bad := []SceneDefinition{
		{},
		{Targets: []SceneTarget{{Type: device.TargetExpression}}},
		{Lighting: SceneLighting{Overrides: []SceneLightOverride{{DeviceID: "d", Kind: SceneLightOverrideEffect}}}},
		{Lighting: SceneLighting{Overrides: []SceneLightOverride{{DeviceID: "d", Kind: SceneLightOverrideState, State: &DesiredState{}}}}},
		{Supporting: []SceneSupportingState{{DeviceID: "d"}}},
	}
	for i, definition := range bad {
		if err := ValidateSceneDefinition(definition); err == nil {
			t.Errorf("invalid definition %d accepted", i)
		}
	}
	s := newTestStore(t)
	if _, err := s.GetScene(context.Background(), "missing"); err == nil || !errors.Is(err, sql.ErrNoRows) {
		t.Fatalf("not found = %v", err)
	}
}

func TestSupportingOnlySceneAllowsEmptyLighting(t *testing.T) {
	definition := SceneDefinition{
		Supporting: []SceneSupportingState{{DeviceID: "plug-1", State: DesiredState{On: device.Ptr(true)}}},
	}
	if err := ValidateSceneDefinition(definition); err != nil {
		t.Fatalf("supporting-only Scene: %v", err)
	}
}

func TestPerLightSceneAllowsEmptyBaseLighting(t *testing.T) {
	definition := SceneDefinition{
		Targets: []SceneTarget{{Type: device.TargetRoom, ID: "living"}},
		Lighting: SceneLighting{Overrides: []SceneLightOverride{{
			DeviceID: "light-1", Kind: SceneLightOverrideState,
			State: &DesiredState{Brightness: device.Ptr(120)},
		}}},
	}
	if err := ValidateSceneDefinition(definition); err != nil {
		t.Fatalf("per-light Scene: %v", err)
	}
}

func TestActiveSceneRunRoundTripAndUpdates(t *testing.T) {
	s := newTestStore(t)
	createSceneDevice(t, s, "d1", device.Light)
	if _, err := s.CreateScene(context.Background(), CreateSceneParams{ID: "scene-1", Name: "Active", Definition: manualDefinition()}); err != nil {
		t.Fatal(err)
	}
	at := time.Date(2026, 8, 26, 12, 0, 0, 0, time.UTC)
	run := ActiveSceneRun{
		SceneID: "scene-1", RunID: "run-1", StartedAt: at, DefinitionUpdatedAt: at.Add(-time.Minute),
		Members: []ActiveSceneMember{{
			DeviceID: "d1", Kind: SceneMemberState,
			Owned:    SceneOwnedFields{On: true, Brightness: true},
			Expected: DesiredState{On: device.Ptr(true), Brightness: device.Ptr(120)},
		}},
	}
	if err := s.StartActiveSceneRun(context.Background(), run); err != nil {
		t.Fatal(err)
	}
	runs, err := s.ListActiveSceneRuns(context.Background())
	if err != nil || len(runs) != 1 || !reflect.DeepEqual(runs[0], run) {
		t.Fatalf("runs = %#v, %v", runs, err)
	}
	updated := DesiredState{On: device.Ptr(true), Brightness: device.Ptr(200), ColorTemp: device.Ptr(300)}
	if err := s.UpdateActiveSceneMemberExpected(context.Background(), "scene-1", "d1", updated); err != nil {
		t.Fatal(err)
	}
	if err := s.UpdateActiveSceneMemberEffectRun(context.Background(), "scene-1", "d1", "effect-run-1"); err != nil {
		t.Fatal(err)
	}
	runs, err = s.ListActiveSceneRuns(context.Background())
	if err != nil || len(runs) != 1 || !reflect.DeepEqual(runs[0].Members[0].Expected, updated) || runs[0].Members[0].EffectRunID != "effect-run-1" {
		t.Fatalf("updated runs = %#v, %v", runs, err)
	}
	loaded, err := s.GetScene(context.Background(), "scene-1")
	if err != nil || loaded.ActivatedAt == nil || !loaded.ActivatedAt.Equal(at) {
		t.Fatalf("active Scene = %#v, %v", loaded, err)
	}
	stopped, err := s.StopActiveSceneRun(context.Background(), "scene-1")
	if err != nil || !stopped {
		t.Fatalf("stop = %v, %v", stopped, err)
	}
	stopped, err = s.StopActiveSceneRun(context.Background(), "scene-1")
	if err != nil || stopped {
		t.Fatalf("second stop = %v, %v", stopped, err)
	}
	loaded, err = s.GetScene(context.Background(), "scene-1")
	if err != nil || loaded.ActivatedAt != nil {
		t.Fatalf("stopped Scene = %#v, %v", loaded, err)
	}
}

func TestActiveSceneRunReplacementIsAtomic(t *testing.T) {
	s := newTestStore(t)
	createSceneDevice(t, s, "d1", device.Light)
	createSceneDevice(t, s, "d2", device.Light)
	if _, err := s.CreateScene(context.Background(), CreateSceneParams{ID: "scene-1", Name: "Active", Definition: manualDefinition()}); err != nil {
		t.Fatal(err)
	}
	at := time.Date(2026, 8, 26, 12, 0, 0, 0, time.UTC)
	first := ActiveSceneRun{SceneID: "scene-1", RunID: "run-1", StartedAt: at, DefinitionUpdatedAt: at, Members: []ActiveSceneMember{{DeviceID: "d1", Kind: SceneMemberState}}}
	if err := s.StartActiveSceneRun(context.Background(), first); err != nil {
		t.Fatal(err)
	}
	second := ActiveSceneRun{SceneID: "scene-1", RunID: "run-2", StartedAt: at.Add(time.Minute), DefinitionUpdatedAt: at, Members: []ActiveSceneMember{{DeviceID: "d2", Kind: SceneMemberField}}}
	if err := s.StartActiveSceneRun(context.Background(), second); err != nil {
		t.Fatal(err)
	}
	runs, err := s.ListActiveSceneRuns(context.Background())
	if err != nil || len(runs) != 1 || !reflect.DeepEqual(runs[0], second) {
		t.Fatalf("replacement = %#v, %v", runs, err)
	}
	bad := second
	bad.RunID = "run-3"
	bad.Members = []ActiveSceneMember{{DeviceID: "missing", Kind: SceneMemberField}}
	if err := s.StartActiveSceneRun(context.Background(), bad); err == nil {
		t.Fatal("missing member device accepted")
	}
	runs, err = s.ListActiveSceneRuns(context.Background())
	if err != nil || len(runs) != 1 || !reflect.DeepEqual(runs[0], second) {
		t.Fatalf("failed replacement mutated run = %#v, %v", runs, err)
	}
	if err := s.DeleteScene(context.Background(), "scene-1"); err != nil {
		t.Fatal(err)
	}
	runs, err = s.ListActiveSceneRuns(context.Background())
	if err != nil || len(runs) != 0 {
		t.Fatalf("delete cascade runs = %#v, %v", runs, err)
	}
}
