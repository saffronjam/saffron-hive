// Package output coordinates every physical write issued by Hive.
package output

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"math"
	"slices"
	"sync"
	"time"

	"github.com/saffronjam/saffron-hive/internal/device"
	"github.com/saffronjam/saffron-hive/internal/eventbus"
	"github.com/saffronjam/saffron-hive/internal/outputowner"
	"github.com/saffronjam/saffron-hive/internal/store"
)

var logger = slog.Default().With("pkg", "output")

const (
	DefaultInteractivePerSecond = 10
	DefaultContinuousPerSecond  = 2
	schedulerResolution         = 20 * time.Millisecond
	confirmationGrace           = 2 * time.Second
)

var ErrNoControllableDevices = errors.New("target resolves to no controllable devices")

// Policy controls foreground and continuous write rates for one provider.
type Policy struct {
	InteractivePerSecond float64
	ContinuousPerSecond  float64
}

// Actuator is the protocol boundary used by the output scheduler.
type Actuator interface {
	DispatchState(context.Context, device.Command) error
	DispatchGroupState(context.Context, device.ProviderGroupCommand) error
	DispatchConfiguration(context.Context, device.ConfigurationRequest) error
	DispatchNativeEffect(context.Context, device.NativeEffectRequest) error
}

// Observer attributes protocol reports to accepted output deliveries.
type Observer interface {
	ObserveState(device.DeviceID, device.DeviceState) device.OutputObservation
	ObserveConfiguration(device.DeviceID, []device.ConfigurationValue) device.CommandOrigin
}

// Store is the structural target data needed by the controller.
type Store interface {
	device.TargetResolver
	GetGroup(context.Context, string) (store.Group, error)
	ListGroupMembers(context.Context, string) ([]store.GroupMember, error)
}

// ContinuousSample computes one device command at its actual dispatch time.
type ContinuousSample = func(context.Context, device.DeviceID, time.Time, time.Duration, time.Duration) (device.Command, error)

type intentKind uint8

const (
	intentState intentKind = iota
	intentGroup
	intentConfiguration
	intentNativeEffect
)

type intent struct {
	key           string
	kind          intentKind
	provider      device.Source
	class         device.OutputClass
	command       device.Command
	group         device.ProviderGroupCommand
	configuration device.ConfigurationRequest
	nativeEffect  device.NativeEffectRequest
	members       []device.DeviceID
	generations   map[device.DeviceID]uint64
	attempt       int
	persistent    bool
}

type delivery struct {
	intent      intent
	desired     device.Command
	generation  uint64
	attempts    int
	nextRetry   time.Time
	deadline    time.Time
	dispatched  time.Time
	lastFailure string
}

type configurationDelivery struct {
	request    device.ConfigurationRequest
	generation uint64
	class      device.OutputClass
	attempts   int
	dispatched time.Time
	deadline   time.Time
	nextRetry  time.Time
}

type continuousProgram struct {
	owner   outputowner.Owner
	devices []device.DeviceID
	sample  ContinuousSample
}

type providerState struct {
	actuator       Actuator
	policy         Policy
	interactive    []*intent
	foreground     []*intent
	queued         map[string]*intent
	lastForeground time.Time
	lastContinuous time.Time
	continuousAt   time.Time
	continuousPos  int
	busy           bool
}

// Controller resolves, coalesces, schedules, dispatches, and verifies physical output.
type Controller struct {
	bus     eventbus.EventBus
	store   Store
	reader  device.StateReader
	support device.NativeEffectSupportReader
	owners  *outputowner.Coordinator

	mu                    sync.Mutex
	providers             map[device.Source]*providerState
	generations           map[device.DeviceID]uint64
	deliveries            map[device.DeviceID]*delivery
	configurationDelivery map[device.DeviceID]*configurationDelivery
	continuous            map[outputowner.Owner]*continuousProgram
	wake                  chan struct{}
}

// New constructs an output controller. Run must be active before writes can dispatch.
func New(bus eventbus.EventBus, st Store, reader device.StateReader, support device.NativeEffectSupportReader, owners *outputowner.Coordinator) *Controller {
	if owners == nil {
		owners = outputowner.New()
	}
	return &Controller{
		bus: bus, store: st, reader: reader, support: support, owners: owners,
		providers: map[device.Source]*providerState{}, generations: map[device.DeviceID]uint64{},
		deliveries: map[device.DeviceID]*delivery{}, configurationDelivery: map[device.DeviceID]*configurationDelivery{},
		continuous: map[outputowner.Owner]*continuousProgram{}, wake: make(chan struct{}, 1),
	}
}

// ResolveTargetDeviceIDs exposes the controller's structural resolver.
func (c *Controller) ResolveTargetDeviceIDs(ctx context.Context, targetType device.TargetType, targetID string) []device.DeviceID {
	return c.store.ResolveTargetDeviceIDs(ctx, targetType, targetID)
}

// ContinuousDeviceIDs reports the devices currently sharing a provider's
// continuous output lane.
func (c *Controller) ContinuousDeviceIDs(provider device.Source) []device.DeviceID {
	c.mu.Lock()
	defer c.mu.Unlock()
	items := c.continuousDevicesLocked(provider)
	result := make([]device.DeviceID, 0, len(items))
	for _, item := range items {
		result = append(result, item.id)
	}
	return result
}

// RegisterActuator makes a provider available for scheduled output.
func (c *Controller) RegisterActuator(provider device.Source, actuator Actuator, policy Policy) {
	c.mu.Lock()
	state := c.providerLocked(provider)
	state.actuator = actuator
	state.policy = normalizePolicy(policy)
	c.mu.Unlock()
	c.signal()
}

