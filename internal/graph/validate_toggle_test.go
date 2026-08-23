package graph

import (
	"context"
	"testing"

	"github.com/saffronjam/saffron-hive/internal/graph/model"
)

func TestValidateAutomationInputToggleAcceptsExpressionTarget(t *testing.T) {
	nodes := []*model.AutomationNodeInput{
		{ID: "trigger", Type: "trigger", Config: `{"kind":"event","event_type":"test.fire","filter_expr":"true"}`},
		{ID: "action", Type: "action", Config: `{"action_type":"toggle_device_state","target_type":"expression","target_expr":[{"subject":"device_type","op":"is","values":["light"]}],"payload":""}`},
	}
	edges := []*model.AutomationEdgeInput{{FromNodeID: "trigger", ToNodeID: "action"}}

	if err := validateAutomationInput(context.Background(), newMockStore(), nodes, edges); err != nil {
		t.Fatalf("valid expression toggle: %v", err)
	}
}
