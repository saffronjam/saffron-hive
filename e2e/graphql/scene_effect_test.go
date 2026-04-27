//go:build e2e

package graphql_test

import (
	"encoding/json"
	"testing"
	"time"
)

// TestScenes_MixedStaticAndEffectPayloads exercises the Phase 9 scene
// integration: a scene with two devices, one static-payload and one
// effect-payload. Applying the scene must publish a command for the static
// device and start the effect run for the effect device. Deactivating via
// drift on the static device stops the spawned effect run.
func TestScenes_MixedStaticAndEffectPayloads(t *testing.T) {
	staticID, err := queryDeviceIDByName("Kitchen Light")
	if err != nil {
		t.Fatalf("find static device: %v", err)
	}
	effectID, err := queryDeviceIDByName("Bedroom Light")
	if err != nil {
		t.Fatalf("find effect device: %v", err)
	}

	if err := publisher.PublishDeviceState("Kitchen Light",
		[]byte(`{"state":"ON","brightness":100,"color_temp":370}`)); err != nil {
		t.Fatalf("publish kitchen seed: %v", err)
	}
	if err := publisher.PublishDeviceState("Bedroom Light",
		[]byte(`{"state":"ON","brightness":100}`)); err != nil {
		t.Fatalf("publish bedroom seed: %v", err)
	}
	time.Sleep(200 * time.Millisecond)

	clipConfig := `{"value":true}`
	data, err := graphqlMutation(`mutation($input: CreateEffectInput!) {
		createEffect(input: $input) { id }
	}`, map[string]any{
		"input": map[string]any{
			"name":       "Phase9 Loop",
			"kind":       "TIMELINE",
			"loop":       true,
			"durationMs": 50,
			"tracks": []map[string]any{
				{
					"name": "Track 1",
					"clips": []map[string]any{
						{
							"startMs":         0,
							"transitionMinMs": 0,
							"transitionMaxMs": 0,
							"kind":            "SET_ON_OFF",
							"config":          clipConfig,
						},
					},
				},
			},
		},
	})
	if err != nil {
		t.Fatalf("create effect: %v", err)
	}
	var er struct {
		CreateEffect struct{ ID string } `json:"createEffect"`
	}
	if err := json.Unmarshal(data, &er); err != nil {
		t.Fatalf("unmarshal create effect: %v", err)
	}
	effID := er.CreateEffect.ID
	t.Cleanup(func() {
		_, _ = graphqlMutation(`mutation($id: ID!) { deleteEffect(id: $id) }`, map[string]any{"id": effID})
	})

	staticPayload := `{"kind":"static","on":true,"brightness":100,"colorTemp":370}`
	effectPayload := `{"kind":"effect","effect_id":"` + effID + `"}`
	data, err = graphqlMutation(`mutation($input: CreateSceneInput!) {
		createScene(input: $input) { id }
	}`, map[string]any{
		"input": map[string]any{
			"name": "Phase9 Mixed",
			"actions": []map[string]any{
				{"targetType": "device", "targetId": staticID},
				{"targetType": "device", "targetId": effectID},
			},
			"devicePayloads": []map[string]any{
				{"deviceId": staticID, "payload": staticPayload},
				{"deviceId": effectID, "payload": effectPayload},
			},
		},
	})
	if err != nil {
		t.Fatalf("create scene: %v", err)
	}
	var sr struct {
		CreateScene struct{ ID string } `json:"createScene"`
	}
	if err := json.Unmarshal(data, &sr); err != nil {
		t.Fatalf("unmarshal create scene: %v", err)
	}
	sceneID := sr.CreateScene.ID
	t.Cleanup(func() {
		_, _ = graphqlMutation(`mutation($id: ID!) { deleteScene(id: $id) }`, map[string]any{"id": sceneID})
	})

	cmdCh, err := publisher.SubscribeCommands()
	if err != nil {
		t.Fatalf("subscribe commands: %v", err)
	}

	if _, err := graphqlMutation(`mutation($id: ID!) { applyScene(sceneId: $id) { id } }`,
		map[string]any{"id": sceneID}); err != nil {
		t.Fatalf("apply: %v", err)
	}

	gotStatic := pollUntil(5*time.Second, 50*time.Millisecond, func() bool {
		select {
		case msg := <-cmdCh:
			if msg.Topic == "zigbee2mqtt/Kitchen Light/set" {
				return true
			}
		default:
		}
		return false
	})
	if !gotStatic {
		t.Fatal("expected static command for Kitchen Light after applyScene")
	}

	activeFound := pollUntil(5*time.Second, 50*time.Millisecond, func() bool {
		data, _ := graphqlQuery(`{ activeEffects { effect { id } targetType targetId } }`, nil)
		var resp struct {
			ActiveEffects []struct {
				Effect     struct{ ID string } `json:"effect"`
				TargetType string              `json:"targetType"`
				TargetID   string              `json:"targetId"`
			} `json:"activeEffects"`
		}
		if json.Unmarshal(data, &resp) != nil {
			return false
		}
		for _, a := range resp.ActiveEffects {
			if a.Effect.ID == effID && a.TargetType == "device" && a.TargetID == effectID {
				return true
			}
		}
		return false
	})
	if !activeFound {
		t.Fatal("effect run for Bedroom Light never appeared in activeEffects")
	}

	if err := publisher.PublishDeviceState("Kitchen Light",
		[]byte(`{"state":"ON","brightness":50,"color_temp":370}`)); err != nil {
		t.Fatalf("publish drift: %v", err)
	}

	deactivated := pollUntil(5*time.Second, 50*time.Millisecond, func() bool {
		data, _ := graphqlQuery(`query($id: ID!) { scene(id: $id) { activatedAt } }`,
			map[string]any{"id": sceneID})
		var sc struct {
			Scene struct {
				ActivatedAt *string `json:"activatedAt"`
			} `json:"scene"`
		}
		if json.Unmarshal(data, &sc) != nil {
			return false
		}
		return sc.Scene.ActivatedAt == nil
	})
	if !deactivated {
		t.Fatal("scene never deactivated after static-device drift")
	}

	cleared := pollUntil(5*time.Second, 50*time.Millisecond, func() bool {
		data, _ := graphqlQuery(`{ activeEffects { effect { id } targetId } }`, nil)
		var resp struct {
			ActiveEffects []struct {
				Effect   struct{ ID string } `json:"effect"`
				TargetID string              `json:"targetId"`
			} `json:"activeEffects"`
		}
		if json.Unmarshal(data, &resp) != nil {
			return false
		}
		for _, a := range resp.ActiveEffects {
			if a.Effect.ID == effID && a.TargetID == effectID {
				return false
			}
		}
		return true
	})
	if !cleared {
		t.Fatal("effect run for Bedroom Light still active after scene deactivation")
	}
}
