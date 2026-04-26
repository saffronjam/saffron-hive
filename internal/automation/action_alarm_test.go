package automation

import (
	"context"
	"sync"
	"testing"

	"github.com/saffronjam/saffron-hive/internal/alarms"
	"github.com/saffronjam/saffron-hive/internal/eventbus"
	"github.com/saffronjam/saffron-hive/internal/store"
)

type recordingAlarmSvc struct {
	mu      sync.Mutex
	raised  []alarms.RaiseParams
	deleted []string
}

func (r *recordingAlarmSvc) Raise(_ context.Context, p alarms.RaiseParams) (alarms.Alarm, error) {
	r.mu.Lock()
	r.raised = append(r.raised, p)
	r.mu.Unlock()
	return alarms.Alarm{ID: p.AlarmID}, nil
}

func (r *recordingAlarmSvc) DeleteByAlarmID(_ context.Context, alarmID string) (bool, error) {
	r.mu.Lock()
	r.deleted = append(r.deleted, alarmID)
	r.mu.Unlock()
	return true, nil
}

func TestRaiseAlarmActionDoesNotResolveTargets(t *testing.T) {
	bus := eventbus.NewChannelBus()
	reader := newMockStateReader()
	s := newMockStore()
	alarm := &recordingAlarmSvc{}

	ch := bus.Subscribe(eventbus.EventCommandRequested)
	defer bus.Unsubscribe(ch)

	executor := NewActionExecutor(bus, reader, s, s, alarm, nil)
	executor.ExecuteGraphAction(ActionConfig{
		ActionType:   ActionRaiseAlarm,
		Payload:      `{"alarm_id":"humidity.high","severity":"high","kind":"auto","message":"bathroom humid"}`,
		AutomationID: "auto-123",
	})

	alarm.mu.Lock()
	defer alarm.mu.Unlock()
	if len(alarm.raised) != 1 {
		t.Fatalf("expected 1 raise, got %d", len(alarm.raised))
	}
	raised := alarm.raised[0]
	if raised.AlarmID != "humidity.high" {
		t.Errorf("alarm_id: want humidity.high, got %s", raised.AlarmID)
	}
	if raised.Severity != store.AlarmSeverityHigh {
		t.Errorf("severity: want high, got %s", raised.Severity)
	}
	if raised.Kind != store.AlarmKindAuto {
		t.Errorf("kind: want auto, got %s", raised.Kind)
	}
	if raised.Message != "bathroom humid" {
		t.Errorf("message: want %q, got %q", "bathroom humid", raised.Message)
	}
	if raised.Source != "automation.auto-123" {
		t.Errorf("source: want automation.auto-123, got %s", raised.Source)
	}
}

func TestClearAlarmActionDelegates(t *testing.T) {
	bus := eventbus.NewChannelBus()
	reader := newMockStateReader()
	s := newMockStore()
	alarm := &recordingAlarmSvc{}

	executor := NewActionExecutor(bus, reader, s, s, alarm, nil)
	executor.ExecuteGraphAction(ActionConfig{
		ActionType: ActionClearAlarm,
		Payload:    `{"alarm_id":"humidity.high"}`,
	})

	alarm.mu.Lock()
	defer alarm.mu.Unlock()
	if len(alarm.deleted) != 1 || alarm.deleted[0] != "humidity.high" {
		t.Fatalf("expected deleted [humidity.high], got %v", alarm.deleted)
	}
}

func TestAlarmActionMalformedPayloadDoesNotCrash(t *testing.T) {
	bus := eventbus.NewChannelBus()
	reader := newMockStateReader()
	s := newMockStore()
	alarm := &recordingAlarmSvc{}

	executor := NewActionExecutor(bus, reader, s, s, alarm, nil)
	executor.ExecuteGraphAction(ActionConfig{
		ActionType: ActionRaiseAlarm,
		Payload:    `not-json`,
	})
	executor.ExecuteGraphAction(ActionConfig{
		ActionType: ActionClearAlarm,
		Payload:    `not-json`,
	})

	alarm.mu.Lock()
	defer alarm.mu.Unlock()
	if len(alarm.raised) != 0 || len(alarm.deleted) != 0 {
		t.Fatalf("expected no calls for malformed payloads, got raised=%d deleted=%d", len(alarm.raised), len(alarm.deleted))
	}
}
