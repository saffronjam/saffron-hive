package graph

import (
	"context"
	"strings"
	"testing"

	"github.com/saffronjam/saffron-hive/internal/effect"
	"github.com/saffronjam/saffron-hive/internal/graph/model"
	"github.com/saffronjam/saffron-hive/internal/store"
)

func runEffectAutomation(actionConfigJSON string) []*model.AutomationNodeInput {
	return []*model.AutomationNodeInput{
		{
			ID:     "trigger-1",
			Type:   "trigger",
			Config: `{"kind":"manual"}`,
		},
		{
			ID:     "action-1",
			Type:   "action",
			Config: actionConfigJSON,
		},
	}
}

func runEffectEdges() []*model.AutomationEdgeInput {
	return []*model.AutomationEdgeInput{{FromNodeID: "trigger-1", ToNodeID: "action-1"}}
}

func seedEffect(t *testing.T, st *mockStore, id string) {
	t.Helper()
	if _, err := st.CreateEffect(context.Background(), store.CreateEffectParams{
		ID:   id,
		Name: id,
		Kind: effect.KindNative,
	}); err != nil {
		t.Fatalf("seed effect: %v", err)
	}
}

func TestValidateAutomationInput_RunEffectAcceptsValidConfig(t *testing.T) {
	st := newMockStore()
	seedEffect(t, st, "fireplace")

	nodes := runEffectAutomation(`{"action_type":"run_effect","target_type":"device","target_id":"light-1","payload":"{\"effect_id\":\"fireplace\"}"}`)
	if err := validateAutomationInput(context.Background(), st, nodes, runEffectEdges()); err != nil {
		t.Fatalf("expected valid, got error: %v", err)
	}
}

func TestValidateAutomationInput_RunEffectRejectsMissingEffectID(t *testing.T) {
	st := newMockStore()

	nodes := runEffectAutomation(`{"action_type":"run_effect","target_type":"device","target_id":"light-1","payload":"{}"}`)
	err := validateAutomationInput(context.Background(), st, nodes, runEffectEdges())
	if err == nil {
		t.Fatal("expected error for missing effect_id and native_name")
	}
	if !strings.Contains(err.Error(), "effect_id") || !strings.Contains(err.Error(), "native_name") {
		t.Errorf("error should mention both effect_id and native_name: %v", err)
	}
}

func TestValidateAutomationInput_RunEffectRejectsUnknownEffectID(t *testing.T) {
	st := newMockStore()

	nodes := runEffectAutomation(`{"action_type":"run_effect","target_type":"device","target_id":"light-1","payload":"{\"effect_id\":\"missing\"}"}`)
	err := validateAutomationInput(context.Background(), st, nodes, runEffectEdges())
	if err == nil {
		t.Fatal("expected error for missing effect")
	}
	if !strings.Contains(err.Error(), "not found") {
		t.Errorf("error should mention not found: %v", err)
	}
}

func TestValidateAutomationInput_RunEffectRejectsInvalidTargetType(t *testing.T) {
	st := newMockStore()
	seedEffect(t, st, "fireplace")

	nodes := runEffectAutomation(`{"action_type":"run_effect","target_type":"scene","target_id":"scene-1","payload":"{\"effect_id\":\"fireplace\"}"}`)
	err := validateAutomationInput(context.Background(), st, nodes, runEffectEdges())
	if err == nil {
		t.Fatal("expected error for invalid target_type")
	}
	if !strings.Contains(err.Error(), "target_type") {
		t.Errorf("error should mention target_type: %v", err)
	}
}

func TestValidateAutomationInput_RunEffectRejectsMissingTargetID(t *testing.T) {
	st := newMockStore()
	seedEffect(t, st, "fireplace")

	nodes := runEffectAutomation(`{"action_type":"run_effect","target_type":"device","target_id":"","payload":"{\"effect_id\":\"fireplace\"}"}`)
	err := validateAutomationInput(context.Background(), st, nodes, runEffectEdges())
	if err == nil {
		t.Fatal("expected error for missing target_id")
	}
	if !strings.Contains(err.Error(), "target_id") {
		t.Errorf("error should mention target_id: %v", err)
	}
}

func TestValidateAutomationInput_RunEffectAcceptsNativeName(t *testing.T) {
	st := newMockStore()

	nodes := runEffectAutomation(`{"action_type":"run_effect","target_type":"device","target_id":"light-1","payload":"{\"native_name\":\"fireplace\"}"}`)
	if err := validateAutomationInput(context.Background(), st, nodes, runEffectEdges()); err != nil {
		t.Fatalf("expected valid native run_effect, got error: %v", err)
	}
}

func TestValidateAutomationInput_RunEffectRejectsBothEffectIDAndNativeName(t *testing.T) {
	st := newMockStore()
	seedEffect(t, st, "fireplace")

	nodes := runEffectAutomation(`{"action_type":"run_effect","target_type":"device","target_id":"light-1","payload":"{\"effect_id\":\"fireplace\",\"native_name\":\"fireplace\"}"}`)
	err := validateAutomationInput(context.Background(), st, nodes, runEffectEdges())
	if err == nil {
		t.Fatal("expected error when both effect_id and native_name are set")
	}
	if !strings.Contains(err.Error(), "exactly one") {
		t.Errorf("error should explain exactly one is required: %v", err)
	}
}
