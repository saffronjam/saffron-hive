//go:build e2e

package graphql_test

import (
	"encoding/base64"
	"encoding/json"
	"testing"
	"time"
)

func staticSceneDefinition(targets []map[string]any, state map[string]any, overrides []map[string]any) map[string]any {
	if overrides == nil {
		overrides = []map[string]any{}
	}
	for _, target := range targets {
		if target["targetType"] != "device" {
			continue
		}
		deviceID, _ := target["targetId"].(string)
		hasOverride := false
		for _, override := range overrides {
			if override["deviceId"] == deviceID {
				hasOverride = true
				break
			}
		}
		if !hasOverride {
			overrides = append(overrides, map[string]any{"deviceId": deviceID, "kind": "state", "state": state})
		}
	}
	return map[string]any{
		"targets": targets,
		"lighting": map[string]any{
			"overrides": overrides,
		},
		"supportingStates": []map[string]any{},
	}
}

func createScene(t *testing.T, name string, definition map[string]any) string {
	t.Helper()
	data, err := graphqlMutation(`mutation($input: CreateSceneInput!) {
		createScene(input: $input) { id }
	}`, map[string]any{"input": map[string]any{"name": name, "definition": definition}})
	if err != nil {
		t.Fatalf("create Scene %q: %v", name, err)
	}
	var response struct {
		CreateScene struct{ ID string } `json:"createScene"`
	}
	if err := json.Unmarshal(data, &response); err != nil {
		t.Fatalf("decode created Scene: %v", err)
	}
	id := response.CreateScene.ID
	t.Cleanup(func() {
		_, _ = graphqlMutation(`mutation($id: ID!) { deleteScene(id: $id) }`, map[string]any{"id": id})
	})
	return id
}

func sceneActivatedAt(sceneID string) *string {
	data, err := graphqlQuery(`query($id: ID!) { scene(id: $id) { activatedAt } }`, map[string]any{"id": sceneID})
	if err != nil {
		return nil
	}
	var response struct {
		Scene struct {
			ActivatedAt *string `json:"activatedAt"`
		} `json:"scene"`
	}
	if json.Unmarshal(data, &response) != nil {
		return nil
	}
	return response.Scene.ActivatedAt
}