// UnregisterActuator stops dispatch for a provider while retaining accepted work.
func (c *Controller) UnregisterActuator(provider device.Source, actuator Actuator) {
	c.mu.Lock()
	if state := c.providers[provider]; state != nil && state.actuator == actuator {
		state.actuator = nil
	}
	c.mu.Unlock()
}

// UpdatePolicy applies provider write rates without reconnecting its adapter.
func (c *Controller) UpdatePolicy(provider device.Source, policy Policy) {
	c.mu.Lock()
	c.providerLocked(provider).policy = normalizePolicy(policy)
	c.mu.Unlock()
	c.signal()
}

// PauseContinuous suspends background output for a provider until the given time.
func (c *Controller) PauseContinuous(provider device.Source, until time.Time) {
	c.mu.Lock()
	state := c.providerLocked(provider)
	if until.After(state.continuousAt) {
		state.continuousAt = until
	}
	c.mu.Unlock()
	c.signal()
}

// ResumeContinuous clears a provider's background-output pause.
func (c *Controller) ResumeContinuous(provider device.Source) {
	c.mu.Lock()
	c.providerLocked(provider).continuousAt = time.Time{}
	c.mu.Unlock()
	c.signal()
}

// CommandTarget accepts a structural state or native-effect operation.
func (c *Controller) CommandTarget(ctx context.Context, request device.TargetCommand) error {
	ids, err := c.resolve(ctx, request)
	if err != nil {
		return err
	}
	if len(ids) == 0 {
		return ErrNoControllableDevices
	}
	c.owners.ForeignCommand(ids, request.State.Origin)

	if request.TargetType == device.TargetGroup {
		if group, ok := c.providerGroupCommand(ctx, request); ok {
			c.enqueueGroup(group, classFor(request.State.Origin))
			return nil
		}
	}

	accepted := 0
	for _, id := range ids {
		dev, ok := c.reader.GetDevice(id)
		if !ok || dev.RuntimeDisabled() || dev.Removed || dev.Type == device.Hub {
			continue
		}
		if request.NativeEffect != "" {
			if !supportsNativeEffect(dev, request.NativeEffect) || !c.nativeEffectAllowed(ctx, dev, request.NativeEffect) {
				continue
			}
			c.enqueueNative(device.NativeEffectRequest{DeviceID: id, Name: request.NativeEffect, Origin: request.State.Origin}, dev.Source)
			accepted++
			continue
		}
		command := filterCommand(request.State, dev)
		command.DeviceID = id
		if emptyCommand(command) {
			continue
		}
		c.enqueueState(command, dev.Source, classFor(command.Origin), false, 0)
		accepted++
	}
	if accepted == 0 {
		return ErrNoControllableDevices
	}
	return nil
}

// CommandConfiguration accepts one validated configuration operation.
func (c *Controller) CommandConfiguration(_ context.Context, request device.ConfigurationRequest) error {
	dev, ok := c.reader.GetDevice(request.DeviceID)
	if !ok || dev.RuntimeDisabled() || dev.Removed {
		return ErrNoControllableDevices
	}
	if err := device.ValidateConfigurationValues(dev, request.Values); err != nil {
		return err
	}
	c.owners.ForeignCommand([]device.DeviceID{request.DeviceID}, request.Origin)
	c.mu.Lock()
	generation := c.nextGenerationLocked(request.DeviceID)
	provider := c.providerLocked(dev.Source)
	key := "configuration:" + string(request.DeviceID)
	next := &intent{key: key, kind: intentConfiguration, provider: dev.Source, class: classFor(request.Origin), configuration: request,
		members: []device.DeviceID{request.DeviceID}, generations: map[device.DeviceID]uint64{request.DeviceID: generation}}
	c.enqueueLocked(provider, next)
	c.mu.Unlock()
	c.bus.Publish(eventbus.Event{Type: eventbus.EventConfigurationRequested, DeviceID: string(request.DeviceID), Timestamp: time.Now().UTC(), Payload: request})
	c.signal()
	return nil
}

// RegisterContinuous installs a dynamic program sampled at provider dispatch time.
func (c *Controller) RegisterContinuous(owner outputowner.Owner, devices []device.DeviceID, sample ContinuousSample) {
	devices = uniqueDevices(devices)
	c.mu.Lock()
	if owner.RunID == "" || len(devices) == 0 || sample == nil {
		delete(c.continuous, owner)
	} else {
		c.continuous[owner] = &continuousProgram{owner: owner, devices: devices, sample: sample}
	}
	c.mu.Unlock()
	c.signal()
}

// UnregisterContinuous removes a dynamic program and invalidates its deliveries.
func (c *Controller) UnregisterContinuous(owner outputowner.Owner) {
	c.mu.Lock()
	program := c.continuous[owner]
	delete(c.continuous, owner)
	if program != nil {
		for _, id := range program.devices {
			if current := c.deliveries[id]; current != nil && current.intent.class == device.OutputContinuous && originMatches(owner, current.desired.Origin) {
				delete(c.deliveries, id)
				c.nextGenerationLocked(id)
			}
		}
	}
	c.mu.Unlock()
}

