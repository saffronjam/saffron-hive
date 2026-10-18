package automation

import (
	"fmt"
	"testing"
	"time"

	"github.com/saffronjam/saffron-hive/internal/eventbus"
)

func gateTrigger(id NodeID) Node {
	return Node{ID: id, Type: NodeTrigger, Config: TriggerConfig{EventType: "test.fire"}}
}

func gateCondition(id NodeID, expr string, negate bool) Node {
	return Node{ID: id, Type: NodeCondition, Config: ConditionConfig{Expr: expr, Negate: negate}}
}

func gateAction() Node {
	return Node{ID: "action", Type: NodeAction, Config: ActionConfig{ActionType: ActionActivateScene, Payload: `{"scene_id":"night"}`}}
}

func evaluateGates(t *testing.T, nodes []Node, edges []Edge, fired map[NodeID]bool, env ExprEnv) (bool, map[NodeID]bool) {
	t.Helper()
	graph, _, err := compileGraph(AutomationGraph{ID: "gates", Nodes: nodes, Edges: edges})
	if err != nil {
		t.Fatal(err)
	}
	bus := eventbus.NewChannelBus()
	activations := bus.Subscribe(eventbus.EventAutomationNodeActivated)
	defer bus.Unsubscribe(activations)
	st := newMockStore()
	engine := NewEngine(bus, newMockStateReader(), st, st, nil, nil, &mockSceneRunner{})
	result := engine.evaluateGraph(graph, env, fired)
	seen := map[NodeID]bool{}
	for len(activations) > 0 {
		activation := (<-activations).Payload.(NodeActivation)
		if _, duplicate := seen[activation.NodeID]; duplicate {
			t.Fatalf("node evaluated twice: %s", activation.NodeID)
		}
		seen[activation.NodeID] = activation.Active
	}
	return result, seen
}

func TestGateOperatorsCombineOnlyArrivingSignals(t *testing.T) {
	for _, kind := range []OperatorKind{OperatorAnd, OperatorOr} {
		for _, fireA := range []bool{false, true} {
			for _, fireB := range []bool{false, true} {
				for _, passA := range []bool{false, true} {
					for _, passB := range []bool{false, true} {
						t.Run(fmt.Sprintf("%s/%v/%v/%v/%v", kind, fireA, fireB, passA, passB), func(t *testing.T) {
							nodes := []Node{gateTrigger("ta"), gateTrigger("tb"), gateCondition("ca", fmt.Sprint(passA), false), gateCondition("cb", fmt.Sprint(passB), false), {ID: "op", Type: NodeOperator, Config: OperatorConfig{Kind: kind}}, gateAction()}
							edges := []Edge{{FromNodeID: "ta", ToNodeID: "ca"}, {FromNodeID: "tb", ToNodeID: "cb"}, {FromNodeID: "ca", ToNodeID: "op"}, {FromNodeID: "cb", ToNodeID: "op"}, {FromNodeID: "op", ToNodeID: "action"}}
							got, seen := evaluateGates(t, nodes, edges, map[NodeID]bool{"ta": fireA, "tb": fireB}, ExprEnv{})
							want := fireA && passA || fireB && passB
							if kind == OperatorAnd {
								want = fireA && passA && fireB && passB
							}
							if got != want {
								t.Fatalf("fired=%v, want=%v; activations=%v", got, want, seen)
							}
							if _, ok := seen["ca"]; ok != fireA {
								t.Fatal("condition A evaluated without its input")
							}
							if _, ok := seen["cb"]; ok != fireB {
								t.Fatal("condition B evaluated without its input")
							}
						})
					}
				}
			}
		}
	}
}

func TestBlockedGateDoesNotEvaluateDownstreamPredicate(t *testing.T) {
	calls := 0
	env := ExprEnv{SceneActive: func(string) bool { calls++; return true }}
	nodes := []Node{gateTrigger("t"), gateCondition("first", "false", false), gateCondition("second", `scene_active("night")`, true), gateAction()}
	edges := []Edge{{FromNodeID: "t", ToNodeID: "first"}, {FromNodeID: "first", ToNodeID: "second"}, {FromNodeID: "second", ToNodeID: "action"}}
	fired, seen := evaluateGates(t, nodes, edges, map[NodeID]bool{"t": true}, env)
	if fired || calls != 0 {
		t.Fatalf("blocked path evaluated: fired=%v calls=%d", fired, calls)
	}
	if _, ok := seen["second"]; ok {
		t.Fatal("unreached gate published an activation")
	}
}