func TestScenesStaticLifecycle(t *testing.T) {
	deviceID, err := queryDeviceIDByName("Bedroom Light")
	if err != nil {
		t.Fatalf("find device: %v", err)
	}
	definition := staticSceneDefinition(
		[]map[string]any{{"targetType": "device", "targetId": deviceID}},
		map[string]any{"on": true, "brightness": 151, "colorTemp": 320},
		nil,
	)
	data, err := graphqlMutation(`mutation($input: CreateSceneInput!) {
		createScene(input: $input) {
			id name targets { targetType targetId }
			lighting { overrides { deviceId kind state { on brightness colorTemp } } }
			preview { width height pixels { r g b } }
		}
	}`, map[string]any{"input": map[string]any{"name": "Typed manual", "definition": definition}})
	if err != nil {
		t.Fatalf("create typed Scene: %v", err)
	}
	var created struct {
		CreateScene struct {
			ID      string `json:"id"`
			Name    string `json:"name"`
			Targets []struct {
				TargetType string `json:"targetType"`
				TargetID   string `json:"targetId"`
			} `json:"targets"`
			Lighting struct {
				Overrides []struct {
					DeviceID string `json:"deviceId"`
					State    struct {
						On         bool `json:"on"`
						Brightness int  `json:"brightness"`
						ColorTemp  int  `json:"colorTemp"`
					} `json:"state"`
				} `json:"overrides"`
			} `json:"lighting"`
			Preview struct {
				Width, Height int
				Pixels        []struct{ R, G, B int }
			} `json:"preview"`
		} `json:"createScene"`
	}
	if err := json.Unmarshal(data, &created); err != nil {
		t.Fatalf("decode Scene: %v", err)
	}
	sceneID := created.CreateScene.ID
	t.Cleanup(func() {
		_, _ = graphqlMutation(`mutation($id: ID!) { deleteScene(id: $id) }`, map[string]any{"id": sceneID})
	})
	if created.CreateScene.Name != "Typed manual" || len(created.CreateScene.Targets) != 1 || created.CreateScene.Targets[0].TargetID != deviceID {
		t.Fatalf("typed Scene identity/targets = %+v", created.CreateScene)
	}
	if len(created.CreateScene.Lighting.Overrides) != 1 || !created.CreateScene.Lighting.Overrides[0].State.On || created.CreateScene.Lighting.Overrides[0].State.Brightness != 151 || created.CreateScene.Lighting.Overrides[0].State.ColorTemp != 320 {
		t.Fatalf("lighting overrides = %+v", created.CreateScene.Lighting)
	}
	if created.CreateScene.Preview.Width != 1 || created.CreateScene.Preview.Height != 1 || len(created.CreateScene.Preview.Pixels) != 1 {
		t.Fatalf("static preview = %+v", created.CreateScene.Preview)
	}

	commands, err := publisher.SubscribeCommands()
	if err != nil {
		t.Fatalf("subscribe commands: %v", err)
	}
	if _, err := graphqlMutation(`mutation($id: ID!) { applyScene(sceneId: $id) { id activatedAt } }`, map[string]any{"id": sceneID}); err != nil {
		t.Fatalf("apply Scene: %v", err)
	}
	if !pollUntil(5*time.Second, 25*time.Millisecond, func() bool {
		select {
		case message := <-commands:
			if message.Topic != "zigbee2mqtt/Bedroom Light/set" {
				return false
			}
			var payload map[string]any
			if json.Unmarshal(message.Payload, &payload) != nil {
				return false
			}
			return payload["state"] == "ON" && payload["brightness"] == float64(151) && payload["color_temp"] == float64(320)
		default:
			return false
		}
	}) {
		t.Fatal("typed static command did not reach Bedroom Light")
	}
	if sceneActivatedAt(sceneID) == nil {
		t.Fatal("Scene did not become active")
	}
	if _, err := graphqlMutation(`mutation($id: ID!) { deactivateScene(sceneId: $id) { id activatedAt } }`, map[string]any{"id": sceneID}); err != nil {
		t.Fatalf("stop Scene: %v", err)
	}
	if sceneActivatedAt(sceneID) != nil {
		t.Fatal("Scene remained active after explicit stop")
	}
}

