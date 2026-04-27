package graph

import (
	"context"
	"encoding/json"
	"sort"
	"testing"
	"time"

	"github.com/saffronjam/saffron-hive/internal/device"
	"github.com/saffronjam/saffron-hive/internal/effect"
	"github.com/saffronjam/saffron-hive/internal/eventbus"
	"github.com/saffronjam/saffron-hive/internal/store"
)

func TestMutationCreateEffectTimeline(t *testing.T) {
	env := newTestEnv(t)

	resp := env.query(t, `mutation($input: CreateEffectInput!) {
        createEffect(input: $input) {
          id name kind loop durationMs
          tracks { index clips { startMs transitionMinMs transitionMaxMs kind config } }
          requiredCapabilities
        }
      }`,
		map[string]any{
			"input": map[string]any{
				"name":       "Pulse",
				"kind":       "TIMELINE",
				"loop":       true,
				"durationMs": 2200,
				"tracks": []map[string]any{
					{
						"name": "Pulse track",
						"clips": []map[string]any{
							{"startMs": 0, "transitionMinMs": 500, "transitionMaxMs": 500, "kind": "SET_BRIGHTNESS", "config": `{"value":255}`},
							{"startMs": 1500, "transitionMinMs": 500, "transitionMaxMs": 500, "kind": "SET_BRIGHTNESS", "config": `{"value":50}`},
						},
					},
				},
			},
		})
	if len(resp.Errors) > 0 {
		t.Fatalf("unexpected errors: %v", resp.Errors)
	}

	var data struct {
		CreateEffect struct {
			ID         string `json:"id"`
			Name       string `json:"name"`
			Kind       string `json:"kind"`
			Loop       bool   `json:"loop"`
			DurationMs int    `json:"durationMs"`
			Tracks     []struct {
				Index int `json:"index"`
				Clips []struct {
					StartMs         int    `json:"startMs"`
					TransitionMinMs int    `json:"transitionMinMs"`
					TransitionMaxMs int    `json:"transitionMaxMs"`
					Kind            string `json:"kind"`
					Config          string `json:"config"`
				} `json:"clips"`
			} `json:"tracks"`
			RequiredCapabilities []string `json:"requiredCapabilities"`
		} `json:"createEffect"`
	}
	if err := json.Unmarshal(resp.Data, &data); err != nil {
		t.Fatalf("unmarshal: %v", err)
	}
	if data.CreateEffect.Name != "Pulse" {
		t.Errorf("expected name Pulse, got %s", data.CreateEffect.Name)
	}
	if data.CreateEffect.Kind != "TIMELINE" {
		t.Errorf("expected kind TIMELINE, got %s", data.CreateEffect.Kind)
	}
	if !data.CreateEffect.Loop {
		t.Error("expected loop=true")
	}
	if data.CreateEffect.DurationMs != 2200 {
		t.Errorf("expected durationMs=2200, got %d", data.CreateEffect.DurationMs)
	}
	if len(data.CreateEffect.Tracks) != 1 {
		t.Fatalf("expected 1 track, got %d", len(data.CreateEffect.Tracks))
	}
	if len(data.CreateEffect.Tracks[0].Clips) != 2 {
		t.Fatalf("expected 2 clips, got %d", len(data.CreateEffect.Tracks[0].Clips))
	}
	if len(data.CreateEffect.RequiredCapabilities) != 1 || data.CreateEffect.RequiredCapabilities[0] != device.CapBrightness {
		t.Errorf("expected requiredCapabilities=[brightness], got %v", data.CreateEffect.RequiredCapabilities)
	}
}

