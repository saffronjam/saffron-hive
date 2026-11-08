package cleaning

// Control describes a supported action and whether the current state allows it.
type Control struct {
	Action  Action
	Enabled bool
}

// Controls derives visible controls from provider support and reported activity.
func Controls(snapshot Snapshot, task *Task, available bool) []Control {
	returning := snapshot.Status == StatusReturning || task != nil && task.State == TaskReturning
	pause := ActionPause
	if snapshot.Status == StatusPaused {
		pause = ActionResume
	}
	controls := []Control{}
	for _, action := range []Action{pause, ActionDock, ActionLocate, ActionEmptyBin} {
		if !snapshot.Supports(action) {
			continue
		}
		enabled := available
		switch action {
		case ActionPause:
			enabled = enabled && snapshot.Status == StatusCleaning && !returning
		case ActionResume:
			enabled = enabled && snapshot.Status == StatusPaused && !returning
		case ActionDock:
			enabled = enabled && !returning && snapshot.Status != StatusDocked
		case ActionEmptyBin:
			enabled = enabled && snapshot.Status == StatusDocked
		}
		controls = append(controls, Control{Action: action, Enabled: enabled})
	}
	return controls
}
