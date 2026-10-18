package automation

import (
	"encoding/json"
	"os"
	"regexp"
	"testing"
	"time"

	"github.com/saffronjam/saffron-hive/internal/eventbus"
)

func assistantExampleGraph(t *testing.T, name string) compiledGraph {
	t.Helper()
	doc, err := os.ReadFile("../assistant/knowledge/authoring-examples.md")
	if err != nil {
		t.Fatal(err)
	}
	var graph AutomationGraph
	for _, block := range regexp.MustCompile("(?s)```json\\n(.*?)\\n```").FindAllSubmatch(doc, -1) {
		var request struct {
			Variables struct {
				Input struct {
					Name  string
					Nodes []struct {
						ID     NodeID
						Type   NodeType
						Config AuthoringConfig
					}
					Edges []Edge
				}
			}
		}
		if err := json.Unmarshal(block[1], &request); err != nil {
			t.Fatal(err)
		}
		input := request.Variables.Input
		if input.Name != name {
			continue
		}
		graph.ID = "night-light"
		graph.Edges = input.Edges
		for _, node := range input.Nodes {
			raw, err := CompileAuthoring(node.Type, node.Config)
			if err != nil {
				t.Fatal(err)
			}
			config, err := parseNodeConfig(node.Type, raw)
			if err != nil {
				t.Fatal(err)
			}
			graph.Nodes = append(graph.Nodes, Node{ID: node.ID, Type: node.Type, Config: config})
		}
	}
	validation := ValidateGraph(graph)
	if !validation.Valid() || len(validation.Warnings) != 0 {
		t.Fatalf("example validation: %+v", validation)
	}
	compiled, _, err := compileGraph(graph)
	if err != nil {
		t.Fatal(err)
	}
	return compiled
}

func TestAssistantNightLightExampleGuardsActions(t *testing.T) {
	compiled := assistantExampleGraph(t, "Hallway night light")
	for _, tc := range []struct {
		name        string
		hour        int
		trigger     NodeID
		sceneActive bool
		want        NodeID
	}{
		{"motion at night", 1, "motion-on", false, "lights-on"},
		{"motion in daylight", 12, "motion-on", false, ""},
		{"motion with active scene in daylight", 12, "motion-on", true, ""},
		{"absence at night", 1, "motion-off", true, "lights-off"},
		{"absence after the time window", 5, "motion-off", true, "lights-off"},
		{"another scene at night", 1, "motion-off", false, ""},
		{"another scene in daylight", 12, "motion-off", false, ""},
		{"conditions without a trigger", 1, "", true, ""},
	} {
		t.Run(tc.name, func(t *testing.T) {
			bus := eventbus.NewChannelBus()
			activations := bus.Subscribe(eventbus.EventAutomationNodeActivated)
			defer bus.Unsubscribe(activations)
			st := newMockStore()
			engine := NewEngine(bus, newMockStateReader(), st, st, nil, nil, &mockSceneRunner{})
			env := ExprEnv{Time: buildTimeContext(time.Date(2026, 10, 18, tc.hour, 0, 0, 0, time.UTC)), SceneActive: func(id string) bool { return id == "SCENE_ID" && tc.sceneActive }}
			fired := map[NodeID]bool{}
			if tc.trigger != "" {
				fired[tc.trigger] = true
			}
			if got := engine.evaluateGraph(compiled, env, fired); got != (tc.want != "") {
				t.Fatalf("action fired = %v, want %q", got, tc.want)
			}
			var actions []NodeID
			for len(activations) > 0 {
				activation := (<-activations).Payload.(NodeActivation)
				if activation.Active && compiled.nodes[activation.NodeID].Type == NodeAction {
					actions = append(actions, activation.NodeID)
				}
			}
			if tc.want == "" && len(actions) != 0 || tc.want != "" && (len(actions) != 1 || actions[0] != tc.want) {
				t.Fatalf("actions = %v, want %q", actions, tc.want)
			}
		})
	}
}

func TestAssistantAlternativeGuardExample(t *testing.T) {
	compiled := assistantExampleGraph(t, "Motion during night or Sunday")
	for _, hour := range []int{1, 12} {
		for _, weekday := range []time.Weekday{time.Monday, time.Sunday} {
			for _, fired := range []bool{false, true} {
				st := newMockStore()
				bus := eventbus.NewChannelBus()
				engine := NewEngine(bus, newMockStateReader(), st, st, nil, nil, &mockSceneRunner{})
				now := time.Date(2026, 10, 18+int(weekday), hour, 0, 0, 0, time.UTC)
				env := ExprEnv{Time: buildTimeContext(now), Day: buildDayContext(now)}
				got := engine.evaluateGraph(compiled, env, map[NodeID]bool{"motion": fired})
				want := fired && (hour == 1 || weekday == time.Sunday)
				if got != want {
					t.Fatalf("hour=%d weekday=%s trigger=%v fired=%v", hour, weekday, fired, got)
				}
			}
		}
	}
}
