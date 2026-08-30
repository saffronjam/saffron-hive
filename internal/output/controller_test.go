package output

import (
	"context"
	"errors"
	"slices"
	"sync"
	"testing"
	"time"

	"github.com/saffronjam/saffron-hive/internal/device"
	"github.com/saffronjam/saffron-hive/internal/eventbus"
	"github.com/saffronjam/saffron-hive/internal/outputowner"
	"github.com/saffronjam/saffron-hive/internal/store"
)

type fakeStore struct {
	group    store.Group
	members  []store.GroupMember
	resolved []device.DeviceID
}

func (s *fakeStore) GetGroup(context.Context, string) (store.Group, error) {
	return s.group, nil
}

func (s *fakeStore) ListGroupMembers(context.Context, string) ([]store.GroupMember, error) {
	return s.members, nil
}

func (s *fakeStore) ResolveTargetDeviceIDs(context.Context, device.TargetType, string) []device.DeviceID {
	return append([]device.DeviceID(nil), s.resolved...)
}

type fakeActuator struct {
	mu             sync.Mutex
	states         []device.Command
	groups         []device.ProviderGroupCommand
	configurations []device.ConfigurationRequest
	nativeEffects  []device.NativeEffectRequest
	err            error
}

type blockingActuator struct {
	*fakeActuator
	started chan struct{}
	release chan struct{}
}

func (a *blockingActuator) DispatchState(_ context.Context, command device.Command) error {
	a.mu.Lock()
	a.states = append(a.states, command)
	a.mu.Unlock()
	select {
	case a.started <- struct{}{}:
	default:
	}
	<-a.release
	return nil
}

func (a *fakeActuator) DispatchState(_ context.Context, command device.Command) error {
	a.mu.Lock()
	defer a.mu.Unlock()
	a.states = append(a.states, command)
	return a.err
}

func (a *fakeActuator) DispatchGroupState(_ context.Context, command device.ProviderGroupCommand) error {
	a.mu.Lock()
	defer a.mu.Unlock()
	a.groups = append(a.groups, command)
	return a.err
}

func (a *fakeActuator) DispatchConfiguration(_ context.Context, request device.ConfigurationRequest) error {
	a.mu.Lock()
	defer a.mu.Unlock()
	a.configurations = append(a.configurations, request)
	return a.err
}

func (a *fakeActuator) DispatchNativeEffect(_ context.Context, request device.NativeEffectRequest) error {
	a.mu.Lock()
	defer a.mu.Unlock()
	a.nativeEffects = append(a.nativeEffects, request)
	return a.err
}

func writable(name string) device.Capability {
	return device.Capability{Name: name, Access: device.CapabilityAccessSet | device.CapabilityAccessState}
}

func writableConfiguration(name string) device.Capability {
	return device.Capability{
		Name: name, Access: device.CapabilityAccessSet | device.CapabilityAccessState,
		Category: device.CapabilityCategoryConfiguration, Type: "binary",
	}
}

func newFixture(devices ...device.Device) (*Controller, *fakeStore, *device.MemoryStore, *fakeActuator, *eventbus.ChannelBus, *outputowner.Coordinator) {
	st := &fakeStore{}
	reader := device.NewMemoryStore()
	for _, dev := range devices {
		reader.Register(dev)
	}
	bus := eventbus.NewChannelBus()
	owners := outputowner.New()
	controller := New(bus, st, reader, nil, owners)
	actuator := &fakeActuator{}
	controller.RegisterActuator(device.SourceZigbee2MQTT, actuator, Policy{InteractivePerSecond: 10, ContinuousPerSecond: 2})
	return controller, st, reader, actuator, bus, owners
}

