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
	EventNativeEffectRequested     EventType = "native_effect.requested"
	EventSceneApplied              EventType = "scene.applied"
	EventSceneActivated            EventType = "scene.activated"
	EventSceneDeactivated          EventType = "scene.deactivated"
	EventAutomationTriggered       EventType = "automation.triggered"
	EventAutomationNodeActivated   EventType = "automation.node_activated"
	// EventEffectStepActivated is emitted by the effect runner around each
	// step it processes (Active=true on enter, Active=false on exit). The
	// frontend live view uses it to highlight the running step inside an
	// effect timeline.
	EventEffectStepActivated EventType = "effect.step_activated"
	// EventEffectEnded is emitted by the effect runner when a run terminates
	// for any reason (manual stop, drift preempt, natural completion, or a
	// preempting Start). Subscribers (scene watcher) use it to release any
	// per-run bookkeeping they hold against the run.
	EventEffectEnded EventType = "effect.ended"
	// EventRoomMembershipChanged signals that some room/device membership
	// changed (create/delete room, add/remove member). It carries no
	// payload; subscribers should refresh their own view of memberships.
	EventRoomMembershipChanged EventType = "room.membership_changed"
	// EventGroupMembershipChanged signals that some group membership changed
	// (create/delete group, add/remove member). It carries no payload.
	// The activity room cache subscribes to it because group reshuffles can
	// change which room a device transitively belongs to.
	EventGroupMembershipChanged EventType = "group.membership_changed"
)

// EffectStepActivatedEvent is the payload for EventEffectStepActivated.
// It marks the entry (Active=true) and exit (Active=false) of a single step
// inside a running effect. RunID identifies the in-flight run instance;
// EffectID is the parent effect's persistent id; StepIndex is the step's
// position in the effect timeline.
type EffectStepActivatedEvent struct {
	RunID     string `json:"runId"`
	EffectID  string `json:"effectId"`
	StepIndex int    `json:"stepIndex"`
	Active    bool   `json:"active"`
}

// EffectEndReason classifies why an effect run ended. Subscribers branch on
// it; the runner publishes EventEffectEnded exactly once per run.
type EffectEndReason string

const (
	// EffectEndReasonStopped signals that a run was stopped via Runner.Stop
	// (manual stop, scene deactivation cascade, automation stop).
	EffectEndReasonStopped EffectEndReason = "stopped"
	// EffectEndReasonPreempted signals that a new Start on the same target
	// preempted this run.
	EffectEndReasonPreempted EffectEndReason = "preempted"
	// EffectEndReasonCompleted signals that a non-loop timeline run finished
	// its steps and exited.
	EffectEndReasonCompleted EffectEndReason = "completed"
	// EffectEndReasonDrift signals that a foreign command on a member device
	// caused the runner's drift goroutine to stop the run.
	EffectEndReasonDrift EffectEndReason = "drift"
)

// EffectEndedEvent is the payload for EventEffectEnded. It identifies the
// terminated run and its target so subscribers (scene watcher) can release
// per-run bookkeeping.
type EffectEndedEvent struct {
	RunID      string          `json:"runId"`
	EffectID   string          `json:"effectId"`
	TargetType string          `json:"targetType"`
	TargetID   string          `json:"targetId"`
	Reason     EffectEndReason `json:"reason"`
}

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
