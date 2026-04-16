package automation

import (
	"testing"
)

func TestValidGraph(t *testing.T) {
	g := AutomationGraph{
		ID:   "auto-1",
		Name: "valid",
		Nodes: []Node{
			{ID: "t1", AutomationID: "auto-1", Type: NodeTrigger, Config: TriggerConfig{EventType: "device.state_changed", ConditionExpr: "true"}},
			{ID: "op1", AutomationID: "auto-1", Type: NodeOperator, Config: OperatorConfig{Kind: OperatorAnd}},
			{ID: "a1", AutomationID: "auto-1", Type: NodeAction, Config: ActionConfig{ActionType: ActionSetDeviceState, Payload: `{"on": true}`}},
		},
		Edges: []Edge{
			{ID: "e1", AutomationID: "auto-1", FromNodeID: "t1", ToNodeID: "op1"},
			{ID: "e2", AutomationID: "auto-1", FromNodeID: "op1", ToNodeID: "a1"},
		},
	}

	result := ValidateGraph(g)
	if !result.Valid() {
		t.Fatalf("expected valid graph, got errors: %v", result.Errors)
	}
}

func TestValidGraphMultipleTriggers(t *testing.T) {
	g := AutomationGraph{
		ID:   "auto-1",
		Name: "multi-trigger",
		Nodes: []Node{
			{ID: "t1", AutomationID: "auto-1", Type: NodeTrigger, Config: TriggerConfig{EventType: "device.state_changed"}},
			{ID: "t2", AutomationID: "auto-1", Type: NodeTrigger, Config: TriggerConfig{EventType: "device.availability_changed"}},
			{ID: "op1", AutomationID: "auto-1", Type: NodeOperator, Config: OperatorConfig{Kind: OperatorOr}},
			{ID: "a1", AutomationID: "auto-1", Type: NodeAction, Config: ActionConfig{ActionType: ActionSetDeviceState, Payload: `{"on": true}`}},
		},
		Edges: []Edge{
			{ID: "e1", AutomationID: "auto-1", FromNodeID: "t1", ToNodeID: "op1"},
			{ID: "e2", AutomationID: "auto-1", FromNodeID: "t2", ToNodeID: "op1"},
			{ID: "e3", AutomationID: "auto-1", FromNodeID: "op1", ToNodeID: "a1"},
		},
	}

	result := ValidateGraph(g)
	if !result.Valid() {
		t.Fatalf("expected valid graph, got errors: %v", result.Errors)
	}
}

func TestValidGraphDirectTriggerToAction(t *testing.T) {
	g := AutomationGraph{
		ID:   "auto-1",
		Name: "direct",
		Nodes: []Node{
			{ID: "t1", AutomationID: "auto-1", Type: NodeTrigger, Config: TriggerConfig{EventType: "device.state_changed"}},
			{ID: "a1", AutomationID: "auto-1", Type: NodeAction, Config: ActionConfig{ActionType: ActionSetDeviceState, Payload: `{"on": true}`}},
		},
		Edges: []Edge{
			{ID: "e1", AutomationID: "auto-1", FromNodeID: "t1", ToNodeID: "a1"},
		},
	}

	result := ValidateGraph(g)
	if !result.Valid() {
		t.Fatalf("expected valid graph, got errors: %v", result.Errors)
	}
}

func TestEmptyGraphIsValid(t *testing.T) {
	g := AutomationGraph{
		ID:   "auto-1",
		Name: "empty",
	}

	result := ValidateGraph(g)
	if !result.Valid() {
		t.Fatalf("expected empty graph to be valid, got errors: %v", result.Errors)
	}
}

