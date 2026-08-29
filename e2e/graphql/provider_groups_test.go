//go:build e2e

package graphql_test

import (
	"encoding/json"
	"strings"
	"testing"
	"time"

	"github.com/saffronjam/saffron-hive/e2e/infra"
)

const e2eProviderGroupID = "zigbee2mqtt:group:42"

type providerGroupView struct {
	ID           string   `json:"id"`
	Name         *string  `json:"name"`
	FriendlyName string   `json:"friendlyName"`
	Source       string   `json:"source"`
	Removed      bool     `json:"removed"`
	Icon         *string  `json:"icon"`
	Tags         []string `json:"tags"`
	Members      []struct {
		ID       string `json:"id"`
		MemberID string `json:"memberId"`
	} `json:"members"`
}

func queryProviderGroup() (*providerGroupView, error) {
	data, err := graphqlQuery(`query($id: ID!) {
		group(id: $id) { id name friendlyName source removed icon tags members { id memberId } }
	}`, map[string]any{"id": e2eProviderGroupID})
	if err != nil {
		return nil, err
	}
	var result struct {
		Group *providerGroupView `json:"group"`
	}
	if err := json.Unmarshal(data, &result); err != nil {
		return nil, err
	}
	return result.Group, nil
}

func waitForGroupChange(ch <-chan json.RawMessage, id string) bool {
	return pollUntil(5*time.Second, 25*time.Millisecond, func() bool {
		select {
		case data := <-ch:
			var result struct {
				GroupsChanged []string `json:"groupsChanged"`
			}
			if json.Unmarshal(data, &result) != nil {
				return false
			}
			for _, changedID := range result.GroupsChanged {
				if changedID == id {
					return true
				}
			}
		default:
		}
		return false
	})
}

func collectCommands(ch <-chan infra.MQTTMessage, duration time.Duration) []infra.MQTTMessage {
	timer := time.NewTimer(duration)
	defer timer.Stop()
	var messages []infra.MQTTMessage
	for {
		select {
		case message := <-ch:
			messages = append(messages, message)
		case <-timer.C:
			return messages
		}
	}
}

