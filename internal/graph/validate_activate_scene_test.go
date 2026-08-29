package graph

import (
	"context"
	"strings"
	"testing"

	"github.com/saffronjam/saffron-hive/internal/device"
	"github.com/saffronjam/saffron-hive/internal/graph/model"
	"github.com/saffronjam/saffron-hive/internal/store"
)

func activateSceneAutomation(actionConfig string) ([]*model.AutomationNodeInput, []*model.AutomationEdgeInput) {
	return []*model.AutomationNodeInput{
		{ID: "trigger", Type: "trigger", Config: `{"kind":"event","event_type":"test.fire","filter_expr":"true"}`},
		{ID: "action", Type: "action", Config: actionConfig},
	}, []*model.AutomationEdgeInput{{FromNodeID: "trigger", ToNodeID: "action"}}
}

func TestValidateAutomationInputActivateScene(t *testing.T) {
	ctx := context.Background()
	tests := []struct {
		name      string
		config    string
		seedScene bool
		wantError string
	}{
		{
			name:      "canonical scene reference",
			config:    `{"action_type":"activate_scene","target_type":"","target_id":"","target_expr":[],"payload":"scene-1"}`,
			seedScene: true,
		},
		{
			name:      "missing scene payload",
			config:    `{"action_type":"activate_scene","target_type":"","target_id":"","target_expr":[],"payload":""}`,
			wantError: "requires a scene ID in payload",
		},
		{
			name:      "scene stored only in target fields",
			config:    `{"action_type":"activate_scene","target_type":"scene","target_id":"scene-1","target_expr":[],"payload":""}`,
			seedScene: true,
			wantError: "requires a scene ID in payload",
		},
		{
			name:      "redundant target fields",
			config:    `{"action_type":"activate_scene","target_type":"scene","target_id":"scene-1","target_expr":[],"payload":"scene-1"}`,
			seedScene: true,
			wantError: "target fields must be empty",
		},
		{
			name:      "unknown scene",
			config:    `{"action_type":"activate_scene","target_type":"","target_id":"","target_expr":[],"payload":"missing"}`,
			wantError: "not found",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			st := newMockStore()
			if tt.seedScene {
				if _, err := st.CreateScene(ctx, store.CreateSceneParams{ID: "scene-1", Name: "Scene", Definition: store.SceneDefinition{Supporting: []store.SceneSupportingState{{DeviceID: "device-1", State: store.DesiredState{On: device.Ptr(true)}}}}}); err != nil {
					t.Fatalf("seed scene: %v", err)
				}
			}
			nodes, edges := activateSceneAutomation(tt.config)
			err := validateAutomationInput(ctx, st, nodes, edges)
			if tt.wantError == "" {
				if err != nil {
					t.Fatalf("validate canonical action: %v", err)
				}
				return
			}
			if err == nil || !strings.Contains(err.Error(), tt.wantError) {
				t.Fatalf("error = %v, want containing %q", err, tt.wantError)
			}
		})
	}
}
