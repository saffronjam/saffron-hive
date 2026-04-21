package device

// Action is the payload for eventbus.EventDeviceActionFired — a discrete
// press, hold, or similar button input. The value is meaningful only at the
// instant the event is published.
type Action struct {
	Action string `json:"action" expr:"action"`
}