func TestProviderGroupsLifecycleOwnershipAndMulticast(t *testing.T) {
	livingID, err := queryDeviceIDByName("Living Room Light")
	if err != nil {
		t.Fatalf("find living room light: %v", err)
	}
	bedroomID, err := queryDeviceIDByName("Bedroom Light")
	if err != nil {
		t.Fatalf("find bedroom light: %v", err)
	}

	changes, stopChanges, err := wsSubscribe(`subscription { groupsChanged }`, nil)
	if err != nil {
		t.Fatalf("subscribe groupsChanged: %v", err)
	}
	defer stopChanges()
	time.Sleep(200 * time.Millisecond)

	t.Cleanup(func() {
		_ = publisher.PublishBridgeGroups([]byte(`[]`))
		_, _ = graphqlMutation(`mutation($id: ID!) { updateDevice(id: $id, input: { disabled: false }) { id } }`, map[string]any{"id": bedroomID})
	})

	initial := []byte(`[{"id":42,"friendly_name":"E2E Zigbee Group","members":[
		{"ieee_address":"` + livingID + `","endpoint":1}
	]}]`)
	if err := publisher.PublishBridgeGroups(initial); err != nil {
		t.Fatalf("publish provider group: %v", err)
	}
	if !waitForGroupChange(changes, e2eProviderGroupID) {
		t.Fatal("groupsChanged did not report retained provider group")
	}
	if !pollUntil(5*time.Second, 50*time.Millisecond, func() bool {
		group, queryErr := queryProviderGroup()
		return queryErr == nil && group != nil && group.Source == "zigbee2mqtt" && !group.Removed && len(group.Members) == 1
	}) {
		t.Fatal("provider group did not become queryable")
	}

	if _, err := graphqlMutation(`mutation($id: ID!) {
		updateGroup(id: $id, input: { icon: "lucide:lamp", tags: [LIGHT] }) {
			id icon tags source
		}
	}`, map[string]any{"id": e2eProviderGroupID}); err != nil {
		t.Fatalf("update Hive-owned provider metadata: %v", err)
	}
	if _, err := graphqlMutation(`mutation($id: ID!) {
		updateGroup(id: $id, input: { name: "Display group" }) { id name friendlyName }
	}`, map[string]any{"id": e2eProviderGroupID}); err != nil {
		t.Fatalf("update provider display name: %v", err)
	}
	for name, mutation := range map[string]string{
		"delete": `mutation($id: ID!) { deleteGroup(id: $id) }`,
		"member": `mutation($id: ID!) { addGroupMember(input: { groupId: $id, memberType: "device", memberId: "x" }) { id } }`,
	} {
		if err := graphqlMutationExpectError(mutation, map[string]any{"id": e2eProviderGroupID}); err != nil {
			t.Fatalf("%s ownership lock: %v", name, err)
		}
	}

	updated := []byte(`[{"id":42,"friendly_name":"E2E Zigbee Lights","members":[
		{"ieee_address":"` + livingID + `","endpoint":1},
		{"ieee_address":"` + bedroomID + `","endpoint":11}
	]}]`)
	if err := publisher.PublishBridgeGroups(updated); err != nil {
		t.Fatalf("publish provider rename: %v", err)
	}
	if !waitForGroupChange(changes, e2eProviderGroupID) {
		t.Fatal("groupsChanged did not report provider rename/membership update")
	}
	if !pollUntil(5*time.Second, 50*time.Millisecond, func() bool {
		group, queryErr := queryProviderGroup()
		return queryErr == nil && group != nil && group.Name != nil && *group.Name == "Display group" && group.FriendlyName == "E2E Zigbee Lights" && len(group.Members) == 2 && group.Icon != nil && *group.Icon == "lucide:lamp" && len(group.Tags) == 1 && group.Tags[0] == "LIGHT"
	}) {
		t.Fatal("provider update did not preserve Hive-owned metadata")
	}

	commands, err := publisher.SubscribeCommands()
	if err != nil {
		t.Fatalf("subscribe multicast commands: %v", err)
	}
	if _, err := graphqlMutation(`mutation($id: ID!) {
		setTargetState(targetType: GROUP, targetId: $id, state: { on: true })
	}`, map[string]any{"id": e2eProviderGroupID}); err != nil {
		t.Fatalf("command provider group: %v", err)
	}
	var multicast []infra.MQTTMessage
	deadline := time.After(500 * time.Millisecond)
	for {
		select {
		case msg := <-commands:
			multicast = append(multicast, msg)
		case <-deadline:
			goto multicastDone
		}
	}

multicastDone:
	if len(multicast) != 1 || multicast[0].Topic != "zigbee2mqtt/E2E Zigbee Lights/set" {
		t.Fatalf("multicast messages = %+v", multicast)
	}

	sceneData, err := graphqlMutation(`mutation($input: CreateSceneInput!) {
		createScene(input: $input) { id }
	}`, map[string]any{"input": map[string]any{
		"name": "Provider reference scene",
		"definition": staticSceneDefinition(
			[]map[string]any{{"targetType": "group", "targetId": e2eProviderGroupID}},
			map[string]any{},
			[]map[string]any{
				{"deviceId": livingID, "kind": "state", "state": map[string]any{"on": true}},
				{"deviceId": bedroomID, "kind": "state", "state": map[string]any{"on": true}},
			},
		),
	}})
	if err != nil {
		t.Fatalf("create provider scene: %v", err)
	}
	var providerScene struct {
		CreateScene struct {
			ID string `json:"id"`
		} `json:"createScene"`
	}
	if err := json.Unmarshal(sceneData, &providerScene); err != nil {
		t.Fatalf("decode provider scene: %v", err)
	}
	t.Cleanup(func() {
		_, _ = graphqlMutation(`mutation($id: ID!) { deleteScene(id: $id) }`, map[string]any{"id": providerScene.CreateScene.ID})
	})
	sceneCommands, err := publisher.SubscribeCommands()
	if err != nil {
		t.Fatalf("subscribe scene commands: %v", err)
	}
	if _, err := graphqlMutation(`mutation($id: ID!) { applyScene(sceneId: $id) { id } }`, map[string]any{"id": providerScene.CreateScene.ID}); err != nil {
		t.Fatalf("apply provider scene: %v", err)
	}
	sceneMessages := collectCommands(sceneCommands, 500*time.Millisecond)
	if len(sceneMessages) != 2 || sceneMessages[0].Topic == "zigbee2mqtt/E2E Zigbee Lights/set" || sceneMessages[1].Topic == "zigbee2mqtt/E2E Zigbee Lights/set" {
		t.Fatalf("scene device messages = %+v", sceneMessages)
	}

	triggerConfig, _ := json.Marshal(map[string]string{"kind": "event", "event_type": "test.fire", "filter_expr": "true"})
	actionConfig, _ := json.Marshal(map[string]string{
		"action_type": "set_device_state",
		"target_type": "group",
		"target_id":   e2eProviderGroupID,
		"payload":     `{"on":false}`,
	})
	automationData, err := graphqlMutation(`mutation($input: CreateAutomationInput!) {
		createAutomation(input: $input) { id }
	}`, map[string]any{"input": map[string]any{
		"name":    "Provider group automation",
		"enabled": true,
		"nodes": []map[string]any{
			{"id": "provider-trigger", "type": "trigger", "config": string(triggerConfig)},
			{"id": "provider-action", "type": "action", "config": string(actionConfig)},
		},
		"edges": []map[string]any{{"fromNodeId": "provider-trigger", "toNodeId": "provider-action"}},
	}})
	if err != nil {
		t.Fatalf("create provider automation: %v", err)
	}
	var providerAutomation struct {
		CreateAutomation struct {
			ID string `json:"id"`
		} `json:"createAutomation"`
	}
	if err := json.Unmarshal(automationData, &providerAutomation); err != nil {
		t.Fatalf("decode provider automation: %v", err)
	}
	t.Cleanup(func() {
		_, _ = graphqlMutation(`mutation($id: ID!) { deleteAutomation(id: $id) }`, map[string]any{"id": providerAutomation.CreateAutomation.ID})
	})
	automationCommands, err := publisher.SubscribeCommands()
	if err != nil {
		t.Fatalf("subscribe automation commands: %v", err)
	}
	if _, err := graphqlMutation(`mutation($id: ID!) {
		fireAutomationTrigger(automationId: $id, nodeId: "provider-trigger")
	}`, map[string]any{"id": providerAutomation.CreateAutomation.ID}); err != nil {
		t.Fatalf("fire provider automation: %v", err)
	}
	automationMessages := collectCommands(automationCommands, 500*time.Millisecond)
	if len(automationMessages) != 1 || automationMessages[0].Topic != "zigbee2mqtt/E2E Zigbee Lights/set" {
		t.Fatalf("automation multicast messages = %+v", automationMessages)
	}

	effectData, err := graphqlMutation(`mutation($input: CreateEffectInput!) {
		createEffect(input: $input) { id }
	}`, map[string]any{"input": map[string]any{
		"name":       "Provider group effect",
		"kind":       "TIMELINE",
		"loop":       true,
		"durationMs": 1000,
		"tracks": []map[string]any{{
			"name": "Power",
			"clips": []map[string]any{{
				"startMs": 0, "transitionMinMs": 0, "transitionMaxMs": 0,
				"kind": "SET_ON_OFF", "config": `{"value":true}`,
			}},
		}},
	}})
	if err != nil {
		t.Fatalf("create provider effect: %v", err)
	}
	var providerEffect struct {
		CreateEffect struct {
			ID string `json:"id"`
		} `json:"createEffect"`
	}
	if err := json.Unmarshal(effectData, &providerEffect); err != nil {
		t.Fatalf("decode provider effect: %v", err)
	}
	t.Cleanup(func() {
		_, _ = graphqlMutation(`mutation($id: ID!) { deleteEffect(id: $id) }`, map[string]any{"id": providerEffect.CreateEffect.ID})
	})
	effectCommands, err := publisher.SubscribeCommands()
	if err != nil {
		t.Fatalf("subscribe effect commands: %v", err)
	}
	if _, err := graphqlMutation(`mutation($effectId: ID!, $targetId: ID!) {
		runEffect(effectId: $effectId, targetType: "group", targetId: $targetId) { id }
	}`, map[string]any{"effectId": providerEffect.CreateEffect.ID, "targetId": e2eProviderGroupID}); err != nil {
		t.Fatalf("run provider effect: %v", err)
	}
	effectMessages := collectCommands(effectCommands, 500*time.Millisecond)
	if len(effectMessages) != 1 || effectMessages[0].Topic != "zigbee2mqtt/E2E Zigbee Lights/set" {
		t.Fatalf("effect multicast messages = %+v", effectMessages)
	}
	if _, err := graphqlMutation(`mutation($targetId: ID!) {
		stopEffect(targetType: "group", targetId: $targetId)
	}`, map[string]any{"targetId": e2eProviderGroupID}); err != nil {
		t.Fatalf("stop provider effect: %v", err)
	}

	if _, err := graphqlMutation(`mutation($id: ID!) {
		updateDevice(id: $id, input: { disabled: true }) { id disabled }
	}`, map[string]any{"id": bedroomID}); err != nil {
		t.Fatalf("disable group member: %v", err)
	}
	if !pollUntil(5*time.Second, 50*time.Millisecond, func() bool {
		data, queryErr := graphqlQuery(`query($id: ID!) { device(id: $id) { disabled } }`, map[string]any{"id": bedroomID})
		if queryErr != nil {
			return false
		}
		var result struct {
			Device struct {
				Disabled bool `json:"disabled"`
			} `json:"device"`
		}
		return json.Unmarshal(data, &result) == nil && result.Device.Disabled
	}) {
		t.Fatal("disabled member did not reach the live store")
	}

	fallback, err := publisher.SubscribeCommands()
	if err != nil {
		t.Fatalf("subscribe fallback commands: %v", err)
	}
	if _, err := graphqlMutation(`mutation($id: ID!) {
		setTargetState(targetType: GROUP, targetId: $id, state: { on: false })
	}`, map[string]any{"id": e2eProviderGroupID}); err != nil {
		t.Fatalf("command group with disabled member: %v", err)
	}
	var fallbackMessages []infra.MQTTMessage
	deadline = time.After(500 * time.Millisecond)
	for {
		select {
		case msg := <-fallback:
			fallbackMessages = append(fallbackMessages, msg)
		case <-deadline:
			goto fallbackDone
		}
	}

fallbackDone:
	if len(fallbackMessages) != 1 || fallbackMessages[0].Topic != "zigbee2mqtt/Living Room Light/set" {
		t.Fatalf("disabled-member fallback messages = %+v", fallbackMessages)
	}

	if err := publisher.PublishBridgeGroups([]byte(`[]`)); err != nil {
		t.Fatalf("remove provider group: %v", err)
	}
	if !waitForGroupChange(changes, e2eProviderGroupID) {
		t.Fatal("groupsChanged did not report provider removal")
	}
	if !pollUntil(5*time.Second, 50*time.Millisecond, func() bool {
		group, queryErr := queryProviderGroup()
		return queryErr == nil && group != nil && group.Removed
	}) {
		t.Fatal("provider group was not soft removed")
	}
	group, err := queryProviderGroup()
	if err != nil || group == nil || group.Icon == nil || *group.Icon != "lucide:lamp" || len(group.Members) != 2 {
		t.Fatalf("removed provider reference = %+v, err=%v", group, err)
	}

	data, err := graphqlQuery(`query($id: ID!) {
		scene(id: $id) {
			targets {
				target { ... on Group { id name source removed resolvedDevices { id } } }
			}
		}
		groups { id }
	}`, map[string]any{"id": providerScene.CreateScene.ID})
	if err != nil {
		t.Fatalf("query removed scene reference: %v", err)
	}
	if !strings.Contains(string(data), `"source":"zigbee2mqtt"`) ||
		!strings.Contains(string(data), `"removed":true`) ||
		strings.Contains(string(data), `"groups":[{"id":"`+e2eProviderGroupID+`"`) {
		t.Fatalf("removed group reference/list projection = %s", data)
	}
}

