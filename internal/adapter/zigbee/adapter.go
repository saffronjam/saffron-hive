package zigbee

import (
	"encoding/json"
	"strings"
	"sync"
	"sync/atomic"
	"time"

	"github.com/saffronjam/saffron-hive/internal/device"
	"github.com/saffronjam/saffron-hive/internal/eventbus"
	"github.com/saffronjam/saffron-hive/internal/logging"
)

// dispatchBufferSize bounds the queue between paho's reader goroutine and the
// adapter's dispatch loop. Sized for the retained-message burst that follows a
// WSS reconnect on a busy broker, plus headroom for bursts of live traffic.
const dispatchBufferSize = 1024

type incomingMsg struct {
	topic   string
	payload []byte
	kind    dispatchKind
	ack     chan struct{} // only set for dispatchBarrier
}

type dispatchKind int

const (
	dispatchState dispatchKind = iota
	dispatchAvailability
	dispatchBridgeDevices
	dispatchBridgeLog
	dispatchBarrier
)

var logger = logging.Named("zigbee")

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

	// pendingOrigin holds the origin of the most recent outgoing command per
	// device. The next inbound state echo claims (and clears) the entry so the
	// resulting EventDeviceStateChanged carries the source that produced it.
	// Best-effort: state arriving without a pending origin is treated as drift
	// (zero origin); subsequent foreign updates after a tagged echo are also
	// untagged because the entry is cleared on first read.
	pendingOriginMu sync.Mutex
	pendingOrigin   map[device.DeviceID]device.CommandOrigin

	// dispatchCh decouples paho's reader goroutine from the handlers that do
	// the actual parsing, state writes, and event bus publishes. Paho's
	// subscribe callbacks write to this channel and return immediately; a
	// dedicated dispatch goroutine drains it and runs the handlers.
	dispatchCh chan incomingMsg
	// dispatchDone closes when the dispatch goroutine exits so Stop can wait
	// for in-flight work.
	dispatchDone chan struct{}
	// droppedIn counts paho messages lost to a full dispatch channel, for
	// visibility from logs. Read-only once Stop has returned.
	droppedIn atomic.Int64

	stopCh chan struct{}
	cmdCh  <-chan eventbus.Event
}

// NewZigbeeAdapter creates a new adapter with the given dependencies.
func NewZigbeeAdapter(mqtt MQTTClient, bus eventbus.EventBus, sw StateWriter, sr StateReader) *ZigbeeAdapter {
	return &ZigbeeAdapter{
		mqtt:          mqtt,
		bus:           bus,
		stateWriter:   sw,
		stateReader:   sr,
		ieeeToID:      make(map[string]device.DeviceID),
		nameToID:      make(map[string]device.DeviceID),
		idToName:      make(map[device.DeviceID]string),
		knownDevices:  make(map[device.DeviceID]struct{}),
		pendingOrigin: make(map[device.DeviceID]device.CommandOrigin),
		stopCh:        make(chan struct{}),
		dispatchCh:    make(chan incomingMsg, dispatchBufferSize),
		dispatchDone:  make(chan struct{}),
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
		a.enqueue(incomingMsg{kind: dispatchBridgeDevices, payload: copyPayload(msg.Payload())})
	}); err != nil {
		return err
	}

	if err := a.mqtt.Subscribe("zigbee2mqtt/bridge/log", 0, func(msg Message) {
		a.enqueue(incomingMsg{kind: dispatchBridgeLog, payload: copyPayload(msg.Payload())})
	}); err != nil {
		return err
	}

	if err := a.mqtt.Subscribe("zigbee2mqtt/+/availability", 0, func(msg Message) {
		a.enqueue(incomingMsg{kind: dispatchAvailability, topic: msg.Topic(), payload: copyPayload(msg.Payload())})
	}); err != nil {
		return err
	}

	// Single-level wildcard: only matches "zigbee2mqtt/<name>". A full "#"
	// wildcard here is both redundant (the state handler filters for exactly
	// two path components) and triggers a large retained-message burst that
	// can race the WSS transport and drop the connection mid-SUBACK.
	if err := a.mqtt.Subscribe("zigbee2mqtt/+", 0, func(msg Message) {
		a.enqueue(incomingMsg{kind: dispatchState, topic: msg.Topic(), payload: copyPayload(msg.Payload())})
	}); err != nil {
		return err
	}

	go a.dispatchLoop()

	if err := a.mqtt.Connect(); err != nil {
		return err
	}

	a.cmdCh = a.bus.Subscribe(eventbus.EventCommandRequested)
	go a.commandLoop()

	return nil
}