func TestControllerCoalescesQueuedStateByDevice(t *testing.T) {
	controller, _, _, actuator, _, _ := newFixture(device.Device{
		ID: "lamp", Source: device.SourceZigbee2MQTT,
		Capabilities: []device.Capability{writable(device.CapOnOff), writable(device.CapBrightness)},
	})
	ctx := context.Background()
	if err := controller.CommandTarget(ctx, device.TargetCommand{
		TargetType: device.TargetDeviceSet,
		DeviceIDs:  []device.DeviceID{"lamp"},
		State:      device.Command{On: device.Ptr(true), Origin: device.OriginAutomation("first")},
	}); err != nil {
		t.Fatal(err)
	}
	if err := controller.CommandTarget(ctx, device.TargetCommand{
		TargetType: device.TargetDeviceSet,
		DeviceIDs:  []device.DeviceID{"lamp"},
		State:      device.Command{Brightness: device.Ptr(42), Origin: device.OriginUser()},
	}); err != nil {
		t.Fatal(err)
	}
	if !controller.dispatchOne(ctx, time.Unix(100, 0)) {
		t.Fatal("queued command did not dispatch")
	}
	if len(actuator.states) != 1 {
		t.Fatalf("dispatch count = %d", len(actuator.states))
	}
	got := actuator.states[0]
	if got.On == nil || !*got.On || got.Brightness == nil || *got.Brightness != 42 || got.Origin != device.OriginUser() {
		t.Fatalf("coalesced command = %+v", got)
	}
}

func TestControllerPromotesCoalescedUserWork(t *testing.T) {
	controller, _, _, actuator, _, _ := newFixture(
		device.Device{ID: "a", Source: device.SourceZigbee2MQTT, Capabilities: []device.Capability{writable(device.CapOnOff)}},
		device.Device{ID: "b", Source: device.SourceZigbee2MQTT, Capabilities: []device.Capability{writable(device.CapOnOff), writable(device.CapBrightness)}},
	)
	for _, id := range []device.DeviceID{"a", "b"} {
		if err := controller.CommandTarget(context.Background(), device.TargetCommand{
			TargetType: device.TargetDeviceSet,
			DeviceIDs:  []device.DeviceID{id},
			State:      device.Command{On: device.Ptr(true), Origin: device.OriginAutomation("queued")},
		}); err != nil {
			t.Fatal(err)
		}
	}
	if err := controller.CommandTarget(context.Background(), device.TargetCommand{
		TargetType: device.TargetDeviceSet,
		DeviceIDs:  []device.DeviceID{"b"},
		State:      device.Command{Brightness: device.Ptr(80), Origin: device.OriginUser()},
	}); err != nil {
		t.Fatal(err)
	}

	controller.dispatchOne(context.Background(), time.Unix(150, 0))
	if len(actuator.states) != 1 || actuator.states[0].DeviceID != "b" || actuator.states[0].Origin != device.OriginUser() {
		t.Fatalf("first dispatch = %+v, want promoted user work for b", actuator.states)
	}
}

func TestControllerPacesDeviceSetAndDeduplicates(t *testing.T) {
	devices := []device.Device{
		{ID: "a", Source: device.SourceZigbee2MQTT, Capabilities: []device.Capability{writable(device.CapOnOff)}},
		{ID: "b", Source: device.SourceZigbee2MQTT, Capabilities: []device.Capability{writable(device.CapOnOff)}},
	}
	controller, _, _, actuator, _, _ := newFixture(devices...)
	if err := controller.CommandTarget(context.Background(), device.TargetCommand{
		TargetType: device.TargetDeviceSet,
		DeviceIDs:  []device.DeviceID{"b", "a", "a"},
		State:      device.Command{On: device.Ptr(false), Origin: device.OriginUser()},
	}); err != nil {
		t.Fatal(err)
	}
	start := time.Unix(200, 0)
	if !controller.dispatchOne(context.Background(), start) {
		t.Fatal("first command did not dispatch")
	}
	if controller.dispatchOne(context.Background(), start.Add(99*time.Millisecond)) {
		t.Fatal("second command bypassed provider rate")
	}
	if !controller.dispatchOne(context.Background(), start.Add(100*time.Millisecond)) {
		t.Fatal("second command did not dispatch at provider rate")
	}
	if len(actuator.states) != 2 || actuator.states[0].DeviceID != "a" || actuator.states[1].DeviceID != "b" {
		t.Fatalf("dispatched devices = %+v", actuator.states)
	}
}

