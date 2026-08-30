package zigbee

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"
	"sync"
	"sync/atomic"
	"time"

	"github.com/saffronjam/saffron-hive/internal/device"
	"github.com/saffronjam/saffron-hive/internal/eventbus"
	"github.com/saffronjam/saffron-hive/internal/logging"
	"github.com/saffronjam/saffron-hive/internal/zigbeemetadata"
)

// dispatchBufferSize bounds the queue between paho's reader goroutine and the
// adapter's dispatch loop. Sized for the retained-message burst that follows a
// WSS reconnect on a busy broker, plus headroom for bursts of live traffic.
const dispatchBufferSize = 1024

type incomingMsg struct {
	topic   string
	payload []byte
	kind    dispatchKind
	ready   bool
	ack     chan struct{} // only set for dispatchBarrier
}

type dispatchKind int

const (
	dispatchState dispatchKind = iota
	dispatchAvailability
	dispatchBridgeState
	dispatchBridgeInfo
	dispatchBridgeDevices
	dispatchBridgeGroups
	dispatchBridgeLog
	dispatchNetworkmap
	dispatchConnectionState
	dispatchBarrier
)

type reportedAvailability struct {
	known    bool
	online   bool
	reported time.Time
}

var logger = logging.Named("zigbee")

// StateWriter is the subset of the device store used to register and update devices.
type StateWriter interface {
	Register(dev device.Device)
	Remove(id device.DeviceID)
	UpdateDeviceState(id device.DeviceID, state device.DeviceState)
	ClearDeviceStateFields(id device.DeviceID, fields ...device.DeviceStateField)
	SetAvailability(id device.DeviceID, available bool)
}

// StateReader is the subset of the device store used to query device state.
type StateReader interface {
	GetDevice(id device.DeviceID) (device.Device, bool)
	GetDeviceState(id device.DeviceID) (*device.DeviceState, bool)
	ListDevices() []device.Device
}

// OutputObserver receives device reports before they are published.
type OutputObserver interface {
	ObserveState(device.DeviceID, device.DeviceState) device.OutputObservation
	ObserveConfiguration(device.DeviceID, []device.ConfigurationValue) device.CommandOrigin
}

// ZigbeeAdapter connects to zigbee2mqtt via MQTT and translates messages
// into domain events.
type ZigbeeAdapter struct {
	mqtt        MQTTClient
	bus         eventbus.EventBus
	stateWriter StateWriter
	stateReader StateReader
	observer    OutputObserver

	mu                    sync.RWMutex
	ieeeToID              map[string]device.DeviceID
	nameToID              map[string]device.DeviceID
	idToName              map[device.DeviceID]string
	knownDevices          map[device.DeviceID]string
	configurationFeatures map[device.DeviceID]map[string]z2mFeature
	deviceAvailability    map[device.DeviceID]reportedAvailability
	pendingAvailability   map[string]reportedAvailability
	bridgeInfo            map[device.DeviceID]zigbeemetadata.BridgeInfo
	mqttReady             bool
	bridgeStateKnown      bool
	bridgeOnline          bool
	networkOnline         atomic.Bool
	lastBridgeSignal      time.Time

	// pendingOrigin holds the origin of the most recent outgoing command per
	// device. The next inbound state echo claims (and clears) the entry so the
	// resulting EventDeviceStateChanged carries the source that produced it.
	// Best-effort: state arriving without a pending origin is treated as drift
	// (zero origin); subsequent foreign updates after a tagged echo are also
	// untagged because the entry is cleared on first read.
	pendingOriginMu            sync.Mutex
	pendingOrigin              map[device.DeviceID]device.CommandOrigin
	pendingConfigurationOrigin map[device.DeviceID]device.CommandOrigin
	nativeEffectMu             sync.Mutex
	pendingNativeEffects       map[device.DeviceID]*pendingNativeEffect

	// dispatchCh decouples paho's reader goroutine from the handlers that do
	// the actual parsing, state writes, and event bus publishes. Paho's
	// subscribe callbacks write to this channel and return immediately; a
	// dedicated dispatch goroutine drains it and runs the handlers.
	dispatchCh chan incomingMsg
	// dispatchDone closes when the dispatch goroutine exits so Stop can wait
	// for in-flight work.
	dispatchDone chan struct{}
	dispatchLive atomic.Bool
	// droppedIn counts paho messages lost to a full dispatch channel, for
	// visibility from logs. Read-only once Stop has returned.
	droppedIn atomic.Int64

	stopCh chan struct{}
}

