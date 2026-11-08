package cleaning

import "testing"

func TestControlsFollowSupportAndReportedActivity(t *testing.T) {
	actions := []Action{ActionPause, ActionResume, ActionStop, ActionDock, ActionLocate, ActionEmptyBin}
	for _, tc := range []struct {
		status                                  Status
		pause                                   Action
		pauseEnabled, dockEnabled, emptyEnabled bool
	}{
		{StatusDocked, ActionPause, false, false, true},
		{StatusCleaning, ActionPause, true, true, false},
		{StatusPaused, ActionResume, true, true, false},
		{StatusReturning, ActionPause, false, false, false},
	} {
		t.Run(string(tc.status), func(t *testing.T) {
			controls := Controls(Snapshot{Status: tc.status, Actions: actions}, nil, true)
			if len(controls) != 4 || controls[0].Action != tc.pause || controls[0].Enabled != tc.pauseEnabled || controls[1].Enabled != tc.dockEnabled || controls[3].Enabled != tc.emptyEnabled {
				t.Fatalf("unexpected controls: %+v", controls)
			}
			for _, control := range Controls(Snapshot{Status: tc.status, Actions: actions}, nil, false) {
				if control.Enabled {
					t.Fatal("offline control is enabled")
				}
			}
		})
	}
	controls := Controls(Snapshot{Status: StatusCleaning, Actions: []Action{ActionLocate}}, nil, true)
	if len(controls) != 1 || controls[0].Action != ActionLocate {
		t.Fatalf("unsupported actions displayed: %+v", controls)
	}
}