func TestControllerNeverCommandsHubInsideDeviceSet(t *testing.T) {
	controller, _, _, actuator, _, _ := newFixture(
		device.Device{ID: "hub", Type: device.Hub, Source: device.SourceZigbee2MQTT},
		device.Device{ID: "lamp", Type: device.Light, Source: device.SourceZigbee2MQTT, Capabilities: []device.Capability{writable(device.CapOnOff)}},
	)
	if err := controller.CommandTarget(context.Background(), device.TargetCommand{
		TargetType: device.TargetDeviceSet,
		DeviceIDs:  []device.DeviceID{"hub", "lamp"},
		State:      device.Command{On: device.Ptr(true), Origin: device.OriginUser()},
	}); err != nil {
		t.Fatal(err)
	}
	controller.dispatchOne(context.Background(), time.Unix(250, 0))
	if len(actuator.states) != 1 || actuator.states[0].DeviceID != "lamp" {
		t.Fatalf("states = %+v", actuator.states)
	}
}

func TestControllerUsesEligibleProviderMulticast(t *testing.T) {
	devices := []device.Device{
		{ID: "a", Source: device.SourceZigbee2MQTT, Capabilities: []device.Capability{writable(device.CapOnOff)}},
		{ID: "b", Source: device.SourceZigbee2MQTT, Capabilities: []device.Capability{writable(device.CapOnOff)}},
	}
	controller, st, _, actuator, _, _ := newFixture(devices...)
	providerID := "7"
	st.group = store.Group{ID: "group", FriendlyName: "Hall", Provider: store.GroupProviderZigbee2MQTT, ProviderGroupID: &providerID}
	st.members = []store.GroupMember{
		{MemberType: device.GroupMemberDevice, MemberID: "a", ProviderEndpoint: device.Ptr(int64(1))},
		{MemberType: device.GroupMemberDevice, MemberID: "b", ProviderEndpoint: device.Ptr(int64(1))},
	}
	st.resolved = []device.DeviceID{"a", "b"}
	if err := controller.CommandTarget(context.Background(), device.TargetCommand{
		TargetType: device.TargetGroup, TargetID: "group", State: device.Command{On: device.Ptr(true)},
	}); err != nil {
		t.Fatal(err)
	}
	controller.dispatchOne(context.Background(), time.Unix(300, 0))
	if len(actuator.groups) != 1 || len(actuator.states) != 0 || len(actuator.groups[0].MemberIDs) != 2 {
		t.Fatalf("group dispatch = %+v, states = %+v", actuator.groups, actuator.states)
	}
}

func TestControllerRejectsUnsafeMulticastAndFiltersFallback(t *testing.T) {
	controller, st, _, actuator, _, _ := newFixture(
		device.Device{ID: "a", Source: device.SourceZigbee2MQTT, Capabilities: []device.Capability{writable(device.CapOnOff)}},
		device.Device{ID: "b", Source: device.SourceZigbee2MQTT, Disabled: true, Capabilities: []device.Capability{writable(device.CapOnOff)}},
	)
	providerID := "7"
	st.group = store.Group{ID: "group", FriendlyName: "Hall", Provider: store.GroupProviderZigbee2MQTT, ProviderGroupID: &providerID}
	st.members = []store.GroupMember{
		{MemberType: device.GroupMemberDevice, MemberID: "a", ProviderEndpoint: device.Ptr(int64(1))},
		{MemberType: device.GroupMemberDevice, MemberID: "b", ProviderEndpoint: device.Ptr(int64(1))},
	}
	st.resolved = []device.DeviceID{"a", "b"}
	if err := controller.CommandTarget(context.Background(), device.TargetCommand{
		TargetType: device.TargetGroup, TargetID: "group",
		State: device.Command{On: device.Ptr(true), Brightness: device.Ptr(50)},
	}); err != nil {
		t.Fatal(err)
	}
	controller.dispatchOne(context.Background(), time.Unix(400, 0))
	if len(actuator.groups) != 0 || len(actuator.states) != 1 || actuator.states[0].DeviceID != "a" || actuator.states[0].Brightness != nil {
		t.Fatalf("groups = %+v, states = %+v", actuator.groups, actuator.states)
	}
}

