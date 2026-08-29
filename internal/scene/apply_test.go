package scene

import (
	"context"
	"testing"
	"time"

	"github.com/saffronjam/saffron-hive/internal/device"
	"github.com/saffronjam/saffron-hive/internal/lightfield"
	"github.com/saffronjam/saffron-hive/internal/store"
)

func writableCap(name string) device.Capability {
	return device.Capability{Name: name, Access: device.CapabilityAccessSet}
}

func TestBuildApplyPlanFiltersManualOutputByCapability(t *testing.T) {
	state := device.NewMemoryStore()
	state.Register(device.Device{ID: "light-1", Type: device.Light, Capabilities: []device.Capability{
		writableCap(device.CapOnOff), writableCap(device.CapBrightness),
	}})
	state.Register(device.Device{ID: "plug-1", Type: device.Plug, Capabilities: []device.Capability{writableCap(device.CapOnOff)}})
	resolver := &fakeResolver{members: map[string][]device.DeviceID{"room-1": {"light-1", "plug-1"}}}
	definition := manualDefinition(store.SceneTarget{Type: device.TargetRoom, ID: "room-1"})
	definition.Lighting.Overrides = []store.SceneLightOverride{{
		DeviceID: "light-1", Kind: store.SceneLightOverrideState,
		State: &store.DesiredState{On: device.Ptr(true), Brightness: device.Ptr(180)},
	}}

	plan, err := BuildApplyPlan(context.Background(), resolver, state, nil, "run-1", definition, time.Unix(0, 0))
	if err != nil {
		t.Fatal(err)
	}
	if len(plan.Commands) != 1 || plan.Commands[0].DeviceID != "light-1" {
		t.Fatalf("commands = %#v", plan.Commands)
	}
	if plan.Commands[0].On == nil || !*plan.Commands[0].On || plan.Commands[0].Brightness == nil || *plan.Commands[0].Brightness != 180 {
		t.Fatalf("manual command = %#v", plan.Commands[0])
	}
	if plan.Commands[0].Origin != device.OriginScene("run-1") {
		t.Fatalf("origin = %#v", plan.Commands[0].Origin)
	}
}

func TestBuildApplyPlanSelectorNarrowsByWritableCapability(t *testing.T) {
	state := device.NewMemoryStore()
	state.Register(device.Device{ID: "rgb", Type: device.Light, Capabilities: []device.Capability{writableCap(device.CapColor)}})
	state.Register(device.Device{ID: "white", Type: device.Light, Capabilities: []device.Capability{writableCap(device.CapColorTemp)}})
	resolver := &fakeResolver{members: map[string][]device.DeviceID{"room-1": {"rgb", "white"}}}
	definition := manualDefinition(store.SceneTarget{
		Type: device.TargetExpression,
		Expression: device.Expression{
			{Subject: device.SubjectRoom, Op: device.OpIs, Values: []string{"room-1"}},
			{Connector: device.ConnectorAnd, Subject: device.SubjectWritableCapability, Op: device.OpIs, Values: []string{device.CapColor}},
		},
	})
	definition.Lighting.Overrides = []store.SceneLightOverride{{
		DeviceID: "rgb", Kind: store.SceneLightOverrideState,
		State: &store.DesiredState{Color: &device.Color{R: 240, G: 20, B: 80, X: 0.5, Y: 0.3}},
	}}

	plan, err := BuildApplyPlan(context.Background(), resolver, state, nil, "run-1", definition, time.Unix(0, 0))
	if err != nil {
		t.Fatal(err)
	}
	if len(plan.Commands) != 1 || plan.Commands[0].DeviceID != "rgb" || plan.Commands[0].Color == nil {
		t.Fatalf("commands = %#v", plan.Commands)
	}
}