func TestCycleDetection(t *testing.T) {
	g := AutomationGraph{
		ID:   "auto-1",
		Name: "cyclic",
		Nodes: []Node{
			{ID: "t1", AutomationID: "auto-1", Type: NodeTrigger, Config: TriggerConfig{EventType: "device.state_changed"}},
			{ID: "op1", AutomationID: "auto-1", Type: NodeOperator, Config: OperatorConfig{Kind: OperatorAnd}},
			{ID: "op2", AutomationID: "auto-1", Type: NodeOperator, Config: OperatorConfig{Kind: OperatorOr}},
		},
		Edges: []Edge{
			{ID: "e1", AutomationID: "auto-1", FromNodeID: "t1", ToNodeID: "op1"},
			{ID: "e2", AutomationID: "auto-1", FromNodeID: "op1", ToNodeID: "op2"},
			{ID: "e3", AutomationID: "auto-1", FromNodeID: "op2", ToNodeID: "op1"},
		},
	}

	result := ValidateGraph(g)
	if result.Valid() {
		t.Fatal("expected cyclic graph to be invalid")
	}

	foundCycle := false
	for _, err := range result.Errors {
		if err.NodeID == "" && len(err.Message) > 0 {
			foundCycle = true
		}
	}
	if !foundCycle {
		t.Fatal("expected a cycle error in validation result")
	}
}

func TestSelfLoop(t *testing.T) {
	g := AutomationGraph{
		ID:   "auto-1",
		Name: "self-loop",
		Nodes: []Node{
			{ID: "op1", AutomationID: "auto-1", Type: NodeOperator, Config: OperatorConfig{Kind: OperatorAnd}},
		},
		Edges: []Edge{
			{ID: "e1", AutomationID: "auto-1", FromNodeID: "op1", ToNodeID: "op1"},
		},
	}

	result := ValidateGraph(g)
	if result.Valid() {
		t.Fatal("expected self-loop to be invalid")
	}
}

func TestTriggerWithIncomingEdge(t *testing.T) {
	g := AutomationGraph{
		ID:   "auto-1",
		Name: "bad-trigger",
		Nodes: []Node{
			{ID: "t1", AutomationID: "auto-1", Type: NodeTrigger, Config: TriggerConfig{EventType: "device.state_changed"}},
			{ID: "op1", AutomationID: "auto-1", Type: NodeOperator, Config: OperatorConfig{Kind: OperatorAnd}},
			{ID: "a1", AutomationID: "auto-1", Type: NodeAction, Config: ActionConfig{ActionType: ActionSetDeviceState, Payload: `{"on": true}`}},
		},
		Edges: []Edge{
			{ID: "e1", AutomationID: "auto-1", FromNodeID: "op1", ToNodeID: "t1"},
			{ID: "e2", AutomationID: "auto-1", FromNodeID: "t1", ToNodeID: "a1"},
		},
	}

	result := ValidateGraph(g)
	if result.Valid() {
		t.Fatal("expected trigger with incoming edge to be invalid")
	}

	found := false
	for _, err := range result.Errors {
		if err.NodeID == "t1" && err.Message == "trigger node must not have incoming edges" {
			found = true
		}
	}
	if !found {
		t.Fatalf("expected specific trigger incoming-edge error, got: %v", result.Errors)
	}
}

func TestActionWithOutgoingEdge(t *testing.T) {
	g := AutomationGraph{
		ID:   "auto-1",
		Name: "bad-action",
		Nodes: []Node{
			{ID: "t1", AutomationID: "auto-1", Type: NodeTrigger, Config: TriggerConfig{EventType: "device.state_changed"}},
			{ID: "a1", AutomationID: "auto-1", Type: NodeAction, Config: ActionConfig{ActionType: ActionSetDeviceState, Payload: `{"on": true}`}},
			{ID: "a2", AutomationID: "auto-1", Type: NodeAction, Config: ActionConfig{ActionType: ActionSetDeviceState, Payload: `{"on": false}`}},
		},
		Edges: []Edge{
			{ID: "e1", AutomationID: "auto-1", FromNodeID: "t1", ToNodeID: "a1"},
			{ID: "e2", AutomationID: "auto-1", FromNodeID: "a1", ToNodeID: "a2"},
		},
	}

	result := ValidateGraph(g)
	if result.Valid() {
		t.Fatal("expected action with outgoing edge to be invalid")
	}

	found := false
	for _, err := range result.Errors {
		if err.NodeID == "a1" && err.Message == "action node must not have outgoing edges" {
			found = true
		}
	}
	if !found {
		t.Fatalf("expected specific action outgoing-edge error, got: %v", result.Errors)
	}
}

