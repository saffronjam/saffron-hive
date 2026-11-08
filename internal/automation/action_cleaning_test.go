package automation

import (
	"context"
	"errors"
	"testing"

	"github.com/saffronjam/saffron-hive/internal/cleaning"
)

type cleaningRunnerFixture struct {
	calls           int
	rooms           []string
	replace, origin string
}

func (r *cleaningRunnerFixture) Snapshot(context.Context, string) (cleaning.Snapshot, error) {
	return cleaning.Snapshot{ActiveMapID: 7}, nil
}
func (r *cleaningRunnerFixture) Prepare(_ context.Context, id, mapID string, rooms []string, o cleaning.Options, scope cleaning.Scope) (cleaning.Plan, error) {
	r.rooms = rooms
	return cleaning.Plan{DeviceID: id, MapID: mapID, RoomIDs: rooms, Options: o}, nil
}
func (r *cleaningRunnerFixture) Start(_ context.Context, _ cleaning.Plan, _, replace, origin string) (*cleaning.Task, error) {
	r.calls++
	r.replace = replace
	r.origin = origin
	return nil, &cleaning.BusyError{TaskID: "active"}
}
func (r *cleaningRunnerFixture) Control(context.Context, string, string, string) error { return nil }
func TestCleaningActionFailsBusyWithoutReplacement(t *testing.T) {
	runner := &cleaningRunnerFixture{}
	executor := &ActionExecutor{cleaner: runner}
	err := executor.executeCleaning(t.Context(), ActionConfig{ActionType: ActionStartCleaning, TargetType: TargetDevice, TargetID: "robot", Payload: `{"roomIds":["kitchen"],"options":{"repeats":2}}`})
	var busy *cleaning.BusyError
	if !errors.As(err, &busy) || runner.calls != 1 || runner.replace != "" || runner.origin != "automation" || len(runner.rooms) != 1 || runner.rooms[0] != "kitchen" {
		t.Fatalf("unsafe automated start: %+v %v", runner, err)
	}
}
func TestCleaningActionRequiresRoomsAndDevice(t *testing.T) {
	for _, c := range []ActionConfig{
		{ActionType: ActionStartCleaning, TargetType: TargetDevice, TargetID: "robot", Payload: `{"roomIds":[]}`},
		{ActionType: ActionStartCleaning, TargetType: TargetRoom, TargetID: "kitchen", Payload: `{"roomIds":["kitchen"]}`},
		{ActionType: ActionStartCleaning, TargetType: TargetDevice, TargetID: "robot", Payload: `{"roomIds":["kitchen"],"options":{"repeats":4}}`},
		{ActionType: ActionControlCleaning, TargetType: TargetDevice, TargetID: "robot", Payload: `{"action":"start"}`},
	} {
		if err := ValidateAction(c); err == nil {
			t.Fatalf("accepted invalid cleaning action: %+v", c)
		}
	}
}
