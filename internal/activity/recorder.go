package activity

import (
	"context"
	"encoding/json"
	"log/slog"

	"github.com/saffronjam/saffron-hive/internal/automation"
	"github.com/saffronjam/saffron-hive/internal/device"
	"github.com/saffronjam/saffron-hive/internal/eventbus"
	"github.com/saffronjam/saffron-hive/internal/store"
)

var logger = slog.Default().With("pkg", "activity")

// Recorder subscribes to every event type on the bus, enriches each event with
// device/scene/automation names, persists it to SQLite, and republishes the
// enriched row onto a Buffer for live GraphQL subscribers.
type Recorder struct {
	bus         eventbus.Subscriber
	store       store.Store
	stateReader device.StateReader
	buffer      *Buffer
}

// NewRecorder wires a recorder to its dependencies. Call Run in a goroutine to start it.
func NewRecorder(bus eventbus.Subscriber, s store.Store, stateReader device.StateReader, buffer *Buffer) *Recorder {
	return &Recorder{bus: bus, store: s, stateReader: stateReader, buffer: buffer}
}

// Run blocks until ctx is done, consuming events and writing them to the store.
func (r *Recorder) Run(ctx context.Context) {
	ch := r.bus.Subscribe(
		eventbus.EventDeviceStateChanged,
		eventbus.EventDeviceAvailabilityChanged,
		eventbus.EventDeviceAdded,
		eventbus.EventDeviceRemoved,
		eventbus.EventCommandRequested,
		eventbus.EventSceneApplied,
		eventbus.EventAutomationTriggered,
		eventbus.EventAutomationNodeActivated,
	)
	defer r.bus.Unsubscribe(ch)

	for {
		select {
		case <-ctx.Done():
			return
		case evt, ok := <-ch:
			if !ok {
				return
			}
			r.handle(ctx, evt)
		}
	}
}

func (r *Recorder) handle(ctx context.Context, evt eventbus.Event) {
	params := store.InsertActivityEventParams{
		Type:      string(evt.Type),
		Timestamp: evt.Timestamp,
	}

	// Enrich device-scoped events with name/type/room from the in-memory state
	// store (no DB round-trip on the hot path) with a DB fallback for rooms.
	var deviceName string
	if evt.DeviceID != "" {
		params.DeviceID = strPtr(evt.DeviceID)
		if d, ok := r.stateReader.GetDevice(device.DeviceID(evt.DeviceID)); ok {
			deviceName = d.Name
			params.DeviceName = strPtr(d.Name)
			dt := string(d.Type)
			params.DeviceType = strPtr(dt)
		}
		if rooms, err := r.store.ListRoomsContainingDevice(ctx, evt.DeviceID); err == nil && len(rooms) > 0 {
			params.RoomID = strPtr(rooms[0].ID)
			params.RoomName = strPtr(rooms[0].Name)
		}
	}

	// For device.added the payload may carry a richer name than the state store.
	if evt.Type == eventbus.EventDeviceAdded {
		if d, ok := evt.Payload.(device.Device); ok {
			if d.Name != "" {
				deviceName = d.Name
				params.DeviceName = strPtr(d.Name)
			}
			if d.Type != "" {
				dt := string(d.Type)
				params.DeviceType = strPtr(dt)
			}
			if params.DeviceID == nil && d.ID != "" {
				id := string(d.ID)
				params.DeviceID = &id
			}
		}
	}

	var sceneName string
	if evt.Type == eventbus.EventSceneApplied {
		if id, ok := evt.Payload.(string); ok && id != "" {
			params.SceneID = strPtr(id)
			if sc, err := r.store.GetScene(ctx, id); err == nil {
				sceneName = sc.Name
				params.SceneName = strPtr(sc.Name)
			}
		}
	}

	var automationName string
	if evt.Type == eventbus.EventAutomationNodeActivated {
		if na, ok := evt.Payload.(automation.NodeActivation); ok && na.AutomationID != "" {
			params.AutomationID = strPtr(na.AutomationID)
			if a, err := r.store.GetAutomation(ctx, na.AutomationID); err == nil {
				automationName = a.Name
				params.AutomationName = strPtr(a.Name)
			}
		}
	}

	params.Message = formatMessage(evt, deviceName, sceneName, automationName)
	params.PayloadJSON = marshalPayload(evt.Payload)

	row, err := r.store.InsertActivityEvent(ctx, params)
	if err != nil {
		logger.Error("failed to insert activity event", "type", evt.Type, "error", err)
		return
	}

	if r.buffer != nil {
		r.buffer.Publish(row)
	}
}

// marshalPayload serialises the event payload to a compact JSON string. When
// marshalling fails (cyclical structures, unsupported types), "null" is
// returned so downstream consumers can still render the row.
func marshalPayload(p any) string {
	if p == nil {
		return "null"
	}
	b, err := json.Marshal(p)
	if err != nil {
		logger.Warn("failed to marshal activity payload", "error", err)
		return "null"
	}
	return string(b)
}

func strPtr(s string) *string { return &s }