func TestMutationCreateEffectMultiTrack(t *testing.T) {
	env := newTestEnv(t)

	resp := env.query(t, `mutation($input: CreateEffectInput!) {
        createEffect(input: $input) {
          id tracks { index clips { kind } } requiredCapabilities
        }
      }`,
		map[string]any{
			"input": map[string]any{
				"name":       "Multi",
				"kind":       "TIMELINE",
				"loop":       false,
				"durationMs": 1000,
				"tracks": []map[string]any{
					{
						"name": "Color",
						"clips": []map[string]any{
							{"startMs": 0, "transitionMinMs": 0, "transitionMaxMs": 1000, "kind": "SET_COLOR", "config": `{"mode":"rgb","rgb":{"r":255,"g":0,"b":0}}`},
						},
					},
					{
						"name": "Brightness",
						"clips": []map[string]any{
							{"startMs": 0, "transitionMinMs": 0, "transitionMaxMs": 1000, "kind": "SET_BRIGHTNESS", "config": `{"value":150}`},
						},
					},
				},
			},
		})
	if len(resp.Errors) > 0 {
		t.Fatalf("unexpected errors: %v", resp.Errors)
	}

	var data struct {
		CreateEffect struct {
			Tracks []struct {
				Index int `json:"index"`
				Clips []struct {
					Kind string `json:"kind"`
				} `json:"clips"`
			} `json:"tracks"`
			RequiredCapabilities []string `json:"requiredCapabilities"`
		} `json:"createEffect"`
	}
	if err := json.Unmarshal(resp.Data, &data); err != nil {
		t.Fatalf("unmarshal: %v", err)
	}
	if len(data.CreateEffect.Tracks) != 2 {
		t.Fatalf("expected 2 tracks, got %d", len(data.CreateEffect.Tracks))
	}
	caps := append([]string(nil), data.CreateEffect.RequiredCapabilities...)
	sort.Strings(caps)
	if len(caps) != 2 || caps[0] != device.CapBrightness || caps[1] != device.CapColor {
		t.Errorf("expected capabilities {brightness,color}, got %v", caps)
	}
}

func TestMutationCreateEffectRejectsMalformedConfig(t *testing.T) {
	env := newTestEnv(t)

	resp := env.query(t, `mutation($input: CreateEffectInput!) { createEffect(input: $input) { id } }`,
		map[string]any{
			"input": map[string]any{
				"name":       "Bad",
				"kind":       "TIMELINE",
				"loop":       false,
				"durationMs": 0,
				"tracks": []map[string]any{
					{"clips": []map[string]any{
						{"startMs": 0, "transitionMinMs": 0, "transitionMaxMs": 100, "kind": "SET_BRIGHTNESS", "config": `not json`},
					}},
				},
			},
		})
	if len(resp.Errors) == 0 {
		t.Fatal("expected error for malformed clip config")
	}
}

func TestMutationCreateEffectRejectsOverlappingClips(t *testing.T) {
	env := newTestEnv(t)

	resp := env.query(t, `mutation($input: CreateEffectInput!) { createEffect(input: $input) { id } }`,
		map[string]any{
			"input": map[string]any{
				"name":       "Overlap",
				"kind":       "TIMELINE",
				"loop":       false,
				"durationMs": 2000,
				"tracks": []map[string]any{
					{"clips": []map[string]any{
						{"startMs": 0, "transitionMinMs": 0, "transitionMaxMs": 1000, "kind": "SET_BRIGHTNESS", "config": `{"value":100}`},
						{"startMs": 500, "transitionMinMs": 0, "transitionMaxMs": 200, "kind": "SET_BRIGHTNESS", "config": `{"value":200}`},
					}},
				},
			},
		})
	if len(resp.Errors) == 0 {
		t.Fatal("expected error for overlapping clips")
	}
}

func TestMutationCreateEffectRejectsClipPastDurationOnLoop(t *testing.T) {
	env := newTestEnv(t)

	resp := env.query(t, `mutation($input: CreateEffectInput!) { createEffect(input: $input) { id } }`,
		map[string]any{
			"input": map[string]any{
				"name":       "Past",
				"kind":       "TIMELINE",
				"loop":       true,
				"durationMs": 500,
				"tracks": []map[string]any{
					{"clips": []map[string]any{
						{"startMs": 100, "transitionMinMs": 0, "transitionMaxMs": 1000, "kind": "SET_BRIGHTNESS", "config": `{"value":100}`},
					}},
				},
			},
		})
	if len(resp.Errors) == 0 {
		t.Fatal("expected error for clip extending past durationMs when loop=true")
	}
}