// NewZigbeeAdapter creates a new adapter with the given dependencies.
func NewZigbeeAdapter(mqtt MQTTClient, bus eventbus.EventBus, sw StateWriter, sr StateReader) *ZigbeeAdapter {
	return &ZigbeeAdapter{
		mqtt:                       mqtt,
		bus:                        bus,
		stateWriter:                sw,
		stateReader:                sr,
		ieeeToID:                   make(map[string]device.DeviceID),
		nameToID:                   make(map[string]device.DeviceID),
		idToName:                   make(map[device.DeviceID]string),
		knownDevices:               make(map[device.DeviceID]string),
		configurationFeatures:      make(map[device.DeviceID]map[string]z2mFeature),
		deviceAvailability:         make(map[device.DeviceID]reportedAvailability),
		pendingAvailability:        make(map[string]reportedAvailability),
		bridgeInfo:                 make(map[device.DeviceID]zigbeemetadata.BridgeInfo),
		pendingOrigin:              make(map[device.DeviceID]device.CommandOrigin),
		pendingConfigurationOrigin: make(map[device.DeviceID]device.CommandOrigin),
		pendingNativeEffects:       make(map[device.DeviceID]*pendingNativeEffect),
		stopCh:                     make(chan struct{}),
		dispatchCh:                 make(chan incomingMsg, dispatchBufferSize),
		dispatchDone:               make(chan struct{}),
	}
}

// SetOutputObserver routes state and configuration acknowledgements through
// Hive's output-delivery ledger.
func (a *ZigbeeAdapter) SetOutputObserver(observer OutputObserver) {
	a.mu.Lock()
	a.observer = observer
	a.mu.Unlock()
}