// ObserveState records a device report synchronously before it reaches the event bus.
func (c *Controller) ObserveState(id device.DeviceID, reported device.DeviceState) device.OutputObservation {
	var confirmed *device.OutputDelivery
	c.mu.Lock()
	current := c.deliveries[id]
	if current == nil || c.generations[id] != current.generation || !reportedTouches(reported, current.desired) {
		c.mu.Unlock()
		return device.OutputObservation{}
	}
	origin := current.desired.Origin
	transition := current.desired.Transition
	merged := mergeReported(c.reader, id, reported)
	if commandMatches(current.desired, merged) {
		delete(c.deliveries, id)
		event := deliveryEvent(id, current.desired.Origin, current.intent.class, current.attempts, time.Now().UTC(), "")
		confirmed = &event
	}
	c.mu.Unlock()
	if confirmed != nil {
		c.bus.Publish(eventbus.Event{Type: eventbus.EventCommandConfirmed, DeviceID: string(id), Timestamp: confirmed.At, Payload: *confirmed})
	}
	return device.OutputObservation{Origin: origin, Transition: transition}
}

// ObserveConfiguration attributes and confirms a reported configuration batch.
func (c *Controller) ObserveConfiguration(id device.DeviceID, reported []device.ConfigurationValue) device.CommandOrigin {
	var confirmed *device.OutputDelivery
	c.mu.Lock()
	current := c.configurationDelivery[id]
	if current == nil || c.generations[id] != current.generation {
		c.mu.Unlock()
		return device.CommandOrigin{}
	}
	origin := current.request.Origin
	if configurationMatches(current.request.Values, reported) {
		delete(c.configurationDelivery, id)
		event := deliveryEvent(id, origin, current.class, current.attempts, time.Now().UTC(), "")
		confirmed = &event
	}
	c.mu.Unlock()
	if confirmed != nil {
		c.bus.Publish(eventbus.Event{Type: eventbus.EventCommandConfirmed, DeviceID: string(id), Timestamp: confirmed.At, Payload: *confirmed})
	}
	return origin
}

// Run dispatches accepted work until the context ends.
func (c *Controller) Run(ctx context.Context) {
	ticker := time.NewTicker(schedulerResolution)
	defer ticker.Stop()
	topologyScans := c.bus.Subscribe(eventbus.EventNetworkTopologyScanned)
	defer c.bus.Unsubscribe(topologyScans)
	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
		case <-c.wake:
		case event, ok := <-topologyScans:
			if !ok {
				return
			}
			if scan, ok := event.Payload.(device.NetworkTopology); ok {
				c.ResumeContinuous(scan.Provider)
			}
		}
		for c.dispatchAvailable(ctx, time.Now().UTC()) {
		}
	}
}

func (c *Controller) dispatchOne(ctx context.Context, now time.Time) bool {
	next, actuator := c.takeOne(now)
	if next == nil {
		return false
	}
	c.dispatchSelected(ctx, actuator, next, now)
	c.finishDispatch(next.provider)
	return true
}

func (c *Controller) dispatchAvailable(ctx context.Context, now time.Time) bool {
	next, actuator := c.takeOne(now)
	if next == nil {
		return false
	}
	go func() {
		c.dispatchSelected(ctx, actuator, next, now)
		c.finishDispatch(next.provider)
	}()
	return true
}

func (c *Controller) takeOne(now time.Time) (*intent, Actuator) {
	c.mu.Lock()
	c.queueRetriesLocked(now)
	providers := make([]device.Source, 0, len(c.providers))
	for provider := range c.providers {
		providers = append(providers, provider)
	}
	slices.Sort(providers)
	var next *intent
	var actuator Actuator
	for _, provider := range providers {
		state := c.providers[provider]
		if state.actuator == nil || state.busy {
			continue
		}
		if candidate := c.popForegroundLocked(state, now); candidate != nil {
			next, actuator = candidate, state.actuator
			break
		}
		if candidate := c.continuousIntentLocked(provider, state, now); candidate != nil {
			next, actuator = candidate, state.actuator
			break
		}
	}
	if next != nil {
		c.providers[next.provider].busy = true
	}
	c.mu.Unlock()
	return next, actuator
}

func (c *Controller) dispatchSelected(ctx context.Context, actuator Actuator, next *intent, now time.Time) {
	if next.kind == intentState && next.class == device.OutputContinuous && next.command.DeviceID == "" {
		c.sampleAndDispatch(ctx, actuator, next, now)
		return
	}
	c.dispatch(ctx, actuator, next, now)
}

func (c *Controller) finishDispatch(provider device.Source) {
	c.mu.Lock()
	c.providerLocked(provider).busy = false
	c.mu.Unlock()
	c.signal()
}

func (c *Controller) sampleAndDispatch(ctx context.Context, actuator Actuator, selected *intent, now time.Time) {
	c.mu.Lock()
	program := c.continuous[outputowner.Owner{Kind: outputowner.Kind(selected.command.Origin.Kind), RunID: selected.command.Origin.ID}]
	state := c.providers[selected.provider]
	count := c.continuousDeviceCountLocked(selected.provider)
	rate := state.policy.ContinuousPerSecond
	c.mu.Unlock()
	if program == nil || !c.owners.Owns(program.owner, selected.members[0]) {
		return
	}
	revisit := time.Duration(float64(time.Second) * float64(max(1, count)) / rate)
	transition := time.Duration(float64(revisit) * 0.9)
	command, err := program.sample(ctx, selected.members[0], now, revisit, transition)
	if err != nil || emptyCommand(command) {
		if err != nil {
			logger.Warn("continuous sample failed", slog.String("device_id", string(selected.members[0])), slog.String("error", err.Error()))
		}
		return
	}
	command.DeviceID = selected.members[0]
	command.Origin = device.CommandOrigin{Kind: string(program.owner.Kind), ID: program.owner.RunID}
	c.mu.Lock()
	if c.continuous[program.owner] != program || !c.owners.Owns(program.owner, command.DeviceID) {
		c.mu.Unlock()
		return
	}
	generation := c.nextGenerationLocked(command.DeviceID)
	selected.command = command
	selected.generations = map[device.DeviceID]uint64{command.DeviceID: generation}
	c.mu.Unlock()
	c.publishRequestedCommand(command)
	c.dispatch(ctx, actuator, selected, now)
}

