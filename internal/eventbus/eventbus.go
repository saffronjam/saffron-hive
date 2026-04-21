package eventbus

import "time"

// EventType categorizes events flowing through the bus.
type EventType string

const (
	EventDeviceStateChanged        EventType = "device.state_changed"
	EventDeviceActionFired         EventType = "device.action_fired"
	EventDeviceAvailabilityChanged EventType = "device.availability_changed"
	EventDeviceAdded               EventType = "device.added"
	EventDeviceRemoved             EventType = "device.removed"
	EventCommandRequested          EventType = "command.requested"
	EventSceneApplied              EventType = "scene.applied"
	EventAutomationTriggered       EventType = "automation.triggered"
	EventAutomationNodeActivated   EventType = "automation.node_activated"
)

// Event is the generic envelope carried by the bus.
type Event struct {
	Type      EventType
	DeviceID  string
	Timestamp time.Time
	Payload   any
}

// Publisher sends events into the bus.
type Publisher interface {
	Publish(event Event)
}

// Subscriber receives events from the bus.
type Subscriber interface {
	Subscribe(eventTypes ...EventType) <-chan Event
	Unsubscribe(ch <-chan Event)
}

// EventBus combines publishing and subscribing.
type EventBus interface {
	Publisher
	Subscriber
}