func TestScenesGroupAndCapabilitySelectorTargets(t *testing.T) {
	livingID, err := queryDeviceIDByName("Living Room Light")
	if err != nil {
		t.Fatalf("find Living Room Light: %v", err)
	}
	data, err := graphqlMutation(`mutation { createGroup(input: { name: "Scene target group" }) { id } }`, nil)
	if err != nil {
		t.Fatalf("create group: %v", err)
	}
	var groupResponse struct {
		CreateGroup struct{ ID string } `json:"createGroup"`
	}
	_ = json.Unmarshal(data, &groupResponse)
	groupID := groupResponse.CreateGroup.ID
	t.Cleanup(func() {
		_, _ = graphqlMutation(`mutation($id: ID!) { deleteGroup(id: $id) }`, map[string]any{"id": groupID})
	})
	if _, err := graphqlMutation(`mutation($input: AddGroupMemberInput!) { addGroupMember(input: $input) { id } }`, map[string]any{"input": map[string]any{"groupId": groupID, "memberType": "device", "memberId": livingID}}); err != nil {
		t.Fatalf("add group member: %v", err)
	}
	groupSceneID := createScene(t, "Group static", staticSceneDefinition(
		[]map[string]any{{"targetType": "group", "targetId": groupID}},
		map[string]any{},
		[]map[string]any{{"deviceId": livingID, "kind": "state", "state": map[string]any{"on": true, "brightness": 177, "colorTemp": 300}}},
	))
	commands, err := publisher.SubscribeCommands()
	if err != nil {
		t.Fatalf("subscribe commands: %v", err)
	}
	if _, err := graphqlMutation(`mutation($id: ID!) { applyScene(sceneId: $id) { id } }`, map[string]any{"id": groupSceneID}); err != nil {
		t.Fatalf("apply group Scene: %v", err)
	}
	if !pollUntil(5*time.Second, 25*time.Millisecond, func() bool {
		select {
		case message := <-commands:
			return message.Topic == "zigbee2mqtt/Living Room Light/set"
		default:
			return false
		}
	}) {
		t.Fatal("group target did not resolve to its physical light")
	}

	selector := []map[string]any{
		{"subject": "device_type", "op": "is", "values": []string{"light"}},
		{"connector": "and", "subject": "writable_capability", "op": "is", "values": []string{"color"}},
	}
	data, err = graphqlMutation(`mutation($input: CreateSceneInput!) {
		createScene(input: $input) { id targets { targetType name expression { connector subject op values } } }
	}`, map[string]any{"input": map[string]any{
		"name": "Colour selector",
		"definition": staticSceneDefinition(
			[]map[string]any{{"targetType": "expression", "name": "Full colour lights", "expression": selector}},
			map[string]any{"on": true, "brightness": 140}, nil,
		),
	}})
	if err != nil {
		t.Fatalf("create Selector Scene: %v", err)
	}
	var selectorResponse struct {
		CreateScene struct {
			ID      string `json:"id"`
			Targets []struct {
				TargetType string `json:"targetType"`
				Name       string `json:"name"`
				Expression []struct {
					Subject string `json:"subject"`
					Values  []string
				} `json:"expression"`
			} `json:"targets"`
		} `json:"createScene"`
	}
	_ = json.Unmarshal(data, &selectorResponse)
	selectorSceneID := selectorResponse.CreateScene.ID
	t.Cleanup(func() {
		_, _ = graphqlMutation(`mutation($id: ID!) { deleteScene(id: $id) }`, map[string]any{"id": selectorSceneID})
	})
	if len(selectorResponse.CreateScene.Targets) != 1 || len(selectorResponse.CreateScene.Targets[0].Expression) != 2 || selectorResponse.CreateScene.Targets[0].Expression[1].Subject != "writable_capability" || selectorResponse.CreateScene.Targets[0].Expression[1].Values[0] != "color" {
		t.Fatalf("capability Selector did not round-trip: %+v", selectorResponse.CreateScene.Targets)
	}
}

func guidedSelections(t *testing.T, domain, seed string, count int) []string {
	t.Helper()
	selected := []string{}
	for len(selected) < count {
		data, err := graphqlQuery(`query($input: GuidedVibeRoundInput!) {
			guidedVibeRound(input: $input) {
				round canFinish complete
				options { id labelId preview { width height pixels { r g b } swatches { x y color { r g b } } } }
			}
		}`, map[string]any{"input": map[string]any{"domain": domain, "seed": seed, "selectedIds": selected}})
		if err != nil {
			t.Fatalf("guided round %d: %v", len(selected)+1, err)
		}
		var response struct {
			GuidedVibeRound struct {
				Options []struct {
					ID      string
					Preview struct {
						Width, Height int
						Pixels        []struct{ R, G, B int }
						Swatches      []struct{ X, Y float64 }
					} `json:"preview"`
				} `json:"options"`
			} `json:"guidedVibeRound"`
		}
		_ = json.Unmarshal(data, &response)
		if len(response.GuidedVibeRound.Options) != 5 {
			t.Fatalf("guided round %d options = %d, want 5", len(selected)+1, len(response.GuidedVibeRound.Options))
		}
		for _, option := range response.GuidedVibeRound.Options {
			if option.Preview.Width == 0 || option.Preview.Height == 0 || len(option.Preview.Pixels) != option.Preview.Width*option.Preview.Height || len(option.Preview.Swatches) == 0 {
				t.Fatalf("guided option %s has an invalid field preview: %+v", option.ID, option.Preview)
			}
		}
		selected = append(selected, response.GuidedVibeRound.Options[0].ID)
	}
	return selected
}