func (c *Controller) dispatch(ctx context.Context, actuator Actuator, next *intent, now time.Time) {
	if !c.intentCurrent(next) {
		return
	}
	dispatchCtx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()
	var err error
	switch next.kind {
	case intentState:
		err = actuator.DispatchState(dispatchCtx, next.command)
	case intentGroup:
		err = actuator.DispatchGroupState(dispatchCtx, next.group)
	case intentConfiguration:
		err = actuator.DispatchConfiguration(dispatchCtx, next.configuration)
	case intentNativeEffect:
		err = actuator.DispatchNativeEffect(dispatchCtx, next.nativeEffect)
	}
	c.recordDispatch(next, now, err)
}

func (c *Controller) recordDispatch(next *intent, now time.Time, dispatchErr error) {
	if !c.intentCurrent(next) {
		return
	}
	attempt := next.attempt + 1
	for _, id := range next.members {
		origin := next.command.Origin
		if next.kind == intentGroup {
			origin = next.group.State.Origin
		} else if next.kind == intentConfiguration {
			origin = next.configuration.Origin
		} else if next.kind == intentNativeEffect {
			origin = next.nativeEffect.Origin
		}
		if dispatchErr != nil {
			failure := deliveryEvent(id, origin, next.class, attempt, now, dispatchErr.Error())
			c.bus.Publish(eventbus.Event{Type: eventbus.EventCommandFailed, DeviceID: string(id), Timestamp: now, Payload: failure})
			continue
		}
		dispatched := deliveryEvent(id, origin, next.class, attempt, now, "")
		c.bus.Publish(eventbus.Event{Type: eventbus.EventCommandDispatched, DeviceID: string(id), Timestamp: now, Payload: dispatched})
	}

	c.mu.Lock()
	defer c.mu.Unlock()
	if !c.intentCurrentLocked(next) {
		return
	}
	for _, id := range next.members {
		generation := next.generations[id]
		switch next.kind {
		case intentState, intentGroup:
			if next.kind == intentGroup && next.group.NativeEffect != "" {
				continue
			}
			desired := next.command
			if next.kind == intentGroup {
				desired = next.group.State
			}
			desired.DeviceID = id
			deadline := now.Add(confirmationGrace + transitionDuration(desired))
			d := &delivery{intent: *next, desired: desired, generation: generation, attempts: attempt, dispatched: now, deadline: deadline}
			if dispatchErr != nil {
				d.lastFailure = dispatchErr.Error()
			}
			d.nextRetry = retryAt(now, deadline, attempt, next.persistent)
			c.deliveries[id] = d
		case intentConfiguration:
			deadline := now.Add(confirmationGrace)
			delivery := &configurationDelivery{
				request: next.configuration, generation: generation, class: next.class,
				attempts: attempt, dispatched: now, deadline: deadline,
			}
			delivery.nextRetry = retryAt(now, deadline, attempt, false)
			c.configurationDelivery[id] = delivery
		}
	}
}

func (c *Controller) queueRetriesLocked(now time.Time) {
	for id, current := range c.deliveries {
		if now.Before(current.nextRetry) || c.generations[id] != current.generation {
			continue
		}
		if !current.intent.persistent && current.attempts >= 3 {
			failure := deliveryEvent(id, current.desired.Origin, current.intent.class, current.attempts, now, "device did not confirm requested state")
			c.bus.Publish(eventbus.Event{Type: eventbus.EventCommandFailed, DeviceID: string(id), Timestamp: now, Payload: failure})
			logger.Warn("device did not confirm requested state", slog.String("device_id", string(id)), slog.Int("attempts", current.attempts))
			delete(c.deliveries, id)
			continue
		}
		provider := c.providers[current.intent.provider]
		if provider == nil {
			continue
		}
		retry := current.intent
		retry.key = "retry:" + string(id)
		retry.kind = intentState
		retry.command = current.desired
		retry.members = []device.DeviceID{id}
		retry.generations = map[device.DeviceID]uint64{id: current.generation}
		retry.attempt = current.attempts
		c.enqueueLocked(provider, &retry)
		current.nextRetry = now.Add(time.Hour)
	}
	for id, current := range c.configurationDelivery {
		if now.Before(current.nextRetry) || c.generations[id] != current.generation {
			continue
		}
		if current.attempts >= 3 {
			failure := deliveryEvent(id, current.request.Origin, current.class, current.attempts, now, "device did not confirm requested configuration")
			c.bus.Publish(eventbus.Event{Type: eventbus.EventCommandFailed, DeviceID: string(id), Timestamp: now, Payload: failure})
			logger.Warn("device did not confirm requested configuration", slog.String("device_id", string(id)), slog.Int("attempts", current.attempts))
			delete(c.configurationDelivery, id)
			continue
		}
		provider := c.providers[c.providerForDevice(id)]
		if provider == nil {
			continue
		}
		retry := &intent{
			key:           "configuration:" + string(id),
			kind:          intentConfiguration,
			provider:      c.providerForDevice(id),
			class:         current.class,
			configuration: current.request,
			members:       []device.DeviceID{id},
			generations:   map[device.DeviceID]uint64{id: current.generation},
			attempt:       current.attempts,
		}
		c.enqueueLocked(provider, retry)
		current.nextRetry = now.Add(time.Hour)
	}
}