func TestMutationCreateEffectNative(t *testing.T) {
	env := newTestEnv(t)

	nativeName := "candle"
	resp := env.query(t, `mutation($input: CreateEffectInput!) {
        createEffect(input: $input) { id name kind nativeName tracks { clips { kind } } requiredCapabilities }
      }`,
		map[string]any{
			"input": map[string]any{
				"name":       "Candle",
				"kind":       "NATIVE",
				"nativeName": nativeName,
				"loop":       false,
				"durationMs": 0,
				"tracks":     []map[string]any{},
			},
		})
	if len(resp.Errors) > 0 {
		t.Fatalf("unexpected errors: %v", resp.Errors)
	}

	var data struct {
		CreateEffect struct {
			Kind                 string   `json:"kind"`
			NativeName           string   `json:"nativeName"`
			RequiredCapabilities []string `json:"requiredCapabilities"`
		} `json:"createEffect"`
	}
	if err := json.Unmarshal(resp.Data, &data); err != nil {
		t.Fatalf("unmarshal: %v", err)
	}
	if data.CreateEffect.Kind != "NATIVE" || data.CreateEffect.NativeName != nativeName {
		t.Errorf("expected NATIVE/%s, got %s/%s", nativeName, data.CreateEffect.Kind, data.CreateEffect.NativeName)
	}
	if len(data.CreateEffect.RequiredCapabilities) != 0 {
		t.Errorf("expected empty required capabilities for native, got %v", data.CreateEffect.RequiredCapabilities)
	}
}

func TestMutationUpdateEffect(t *testing.T) {
	env := newTestEnv(t)
	env.store.effects["e1"] = store.Effect{
		ID:   "e1",
		Name: "Old",
		Kind: effect.KindTimeline,
		Loop: false,
		Tracks: []store.EffectTrack{
			{
				ID:       "t1",
				EffectID: "e1",
				Index:    0,
				Clips: []store.EffectClip{
					{ID: "c1", TrackID: "t1", StartMs: 0, TransitionMinMs: 0, TransitionMaxMs: 0, Kind: effect.ClipSetOnOff, ConfigJSON: `{"value":true}`},
				},
			},
		},
	}

	resp := env.query(t, `mutation($input: UpdateEffectInput!) {
        updateEffect(input: $input) { id name loop durationMs tracks { index clips { kind } } }
      }`,
		map[string]any{
			"input": map[string]any{
				"id":         "e1",
				"name":       "New",
				"loop":       true,
				"durationMs": 500,
				"tracks": []map[string]any{
					{"name": "Updated", "clips": []map[string]any{
						{"startMs": 0, "transitionMinMs": 0, "transitionMaxMs": 200, "kind": "SET_COLOR", "config": `{"mode":"rgb","rgb":{"r":255,"g":0,"b":0}}`},
					}},
				},
			},
		})
	if len(resp.Errors) > 0 {
		t.Fatalf("unexpected errors: %v", resp.Errors)
	}

	var data struct {
		UpdateEffect struct {
			Name       string `json:"name"`
			Loop       bool   `json:"loop"`
			DurationMs int    `json:"durationMs"`
			Tracks     []struct {
				Index int `json:"index"`
				Clips []struct {
					Kind string `json:"kind"`
				} `json:"clips"`
			} `json:"tracks"`
		} `json:"updateEffect"`
	}
	if err := json.Unmarshal(resp.Data, &data); err != nil {
		t.Fatalf("unmarshal: %v", err)
	}
	if data.UpdateEffect.Name != "New" || !data.UpdateEffect.Loop {
		t.Errorf("update did not apply: %+v", data.UpdateEffect)
	}
	if data.UpdateEffect.DurationMs != 500 {
		t.Errorf("expected durationMs=500, got %d", data.UpdateEffect.DurationMs)
	}
	if len(data.UpdateEffect.Tracks) != 1 || len(data.UpdateEffect.Tracks[0].Clips) != 1 || data.UpdateEffect.Tracks[0].Clips[0].Kind != "SET_COLOR" {
		t.Errorf("expected single SET_COLOR clip, got %+v", data.UpdateEffect.Tracks)
	}
}

func TestMutationDeleteEffect(t *testing.T) {
	env := newTestEnv(t)
	env.store.effects["e1"] = store.Effect{ID: "e1", Name: "X", Kind: effect.KindTimeline}

	resp := env.query(t, `mutation { deleteEffect(id: "e1") }`, nil)
	if len(resp.Errors) > 0 {
		t.Fatalf("unexpected errors: %v", resp.Errors)
	}
	if _, ok := env.store.effects["e1"]; ok {
		t.Error("expected effect to be deleted")
	}
}