func TestBuildApplyPlanDeduplicatesOverlappingTargets(t *testing.T) {
	state := device.NewMemoryStore()
	state.Register(device.Device{ID: "light", Type: device.Light, Capabilities: []device.Capability{writableCap(device.CapOnOff)}})
	resolver := &fakeResolver{members: map[string][]device.DeviceID{
		"room":  {"light"},
		"group": {"light"},
	}}
	definition := manualDefinition(
		store.SceneTarget{Type: device.TargetRoom, ID: "room"},
		store.SceneTarget{Type: device.TargetGroup, ID: "group"},
	)
	definition.Lighting.Overrides = []store.SceneLightOverride{{
		DeviceID: "light", Kind: store.SceneLightOverrideState,
		State: &store.DesiredState{On: device.Ptr(true)},
	}}

	plan, err := BuildApplyPlan(context.Background(), resolver, state, nil, "run", definition, time.Unix(0, 0))
	if err != nil {
		t.Fatal(err)
	}
	if len(plan.Commands) != 1 || plan.Commands[0].DeviceID != "light" {
		t.Fatalf("commands = %#v", plan.Commands)
	}
}

func TestBuildApplyPlanEffectOverrideReplacesLighting(t *testing.T) {
	state := device.NewMemoryStore()
	state.Register(device.Device{ID: "light-1", Type: device.Light, Capabilities: []device.Capability{writableCap(device.CapOnOff)}})
	resolver := &fakeResolver{}
	definition := manualDefinition(store.SceneTarget{Type: device.TargetDevice, ID: "light-1"})
	definition.Lighting.Overrides = []store.SceneLightOverride{{DeviceID: "light-1", Kind: store.SceneLightOverrideEffect, EffectID: "fireplace"}}

	plan, err := BuildApplyPlan(context.Background(), resolver, state, nil, "run-1", definition, time.Unix(0, 0))
	if err != nil {
		t.Fatal(err)
	}
	if len(plan.Commands) != 0 || len(plan.EffectRuns) != 1 || plan.EffectRuns[0].EffectID != "fireplace" {
		t.Fatalf("plan = %#v", plan)
	}
}

func TestBuildApplyPlanProjectsOneVibeAcrossHeterogeneousLights(t *testing.T) {
	state := device.NewMemoryStore()
	state.Register(device.Device{ID: "rgb", Type: device.Light, Capabilities: []device.Capability{
		writableCap(device.CapOnOff), writableCap(device.CapBrightness), writableCap(device.CapColor),
	}})
	state.Register(device.Device{ID: "white", Type: device.Light, Capabilities: []device.Capability{
		writableCap(device.CapOnOff), writableCap(device.CapBrightness), writableCap(device.CapColorTemp),
	}})
	resolver := &fakeResolver{members: map[string][]device.DeviceID{"room": {"rgb", "white"}}}
	field := lightfield.NewFullColor(2, 2, []lightfield.ColorSample{
		{Lightness: 0.7, Chroma: 0.2, Hue: 20}, {Lightness: 0.7, Chroma: 0.2, Hue: 80},
		{Lightness: 0.7, Chroma: 0.2, Hue: 180}, {Lightness: 0.7, Chroma: 0.2, Hue: 280},
	})
	definition := store.SceneDefinition{
		Targets: []store.SceneTarget{{Type: device.TargetRoom, ID: "room"}},
		Lighting: store.SceneLighting{
			Dynamic: &store.DynamicLighting{Field: field, Seed: 42, Brightness: 0.8, Movement: 0.5, Cycle: 10 * time.Minute, Provenance: lightfield.Provenance{Kind: lightfield.SourcePreset}},
		},
	}
	plan, err := BuildApplyPlan(context.Background(), resolver, state, nil, "run-1", definition, time.Unix(100, 0))
	if err != nil {
		t.Fatal(err)
	}
	if len(plan.Commands) != 2 {
		t.Fatalf("commands = %#v", plan.Commands)
	}
	for _, command := range plan.Commands {
		switch command.DeviceID {
		case "rgb":
			if command.Color == nil || command.ColorTemp != nil {
				t.Fatalf("RGB command = %#v", command)
			}
		case "white":
			if command.ColorTemp == nil || command.Color != nil {
				t.Fatalf("white command = %#v", command)
			}
		}
	}
}

