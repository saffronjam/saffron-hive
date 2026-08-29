package automation

import (
	"context"
	"errors"
	"sync"
	"testing"

	"github.com/saffronjam/saffron-hive/internal/eventbus"
	"github.com/saffronjam/saffron-hive/internal/store"
)

type mockSceneRunner struct {
	mu      sync.Mutex
	applied []string
	err     error
}

func (m *mockSceneRunner) Apply(_ context.Context, sceneID string) (store.Scene, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.applied = append(m.applied, sceneID)
	return store.Scene{ID: sceneID}, m.err
}

func (m *mockSceneRunner) appliedScenes() []string {
	m.mu.Lock()
	defer m.mu.Unlock()
	return append([]string(nil), m.applied...)
}

func TestActivateSceneDelegatesToRunner(t *testing.T) {
	runner := &mockSceneRunner{}
	s := newMockStore()
	executor := NewActionExecutor(eventbus.NewChannelBus(), newMockStateReader(), s, s, nil, nil, runner)

	executor.ExecuteGraphAction(ActionConfig{ActionType: ActionActivateScene, Payload: "scene-1"})

	applied := runner.appliedScenes()
	if len(applied) != 1 || applied[0] != "scene-1" {
		t.Fatalf("applied scenes = %v, want [scene-1]", applied)
	}
}

func TestActivateSceneWithoutRunnerIsNoOp(t *testing.T) {
	s := newMockStore()
	executor := NewActionExecutor(eventbus.NewChannelBus(), newMockStateReader(), s, s, nil, nil, nil)
	executor.ExecuteGraphAction(ActionConfig{ActionType: ActionActivateScene, Payload: "scene-1"})
}

func TestActivateSceneRunnerErrorDoesNotRetry(t *testing.T) {
	runner := &mockSceneRunner{err: errors.New("apply failed")}
	s := newMockStore()
	executor := NewActionExecutor(eventbus.NewChannelBus(), newMockStateReader(), s, s, nil, nil, runner)

	executor.ExecuteGraphAction(ActionConfig{ActionType: ActionActivateScene, Payload: "scene-1"})

	if applied := runner.appliedScenes(); len(applied) != 1 {
		t.Fatalf("apply calls = %d, want 1", len(applied))
	}
}