func (c *Controller) popForegroundLocked(state *providerState, now time.Time) *intent {
	if len(state.interactive) == 0 && len(state.foreground) == 0 {
		return nil
	}
	interval := rateInterval(state.policy.InteractivePerSecond)
	if !state.lastForeground.IsZero() && now.Sub(state.lastForeground) < interval {
		return nil
	}
	var next *intent
	if len(state.interactive) > 0 {
		next = state.interactive[0]
		state.interactive = state.interactive[1:]
	} else {
		next = state.foreground[0]
		state.foreground = state.foreground[1:]
	}
	delete(state.queued, next.key)
	state.lastForeground = now
	return next
}

func (c *Controller) continuousIntentLocked(provider device.Source, state *providerState, now time.Time) *intent {
	if now.Before(state.continuousAt) || len(state.interactive) > 0 || len(state.foreground) > 0 {
		return nil
	}
	interval := rateInterval(state.policy.ContinuousPerSecond)
	if !state.lastContinuous.IsZero() && now.Sub(state.lastContinuous) < interval {
		return nil
	}
	items := c.continuousDevicesLocked(provider)
	if len(items) == 0 {
		return nil
	}
	if state.continuousPos >= len(items) {
		state.continuousPos = 0
	}
	item := items[state.continuousPos]
	state.continuousPos = (state.continuousPos + 1) % len(items)
	state.lastContinuous = now
	return &intent{kind: intentState, provider: provider, class: device.OutputContinuous, members: []device.DeviceID{item.id},
		command: device.Command{Origin: device.CommandOrigin{Kind: string(item.owner.Kind), ID: item.owner.RunID}}, persistent: true}
}

type continuousDevice struct {
	owner outputowner.Owner
	id    device.DeviceID
}

func (c *Controller) continuousDevicesLocked(provider device.Source) []continuousDevice {
	var result []continuousDevice
	for owner, program := range c.continuous {
		for _, id := range program.devices {
			dev, ok := c.reader.GetDevice(id)
			if ok && dev.Source == provider && !dev.RuntimeDisabled() && !dev.Removed && c.owners.Owns(owner, id) {
				result = append(result, continuousDevice{owner: owner, id: id})
			}
		}
	}
	slices.SortFunc(result, func(left, right continuousDevice) int {
		if left.owner.Kind != right.owner.Kind {
			return stringCompare(string(left.owner.Kind), string(right.owner.Kind))
		}
		if left.owner.RunID != right.owner.RunID {
			return stringCompare(left.owner.RunID, right.owner.RunID)
		}
		return stringCompare(string(left.id), string(right.id))
	})
	return result
}

func (c *Controller) continuousDeviceCountLocked(provider device.Source) int {
	return len(c.continuousDevicesLocked(provider))
}

func (c *Controller) enqueueState(command device.Command, provider device.Source, class device.OutputClass, persistent bool, attempt int) {
	c.mu.Lock()
	generation := c.nextGenerationLocked(command.DeviceID)
	state := c.providerLocked(provider)
	key := "state:" + string(command.DeviceID)
	next := &intent{key: key, kind: intentState, provider: provider, class: class, command: command,
		members: []device.DeviceID{command.DeviceID}, generations: map[device.DeviceID]uint64{command.DeviceID: generation}, persistent: persistent, attempt: attempt}
	c.enqueueLocked(state, next)
	c.mu.Unlock()
	c.publishRequestedCommand(command)
	c.signal()
}

func (c *Controller) enqueueGroup(group device.ProviderGroupCommand, class device.OutputClass) {
	c.mu.Lock()
	generations := make(map[device.DeviceID]uint64, len(group.MemberIDs))
	for _, id := range group.MemberIDs {
		generations[id] = c.nextGenerationLocked(id)
	}
	provider := device.Source(group.Provider)
	state := c.providerLocked(provider)
	key := "group:" + group.ProviderGroupID
	next := &intent{key: key, kind: intentGroup, provider: provider, class: class, group: group,
		members: append([]device.DeviceID(nil), group.MemberIDs...), generations: generations}
	c.enqueueLocked(state, next)
	c.mu.Unlock()
	for _, id := range group.MemberIDs {
		if group.NativeEffect != "" {
			c.bus.Publish(eventbus.Event{
				Type: eventbus.EventNativeEffectRequested, DeviceID: string(id), Timestamp: time.Now().UTC(),
				Payload: device.NativeEffectRequest{DeviceID: id, Name: group.NativeEffect, Origin: group.State.Origin},
			})
			continue
		}
		command := group.State
		command.DeviceID = id
		c.publishRequestedCommand(command)
	}
	c.signal()
}

func (c *Controller) enqueueNative(request device.NativeEffectRequest, provider device.Source) {
	c.mu.Lock()
	generation := c.nextGenerationLocked(request.DeviceID)
	state := c.providerLocked(provider)
	key := "native:" + string(request.DeviceID)
	next := &intent{key: key, kind: intentNativeEffect, provider: provider, class: classFor(request.Origin), nativeEffect: request,
		members: []device.DeviceID{request.DeviceID}, generations: map[device.DeviceID]uint64{request.DeviceID: generation}}
	c.enqueueLocked(state, next)
	c.mu.Unlock()
	c.bus.Publish(eventbus.Event{Type: eventbus.EventNativeEffectRequested, DeviceID: string(request.DeviceID), Timestamp: time.Now().UTC(), Payload: request})
	c.signal()
}