func TestBuildApplyPlanAppliesSparseOverridesAndSupportingStates(t *testing.T) {
	state := device.NewMemoryStore()
	state.Register(device.Device{ID: "light-1", Type: device.Light, Capabilities: []device.Capability{
		writableCap(device.CapOnOff), writableCap(device.CapBrightness), writableCap(device.CapColorTemp),
	}})
	state.Register(device.Device{ID: "light-2", Type: device.Light, Capabilities: []device.Capability{
		writableCap(device.CapOnOff), writableCap(device.CapBrightness), writableCap(device.CapColorTemp),
	}})
	state.Register(device.Device{ID: "plug-1", Type: device.Plug, Capabilities: []device.Capability{writableCap(device.CapOnOff)}})
	resolver := &fakeResolver{members: map[string][]device.DeviceID{"room": {"light-1"}}}
	definition := store.SceneDefinition{
		Targets: []store.SceneTarget{{Type: device.TargetRoom, ID: "room"}},
		Lighting: store.SceneLighting{
			Overrides: []store.SceneLightOverride{
				{DeviceID: "light-1", Kind: store.SceneLightOverrideState, State: &store.DesiredState{Brightness: device.Ptr(42)}},
				{DeviceID: "light-2", Kind: store.SceneLightOverrideState, State: &store.DesiredState{Brightness: device.Ptr(1)}},
			},
		},
		Supporting: []store.SceneSupportingState{{DeviceID: "plug-1", State: store.DesiredState{On: device.Ptr(false)}}},
	}

	plan, err := BuildApplyPlan(context.Background(), resolver, state, nil, "run-1", definition, time.Unix(0, 0))
	if err != nil {
		t.Fatal(err)
	}
	if len(plan.Commands) != 2 {
		t.Fatalf("commands = %#v", plan.Commands)
	}
	commands := map[device.DeviceID]device.Command{}
	for _, command := range plan.Commands {
		commands[command.DeviceID] = command
	}
	light := commands["light-1"]
	if light.On != nil || light.Brightness == nil || *light.Brightness != 42 || light.ColorTemp != nil {
		t.Fatalf("sparse light = %#v", light)
	}
	if _, exists := commands["light-2"]; exists {
		t.Fatal("override conferred membership on an untargeted light")
	}
	plug := commands["plug-1"]
	if plug.On == nil || *plug.On {
		t.Fatalf("supporting state = %#v", plug)
	}
}

func TestCommandFromDesiredPrefersColorAndGatesFields(t *testing.T) {
	state := device.NewMemoryStore()
	state.Register(device.Device{ID: "bulb", Type: device.Light, Capabilities: []device.Capability{
		writableCap(device.CapOnOff), writableCap(device.CapBrightness), writableCap(device.CapColor), writableCap(device.CapColorTemp),
	}})
	command := commandFromDesired(state, "bulb", store.DesiredState{
		On: device.Ptr(true), Brightness: device.Ptr(120), ColorTemp: device.Ptr(370),
		Color: &device.Color{R: 20, G: 30, B: 40, X: 0.2, Y: 0.3}, HvacMode: device.Ptr("heat"),
	})
	if command.Color == nil || command.ColorTemp != nil || command.HvacMode != nil {
		t.Fatalf("command = %#v", command)
	}
}

func manualDefinition(targets ...store.SceneTarget) store.SceneDefinition {
	definition := store.SceneDefinition{Targets: targets}
	for _, target := range targets {
		if target.Type != device.TargetDevice {
			continue
		}
		definition.Lighting.Overrides = append(definition.Lighting.Overrides, store.SceneLightOverride{
			DeviceID: device.DeviceID(target.ID), Kind: store.SceneLightOverrideState,
			State: &store.DesiredState{On: device.Ptr(true), Brightness: device.Ptr(180)},
		})
	}
	return definition
}
