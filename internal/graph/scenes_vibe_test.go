package graph

import (
	"context"
	"reflect"
	"testing"

	"github.com/99designs/gqlgen/graphql"
	"github.com/saffronjam/saffron-hive/internal/device"
	"github.com/saffronjam/saffron-hive/internal/graph/model"
	"github.com/saffronjam/saffron-hive/internal/lightfield/catalog"
	"github.com/saffronjam/saffron-hive/internal/store"
)

func TestSceneReferencesKeepSensorsOutOfSupportingStates(t *testing.T) {
	env := newTestEnv(t)
	env.store.putDevice(device.Device{ID: "sensor", Type: device.Sensor})
	err := validateSceneReferences(context.Background(), env.resolver, store.SceneDefinition{
		Supporting: []store.SceneSupportingState{{DeviceID: "sensor", State: store.DesiredState{On: device.Ptr(true)}}},
	})
	if err == nil {
		t.Fatal("sensor supporting state was accepted")
	}
}

func TestSceneReferencesRequireLightOverrides(t *testing.T) {
	env := newTestEnv(t)
	env.store.putDevice(device.Device{ID: "plug", Type: device.Plug})
	err := validateSceneReferences(context.Background(), env.resolver, store.SceneDefinition{
		Lighting: store.SceneLighting{Overrides: []store.SceneLightOverride{{
			DeviceID: "plug", Kind: store.SceneLightOverrideState,
			State: &store.DesiredState{On: device.Ptr(true)},
		}}},
	})
	if err == nil {
		t.Fatal("non-light override was accepted")
	}
}

func TestVibePresetAndSavedSceneShareBasePreview(t *testing.T) {
	presets, err := cachedVibePresets()
	if err != nil || len(presets) == 0 {
		t.Fatalf("load Vibe presets: %v", err)
	}
	entry, ok := catalog.Lookup(presets[0].ID)
	if !ok {
		t.Fatalf("preset %q is unavailable", presets[0].ID)
	}
	definition := store.SceneDefinition{
		Lighting: store.SceneLighting{
			Dynamic: &store.DynamicLighting{
				Field: entry.Field, Seed: entry.Seed, Brightness: entry.Defaults.Brightness,
				Movement: entry.Defaults.Movement, Cycle: entry.Defaults.Cycle,
			},
		},
	}

	if got := previewScene(definition); !reflect.DeepEqual(got, presets[0].Preview) {
		t.Fatal("preset and saved scene produced different base previews")
	}
}

func TestDynamicLightingAcceptsVisibleSeed(t *testing.T) {
	entry, ok := catalog.Lookup("night-sky")
	if !ok {
		t.Fatal("night-sky preset is unavailable")
	}
	existing := &store.DynamicLighting{
		Field: entry.Field, Seed: entry.Seed, Brightness: entry.Defaults.Brightness,
		Movement: entry.Defaults.Movement, Cycle: entry.Defaults.Cycle,
	}
	seed := "912"
	got, err := dynamicLightingFromInput(&model.DynamicSceneSourceInput{
		Seed: graphql.OmittableOf(&seed),
	}, existing)
	if err != nil {
		t.Fatal(err)
	}
	if got.Seed != 912 {
		t.Fatalf("seed = %d, want 912", got.Seed)
	}
}