func TestControllerPreemptsOwnerBeforeAcceptingForeignWork(t *testing.T) {
	controller, _, _, _, _, owners := newFixture(device.Device{
		ID: "lamp", Source: device.SourceZigbee2MQTT, Capabilities: []device.Capability{writable(device.CapOnOff)},
	})
	owner := outputowner.Owner{Kind: outputowner.KindScene, RunID: "run"}
	lost := make(chan outputowner.Loss, 1)
	owners.Acquire(owner, []device.DeviceID{"lamp"}, func(loss outputowner.Loss) { lost <- loss })
	if err := controller.CommandTarget(context.Background(), device.TargetCommand{
		TargetType: device.TargetDeviceSet, DeviceIDs: []device.DeviceID{"lamp"}, State: device.Command{On: device.Ptr(false), Origin: device.OriginUser()},
	}); err != nil {
		t.Fatal(err)
	}
	select {
	case loss := <-lost:
		if loss.Reason != outputowner.LossForeign {
			t.Fatalf("loss reason = %q", loss.Reason)
		}
	default:
		t.Fatal("owner was not synchronously preempted")
	}
}

func TestControllerAttributesConfirmationToDispatchedOrigin(t *testing.T) {
	controller, _, reader, _, bus, _ := newFixture(device.Device{
		ID: "lamp", Source: device.SourceZigbee2MQTT, Capabilities: []device.Capability{writable(device.CapBrightness)},
	})
	confirmed := bus.Subscribe(eventbus.EventCommandConfirmed)
	defer bus.Unsubscribe(confirmed)
	origin := device.OriginAutomation("automation")
	if err := controller.CommandTarget(context.Background(), device.TargetCommand{
		TargetType: device.TargetDeviceSet, DeviceIDs: []device.DeviceID{"lamp"}, State: device.Command{Brightness: device.Ptr(61), Transition: device.Ptr(1.8), Origin: origin},
	}); err != nil {
		t.Fatal(err)
	}
	controller.dispatchOne(context.Background(), time.Unix(500, 0))
	reported := device.DeviceState{Brightness: device.Ptr(61)}
	if got := controller.ObserveState("lamp", reported); got.Origin != origin || got.Transition == nil || *got.Transition != 1.8 {
		t.Fatalf("reported observation = %+v", got)
	}
	reader.UpdateDeviceState("lamp", reported)
	select {
	case event := <-confirmed:
		delivery := event.Payload.(device.OutputDelivery)
		if delivery.DeviceID != "lamp" || delivery.Origin != origin {
			t.Fatalf("confirmation = %+v", delivery)
		}
	default:
		t.Fatal("confirmation event was not published")
	}
}

func TestControllerRetriesAndConfirmsConfiguration(t *testing.T) {
	controller, _, _, actuator, bus, _ := newFixture(device.Device{
		ID: "sensor", Source: device.SourceZigbee2MQTT, Capabilities: []device.Capability{writableConfiguration("led")},
	})
	confirmed := bus.Subscribe(eventbus.EventCommandConfirmed)
	defer bus.Unsubscribe(confirmed)
	origin := device.OriginUser()
	request := device.ConfigurationRequest{
		DeviceID: "sensor",
		Values:   []device.ConfigurationValue{{Capability: "led", BooleanValue: device.Ptr(true)}},
		Origin:   origin,
	}
	if err := controller.CommandConfiguration(context.Background(), request); err != nil {
		t.Fatal(err)
	}
	start := time.Unix(550, 0)
	controller.dispatchOne(context.Background(), start)
	controller.dispatchOne(context.Background(), start.Add(2*time.Second))
	if len(actuator.configurations) != 2 {
		t.Fatalf("configuration dispatches = %d, want retry", len(actuator.configurations))
	}
	if got := controller.ObserveConfiguration("sensor", request.Values); got != origin {
		t.Fatalf("configuration origin = %+v", got)
	}
	select {
	case event := <-confirmed:
		delivery := event.Payload.(device.OutputDelivery)
		if delivery.DeviceID != "sensor" || delivery.Attempt != 2 {
			t.Fatalf("configuration confirmation = %+v", delivery)
		}
	default:
		t.Fatal("configuration confirmation was not published")
	}
	if controller.dispatchOne(context.Background(), start.Add(6*time.Second)) {
		t.Fatal("confirmed configuration retried")
	}
}

