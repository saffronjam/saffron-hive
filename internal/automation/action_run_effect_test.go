package automation

import (
	"context"
	"sync"
	"testing"

	"github.com/saffronjam/saffron-hive/internal/device"
	"github.com/saffronjam/saffron-hive/internal/effect"
	"github.com/saffronjam/saffron-hive/internal/eventbus"
)

type recordingRunner struct {
	mu     sync.Mutex
	starts []effectStart
	stops  []effect.Target
}

type effectStart struct {
	EffectID   string
	NativeName string
	Target     effect.Target
}

func (r *recordingRunner) Start(_ context.Context, effectID string, target effect.Target) (string, error) {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.starts = append(r.starts, effectStart{EffectID: effectID, Target: target})
	return "run-1", nil
}

func (r *recordingRunner) StartNative(_ context.Context, nativeName string, target effect.Target) (string, error) {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.starts = append(r.starts, effectStart{NativeName: nativeName, Target: target})
	return "run-native", nil
}

func (r *recordingRunner) Stop(target effect.Target) bool {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.stops = append(r.stops, target)
	return true
}

func TestRunEffectStartsRunOnDeviceTarget(t *testing.T) {
	bus := eventbus.NewChannelBus()
	reader := newMockStateReader()
	s := newMockStore()
	runner := &recordingRunner{}

	executor := NewActionExecutor(bus, reader, s, s, nil, runner)
	executor.ExecuteGraphAction(ActionConfig{
		ActionType: ActionRunEffect,
		TargetType: TargetDevice,
		TargetID:   "light-1",
		Payload:    `{"effect_id":"fireplace"}`,
	})

	runner.mu.Lock()
	defer runner.mu.Unlock()
	if len(runner.starts) != 1 {
		t.Fatalf("expected 1 Start, got %d", len(runner.starts))
	}
	got := runner.starts[0]
	if got.EffectID != "fireplace" {
		t.Errorf("effect id: want fireplace, got %s", got.EffectID)
	}
	if got.Target.Type != device.TargetDevice || got.Target.ID != "light-1" {
		t.Errorf("target: want device/light-1, got %+v", got.Target)
	}
}

func TestRunEffectStartsRunOnGroupTargetWithoutFanOut(t *testing.T) {
	bus := eventbus.NewChannelBus()
	reader := newMockStateReader()
	s := newMockStore()
	runner := &recordingRunner{}

	executor := NewActionExecutor(bus, reader, s, s, nil, runner)
	executor.ExecuteGraphAction(ActionConfig{
		ActionType: ActionRunEffect,
		TargetType: TargetGroup,
		TargetID:   "living",
		Payload:    `{"effect_id":"fireplace"}`,
	})

	runner.mu.Lock()
	defer runner.mu.Unlock()
	if len(runner.starts) != 1 {
		t.Fatalf("expected 1 Start (no fan-out), got %d", len(runner.starts))
	}
	if runner.starts[0].Target.Type != device.TargetGroup || runner.starts[0].Target.ID != "living" {
		t.Errorf("target: want group/living, got %+v", runner.starts[0].Target)
	}
}

func TestRunEffectMissingEffectIDIsNoop(t *testing.T) {
	bus := eventbus.NewChannelBus()
	reader := newMockStateReader()
	s := newMockStore()
	runner := &recordingRunner{}

	executor := NewActionExecutor(bus, reader, s, s, nil, runner)
	executor.ExecuteGraphAction(ActionConfig{
		ActionType: ActionRunEffect,
		TargetType: TargetDevice,
		TargetID:   "light-1",
		Payload:    `{}`,
	})

	runner.mu.Lock()
	defer runner.mu.Unlock()
	if len(runner.starts) != 0 {
		t.Fatalf("expected no Start when effect_id missing, got %d", len(runner.starts))
	}
}

func TestRunEffectInvalidTargetTypeIsNoop(t *testing.T) {
	bus := eventbus.NewChannelBus()
	reader := newMockStateReader()
	s := newMockStore()
	runner := &recordingRunner{}

	executor := NewActionExecutor(bus, reader, s, s, nil, runner)
	executor.ExecuteGraphAction(ActionConfig{
		ActionType: ActionRunEffect,
		TargetType: "scene",
		TargetID:   "scene-1",
		Payload:    `{"effect_id":"fireplace"}`,
	})

	runner.mu.Lock()
	defer runner.mu.Unlock()
	if len(runner.starts) != 0 {
		t.Fatalf("expected no Start with invalid target_type, got %d", len(runner.starts))
	}
}

func TestRunEffectNoRunnerIsNoop(t *testing.T) {
	bus := eventbus.NewChannelBus()
	reader := newMockStateReader()
	s := newMockStore()

	executor := NewActionExecutor(bus, reader, s, s, nil, nil)
	executor.ExecuteGraphAction(ActionConfig{
		ActionType: ActionRunEffect,
		TargetType: TargetDevice,
		TargetID:   "light-1",
		Payload:    `{"effect_id":"fireplace"}`,
	})
}

func TestRunEffectStartsNativeRunOnDeviceTarget(t *testing.T) {
	bus := eventbus.NewChannelBus()
	reader := newMockStateReader()
	s := newMockStore()
	runner := &recordingRunner{}

	executor := NewActionExecutor(bus, reader, s, s, nil, runner)
	executor.ExecuteGraphAction(ActionConfig{
		ActionType: ActionRunEffect,
		TargetType: TargetDevice,
		TargetID:   "light-1",
		Payload:    `{"native_name":"fireplace"}`,
	})

	runner.mu.Lock()
	defer runner.mu.Unlock()
	if len(runner.starts) != 1 {
		t.Fatalf("expected 1 Start, got %d", len(runner.starts))
	}
	got := runner.starts[0]
	if got.NativeName != "fireplace" {
		t.Errorf("native_name: want fireplace, got %q", got.NativeName)
	}
	if got.EffectID != "" {
		t.Errorf("effect_id should be empty for native runs, got %q", got.EffectID)
	}
	if got.Target.Type != device.TargetDevice || got.Target.ID != "light-1" {
		t.Errorf("target: want device/light-1, got %+v", got.Target)
	}
}

func TestRunEffectRejectsBothEffectIDAndNativeName(t *testing.T) {
	bus := eventbus.NewChannelBus()
	reader := newMockStateReader()
	s := newMockStore()
	runner := &recordingRunner{}

	executor := NewActionExecutor(bus, reader, s, s, nil, runner)
	executor.ExecuteGraphAction(ActionConfig{
		ActionType: ActionRunEffect,
		TargetType: TargetDevice,
		TargetID:   "light-1",
		Payload:    `{"effect_id":"fireplace","native_name":"fireplace"}`,
	})

	runner.mu.Lock()
	defer runner.mu.Unlock()
	if len(runner.starts) != 0 {
		t.Fatalf("expected no Start when both effect_id and native_name set, got %d", len(runner.starts))
	}
}