func (c *Controller) enqueueLocked(state *providerState, next *intent) {
	if existing := state.queued[next.key]; existing != nil {
		wasInteractive := existing.class == device.OutputInteractive
		existing.class = higherPriority(existing.class, next.class)
		if existing.kind == intentState && next.kind == intentState {
			existing.command = mergeCommand(existing.command, next.command)
			existing.generations = next.generations
			existing.persistent = next.persistent
		} else {
			existing.kind = next.kind
			existing.command = next.command
			existing.group = next.group
			existing.configuration = next.configuration
			existing.nativeEffect = next.nativeEffect
			existing.members = next.members
			existing.generations = next.generations
			existing.persistent = next.persistent
		}
		existing.attempt = next.attempt
		if !wasInteractive && existing.class == device.OutputInteractive {
			state.foreground = deleteIntent(state.foreground, existing)
			state.interactive = append(state.interactive, existing)
		}
		return
	}
	state.queued[next.key] = next
	if next.class == device.OutputInteractive {
		state.interactive = append(state.interactive, next)
	} else {
		state.foreground = append(state.foreground, next)
	}
}

func (c *Controller) intentCurrent(next *intent) bool {
	c.mu.Lock()
	defer c.mu.Unlock()
	return c.intentCurrentLocked(next)
}

func (c *Controller) intentCurrentLocked(next *intent) bool {
	currentMembers := next.members[:0]
	for _, id := range next.members {
		if c.generations[id] == next.generations[id] {
			currentMembers = append(currentMembers, id)
		}
	}
	if len(currentMembers) == 0 {
		return false
	}
	if next.kind == intentGroup && len(currentMembers) != len(next.members) {
		for _, id := range currentMembers {
			dev, ok := c.reader.GetDevice(id)
			if !ok {
				continue
			}
			command := next.group.State
			command.DeviceID = id
			individual := &intent{key: "state:" + string(id), kind: intentState, provider: dev.Source, class: next.class, command: command,
				members: []device.DeviceID{id}, generations: map[device.DeviceID]uint64{id: next.generations[id]}}
			c.enqueueLocked(c.providerLocked(dev.Source), individual)
		}
		return false
	}
	return true
}

func (c *Controller) resolve(ctx context.Context, request device.TargetCommand) ([]device.DeviceID, error) {
	if request.TargetType == device.TargetDeviceSet {
		if len(request.DeviceIDs) == 0 {
			return nil, fmt.Errorf("target command: device set is empty")
		}
		return uniqueDevices(request.DeviceIDs), nil
	}
	if request.TargetID == "" {
		return nil, fmt.Errorf("target command: target id is empty")
	}
	if request.TargetType != device.TargetDevice && request.TargetType != device.TargetGroup && request.TargetType != device.TargetRoom {
		return nil, fmt.Errorf("target command: unsupported target type %q", request.TargetType)
	}
	if request.TargetType == device.TargetGroup {
		if group, err := c.store.GetGroup(ctx, request.TargetID); err == nil && group.Removed {
			return nil, nil
		}
	}
	return uniqueDevices(c.store.ResolveTargetDeviceIDs(ctx, request.TargetType, request.TargetID)), nil
}

func (c *Controller) providerGroupCommand(ctx context.Context, request device.TargetCommand) (device.ProviderGroupCommand, bool) {
	group, err := c.store.GetGroup(ctx, request.TargetID)
	if err != nil || group.Provider != store.GroupProviderZigbee2MQTT || group.ProviderGroupID == nil || group.Removed {
		return device.ProviderGroupCommand{}, false
	}
	members, err := c.store.ListGroupMembers(ctx, group.ID)
	if err != nil || len(members) == 0 {
		return device.ProviderGroupCommand{}, false
	}
	ids := make([]device.DeviceID, 0, len(members))
	zeroUsesOnOff := false
	zeroSet := false
	for _, member := range members {
		if member.MemberType != device.GroupMemberDevice || member.ProviderEndpoint == nil {
			return device.ProviderGroupCommand{}, false
		}
		id := device.DeviceID(member.MemberID)
		dev, ok := c.reader.GetDevice(id)
		if !ok || dev.Source != device.SourceZigbee2MQTT || dev.RuntimeDisabled() || dev.Removed {
			return device.ProviderGroupCommand{}, false
		}
		if request.NativeEffect != "" {
			if !supportsNativeEffect(dev, request.NativeEffect) || !c.nativeEffectAllowed(ctx, dev, request.NativeEffect) {
				return device.ProviderGroupCommand{}, false
			}
		} else if !acceptsCommand(dev, request.State) {
			return device.ProviderGroupCommand{}, false
		}
		if request.State.Brightness != nil && *request.State.Brightness == 0 {
			usesOnOff := hasCapability(dev, device.CapOnOff)
			if zeroSet && usesOnOff != zeroUsesOnOff {
				return device.ProviderGroupCommand{}, false
			}
			zeroUsesOnOff, zeroSet = usesOnOff, true
		}
		ids = append(ids, id)
	}
	return device.ProviderGroupCommand{Provider: group.Provider, ProviderGroupID: *group.ProviderGroupID, FriendlyName: group.FriendlyName,
		MemberIDs: uniqueDevices(ids), State: request.State, NativeEffect: request.NativeEffect}, true
}

func (c *Controller) nativeEffectAllowed(ctx context.Context, dev device.Device, name string) bool {
	if c.support == nil {
		return true
	}
	status, err := c.support.Status(ctx, dev, name)
	if err != nil {
		logger.Warn("resolve native effect support failed", slog.String("device_id", string(dev.ID)), slog.String("effect", name), slog.String("error", err.Error()))
		return true
	}
	return status != device.NativeEffectSupportUnsupported
}