func TestScenesAllVibeSourcesAndDomains(t *testing.T) {
	data, err := graphqlQuery(`{
		vibePresets { id category domain seed brightness movement cycleSeconds preview { width height pixels { r g b } } }
	}`, nil)
	if err != nil {
		t.Fatalf("query Vibe gallery: %v", err)
	}
	var catalogue struct {
		VibePresets []struct {
			ID, Domain string
			Preview    struct {
				Width, Height int
				Pixels        []struct{ R, G, B int }
			}
		} `json:"vibePresets"`
	}
	_ = json.Unmarshal(data, &catalogue)
	if len(catalogue.VibePresets) == 0 {
		t.Fatal("Vibe gallery is empty")
	}
	var fullPreset, whitePreset string
	for _, preset := range catalogue.VibePresets {
		if preset.Preview.Width == 0 || preset.Preview.Height == 0 || len(preset.Preview.Pixels) == 0 {
			t.Fatalf("preset %s has no canonical preview", preset.ID)
		}
		if preset.Domain == "full_color" && fullPreset == "" {
			fullPreset = preset.ID
		}
		if preset.Domain == "white_ambience" && whitePreset == "" {
			whitePreset = preset.ID
		}
	}
	if fullPreset == "" || whitePreset == "" {
		t.Fatalf("catalogue domains missing: full=%q white=%q", fullPreset, whitePreset)
	}

	rgb := base64.StdEncoding.EncodeToString([]byte{
		255, 70, 30, 250, 180, 50,
		30, 70, 255, 120, 20, 180,
	})
	for _, domain := range []string{"full_color", "white_ambience"} {
		data, err := graphqlQuery(`query($input: PreviewVibeInput!) {
			previewVibe(input: $input) { domain seed brightness movement cycleSeconds minimumLightness maximumLightness preview { width height pixels { r g b } swatches { x y color { r g b } } } }
		}`, map[string]any{"input": map[string]any{"source": map[string]any{"photo": map[string]any{"domain": domain, "seed": "42", "width": 2, "height": 2, "rgbBase64": rgb}}}})
		if err != nil {
			t.Fatalf("preview %s Photo Vibe: %v", domain, err)
		}
		var preview struct {
			PreviewVibe struct {
				Domain  string `json:"domain"`
				Preview struct {
					Width, Height int
					Pixels        []struct{ R, G, B int }
					Swatches      []struct{ X, Y float64 }
				} `json:"preview"`
			} `json:"previewVibe"`
		}
		_ = json.Unmarshal(data, &preview)
		if preview.PreviewVibe.Domain != domain || preview.PreviewVibe.Preview.Width != 24 || preview.PreviewVibe.Preview.Height != 16 || len(preview.PreviewVibe.Preview.Pixels) != 24*16 || len(preview.PreviewVibe.Preview.Swatches) == 0 {
			t.Fatalf("%s Photo preview = %+v", domain, preview.PreviewVibe)
		}
	}

	fullGuided := guidedSelections(t, "full_color", "83", 3)
	whiteGuided := guidedSelections(t, "white_ambience", "84", 5)
	deviceID, err := queryDeviceIDByName("Bedroom Light")
	if err != nil {
		t.Fatalf("find target light: %v", err)
	}
	targets := []map[string]any{{"targetType": "device", "targetId": deviceID}}
	sources := []struct {
		name   string
		source map[string]any
		kind   string
	}{
		{"Gallery Vibe", map[string]any{"preset": map[string]any{"presetId": fullPreset, "seed": "101"}}, "preset"},
		{"Photo whites", map[string]any{"photo": map[string]any{"domain": "white_ambience", "seed": "102", "width": 2, "height": 2, "rgbBase64": rgb}}, "photo"},
		{"Guided three", map[string]any{"guided": map[string]any{"domain": "full_color", "seed": "83", "selectedIds": fullGuided}}, "guided"},
		{"Guided five", map[string]any{"guided": map[string]any{"domain": "white_ambience", "seed": "84", "selectedIds": whiteGuided}}, "guided"},
	}
	createdIDs := make([]string, 0, len(sources))
	for _, source := range sources {
		data, err := graphqlMutation(`mutation($input: CreateSceneInput!) {
			createScene(input: $input) {
				id preview { width height }
				lighting { dynamicSource { domain sourceKind seed brightness movement cycleSeconds } }
			}
		}`, map[string]any{"input": map[string]any{
			"name": source.name,
			"definition": map[string]any{
				"targets": targets,
				"lighting": map[string]any{
					"dynamicSource": map[string]any{"source": source.source, "brightness": 0.72, "movement": 0.25, "cycleSeconds": 90.0},
					"overrides":     []map[string]any{},
				},
				"supportingStates": []map[string]any{},
			},
		}})
		if err != nil {
			t.Fatalf("create %s: %v", source.name, err)
		}
		var response struct {
			CreateScene struct {
				ID       string `json:"id"`
				Lighting struct {
					DynamicSource struct {
						SourceKind   string
						Brightness   float64
						Movement     float64
						CycleSeconds float64
					} `json:"dynamicSource"`
				} `json:"lighting"`
				Preview struct{ Width, Height int }
			} `json:"createScene"`
		}
		_ = json.Unmarshal(data, &response)
		createdIDs = append(createdIDs, response.CreateScene.ID)
		dynamic := response.CreateScene.Lighting.DynamicSource
		if dynamic.SourceKind != source.kind || dynamic.Brightness != 0.72 || dynamic.Movement != 0.25 || dynamic.CycleSeconds != 90 || response.CreateScene.Preview.Width != 24 {
			t.Fatalf("saved %s = %+v", source.name, response.CreateScene)
		}
	}
	t.Cleanup(func() {
		for _, id := range createdIDs {
			_, _ = graphqlMutation(`mutation($id: ID!) { deleteScene(id: $id) }`, map[string]any{"id": id})
		}
	})

	if _, err := graphqlMutation(`mutation($id: ID!) { applyScene(sceneId: $id) { id activatedAt } }`, map[string]any{"id": createdIDs[0]}); err != nil {
		t.Fatalf("apply Gallery Vibe: %v", err)
	}
	if sceneActivatedAt(createdIDs[0]) == nil {
		t.Fatal("Gallery Vibe did not become active")
	}
	if _, err := graphqlMutation(`mutation($id: ID!) { deactivateScene(sceneId: $id) { activatedAt } }`, map[string]any{"id": createdIDs[0]}); err != nil {
		t.Fatalf("stop Gallery Vibe: %v", err)
	}
}

func TestScenesRejectInvalidPhotoAndUnknownUpdate(t *testing.T) {
	err := graphqlMutationExpectError(`mutation($input: CreateSceneInput!) { createScene(input: $input) { id } }`, map[string]any{"input": map[string]any{
		"name": "Bad photo",
		"definition": map[string]any{
			"targets": []map[string]any{},
			"lighting": map[string]any{
				"dynamicSource": map[string]any{"source": map[string]any{"photo": map[string]any{"domain": "full_color", "seed": "1", "width": 512, "height": 512, "rgbBase64": "AAAA"}}},
				"overrides":     []map[string]any{},
			},
			"supportingStates": []map[string]any{},
		},
	}})
	if err != nil {
		t.Fatalf("invalid Photo sample was accepted: %v", err)
	}
	err = graphqlMutationExpectError(`mutation($id: ID!, $input: UpdateSceneInput!) { updateScene(id: $id, input: $input) { id } }`, map[string]any{"id": "missing-scene", "input": map[string]any{"name": "Nope"}})
	if err != nil {
		t.Fatalf("unknown Scene update was accepted: %v", err)
	}
}