func TestMutationRunEffect(t *testing.T) {
	env := newTestEnv(t)
	env.store.effects["e1"] = store.Effect{ID: "e1", Name: "Pulse", Kind: effect.KindTimeline, Loop: true}

	resp := env.query(t, `mutation { runEffect(effectId: "e1", targetType: "device", targetId: "d1") {
        id targetType targetId effect { id name } volatile
      } }`, nil)
	if len(resp.Errors) > 0 {
		t.Fatalf("unexpected errors: %v", resp.Errors)
	}

	if len(env.effectRunner.startCalls) != 1 {
		t.Fatalf("expected 1 Start call, got %d", len(env.effectRunner.startCalls))
	}
	call := env.effectRunner.startCalls[0]
	if call.effectID != "e1" || call.target.Type != device.TargetDevice || call.target.ID != "d1" {
		t.Errorf("unexpected start call: %+v", call)
	}

	var data struct {
		RunEffect struct {
			ID         string `json:"id"`
			TargetType string `json:"targetType"`
			TargetID   string `json:"targetId"`
			Effect     struct {
				ID   string `json:"id"`
				Name string `json:"name"`
			} `json:"effect"`
		} `json:"runEffect"`
	}
	if err := json.Unmarshal(resp.Data, &data); err != nil {
		t.Fatalf("unmarshal: %v", err)
	}
	if data.RunEffect.Effect.ID != "e1" {
		t.Errorf("expected effect e1, got %s", data.RunEffect.Effect.ID)
	}
	if data.RunEffect.TargetType != "device" || data.RunEffect.TargetID != "d1" {
		t.Errorf("unexpected target: %+v", data.RunEffect)
	}
}

func TestMutationRunEffectInvalidTargetType(t *testing.T) {
	env := newTestEnv(t)
	env.store.effects["e1"] = store.Effect{ID: "e1", Name: "Pulse", Kind: effect.KindTimeline}

	resp := env.query(t, `mutation { runEffect(effectId: "e1", targetType: "bogus", targetId: "d1") { id } }`, nil)
	if len(resp.Errors) == 0 {
		t.Fatal("expected error for invalid target type")
	}
}

func TestMutationStopEffect(t *testing.T) {
	env := newTestEnv(t)

	resp := env.query(t, `mutation { stopEffect(targetType: "device", targetId: "d1") }`, nil)
	if len(resp.Errors) > 0 {
		t.Fatalf("unexpected errors: %v", resp.Errors)
	}
	if len(env.effectRunner.stopCalls) != 1 {
		t.Fatalf("expected 1 Stop call, got %d", len(env.effectRunner.stopCalls))
	}
	if env.effectRunner.stopCalls[0].Type != device.TargetDevice || env.effectRunner.stopCalls[0].ID != "d1" {
		t.Errorf("unexpected stop target: %+v", env.effectRunner.stopCalls[0])
	}
}

func TestQueryActiveEffects(t *testing.T) {
	env := newTestEnv(t)
	env.store.effects["e1"] = store.Effect{ID: "e1", Name: "X", Kind: effect.KindTimeline, Loop: true}
	env.store.activeEffects["run-1"] = effect.ActiveEffectRecord{
		ID:         "run-1",
		EffectID:   "e1",
		TargetType: "device",
		TargetID:   "d1",
		StartedAt:  time.Now(),
		Volatile:   false,
	}

	resp := env.query(t, `query { activeEffects { id targetType targetId effect { id } volatile } }`, nil)
	if len(resp.Errors) > 0 {
		t.Fatalf("unexpected errors: %v", resp.Errors)
	}

	var data struct {
		ActiveEffects []struct {
			ID         string `json:"id"`
			TargetType string `json:"targetType"`
			TargetID   string `json:"targetId"`
			Effect     struct {
				ID string `json:"id"`
			} `json:"effect"`
			Volatile bool `json:"volatile"`
		} `json:"activeEffects"`
	}
	if err := json.Unmarshal(resp.Data, &data); err != nil {
		t.Fatalf("unmarshal: %v", err)
	}
	if len(data.ActiveEffects) != 1 || data.ActiveEffects[0].ID != "run-1" || data.ActiveEffects[0].Effect.ID != "e1" {
		t.Errorf("unexpected activeEffects: %+v", data.ActiveEffects)
	}
}

