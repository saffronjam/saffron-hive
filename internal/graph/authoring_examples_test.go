package graph

import (
	"context"
	"encoding/json"
	"os"
	"regexp"
	"strings"
	"testing"

	"github.com/saffronjam/saffron-hive/internal/device"
	"github.com/saffronjam/saffron-hive/internal/store"
)

func TestAssistantAuthoringExamples(t *testing.T) {
	env := newTestEnv(t)
	env.stateReader.addDevice(device.Device{ID: "lamp", Type: device.Light, Capabilities: []device.Capability{{Name: device.CapOnOff, Access: device.CapabilityAccessSet}, {Name: device.CapBrightness, Access: device.CapabilityAccessSet}, {Name: device.CapColorTemp, Access: device.CapabilityAccessSet}}})
	env.stateReader.addDevice(device.Device{ID: "motion", Type: device.Sensor, Capabilities: []device.Capability{{Name: device.CapOccupancy, Access: device.CapabilityAccessState}}})
	env.store.rooms["hallway"] = store.Room{ID: "hallway", Name: "Hallway"}
	env.resolver.TargetResolver = exampleTargetResolver{}
	doc, err := os.ReadFile("../assistant/knowledge/authoring-examples.md")
	if err != nil {
		t.Fatal(err)
	}
	blocks := regexp.MustCompile("(?s)```json\\n(.*?)\\n```").FindAllSubmatch(doc, -1)
	if len(blocks) != 5 {
		t.Fatalf("expected five executable examples, got %d", len(blocks))
	}
	sceneID := ""
	for _, block := range blocks {
		raw := strings.ReplaceAll(string(block[1]), "SCENE_ID", sceneID)
		var request struct {
			Query     string
			Variables map[string]any
		}
		if err := json.Unmarshal([]byte(raw), &request); err != nil {
			t.Fatal(err)
		}
		if strings.Contains(request.Query, "createAutomation") {
			validation := env.query(t, `query($input:CreateAutomationInput!){validateAutomation(input:$input){valid issues{message}}}`, request.Variables)
			if len(validation.Errors) > 0 || !strings.Contains(string(validation.Data), `"valid":true`) {
				t.Fatalf("example validation: %s %v", validation.Data, validation.Errors)
			}
		}
		response := env.query(t, request.Query, request.Variables)
		if len(response.Errors) > 0 {
			t.Fatalf("example failed: %s: %v", request.Query, response.Errors)
		}
		var result struct {
			CreateScene      struct{ ID string }
			CreateAutomation struct {
				ID         string
				Validation struct{ Valid bool }
			}
			SceneAuthoring []struct {
				DeviceID string
				State    struct{ Brightness int }
			}
			CreateEffect struct {
				Tracks []struct{ Clips []struct{ ID string } }
			}
		}
		if err := json.Unmarshal(response.Data, &result); err != nil {
			t.Fatal(err)
		}
		if result.CreateScene.ID != "" {
			sceneID = result.CreateScene.ID
		}
		if strings.Contains(request.Query, "sceneAuthoring") && (len(result.SceneAuthoring) != 1 || result.SceneAuthoring[0].DeviceID != "lamp" || result.SceneAuthoring[0].State.Brightness != 13) {
			t.Fatalf("scene authoring: %s", response.Data)
		}
		if strings.Contains(request.Query, "createEffect") && result.CreateEffect.Tracks[0].Clips[0].ID != "fade" {
			t.Fatalf("clip identity: %s", response.Data)
		}
		if result.CreateAutomation.ID != "" {
			if !result.CreateAutomation.Validation.Valid {
				t.Fatalf("saved validation: %s", response.Data)
			}
			reread := env.query(t, `query($id:ID!){automation(id:$id){validation{valid} nodes{id config{trigger{mode holdMs value{booleanValue}}}}}}`, map[string]any{"id": result.CreateAutomation.ID})
			if len(reread.Errors) > 0 || (strings.Contains(raw, "Hallway night light") && !strings.Contains(string(reread.Data), `"holdMs":600000`)) {
				t.Fatalf("readback: %s %v", reread.Data, reread.Errors)
			}
		}
	}
	if len(env.sceneRunner.appliedScenes()) != 0 {
		t.Fatal("authoring applied a scene")
	}
}

type exampleTargetResolver struct{}

func (exampleTargetResolver) ResolveTargetDeviceIDs(_ context.Context, kind device.TargetType, id string) []device.DeviceID {
	if kind == device.TargetRoom && id == "hallway" {
		return []device.DeviceID{"lamp", "motion"}
	}
	return []device.DeviceID{device.DeviceID(id)}
}