func TestEffectSources(t *testing.T) {
	data, err := graphqlMutation(`mutation {
		createEffect(input: {
			name: "E2E Hive Effect"
			kind: TIMELINE
			loop: false
			durationMs: 0
			tracks: []
		}) { id source }
	}`, nil)
	if err != nil {
		t.Fatalf("create Hive effect: %v", err)
	}
	var created struct {
		CreateEffect struct {
			ID     string `json:"id"`
			Source string `json:"source"`
		} `json:"createEffect"`
	}
	if err := json.Unmarshal(data, &created); err != nil {
		t.Fatalf("decode Hive effect: %v", err)
	}
	if created.CreateEffect.Source != "hive" {
		t.Fatalf("Hive effect source = %q", created.CreateEffect.Source)
	}
	t.Cleanup(func() {
		_, _ = graphqlMutation(`mutation($id: ID!) { deleteEffect(id: $id) }`, map[string]any{"id": created.CreateEffect.ID})
	})

	devices, err := infra.LoadBridgeDevices()
	if err != nil {
		t.Fatalf("load devices: %v", err)
	}
	var registry []map[string]any
	if err := json.Unmarshal(devices, &registry); err != nil {
		t.Fatalf("decode devices: %v", err)
	}
	definition := registry[0]["definition"].(map[string]any)
	exposes := definition["exposes"].([]any)
	definition["exposes"] = append(exposes, map[string]any{
		"type": "enum", "name": "effect", "property": "effect", "access": 2,
		"values": []any{"e2e_blink"},
	})
	withEffect, err := json.Marshal(registry)
	if err != nil {
		t.Fatalf("encode devices: %v", err)
	}
	if err := publisher.PublishBridgeDevices(withEffect); err != nil {
		t.Fatalf("publish effect capability: %v", err)
	}
	t.Cleanup(func() { _ = publisher.PublishBridgeDevices(devices) })

	if !pollUntil(5*time.Second, 50*time.Millisecond, func() bool {
		options, queryErr := graphqlQuery(`{ nativeEffectOptions { name source } }`, nil)
		return queryErr == nil && strings.Contains(string(options), `"name":"e2e_blink"`) && strings.Contains(string(options), `"source":"zigbee2mqtt"`)
	}) {
		t.Fatal("Zigbee effect option did not expose its source")
	}
}