// Start registers zigbee2mqtt subscriptions and connects to MQTT.
// Subscriptions are registered BEFORE Connect so paho's OnConnectHandler
// issues the SUBSCRIBE frames inside the post-CONNACK callback — the only
// point where every internal paho goroutine is guaranteed to be running.
// Doing it this way avoids the "connection lost before Subscribe completed"
// race on WSS transports.
func (a *ZigbeeAdapter) Start() error {
	a.mqtt.SetConnectionStateHandler(func(connected bool) {
		a.enqueueReliable(incomingMsg{kind: dispatchConnectionState, ready: connected})
	})

	if err := a.mqtt.Subscribe("zigbee2mqtt/bridge/state", 0, func(msg Message) {
		a.enqueue(incomingMsg{kind: dispatchBridgeState, payload: copyPayload(msg.Payload())})
	}); err != nil {
		return err
	}

	if err := a.mqtt.Subscribe("zigbee2mqtt/bridge/info", 0, func(msg Message) {
		a.enqueue(incomingMsg{kind: dispatchBridgeInfo, payload: copyPayload(msg.Payload())})
	}); err != nil {
		return err
	}

	if err := a.mqtt.Subscribe("zigbee2mqtt/bridge/devices", 0, func(msg Message) {
		a.enqueue(incomingMsg{kind: dispatchBridgeDevices, payload: copyPayload(msg.Payload())})
	}); err != nil {
		return err
	}

	if err := a.mqtt.Subscribe("zigbee2mqtt/bridge/groups", 0, func(msg Message) {
		a.enqueue(incomingMsg{kind: dispatchBridgeGroups, payload: copyPayload(msg.Payload())})
	}); err != nil {
		return err
	}

	if err := a.mqtt.Subscribe("zigbee2mqtt/bridge/log", 0, func(msg Message) {
		a.enqueue(incomingMsg{kind: dispatchBridgeLog, payload: copyPayload(msg.Payload())})
	}); err != nil {
		return err
	}

	if err := a.mqtt.Subscribe("zigbee2mqtt/bridge/response/networkmap", 0, func(msg Message) {
		a.enqueue(incomingMsg{kind: dispatchNetworkmap, payload: copyPayload(msg.Payload())})
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
	a.dispatchLive.Store(true)

	if err := a.mqtt.Connect(); err != nil {
		return err
	}

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

func (a *ZigbeeAdapter) enqueueReliable(msg incomingMsg) {
	a.dispatchCh <- msg
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
		case dispatchBridgeState:
			a.handleBridgeState(msg.payload)
		case dispatchBridgeInfo:
			a.handleBridgeInfo(msg.payload)
		case dispatchBridgeDevices:
			a.handleBridgeDevices(msg.payload)
		case dispatchBridgeGroups:
			a.handleBridgeGroups(msg.payload)
		case dispatchBridgeLog:
			a.handleBridgeLog(msg.payload)
		case dispatchNetworkmap:
			a.handleNetworkmapResponse(msg.payload)
		case dispatchConnectionState:
			a.handleConnectionState(msg.ready)
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
	a.cancelNativeEffectVerifications()
	a.mqtt.SetConnectionStateHandler(nil)
	if a.dispatchLive.Load() {
		a.enqueueReliable(incomingMsg{kind: dispatchConnectionState, ready: false})
		a.WaitForDispatchIdle()
	}
	close(a.stopCh)
	a.mqtt.Disconnect(250)

	close(a.dispatchCh)
	if !a.dispatchLive.Load() {
		return
	}
	select {
	case <-a.dispatchDone:
		a.dispatchLive.Store(false)
	case <-time.After(2 * time.Second):
		logger.Warn("dispatch loop did not drain within 2s of Stop")
	}
}

// BridgeConnected reports whether Hive's MQTT subscriptions are ready and
// Zigbee2MQTT reports its bridge online.
func (a *ZigbeeAdapter) BridgeConnected() bool {
	return a.networkOnline.Load()
}

func (a *ZigbeeAdapter) acceptsCommand(deviceID device.DeviceID) bool {
	dev, found := a.stateReader.GetDevice(deviceID)
	if !found {
		return true
	}
	if dev.RuntimeDisabled() {
		return false
	}
	return dev.Source == device.SourceZigbee2MQTT
}

// DispatchState writes one state command through Zigbee2MQTT.
func (a *ZigbeeAdapter) DispatchState(_ context.Context, command device.Command) error {
	if !a.acceptsCommand(command.DeviceID) {
		return fmt.Errorf("device %q is not writable through Zigbee2MQTT", command.DeviceID)
	}
	return a.handleCommand(command)
}

// DispatchGroupState writes one provider-group multicast through Zigbee2MQTT.
func (a *ZigbeeAdapter) DispatchGroupState(_ context.Context, request device.ProviderGroupCommand) error {
	if request.Provider != string(device.SourceZigbee2MQTT) {
		return fmt.Errorf("provider %q is not Zigbee2MQTT", request.Provider)
	}
	return a.handleGroupCommand(request)
}

// DispatchConfiguration writes one device configuration batch through Zigbee2MQTT.
func (a *ZigbeeAdapter) DispatchConfiguration(_ context.Context, request device.ConfigurationRequest) error {
	if !a.acceptsCommand(request.DeviceID) {
		return fmt.Errorf("device %q is not writable through Zigbee2MQTT", request.DeviceID)
	}
	return a.handleConfigurationRequest(request)
}

// DispatchNativeEffect starts one native effect through Zigbee2MQTT.
func (a *ZigbeeAdapter) DispatchNativeEffect(_ context.Context, request device.NativeEffectRequest) error {
	if !a.acceptsCommand(request.DeviceID) {
		return fmt.Errorf("device %q is not writable through Zigbee2MQTT", request.DeviceID)
	}
	return a.handleNativeEffect(request)
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

	var avail z2mAvailability
	if err := json.Unmarshal(payload, &avail); err != nil {
		logger.Warn("failed to parse device availability", "topic", topic, "error", err)
		return
	}
	if avail.State != "online" && avail.State != "offline" {
		logger.Warn("ignoring unknown device availability", "topic", topic, "state", avail.State)
		return
	}

	reported := reportedAvailability{known: true, online: avail.State == "online", reported: time.Now()}
	a.mu.RLock()
	id, ok := a.nameToID[friendlyName]
	a.mu.RUnlock()
	if !ok {
		a.pendingAvailability[friendlyName] = reported
		return
	}
	a.deviceAvailability[id] = reported

	dev, ok := a.stateReader.GetDevice(id)
	if !ok {
		return
	}
	a.applyAvailability(dev, a.effectiveAvailability(dev), reported.online)
}

func (a *ZigbeeAdapter) handleConnectionState(ready bool) {
	a.mqttReady = ready
	if !ready {
		a.bridgeStateKnown = false
		a.bridgeOnline = false
		a.invalidateDeviceAvailability()
	}
	a.reconcileNetworkAvailability(false)
}

func (a *ZigbeeAdapter) handleBridgeState(payload []byte) {
	var state z2mBridgeState
	if err := json.Unmarshal(payload, &state); err != nil {
		logger.Warn("failed to parse bridge/state", "error", err)
		return
	}
	if state.State != "online" && state.State != "offline" {
		logger.Warn("ignoring unknown bridge state", "state", state.State)
		return
	}

	a.bridgeStateKnown = true
	a.bridgeOnline = state.State == "online"
	if a.bridgeOnline {
		a.lastBridgeSignal = time.Now()
	} else {
		a.invalidateDeviceAvailability()
	}
	a.reconcileNetworkAvailability(a.bridgeOnline)
}

func (a *ZigbeeAdapter) invalidateDeviceAvailability() {
	for id, reported := range a.deviceAvailability {
		reported.known = false
		a.deviceAvailability[id] = reported
	}
}

func (a *ZigbeeAdapter) reconcileNetworkAvailability(touchCoordinator bool) {
	networkOnline := a.mqttReady && a.bridgeStateKnown && a.bridgeOnline
	a.networkOnline.Store(networkOnline)
	for _, dev := range a.stateReader.ListDevices() {
		if dev.Source != device.SourceZigbee2MQTT {
			continue
		}
		touch := touchCoordinator && dev.Type == device.Hub && networkOnline
		a.applyAvailability(dev, a.effectiveAvailability(dev), touch)
	}
}

func (a *ZigbeeAdapter) effectiveAvailability(dev device.Device) bool {
	if !a.networkOnline.Load() {
		return false
	}
	if dev.Type == device.Hub {
		return true
	}
	reported, tracked := a.deviceAvailability[dev.ID]
	if !tracked {
		return true
	}
	return reported.known && reported.online
}

func (a *ZigbeeAdapter) applyAvailability(dev device.Device, available, touch bool) {
	changed := dev.Available != available
	if !changed && !(touch && available) {
		return
	}
	a.stateWriter.SetAvailability(dev.ID, available)
	if !changed {
		return
	}

	a.bus.Publish(eventbus.Event{
		Type:      eventbus.EventDeviceAvailabilityChanged,
		DeviceID:  string(dev.ID),
		Timestamp: time.Now(),
		Payload:   available,
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
	a.handleNativeEffectReadback(id, payload)

	var statePayload json.RawMessage = payload
	now := time.Now()
	if ota, present, err := mapOTAStatus(statePayload); err != nil {
		logger.Error("failed to map device OTA status", "device", friendlyName, "error", err)
	} else if present {
		a.bus.Publish(eventbus.Event{
			Type:      eventbus.EventZigbeeOTAStatusChanged,
			DeviceID:  string(id),
			Timestamp: now,
			Payload:   zigbeemetadata.OTAStatus(ota),
		})
	}

	if action, ok := mapAction(statePayload); ok {
		a.bus.Publish(eventbus.Event{
			Type:      eventbus.EventDeviceActionFired,
			DeviceID:  string(id),
			Timestamp: now,
			Payload:   device.Action{Action: action},
		})
	}

	state, colorMode, err := mapDeviceState(statePayload)
	if err != nil {
		logger.Error("failed to map device state", "device", friendlyName, "error", err)
		return
	}
	if dev, found := a.stateReader.GetDevice(id); found {
		state = device.FilterReportedState(state, dev)
	}
	configuration, err := a.mapConfiguration(id, statePayload)
	if err != nil {
		logger.Error("failed to map device configuration", "device", friendlyName, "error", err)
	} else if len(configuration) > 0 {
		if writer, ok := a.stateWriter.(device.ConfigurationWriter); ok {
			writer.UpdateDeviceConfiguration(id, configuration)
		}
		origin := device.CommandOrigin{}
		if observer := a.outputObserver(); observer != nil {
			origin = observer.ObserveConfiguration(id, configuration)
		} else {
			origin = a.consumePendingConfigurationOrigin(id)
		}
		a.bus.Publish(eventbus.Event{
			Type:      eventbus.EventDeviceConfigurationChanged,
			DeviceID:  string(id),
			Timestamp: now,
			Payload:   device.ConfigurationChange{Values: configuration, Origin: origin},
		})
	}
	if !hasAnyField(state) {
		return
	}
	observation := device.OutputObservation{Transition: state.Transition}
	if observer := a.outputObserver(); observer != nil {
		observation = observer.ObserveState(id, state)
	} else {
		observation.Origin = a.consumePendingOrigin(id)
	}
	a.stateWriter.UpdateDeviceState(id, state)
	switch colorMode {
	case "xy":
		a.stateWriter.ClearDeviceStateFields(id, device.FieldColorTemp)
	case "color_temp":
		a.stateWriter.ClearDeviceStateFields(id, device.FieldColor)
	}
	reported := state
	reported.Transition = observation.Transition
	a.bus.Publish(eventbus.Event{
		Type:      eventbus.EventDeviceStateChanged,
		DeviceID:  string(id),
		Timestamp: now,
		Payload:   device.DeviceStateChange{State: reported, Origin: observation.Origin},
	})
}

func (a *ZigbeeAdapter) outputObserver() OutputObserver {
	a.mu.RLock()
	defer a.mu.RUnlock()
	return a.observer
}

func (a *ZigbeeAdapter) recordPendingConfigurationOrigin(id device.DeviceID, origin device.CommandOrigin) {
	if origin.IsZero() {
		return
	}
	a.pendingOriginMu.Lock()
	a.pendingConfigurationOrigin[id] = origin
	a.pendingOriginMu.Unlock()
}

func (a *ZigbeeAdapter) consumePendingConfigurationOrigin(id device.DeviceID) device.CommandOrigin {
	a.pendingOriginMu.Lock()
	defer a.pendingOriginMu.Unlock()
	origin := a.pendingConfigurationOrigin[id]
	delete(a.pendingConfigurationOrigin, id)
	return origin
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
		s.Illuminance != nil || s.Occupancy != nil || s.Battery != nil ||
		s.Contact != nil || s.Orientation != nil || s.DevicePosture != nil || s.LinkQuality != nil ||
		s.Power != nil || s.Voltage != nil || s.Current != nil || s.Energy != nil
}