func TestControllerSamplesContinuousWorkAtDispatchTime(t *testing.T) {
	controller, _, _, actuator, _, owners := newFixture(
		device.Device{ID: "a", Source: device.SourceZigbee2MQTT, Capabilities: []device.Capability{writable(device.CapColor)}},
		device.Device{ID: "b", Source: device.SourceZigbee2MQTT, Capabilities: []device.Capability{writable(device.CapColor)}},
	)
	owner := outputowner.Owner{Kind: outputowner.KindScene, RunID: "run"}
	owners.Acquire(owner, []device.DeviceID{"a", "b"}, nil)
	var sampledAt []time.Time
	var transitions []time.Duration
	var revisits []time.Duration
	controller.RegisterContinuous(owner, []device.DeviceID{"b", "a"}, func(_ context.Context, _ device.DeviceID, at time.Time, revisit, transition time.Duration) (device.Command, error) {
		sampledAt = append(sampledAt, at)
		revisits = append(revisits, revisit)
		transitions = append(transitions, transition)
		return device.Command{Color: &device.Color{R: 1}}, nil
	})
	start := time.Unix(600, 0)
	if !controller.dispatchOne(context.Background(), start) {
		t.Fatal("first continuous sample did not dispatch")
	}
	if controller.dispatchOne(context.Background(), start.Add(499*time.Millisecond)) {
		t.Fatal("continuous output bypassed provider rate")
	}
	if !controller.dispatchOne(context.Background(), start.Add(500*time.Millisecond)) {
		t.Fatal("second continuous sample did not dispatch")
	}
	if len(sampledAt) != 2 || !sampledAt[0].Equal(start) || !sampledAt[1].Equal(start.Add(500*time.Millisecond)) {
		t.Fatalf("sample times = %v", sampledAt)
	}
	if transitions[0] != 900*time.Millisecond || transitions[1] != 900*time.Millisecond {
		t.Fatalf("transitions = %v", transitions)
	}
	if revisits[0] != time.Second || revisits[1] != time.Second {
		t.Fatalf("revisits = %v", revisits)
	}
	if len(actuator.states) != 2 || actuator.states[0].DeviceID != "a" || actuator.states[1].DeviceID != "b" {
		t.Fatalf("continuous dispatch = %+v", actuator.states)
	}
}

func TestControllerReportsProviderWideContinuousDevices(t *testing.T) {
	controller, _, _, _, _, owners := newFixture(
		device.Device{ID: "zigbee-a", Source: device.SourceZigbee2MQTT, Capabilities: []device.Capability{writable(device.CapColor)}},
		device.Device{ID: "zigbee-b", Source: device.SourceZigbee2MQTT, Capabilities: []device.Capability{writable(device.CapColor)}},
		device.Device{ID: "tuya-a", Source: device.SourceTuya, Capabilities: []device.Capability{writable(device.CapColor)}},
	)
	owner := outputowner.Owner{Kind: outputowner.KindScene, RunID: "run"}
	owners.Acquire(owner, []device.DeviceID{"zigbee-a", "zigbee-b", "tuya-a"}, nil)
	controller.RegisterContinuous(owner, []device.DeviceID{"tuya-a", "zigbee-b", "zigbee-a"}, func(context.Context, device.DeviceID, time.Time, time.Duration, time.Duration) (device.Command, error) {
		return device.Command{Color: &device.Color{R: 1}}, nil
	})

	if got := controller.ContinuousDeviceIDs(device.SourceZigbee2MQTT); !slices.Equal(got, []device.DeviceID{"zigbee-a", "zigbee-b"}) {
		t.Fatalf("Zigbee continuous devices = %v", got)
	}
	if got := controller.ContinuousDeviceIDs(device.SourceTuya); !slices.Equal(got, []device.DeviceID{"tuya-a"}) {
		t.Fatalf("Tuya continuous devices = %v", got)
	}
}