func (c *Controller) providerLocked(provider device.Source) *providerState {
	state := c.providers[provider]
	if state == nil {
		state = &providerState{policy: normalizePolicy(Policy{}), queued: map[string]*intent{}}
		c.providers[provider] = state
	}
	return state
}

func (c *Controller) nextGenerationLocked(id device.DeviceID) uint64 {
	c.generations[id]++
	delete(c.deliveries, id)
	delete(c.configurationDelivery, id)
	return c.generations[id]
}

func (c *Controller) providerForDevice(id device.DeviceID) device.Source {
	dev, _ := c.reader.GetDevice(id)
	return dev.Source
}

func (c *Controller) publishRequestedCommand(command device.Command) {
	now := time.Now().UTC()
	c.bus.Publish(eventbus.Event{Type: eventbus.EventCommandRequested, DeviceID: string(command.DeviceID), Timestamp: now, Payload: command})
}

func (c *Controller) signal() {
	select {
	case c.wake <- struct{}{}:
	default:
	}
}

func normalizePolicy(policy Policy) Policy {
	if policy.InteractivePerSecond <= 0 {
		policy.InteractivePerSecond = DefaultInteractivePerSecond
	}
	if policy.ContinuousPerSecond <= 0 {
		policy.ContinuousPerSecond = DefaultContinuousPerSecond
	}
	if policy.ContinuousPerSecond > policy.InteractivePerSecond {
		policy.ContinuousPerSecond = policy.InteractivePerSecond
	}
	return policy
}

func classFor(origin device.CommandOrigin) device.OutputClass {
	if origin.Kind == device.OriginKindUser {
		return device.OutputInteractive
	}
	return device.OutputForeground
}

func higherPriority(left, right device.OutputClass) device.OutputClass {
	if left == device.OutputInteractive || right == device.OutputInteractive {
		return device.OutputInteractive
	}
	if left == device.OutputForeground || right == device.OutputForeground {
		return device.OutputForeground
	}
	return device.OutputContinuous
}

func rateInterval(rate float64) time.Duration {
	return time.Duration(float64(time.Second) / rate)
}

func retryAt(now, deadline time.Time, attempts int, persistent bool) time.Time {
	if persistent {
		steps := []time.Duration{2 * time.Second, 4 * time.Second, 8 * time.Second, 16 * time.Second, 30 * time.Second}
		index := min(max(attempts-1, 0), len(steps)-1)
		return now.Add(steps[index])
	}
	delay := time.Duration(1<<min(max(attempts-1, 0), 1)) * 2 * time.Second
	result := now.Add(delay)
	if deadline.After(result) {
		return deadline
	}
	return result
}

func transitionDuration(command device.Command) time.Duration {
	if command.Transition == nil || *command.Transition <= 0 {
		return 0
	}
	return time.Duration(*command.Transition * float64(time.Second))
}

func deliveryEvent(id device.DeviceID, origin device.CommandOrigin, class device.OutputClass, attempt int, at time.Time, failure string) device.OutputDelivery {
	return device.OutputDelivery{DeviceID: id, Origin: origin, Class: class, Attempt: attempt, At: at, Error: failure}
}

func deleteIntent(queue []*intent, target *intent) []*intent {
	for index, queued := range queue {
		if queued == target {
			return slices.Delete(queue, index, index+1)
		}
	}
	return queue
}

func mergeReported(reader device.StateReader, id device.DeviceID, patch device.DeviceState) device.DeviceState {
	var result device.DeviceState
	if current, ok := reader.GetDeviceState(id); ok && current != nil {
		result = *current
	}
	if patch.On != nil {
		result.On = patch.On
	}
	if patch.Brightness != nil {
		result.Brightness = patch.Brightness
	}
	if patch.ColorTemp != nil {
		result.ColorTemp = patch.ColorTemp
	}
	if patch.Color != nil {
		result.Color = patch.Color
	}
	if patch.TargetTemperature != nil {
		result.TargetTemperature = patch.TargetTemperature
	}
	if patch.HvacMode != nil {
		result.HvacMode = patch.HvacMode
	}
	if patch.FanMode != nil {
		result.FanMode = patch.FanMode
	}
	if patch.Swing != nil {
		result.Swing = patch.Swing
	}
	return result
}

func reportedTouches(reported device.DeviceState, desired device.Command) bool {
	return (reported.On != nil && desired.On != nil) || (reported.Brightness != nil && desired.Brightness != nil) ||
		(reported.ColorTemp != nil && desired.ColorTemp != nil) || (reported.Color != nil && desired.Color != nil) ||
		(reported.TargetTemperature != nil && desired.TargetTemperature != nil) || (reported.HvacMode != nil && desired.HvacMode != nil) ||
		(reported.FanMode != nil && desired.FanMode != nil) || (reported.Swing != nil && desired.Swing != nil)
}

func commandMatches(command device.Command, state device.DeviceState) bool {
	if command.On != nil && (state.On == nil || *command.On != *state.On) {
		return false
	}
	if command.Brightness != nil && (state.Brightness == nil || absInt(*command.Brightness-*state.Brightness) > 2) {
		return false
	}
	if command.ColorTemp != nil && (state.ColorTemp == nil || absInt(*command.ColorTemp-*state.ColorTemp) > 3) {
		return false
	}
	if command.Color != nil && (state.Color == nil || colorDistance(*command.Color, *state.Color) > 10) {
		return false
	}
	if command.TargetTemperature != nil && (state.TargetTemperature == nil || math.Abs(*command.TargetTemperature-*state.TargetTemperature) > 0.1) {
		return false
	}
	if command.HvacMode != nil && (state.HvacMode == nil || *command.HvacMode != *state.HvacMode) {
		return false
	}
	if command.FanMode != nil && (state.FanMode == nil || *command.FanMode != *state.FanMode) {
		return false
	}
	if command.Swing != nil && (state.Swing == nil || *command.Swing != *state.Swing) {
		return false
	}
	return true
}

