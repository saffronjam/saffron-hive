package zigbee

import (
	"encoding/json"
	"log/slog"
	"strings"
	"sync"
	"time"

	"github.com/saffronjam/saffron-hive/internal/device"
	"github.com/saffronjam/saffron-hive/internal/eventbus"
)

var logger = slog.Default().With("pkg", "zigbee")

// StateWriter is the subset of the device store used to register and update devices.
type StateWriter interface {
	Register(dev device.Device)
	Remove(id device.DeviceID)
	UpdateDeviceState(id device.DeviceID, state device.DeviceState)
	SetAvailability(id device.DeviceID, available bool)
}

// StateReader is the subset of the device store used to query device state.
type StateReader interface {
	GetDevice(id device.DeviceID) (device.Device, bool)
	GetDeviceState(id device.DeviceID) (*device.DeviceState, bool)
	ListDevices() []device.Device
}

// ZigbeeAdapter connects to zigbee2mqtt via MQTT and translates messages
// into domain events.
type ZigbeeAdapter struct {
	mqtt        MQTTClient
	bus         eventbus.EventBus
	stateWriter StateWriter
	stateReader StateReader

	mu           sync.RWMutex
	ieeeToID     map[string]device.DeviceID
	nameToID     map[string]device.DeviceID
	idToName     map[device.DeviceID]string
	knownDevices map[device.DeviceID]struct{}

	stopCh chan struct{}
	cmdCh  <-chan eventbus.Event
}

// NewZigbeeAdapter creates a new adapter with the given dependencies.
func NewZigbeeAdapter(mqtt MQTTClient, bus eventbus.EventBus, sw StateWriter, sr StateReader) *ZigbeeAdapter {
	return &ZigbeeAdapter{
		mqtt:         mqtt,
		bus:          bus,
		stateWriter:  sw,
		stateReader:  sr,
		ieeeToID:     make(map[string]device.DeviceID),
		nameToID:     make(map[string]device.DeviceID),
		idToName:     make(map[device.DeviceID]string),
		knownDevices: make(map[device.DeviceID]struct{}),
		stopCh:       make(chan struct{}),
	}
}

// Start registers zigbee2mqtt subscriptions and connects to MQTT.
// Subscriptions are registered BEFORE Connect so paho's OnConnectHandler
// issues the SUBSCRIBE frames inside the post-CONNACK callback — the only
// point where every internal paho goroutine is guaranteed to be running.
// Doing it this way avoids the "connection lost before Subscribe completed"
// race on WSS transports.
func (a *ZigbeeAdapter) Start() error {
	if err := a.mqtt.Subscribe("zigbee2mqtt/bridge/devices", 0, func(msg Message) {
		a.handleBridgeDevices(msg.Payload())
	}); err != nil {
		return err
	}

	if err := a.mqtt.Subscribe("zigbee2mqtt/bridge/log", 0, func(msg Message) {
		a.handleBridgeLog(msg.Payload())
	}); err != nil {
		return err
	}

	if err := a.mqtt.Subscribe("zigbee2mqtt/+/availability", 0, func(msg Message) {
		a.handleAvailability(msg.Topic(), msg.Payload())
	}); err != nil {
		return err
	}

	// Single-level wildcard: only matches "zigbee2mqtt/<name>". A full "#"
	// wildcard here is both redundant (the state handler filters for exactly
	// two path components) and triggers a large retained-message burst that
	// can race the WSS transport and drop the connection mid-SUBACK.
	if err := a.mqtt.Subscribe("zigbee2mqtt/+", 0, func(msg Message) {
		a.handleStateMessage(msg.Topic(), msg.Payload())
	}); err != nil {
		return err
	}

	if err := a.mqtt.Connect(); err != nil {
		return err
	}

	a.cmdCh = a.bus.Subscribe(eventbus.EventCommandRequested)
	go a.commandLoop()

	return nil
}