func TestControllerContinuousWorkYieldsWhileForegroundIsQueued(t *testing.T) {
	controller, _, _, actuator, _, owners := newFixture(
		device.Device{ID: "a", Source: device.SourceZigbee2MQTT, Capabilities: []device.Capability{writable(device.CapOnOff), writable(device.CapColor)}},
		device.Device{ID: "b", Source: device.SourceZigbee2MQTT, Capabilities: []device.Capability{writable(device.CapOnOff), writable(device.CapColor)}},
	)
	owner := outputowner.Owner{Kind: outputowner.KindScene, RunID: "run"}
	owners.Acquire(owner, []device.DeviceID{"a"}, nil)
	controller.RegisterContinuous(owner, []device.DeviceID{"a"}, func(context.Context, device.DeviceID, time.Time, time.Duration, time.Duration) (device.Command, error) {
		return device.Command{Color: &device.Color{R: 1}}, nil
	})
	if err := controller.CommandTarget(context.Background(), device.TargetCommand{
		TargetType: device.TargetDeviceSet,
		DeviceIDs:  []device.DeviceID{"a", "b"},
		State:      device.Command{On: device.Ptr(true), Origin: device.OriginScene("run")},
	}); err != nil {
		t.Fatal(err)
	}
	start := time.Unix(650, 0)
	if !controller.dispatchOne(context.Background(), start) {
		t.Fatal("first foreground command did not dispatch")
	}
	if controller.dispatchOne(context.Background(), start.Add(50*time.Millisecond)) {
		t.Fatal("continuous work bypassed queued foreground work")
	}
	if !controller.dispatchOne(context.Background(), start.Add(100*time.Millisecond)) {
		t.Fatal("second foreground command did not dispatch")
	}
	if len(actuator.states) != 2 || actuator.states[0].Color != nil || actuator.states[1].Color != nil {
		t.Fatalf("foreground dispatch = %+v", actuator.states)
	}
}

func TestControllerPausesAndResumesContinuousProviderTraffic(t *testing.T) {
	controller, _, _, _, _, owners := newFixture(device.Device{
		ID: "lamp", Source: device.SourceZigbee2MQTT, Capabilities: []device.Capability{writable(device.CapColor)},
	})
	owner := outputowner.Owner{Kind: outputowner.KindScene, RunID: "run"}
	owners.Acquire(owner, []device.DeviceID{"lamp"}, nil)
	controller.RegisterContinuous(owner, []device.DeviceID{"lamp"}, func(context.Context, device.DeviceID, time.Time, time.Duration, time.Duration) (device.Command, error) {
		return device.Command{Color: &device.Color{R: 1}}, nil
	})
	start := time.Unix(675, 0)
	controller.PauseContinuous(device.SourceZigbee2MQTT, start.Add(time.Minute))
	if controller.dispatchOne(context.Background(), start) {
		t.Fatal("paused continuous output dispatched")
	}
	controller.ResumeContinuous(device.SourceZigbee2MQTT)
	if !controller.dispatchOne(context.Background(), start) {
		t.Fatal("resumed continuous output did not dispatch")
	}
}

func TestControllerPublishesDispatchFailureAndSchedulesRetry(t *testing.T) {
	controller, _, _, actuator, bus, _ := newFixture(device.Device{
		ID: "lamp", Source: device.SourceZigbee2MQTT, Capabilities: []device.Capability{writable(device.CapOnOff)},
	})
	actuator.err = errors.New("offline")
	failed := bus.Subscribe(eventbus.EventCommandFailed)
	defer bus.Unsubscribe(failed)
	if err := controller.CommandTarget(context.Background(), device.TargetCommand{
		TargetType: device.TargetDeviceSet, DeviceIDs: []device.DeviceID{"lamp"}, State: device.Command{On: device.Ptr(true)},
	}); err != nil {
		t.Fatal(err)
	}
	start := time.Unix(700, 0)
	controller.dispatchOne(context.Background(), start)
	select {
	case event := <-failed:
		if delivery := event.Payload.(device.OutputDelivery); delivery.Error != "offline" || delivery.Attempt != 1 {
			t.Fatalf("failure = %+v", delivery)
		}
	default:
		t.Fatal("failure event was not published")
	}
	if controller.dispatchOne(context.Background(), start.Add(1999*time.Millisecond)) {
		t.Fatal("retry dispatched before backoff")
	}
	if !controller.dispatchOne(context.Background(), start.Add(2*time.Second)) || len(actuator.states) != 2 {
		t.Fatalf("retry count = %d", len(actuator.states))
	}
}