func TestOperatorWithNoIncoming(t *testing.T) {
	g := AutomationGraph{
		ID:   "auto-1",
		Name: "floating-op",
		Nodes: []Node{
			{ID: "op1", AutomationID: "auto-1", Type: NodeOperator, Config: OperatorConfig{Kind: OperatorAnd}},
			{ID: "a1", AutomationID: "auto-1", Type: NodeAction, Config: ActionConfig{ActionType: ActionSetDeviceState, Payload: `{"on": true}`}},
		},
		Edges: []Edge{
			{ID: "e1", AutomationID: "auto-1", FromNodeID: "op1", ToNodeID: "a1"},
		},
	}

	result := ValidateGraph(g)
	if result.Valid() {
		t.Fatal("expected operator with no incoming edges to be invalid")
	}

	found := false
	for _, err := range result.Errors {
		if err.NodeID == "op1" && err.Message == "operator node must have at least one incoming edge" {
			found = true
		}
	}
	if !found {
		t.Fatalf("expected specific operator incoming-edge error, got: %v", result.Errors)
	}
}

func TestOperatorWithNoOutgoing(t *testing.T) {
	g := AutomationGraph{
		ID:   "auto-1",
		Name: "dead-end-op",
		Nodes: []Node{
			{ID: "t1", AutomationID: "auto-1", Type: NodeTrigger, Config: TriggerConfig{EventType: "device.state_changed"}},
			{ID: "op1", AutomationID: "auto-1", Type: NodeOperator, Config: OperatorConfig{Kind: OperatorAnd}},
		},
		Edges: []Edge{
			{ID: "e1", AutomationID: "auto-1", FromNodeID: "t1", ToNodeID: "op1"},
		},
	}

	result := ValidateGraph(g)
	if result.Valid() {
		t.Fatal("expected operator with no outgoing edges to be invalid")
	}

	found := false
	for _, err := range result.Errors {
		if err.NodeID == "op1" && err.Message == "operator node must have at least one outgoing edge" {
			found = true
		}
	}
	if !found {
		t.Fatalf("expected specific operator outgoing-edge error, got: %v", result.Errors)
	}
}

func TestEdgeReferencesNonExistentNode(t *testing.T) {
	g := AutomationGraph{
		ID:   "auto-1",
		Name: "bad-edge",
		Nodes: []Node{
			{ID: "t1", AutomationID: "auto-1", Type: NodeTrigger, Config: TriggerConfig{EventType: "device.state_changed"}},
		},
		Edges: []Edge{
			{ID: "e1", AutomationID: "auto-1", FromNodeID: "t1", ToNodeID: "nonexistent"},
		},
	}

	result := ValidateGraph(g)
	if result.Valid() {
		t.Fatal("expected edge referencing non-existent node to be invalid")
	}
}

func TestEdgeReferencesNonExistentSourceNode(t *testing.T) {
	g := AutomationGraph{
		ID:   "auto-1",
		Name: "bad-source-edge",
		Nodes: []Node{
			{ID: "a1", AutomationID: "auto-1", Type: NodeAction, Config: ActionConfig{ActionType: ActionSetDeviceState, Payload: `{"on": true}`}},
		},
		Edges: []Edge{
			{ID: "e1", AutomationID: "auto-1", FromNodeID: "nonexistent", ToNodeID: "a1"},
		},
	}

	result := ValidateGraph(g)
	if result.Valid() {
		t.Fatal("expected edge referencing non-existent source node to be invalid")
	}
}