func TestConditionInversionAndMultipleInputs(t *testing.T) {
	for _, expr := range []string{"true", "false", `scene_active("night")`} {
		for _, negate := range []bool{false, true} {
			t.Run(fmt.Sprintf("%s/%v", expr, negate), func(t *testing.T) {
				nodes := []Node{gateTrigger("ta"), gateTrigger("tb"), gateCondition("c", expr, negate), gateAction()}
				edges := []Edge{{FromNodeID: "ta", ToNodeID: "c"}, {FromNodeID: "tb", ToNodeID: "c"}, {FromNodeID: "c", ToNodeID: "action"}}
				env := ExprEnv{SceneActive: func(string) bool { panic("predicate unavailable") }}
				for _, inputs := range []map[NodeID]bool{{}, {"ta": true}, {"ta": true, "tb": true}} {
					got, _ := evaluateGates(t, nodes, edges, inputs, env)
					want := len(inputs) > 0 && expr != `scene_active("night")` && ((expr == "true") != negate)
					if got != want {
						t.Fatalf("inputs=%v fired=%v want=%v", inputs, got, want)
					}
				}
			})
		}
	}
}

func TestIndependentConditionsAndUnsupportedOperatorsAreInvalid(t *testing.T) {
	for _, kind := range []OperatorKind{OperatorAnd, OperatorOr, OperatorKind("not")} {
		graph := AutomationGraph{Nodes: []Node{gateTrigger("t"), gateCondition("c", "true", false), {ID: "op", Type: NodeOperator, Config: OperatorConfig{Kind: kind}}, gateAction()}, Edges: []Edge{{FromNodeID: "t", ToNodeID: "op"}, {FromNodeID: "c", ToNodeID: "op"}, {FromNodeID: "op", ToNodeID: "action"}}}
		if ValidateGraph(graph).Valid() {
			t.Fatalf("independent condition accepted for %s", kind)
		}
		graph.Edges = append(graph.Edges, Edge{FromNodeID: "t", ToNodeID: "c"})
		if (kind == "not") == ValidateGraph(graph).Valid() {
			t.Fatalf("unexpected validation for operator %s", kind)
		}
	}
}

func TestGraceKeepsTriggerSignalsButReevaluatesConditions(t *testing.T) {
	nodes := []Node{gateTrigger("ta"), gateTrigger("tb"), gateCondition("c", `scene_active("night")`, false), {ID: "op", Type: NodeOperator, Config: OperatorConfig{Kind: OperatorAnd}}, gateAction()}
	nodes[0].Config = TriggerConfig{EventType: "test.fire", GraceMs: 5000}
	edges := []Edge{{FromNodeID: "ta", ToNodeID: "c"}, {FromNodeID: "c", ToNodeID: "op"}, {FromNodeID: "tb", ToNodeID: "op"}, {FromNodeID: "op", ToNodeID: "action"}}
	graph, _, err := compileGraph(AutomationGraph{ID: "grace", Nodes: nodes, Edges: edges})
	if err != nil {
		t.Fatal(err)
	}
	st := newMockStore()
	engine := NewEngine(eventbus.NewChannelBus(), newMockStateReader(), st, st, nil, nil, &mockSceneRunner{})
	now := time.Now()
	engine.recordTriggerFired("grace", "ta", now)
	for _, elapsed := range []time.Duration{2 * time.Second, 6 * time.Second} {
		for _, pass := range []bool{false, true} {
			inputs := engine.combineWithGrace(graph, map[NodeID]bool{"tb": true}, now.Add(elapsed))
			got := engine.evaluateGraph(graph, ExprEnv{SceneActive: func(string) bool { return pass }}, inputs)
			if got != (elapsed < 5*time.Second && pass) {
				t.Fatalf("elapsed=%v pass=%v fired=%v", elapsed, pass, got)
			}
		}
	}
}
