package eventbus

import "time"

// EventType categorizes events flowing through the bus.
type EventType string

const (
	EventDeviceStateChanged         EventType = "device.state_changed"
	EventDeviceConfigurationChanged EventType = "device.configuration_changed"
	EventDeviceActionFired          EventType = "device.action_fired"
	EventDeviceAvailabilityChanged  EventType = "device.availability_changed"
	EventDeviceAdded                EventType = "device.added"
	// EventDeviceSynced signals that an adapter re-reported a device it already
	// knew about, with at least one adapter-owned field changed (friendly name,
	// type, capabilities). It carries the device.Device so persistence can
	// refresh those columns. Distinct from device.added, which fires once per
	// device and drives "new device" surfaces, and from device.updated, which
	// carries user-owned metadata and must never come from an adapter.
	EventDeviceSynced EventType = "device.synced"
	// EventDeviceUpdated signals a change to a device's user-owned metadata
	// (name, icon, roles, disabled) — distinct from runtime state or
	// availability. It carries the updated device.Device; subscribers refresh
	// their cached view of those fields.
	EventDeviceUpdated              EventType = "device.updated"
	EventDeviceRemoved              EventType = "device.removed"
	EventCommandRequested           EventType = "command.requested"
	EventCommandDispatched          EventType = "command.dispatched"
	EventCommandConfirmed           EventType = "command.confirmed"
	EventCommandFailed              EventType = "command.failed"
	EventConfigurationRequested     EventType = "configuration.requested"
	EventNativeEffectRequested      EventType = "native_effect.requested"
	EventNativeEffectResult         EventType = "native_effect.result"
	EventNativeEffectSupportChanged EventType = "native_effect.support_changed"
	EventSceneApplied               EventType = "scene.applied"
	EventSceneActivated             EventType = "scene.activated"
	EventSceneDeactivated           EventType = "scene.deactivated"
	EventAutomationTriggered        EventType = "automation.triggered"
	EventAutomationNodeActivated    EventType = "automation.node_activated"
	EventWebhookReceived            EventType = "webhook.received"
	// EventEffectStepActivated is emitted by the effect runner around each
	// step it processes (Active=true on enter, Active=false on exit). The
	// frontend live view uses it to highlight the running step inside an
	// effect timeline.
	EventEffectStepActivated EventType = "effect.step_activated"
	// EventEffectEnded is emitted by the effect runner when a run terminates
	// for any reason (manual stop, drift preempt, natural completion, or a
	// preempting Start). Subscribers such as the Scene runner use it to release any
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
	// EventFloorplanUpdated signals that a committed floor-plan graph or its
	// placements changed. Consumers reload the graph from the store.
	EventFloorplanUpdated EventType = "floorplan.updated"
	// EventProviderGroupsSynced carries a complete provider-owned group
	// snapshot. A persister applies it atomically before announcing changes.
	EventProviderGroupsSynced EventType = "provider.groups_synced"
	// EventZigbeeMetadataSynced carries the bridge/devices description for one
	// Zigbee device. The metadata persister owns deduplication and storage.
	EventZigbeeMetadataSynced EventType = "zigbee.metadata_synced"
	// EventZigbeeBridgeInfoSynced carries stable coordinator and network
	// diagnostics reported by bridge/info.
	EventZigbeeBridgeInfoSynced EventType = "zigbee.bridge_info_synced"
	// EventZigbeeOTAStatusChanged carries an OTA update object from a Zigbee
	// device state payload.
	EventZigbeeOTAStatusChanged EventType = "zigbee.ota_status_changed"
	// EventZigbeeMetadataUpdated announces a committed metadata change.
	EventZigbeeMetadataUpdated EventType = "zigbee.metadata_updated"
	// EventGroupSynced announces provider-owned groups whose stored definition
	// changed. GroupSyncedEvent carries the affected generic group IDs.
	EventGroupSynced EventType = "group.synced"
	// EventNetworkTopologyScanned is published by an adapter when a mesh
	// network scan completes, carrying the freshly parsed
	// device.NetworkTopology (pre-merge). The topology persister stores it and
	// the output controller resumes continuous provider traffic.
	EventNetworkTopologyScanned EventType = "topology.scanned"
	// EventNetworkTopologyUpdated is published by the topology persister after
	// a merged snapshot is stored, carrying NetworkTopologyUpdatedEvent. It is
	// what the GraphQL subscription rides, so consumers can re-query and see
	// the persisted snapshot.
	EventNetworkTopologyUpdated EventType = "topology.updated"
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
// terminated run and its target so subscribers such as the Scene runner can release
// per-run bookkeeping.
type EffectEndedEvent struct {
	RunID      string          `json:"runId"`
	EffectID   string          `json:"effectId"`
	TargetType string          `json:"targetType"`
	TargetID   string          `json:"targetId"`
	Reason     EffectEndReason `json:"reason"`
}

// NetworkTopologyUpdatedEvent is the payload for EventNetworkTopologyUpdated.
// It announces that a provider's stored topology snapshot changed; consumers
// query the store for the snapshot itself.
type NetworkTopologyUpdatedEvent struct {
	Provider  string    `json:"provider"`
	ScannedAt time.Time `json:"scannedAt"`
	NodeCount int       `json:"nodeCount"`
	LinkCount int       `json:"linkCount"`
}

// GroupSyncedEvent is the payload for EventGroupSynced.
type GroupSyncedEvent struct {
	ChangedIDs []string `json:"changedIds"`
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