func TestOrphanNodeProducesWarning(t *testing.T) {
	g := AutomationGraph{
		ID:   "auto-1",
		Name: "orphan",
		Nodes: []Node{
			{ID: "t1", AutomationID: "auto-1", Type: NodeTrigger, Config: TriggerConfig{EventType: "device.state_changed"}},
			{ID: "t2", AutomationID: "auto-1", Type: NodeTrigger, Config: TriggerConfig{EventType: "device.availability_changed"}},
			{ID: "a1", AutomationID: "auto-1", Type: NodeAction, Config: ActionConfig{ActionType: ActionSetDeviceState, Payload: `{"on": true}`}},
		},
		Edges: []Edge{
			{ID: "e1", AutomationID: "auto-1", FromNodeID: "t1", ToNodeID: "a1"},
		},
	}

	result := ValidateGraph(g)
	if !result.Valid() {
		t.Fatalf("expected orphan trigger to be valid (warning only), got errors: %v", result.Errors)
	}
	if len(result.Warnings) == 0 {
		t.Fatal("expected at least one warning for orphan trigger node")
	}

	found := false
	for _, w := range result.Warnings {
		if w.NodeID == "t2" {
			found = true
		}
	}
	if !found {
		t.Fatalf("expected warning for orphan trigger t2, got: %v", result.Warnings)
	}
}

func TestOrphanActionProducesWarning(t *testing.T) {
	g := AutomationGraph{
		ID:   "auto-1",
		Name: "orphan-action",
		Nodes: []Node{
			{ID: "t1", AutomationID: "auto-1", Type: NodeTrigger, Config: TriggerConfig{EventType: "device.state_changed"}},
			{ID: "a1", AutomationID: "auto-1", Type: NodeAction, Config: ActionConfig{ActionType: ActionSetDeviceState, Payload: `{"on": true}`}},
			{ID: "a2", AutomationID: "auto-1", Type: NodeAction, Config: ActionConfig{ActionType: ActionActivateScene, Payload: "scene-1"}},
		},
		Edges: []Edge{
			{ID: "e1", AutomationID: "auto-1", FromNodeID: "t1", ToNodeID: "a1"},
		},
	}

	result := ValidateGraph(g)
	if !result.Valid() {
		t.Fatalf("expected orphan action to be valid (warning only), got errors: %v", result.Errors)
	}

	found := false
	for _, w := range result.Warnings {
		if w.NodeID == "a2" {
			found = true
		}
	}
	if !found {
		t.Fatalf("expected warning for orphan action a2, got: %v", result.Warnings)
	}
}

func TestUnknownNodeType(t *testing.T) {
	g := AutomationGraph{
		ID:   "auto-1",
		Name: "unknown-type",
		Nodes: []Node{
			{ID: "x1", AutomationID: "auto-1", Type: NodeType("bogus"), Config: TriggerConfig{}},
		},
	}

	result := ValidateGraph(g)
	if result.Valid() {
		t.Fatal("expected unknown node type to be invalid")
	}
}

func TestChainedOperators(t *testing.T) {
	g := AutomationGraph{
		ID:   "auto-1",
		Name: "chained-ops",
		Nodes: []Node{
			{ID: "t1", AutomationID: "auto-1", Type: NodeTrigger, Config: TriggerConfig{EventType: "device.state_changed"}},
			{ID: "t2", AutomationID: "auto-1", Type: NodeTrigger, Config: TriggerConfig{EventType: "device.availability_changed"}},
			{ID: "op1", AutomationID: "auto-1", Type: NodeOperator, Config: OperatorConfig{Kind: OperatorAnd}},
			{ID: "op2", AutomationID: "auto-1", Type: NodeOperator, Config: OperatorConfig{Kind: OperatorNot}},
			{ID: "a1", AutomationID: "auto-1", Type: NodeAction, Config: ActionConfig{ActionType: ActionSetDeviceState, Payload: `{"on": true}`}},
		},
		Edges: []Edge{
			{ID: "e1", AutomationID: "auto-1", FromNodeID: "t1", ToNodeID: "op1"},
			{ID: "e2", AutomationID: "auto-1", FromNodeID: "t2", ToNodeID: "op1"},
			{ID: "e3", AutomationID: "auto-1", FromNodeID: "op1", ToNodeID: "op2"},
			{ID: "e4", AutomationID: "auto-1", FromNodeID: "op2", ToNodeID: "a1"},
		},
	}

	result := ValidateGraph(g)
	if !result.Valid() {
		t.Fatalf("expected chained operators to be valid, got errors: %v", result.Errors)
	}
}

