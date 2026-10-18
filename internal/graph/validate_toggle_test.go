package graph

import (
	"context"
	"testing"

	"github.com/saffronjam/saffron-hive/internal/store"
)

func TestValidateAutomationInputToggleAcceptsExpressionTarget(t *testing.T) {
	nodes := []store.CreateAutomationNodeParams{
		{ID: "trigger", Type: "trigger", Config: `{"kind":"event","event_type":"test.fire","filter_expr":"true"}`},
		{ID: "action", Type: "action", Config: `{"action_type":"toggle_device_state","target_type":"expression","target_expr":[{"subject":"device_type","op":"is","values":["light"]}],"payload":""}`},
	}

	if err := validateAutomationReferences(context.Background(), newMockStore(), "", nodes); err != nil {
		t.Fatalf("valid expression toggle: %v", err)
	}
}
