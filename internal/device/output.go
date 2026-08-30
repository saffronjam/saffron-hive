package device

import "time"

// OutputClass identifies the scheduling lane used for a physical write.
type OutputClass string

const (
	OutputInteractive OutputClass = "interactive"
	OutputForeground  OutputClass = "foreground"
	OutputContinuous  OutputClass = "continuous"
)

// OutputDelivery describes one physical device write lifecycle event.
type OutputDelivery struct {
	DeviceID DeviceID      `json:"deviceId"`
	Origin   CommandOrigin `json:"origin,omitzero"`
	Class    OutputClass   `json:"class"`
	Attempt  int           `json:"attempt"`
	At       time.Time     `json:"at"`
	Error    string        `json:"error,omitempty"`
}

// OutputObservation attributes a reported state to the delivery it acknowledges.
// Transition is the fade duration carried by that delivery, when one was set.
type OutputObservation struct {
	Origin     CommandOrigin
	Transition *float64
}