func configurationMatches(expected, reported []device.ConfigurationValue) bool {
	for _, wanted := range expected {
		found := false
		for _, actual := range reported {
			if device.ConfigurationValuesEqual(wanted, actual) {
				found = true
				break
			}
		}
		if !found {
			return false
		}
	}
	return true
}

func colorDistance(left, right device.Color) float64 {
	if (left.X != 0 || left.Y != 0) && (right.X != 0 || right.Y != 0) {
		return math.Hypot(left.X-right.X, left.Y-right.Y) * 255
	}
	return math.Sqrt(float64((left.R-right.R)*(left.R-right.R) + (left.G-right.G)*(left.G-right.G) + (left.B-right.B)*(left.B-right.B)))
}

func absInt(value int) int {
	if value < 0 {
		return -value
	}
	return value
}

func mergeCommand(base, patch device.Command) device.Command {
	if patch.DeviceID != "" {
		base.DeviceID = patch.DeviceID
	}
	if patch.On != nil {
		base.On = patch.On
	}
	if patch.Brightness != nil {
		base.Brightness = patch.Brightness
	}
	if patch.ColorTemp != nil {
		base.ColorTemp = patch.ColorTemp
	}
	if patch.Color != nil {
		base.Color = patch.Color
	}
	if patch.Transition != nil {
		base.Transition = patch.Transition
	}
	if patch.TargetTemperature != nil {
		base.TargetTemperature = patch.TargetTemperature
	}
	if patch.HvacMode != nil {
		base.HvacMode = patch.HvacMode
	}
	if patch.FanMode != nil {
		base.FanMode = patch.FanMode
	}
	if patch.Swing != nil {
		base.Swing = patch.Swing
	}
	base.Origin = patch.Origin
	return base
}

func acceptsCommand(dev device.Device, command device.Command) bool {
	required := []struct {
		set        bool
		capability string
	}{
		{command.On != nil, device.CapOnOff},
		{command.Brightness != nil, device.CapBrightness},
		{command.ColorTemp != nil, device.CapColorTemp},
		{command.Color != nil, device.CapColor},
		{command.TargetTemperature != nil, device.CapTargetTemperature},
		{command.HvacMode != nil, device.CapHvacMode},
		{command.FanMode != nil, device.CapFanMode},
		{command.Swing != nil, device.CapSwing},
	}
	for _, item := range required {
		if item.set && !hasWritableCapability(dev, item.capability) {
			return false
		}
	}
	return !emptyCommand(command)
}

func filterCommand(command device.Command, dev device.Device) device.Command {
	if len(dev.Capabilities) == 0 {
		return command
	}
	if command.On != nil && !hasWritableCapability(dev, device.CapOnOff) {
		command.On = nil
	}
	if command.Brightness != nil && !hasWritableCapability(dev, device.CapBrightness) {
		command.Brightness = nil
	}
	if command.ColorTemp != nil && !hasWritableCapability(dev, device.CapColorTemp) {
		command.ColorTemp = nil
	}
	if command.Color != nil && !hasWritableCapability(dev, device.CapColor) {
		command.Color = nil
	}
	if command.TargetTemperature != nil && !hasWritableCapability(dev, device.CapTargetTemperature) {
		command.TargetTemperature = nil
	}
	if command.HvacMode != nil && !hasWritableCapability(dev, device.CapHvacMode) {
		command.HvacMode = nil
	}
	if command.FanMode != nil && !hasWritableCapability(dev, device.CapFanMode) {
		command.FanMode = nil
	}
	if command.Swing != nil && !hasWritableCapability(dev, device.CapSwing) {
		command.Swing = nil
	}
	return command
}

func emptyCommand(command device.Command) bool {
	return command.On == nil && command.Brightness == nil && command.ColorTemp == nil && command.Color == nil &&
		command.TargetTemperature == nil && command.HvacMode == nil && command.FanMode == nil && command.Swing == nil
}

func hasWritableCapability(dev device.Device, name string) bool {
	for _, capability := range dev.Capabilities {
		if capability.Name == name && capability.CanSet() {
			return true
		}
	}
	return false
}

func hasCapability(dev device.Device, name string) bool {
	for _, capability := range dev.Capabilities {
		if capability.Name == name {
			return true
		}
	}
	return false
}

func supportsNativeEffect(dev device.Device, name string) bool {
	for _, capability := range dev.Capabilities {
		if capability.Name != device.CapEffect || !capability.CanSet() {
			continue
		}
		if slices.Contains(capability.Values, name) {
			return true
		}
	}
	return false
}

func uniqueDevices(ids []device.DeviceID) []device.DeviceID {
	result := append([]device.DeviceID(nil), ids...)
	slices.Sort(result)
	return slices.Compact(result)
}

func originMatches(owner outputowner.Owner, origin device.CommandOrigin) bool {
	return string(owner.Kind) == origin.Kind && owner.RunID == origin.ID
}

func stringCompare(left, right string) int {
	if left < right {
		return -1
	}
	if left > right {
		return 1
	}
	return 0
}