func TestMultipleActionsFromOperator(t *testing.T) {
	g := AutomationGraph{
		ID:   "auto-1",
		Name: "fan-out",
		Nodes: []Node{
			{ID: "t1", AutomationID: "auto-1", Type: NodeTrigger, Config: TriggerConfig{EventType: "device.state_changed"}},
			{ID: "op1", AutomationID: "auto-1", Type: NodeOperator, Config: OperatorConfig{Kind: OperatorAnd}},
			{ID: "a1", AutomationID: "auto-1", Type: NodeAction, Config: ActionConfig{ActionType: ActionSetDeviceState, TargetType: TargetDevice, TargetID: "light-1", Payload: `{"on": true}`}},
			{ID: "a2", AutomationID: "auto-1", Type: NodeAction, Config: ActionConfig{ActionType: ActionActivateScene, Payload: "scene-1"}},
		},
		Edges: []Edge{
			{ID: "e1", AutomationID: "auto-1", FromNodeID: "t1", ToNodeID: "op1"},
			{ID: "e2", AutomationID: "auto-1", FromNodeID: "op1", ToNodeID: "a1"},
			{ID: "e3", AutomationID: "auto-1", FromNodeID: "op1", ToNodeID: "a2"},
		},
	}

	result := ValidateGraph(g)
	if !result.Valid() {
		t.Fatalf("expected fan-out to actions to be valid, got errors: %v", result.Errors)
	}
}

func TestNodesOnlyNoEdgesIsValid(t *testing.T) {
	g := AutomationGraph{
		ID:   "auto-1",
		Name: "nodes-only",
		Nodes: []Node{
			{ID: "t1", AutomationID: "auto-1", Type: NodeTrigger, Config: TriggerConfig{EventType: "device.state_changed"}},
			{ID: "a1", AutomationID: "auto-1", Type: NodeAction, Config: ActionConfig{ActionType: ActionSetDeviceState, Payload: `{"on": true}`}},
		},
	}

	result := ValidateGraph(g)
	if !result.Valid() {
		t.Fatalf("expected graph with nodes but no edges to be valid, got errors: %v", result.Errors)
	}
}

func TestValidationErrorFormat(t *testing.T) {
	err := ValidationError{NodeID: "t1", Message: "something wrong"}
	expected := "node t1: something wrong"
	if err.Error() != expected {
		t.Fatalf("expected %q, got %q", expected, err.Error())
	}

	errNoNode := ValidationError{Message: "global issue"}
	if errNoNode.Error() != "global issue" {
		t.Fatalf("expected %q, got %q", "global issue", errNoNode.Error())
	}
}

func TestLargerCycle(t *testing.T) {
	g := AutomationGraph{
		ID:   "auto-1",
		Name: "large-cycle",
		Nodes: []Node{
			{ID: "t1", AutomationID: "auto-1", Type: NodeTrigger, Config: TriggerConfig{EventType: "device.state_changed"}},
			{ID: "op1", AutomationID: "auto-1", Type: NodeOperator, Config: OperatorConfig{Kind: OperatorAnd}},
			{ID: "op2", AutomationID: "auto-1", Type: NodeOperator, Config: OperatorConfig{Kind: OperatorOr}},
			{ID: "op3", AutomationID: "auto-1", Type: NodeOperator, Config: OperatorConfig{Kind: OperatorAnd}},
		},
		Edges: []Edge{
			{ID: "e1", AutomationID: "auto-1", FromNodeID: "t1", ToNodeID: "op1"},
			{ID: "e2", AutomationID: "auto-1", FromNodeID: "op1", ToNodeID: "op2"},
			{ID: "e3", AutomationID: "auto-1", FromNodeID: "op2", ToNodeID: "op3"},
			{ID: "e4", AutomationID: "auto-1", FromNodeID: "op3", ToNodeID: "op1"},
		},
	}

	result := ValidateGraph(g)
	if result.Valid() {
		t.Fatal("expected larger cycle (A->B->C->A) to be invalid")
	}

	foundCycle := false
	for _, err := range result.Errors {
		if err.NodeID == "" && len(err.Message) > 0 {
			foundCycle = true
		}
	}
	if !foundCycle {
		t.Fatal("expected a cycle error for larger cycle")
	}
}