func TestQueryNativeEffectOptions(t *testing.T) {
	env := newTestEnv(t)

	env.stateReader.addDevice(device.Device{
		ID: "hue",
		Capabilities: []device.Capability{{
			Name:   device.CapEffect,
			Type:   "enum",
			Values: []string{"blink", "candle", "stop_effect", "stop_hue_effect", "finish_effect"},
		}},
	})
	env.stateReader.addDevice(device.Device{
		ID: "ikea",
		Capabilities: []device.Capability{{
			Name:   device.CapEffect,
			Type:   "enum",
			Values: []string{"blink", "stop_effect"},
		}},
	})
	env.stateReader.addDevice(device.Device{
		ID:           "sensor",
		Capabilities: []device.Capability{{Name: "temperature", Type: "numeric"}},
	})

	resp := env.query(t, `query { nativeEffectOptions { name displayName supportedDeviceCount } }`, nil)
	if len(resp.Errors) > 0 {
		t.Fatalf("unexpected errors: %v", resp.Errors)
	}

	var data struct {
		Options []struct {
			Name                 string `json:"name"`
			DisplayName          string `json:"displayName"`
			SupportedDeviceCount int    `json:"supportedDeviceCount"`
		} `json:"nativeEffectOptions"`
	}
	if err := json.Unmarshal(resp.Data, &data); err != nil {
		t.Fatalf("unmarshal: %v", err)
	}

	byName := make(map[string]int, len(data.Options))
	displayByName := make(map[string]string, len(data.Options))
	for _, o := range data.Options {
		byName[o.Name] = o.SupportedDeviceCount
		displayByName[o.Name] = o.DisplayName
	}
	for _, terminator := range []string{"stop_effect", "stop_hue_effect", "finish_effect"} {
		if _, ok := byName[terminator]; ok {
			t.Errorf("terminator %q should be filtered out", terminator)
		}
	}
	if got := byName["blink"]; got != 2 {
		t.Errorf("expected blink count 2, got %d", got)
	}
	if got := byName["candle"]; got != 1 {
		t.Errorf("expected candle count 1, got %d", got)
	}
	if got := displayByName["candle"]; got != "Candle" {
		t.Errorf("expected display name 'Candle', got %q", got)
	}

	names := make([]string, 0, len(data.Options))
	for _, o := range data.Options {
		names = append(names, o.Name)
	}
	if !sort.StringsAreSorted(names) {
		t.Errorf("expected options sorted by name, got %v", names)
	}
}

func TestSubscriptionEffectStepActivated(t *testing.T) {
	sr := newMockStateReader()
	bus := eventbus.NewChannelBus()
	resolver := &Resolver{StateReader: sr, EventBus: bus}
	sub := &subscriptionResolver{resolver}

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	runID := "run-1"
	ch, err := sub.EffectStepActivated(ctx, &runID)
	if err != nil {
		t.Fatalf("subscribe: %v", err)
	}

	bus.Publish(eventbus.Event{
		Type:      eventbus.EventEffectStepActivated,
		Timestamp: time.Now(),
		Payload: eventbus.EffectStepActivatedEvent{
			RunID:     "other",
			EffectID:  "e1",
			StepIndex: 0,
			Active:    true,
		},
	})
	bus.Publish(eventbus.Event{
		Type:      eventbus.EventEffectStepActivated,
		Timestamp: time.Now(),
		Payload: eventbus.EffectStepActivatedEvent{
			RunID:     runID,
			EffectID:  "e1",
			StepIndex: 0,
			Active:    true,
		},
	})
	bus.Publish(eventbus.Event{
		Type:      eventbus.EventEffectStepActivated,
		Timestamp: time.Now(),
		Payload: eventbus.EffectStepActivatedEvent{
			RunID:     runID,
			EffectID:  "e1",
			StepIndex: 0,
			Active:    false,
		},
	})

	for i, want := range []struct {
		stepIndex int
		active    bool
	}{
		{0, true},
		{0, false},
	} {
		select {
		case evt := <-ch:
			if evt.RunID != runID {
				t.Fatalf("event %d: expected runId %s, got %s", i, runID, evt.RunID)
			}
			if evt.StepIndex != want.stepIndex || evt.Active != want.active {
				t.Errorf("event %d: expected (%d,%v), got (%d,%v)", i, want.stepIndex, want.active, evt.StepIndex, evt.Active)
			}
		case <-time.After(time.Second):
			t.Fatalf("timed out waiting for event %d", i)
		}
	}
}
