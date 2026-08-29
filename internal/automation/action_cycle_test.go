package automation

import (
	"context"
	"testing"

	"github.com/saffronjam/saffron-hive/internal/eventbus"
	"github.com/saffronjam/saffron-hive/internal/store"
)

func fixtureCycleScenes(s *mockStore) {
	for _, id := range []string{"scene-a", "scene-b", "scene-c"} {
		s.setScene(id, store.Scene{Name: id})
	}
}

func newCycleExecutor(s *mockStore, runner *mockSceneRunner) *ActionExecutor {
	executor := NewActionExecutor(eventbus.NewChannelBus(), newMockStateReader(), s, s, nil, nil, runner)
	executor.SetBaseContext(context.Background())
	return executor
}

func cycleConfig(sceneIDs string) ActionConfig {
	return ActionConfig{
		AutomationID: "auto-1",
		NodeID:       "n1",
		ActionType:   ActionCycleScenes,
		Payload:      `{"scenes":` + sceneIDs + `}`,
	}
}

func TestCycleScenesAdvancesAndWraps(t *testing.T) {
	s := newMockStore()
	fixtureCycleScenes(s)
	runner := &mockSceneRunner{}
	executor := newCycleExecutor(s, runner)
	cfg := cycleConfig(`["scene-a","scene-b","scene-c"]`)

	for range 4 {
		executor.ExecuteGraphAction(cfg)
	}

	want := []string{"scene-a", "scene-b", "scene-c", "scene-a"}
	got := runner.appliedScenes()
	if len(got) != len(want) {
		t.Fatalf("applied scenes = %v, want %v", got, want)
	}
	for i := range want {
		if got[i] != want[i] {
			t.Fatalf("applied scenes = %v, want %v", got, want)
		}
	}
}

func TestCycleScenesFiltersMissingScenes(t *testing.T) {
	s := newMockStore()
	fixtureCycleScenes(s)
	delete(s.scenes, "scene-b")
	runner := &mockSceneRunner{}
	executor := newCycleExecutor(s, runner)
	cfg := cycleConfig(`["scene-a","scene-b","scene-c"]`)

	for range 4 {
		executor.ExecuteGraphAction(cfg)
	}

	want := []string{"scene-a", "scene-c", "scene-a", "scene-c"}
	got := runner.appliedScenes()
	if len(got) != len(want) {
		t.Fatalf("applied scenes = %v, want %v", got, want)
	}
	for i := range want {
		if got[i] != want[i] {
			t.Fatalf("applied scenes = %v, want %v", got, want)
		}
	}
}

func TestCycleScenesWithNoExistingScenesIsNoOp(t *testing.T) {
	s := newMockStore()
	runner := &mockSceneRunner{}
	newCycleExecutor(s, runner).ExecuteGraphAction(cycleConfig(`["scene-a","scene-b"]`))
	if got := runner.appliedScenes(); len(got) != 0 {
		t.Fatalf("applied scenes = %v, want none", got)
	}
}

func TestCycleScenesPersistsCursor(t *testing.T) {
	s := newMockStore()
	fixtureCycleScenes(s)
	runner := &mockSceneRunner{}
	executor := newCycleExecutor(s, runner)
	cfg := cycleConfig(`["scene-a","scene-b"]`)

	executor.ExecuteGraphAction(cfg)
	v, ok, err := s.GetAutomationNodeState(context.Background(), "auto-1", "n1", cycleIndexStateKey)
	if err != nil || !ok || v != "1" {
		t.Fatalf("first cursor = %q, found=%v, err=%v", v, ok, err)
	}

	executor.ExecuteGraphAction(cfg)
	v, ok, err = s.GetAutomationNodeState(context.Background(), "auto-1", "n1", cycleIndexStateKey)
	if err != nil || !ok || v != "0" {
		t.Fatalf("wrapped cursor = %q, found=%v, err=%v", v, ok, err)
	}
}