// enqueue hands an incoming paho message to the dispatch channel without
// blocking the reader goroutine. If the queue is full the message is dropped
// and a counter is bumped so the operator can see adapter overload in logs.
func (a *ZigbeeAdapter) enqueue(msg incomingMsg) {
	select {
	case a.dispatchCh <- msg:
	default:
		n := a.droppedIn.Add(1)
		logger.Warn("dropping zigbee message, dispatch queue full", "dropped_total", n, "topic", msg.topic)
	}
}

// dispatchLoop drains the dispatch channel and routes each message to its
// handler. Runs until dispatchCh is closed by Stop.
func (a *ZigbeeAdapter) dispatchLoop() {
	defer close(a.dispatchDone)
	for msg := range a.dispatchCh {
		switch msg.kind {
		case dispatchState:
			a.handleStateMessage(msg.topic, msg.payload)
		case dispatchAvailability:
			a.handleAvailability(msg.topic, msg.payload)
		case dispatchBridgeDevices:
			a.handleBridgeDevices(msg.payload)
		case dispatchBridgeLog:
			a.handleBridgeLog(msg.payload)
		case dispatchBarrier:
			close(msg.ack)
		}
	}
}

// WaitForDispatchIdle blocks until every message enqueued before the call has
// been fully processed by the dispatch loop. Intended for tests that need
// deterministic ordering against the async dispatch goroutine.
func (a *ZigbeeAdapter) WaitForDispatchIdle() {
	ack := make(chan struct{})
	a.dispatchCh <- incomingMsg{kind: dispatchBarrier, ack: ack}
	<-ack
}

// copyPayload takes a defensive copy of paho's payload slice. Paho reuses its
// internal buffer after the callback returns, so any reference held beyond
// the callback (e.g. once queued for dispatch) would otherwise alias reused
// memory.
func copyPayload(p []byte) []byte {
	out := make([]byte, len(p))
	copy(out, p)
	return out
}

// Stop disconnects from MQTT and stops the command and dispatch loops.
// Waits up to a short deadline for the dispatch goroutine to drain in-flight
// messages so observers don't see a truncated event stream during shutdown.
func (a *ZigbeeAdapter) Stop() {
	close(a.stopCh)
	if a.cmdCh != nil {
		a.bus.Unsubscribe(a.cmdCh)
	}
	a.mqtt.Disconnect(250)

	close(a.dispatchCh)
	select {
	case <-a.dispatchDone:
	case <-time.After(2 * time.Second):
		logger.Warn("dispatch loop did not drain within 2s of Stop")
	}
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
	origin := a.consumePendingOrigin(id)
	a.bus.Publish(eventbus.Event{
		Type:      eventbus.EventDeviceStateChanged,
		DeviceID:  string(id),
		Timestamp: now,
		Payload:   device.DeviceStateChange{State: state, Origin: origin},
	})
}

func (a *ZigbeeAdapter) recordPendingOrigin(id device.DeviceID, origin device.CommandOrigin) {
	if origin.IsZero() {
		return
	}
	a.pendingOriginMu.Lock()
	a.pendingOrigin[id] = origin
	a.pendingOriginMu.Unlock()
}

func (a *ZigbeeAdapter) consumePendingOrigin(id device.DeviceID) device.CommandOrigin {
	a.pendingOriginMu.Lock()
	defer a.pendingOriginMu.Unlock()
	origin, ok := a.pendingOrigin[id]
	if !ok {
		return device.CommandOrigin{}
	}
	delete(a.pendingOrigin, id)
	return origin
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
