package automation

import "testing"

func TestActionUsesTargetResolver(t *testing.T) {
	tests := []struct {
		actionType string
		want       bool
	}{
		{ActionSetDeviceState, true},
		{ActionToggleDeviceState, true},
		{ActionChangeValue, true},
		{ActionConfigureDevice, true},
		{ActionActivateScene, false},
		{ActionCycleScenes, false},
		{ActionRaiseAlarm, false},
		{ActionClearAlarm, false},
		{ActionRunEffect, false},
	}

	for _, tt := range tests {
		t.Run(tt.actionType, func(t *testing.T) {
			if got := actionUsesTargetResolver(tt.actionType); got != tt.want {
				t.Fatalf("actionUsesTargetResolver(%q) = %v, want %v", tt.actionType, got, tt.want)
			}
		})
	}
}