func TestControllerPublishesFailureAfterConfirmationRetries(t *testing.T) {
	controller, _, _, actuator, bus, _ := newFixture(device.Device{
		ID: "lamp", Source: device.SourceZigbee2MQTT, Capabilities: []device.Capability{writable(device.CapOnOff)},
	})
	failed := bus.Subscribe(eventbus.EventCommandFailed)
	defer bus.Unsubscribe(failed)
	if err := controller.CommandTarget(context.Background(), device.TargetCommand{
		TargetType: device.TargetDeviceSet, DeviceIDs: []device.DeviceID{"lamp"}, State: device.Command{On: device.Ptr(true), Origin: device.OriginUser()},
	}); err != nil {
		t.Fatal(err)
	}
	start := time.Unix(750, 0)
	controller.dispatchOne(context.Background(), start)
	controller.dispatchOne(context.Background(), start.Add(2*time.Second))
	controller.dispatchOne(context.Background(), start.Add(6*time.Second))
	if controller.dispatchOne(context.Background(), start.Add(10*time.Second)) {
		t.Fatal("exhausted command dispatched a fourth time")
	}
	if len(actuator.states) != 3 {
		t.Fatalf("dispatch count = %d, want 3", len(actuator.states))
	}
	select {
	case event := <-failed:
		delivery := event.Payload.(device.OutputDelivery)
		if delivery.Attempt != 3 || delivery.Error != "device did not confirm requested state" {
			t.Fatalf("terminal failure = %+v", delivery)
		}
	default:
		t.Fatal("terminal confirmation failure was not published")
	}
}

func TestControllerDoesNotLetOneProviderBlockAnother(t *testing.T) {
	controller, _, reader, zigbeeActuator, _, _ := newFixture(device.Device{
		ID: "zigbee", Source: device.SourceZigbee2MQTT, Capabilities: []device.Capability{writable(device.CapOnOff)},
	})
	reader.Register(device.Device{
		ID: "tuya", Source: device.SourceTuya, Capabilities: []device.Capability{writable(device.CapOnOff)},
	})
	tuyaActuator := &blockingActuator{
		fakeActuator: &fakeActuator{},
		started:      make(chan struct{}, 1),
		release:      make(chan struct{}),
	}
	controller.RegisterActuator(device.SourceTuya, tuyaActuator, Policy{InteractivePerSecond: 1000, ContinuousPerSecond: 1})
	ctx, cancel := context.WithCancel(context.Background())
	done := make(chan struct{})
	go func() {
		controller.Run(ctx)
		close(done)
	}()
	defer func() {
		close(tuyaActuator.release)
		cancel()
		<-done
	}()

	if err := controller.CommandTarget(context.Background(), device.TargetCommand{
		TargetType: device.TargetDeviceSet,
		DeviceIDs:  []device.DeviceID{"tuya", "zigbee"},
		State:      device.Command{On: device.Ptr(true), Origin: device.OriginUser()},
	}); err != nil {
		t.Fatal(err)
	}
	select {
	case <-tuyaActuator.started:
	case <-time.After(time.Second):
		t.Fatal("Tuya dispatch did not start")
	}
	deadline := time.Now().Add(time.Second)
	for time.Now().Before(deadline) {
		zigbeeActuator.mu.Lock()
		count := len(zigbeeActuator.states)
		zigbeeActuator.mu.Unlock()
		if count == 1 {
			return
		}
		time.Sleep(time.Millisecond)
	}
	t.Fatal("Zigbee dispatch was blocked by Tuya")
}