// Stop disconnects from MQTT and stops the command loop.
func (a *ZigbeeAdapter) Stop() {
	close(a.stopCh)
	if a.cmdCh != nil {
		a.bus.Unsubscribe(a.cmdCh)
	}
	a.mqtt.Disconnect(250)
}

func (a *ZigbeeAdapter) commandLoop() {
	for {
		select {
		case <-a.stopCh:
			return
		case evt, ok := <-a.cmdCh:
			if !ok {
				return
			}
			cmd, ok := evt.Payload.(device.Command)
			if !ok {
				continue
			}
			a.handleCommand(cmd)
		}
	}
}

func (a *ZigbeeAdapter) handleBridgeLog(payload []byte) {
	var logMsg z2mBridgeLog
	if err := json.Unmarshal(payload, &logMsg); err != nil {
		logger.Error("failed to parse bridge/log", "error", err)
		return
	}

	switch logMsg.Type {
	case "device_joined":
		a.bus.Publish(eventbus.Event{
			Type:      eventbus.EventDeviceAdded,
			Timestamp: time.Now(),
			Payload:   logMsg.Message,
		})
	case "device_removed":
		a.bus.Publish(eventbus.Event{
			Type:      eventbus.EventDeviceRemoved,
			Timestamp: time.Now(),
			Payload:   logMsg.Message,
		})
	}
}

func (a *ZigbeeAdapter) handleAvailability(topic string, payload []byte) {
	parts := strings.Split(topic, "/")
	if len(parts) < 3 {
		return
	}
	friendlyName := parts[1]

	a.mu.RLock()
	id, ok := a.nameToID[friendlyName]
	a.mu.RUnlock()
	if !ok {
		return
	}

	var avail z2mAvailability
	if err := json.Unmarshal(payload, &avail); err != nil {
		return
	}

	online := avail.State == "online"
	a.stateWriter.SetAvailability(id, online)

	a.bus.Publish(eventbus.Event{
		Type:      eventbus.EventDeviceAvailabilityChanged,
		DeviceID:  string(id),
		Timestamp: time.Now(),
		Payload:   online,
	})
}

func (a *ZigbeeAdapter) handleStateMessage(topic string, payload []byte) {
	if strings.HasPrefix(topic, "zigbee2mqtt/bridge/") {
		return
	}
	if strings.HasSuffix(topic, "/availability") {
		return
	}
	if strings.HasSuffix(topic, "/set") || strings.HasSuffix(topic, "/get") {
		return
	}

	parts := strings.Split(topic, "/")
	if len(parts) != 2 {
		return
	}
	friendlyName := parts[1]

	a.mu.RLock()
	id, ok := a.nameToID[friendlyName]
	a.mu.RUnlock()
	if !ok {
		return
	}

	var statePayload json.RawMessage = payload
	now := time.Now()

	if action, ok := mapAction(statePayload); ok {
		a.bus.Publish(eventbus.Event{
			Type:      eventbus.EventDeviceActionFired,
			DeviceID:  string(id),
			Timestamp: now,
			Payload:   device.Action{Action: action},
		})
	}

	state, err := mapDeviceState(statePayload)
	if err != nil {
		logger.Error("failed to map device state", "device", friendlyName, "error", err)
		return
	}
	if !hasAnyField(state) {
		return
	}
	a.stateWriter.UpdateDeviceState(id, state)
	a.bus.Publish(eventbus.Event{
		Type:      eventbus.EventDeviceStateChanged,
		DeviceID:  string(id),
		Timestamp: now,
		Payload:   state,
	})
}

// hasAnyField reports whether any DeviceState pointer field is non-nil. Used
// to skip state-changed publishes for payloads that carry only an action.
func hasAnyField(s device.DeviceState) bool {
	return s.On != nil || s.Brightness != nil || s.ColorTemp != nil ||
		s.Color != nil || s.Transition != nil ||
		s.Temperature != nil || s.Humidity != nil || s.Pressure != nil ||
		s.Illuminance != nil || s.Battery != nil ||
		s.Power != nil || s.Voltage != nil || s.Current != nil || s.Energy != nil
}
