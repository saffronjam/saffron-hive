package targetcommand

import (
	"context"
	"testing"
	"time"

	"github.com/saffronjam/saffron-hive/internal/device"
	"github.com/saffronjam/saffron-hive/internal/eventbus"
	"github.com/saffronjam/saffron-hive/internal/store"
)

type fixedNativeEffectSupport map[device.DeviceID]device.NativeEffectSupportStatus

func (s fixedNativeEffectSupport) Status(_ context.Context, dev device.Device, _ string) (device.NativeEffectSupportStatus, error) {
	if status, ok := s[dev.ID]; ok {
		return status, nil
	}
	return device.NativeEffectSupportUntested, nil
}

type fakeStore struct {
	group    store.Group
	members  []store.GroupMember
	resolved []device.DeviceID
}

func (s *fakeStore) GetGroup(_ context.Context, _ string) (store.Group, error) {
	return s.group, nil
}

func (s *fakeStore) ListGroupMembers(_ context.Context, _ string) ([]store.GroupMember, error) {
	return s.members, nil
}

func (s *fakeStore) ResolveTargetDeviceIDs(_ context.Context, _ device.TargetType, _ string) []device.DeviceID {
	return s.resolved
}

func writable(name string) device.Capability {
	return device.Capability{Name: name, Access: device.CapabilityAccessSet | device.CapabilityAccessState}
}

func TestDispatcherUsesProviderMulticastForEligibleGroup(t *testing.T) {
	providerID := "7"
	st := &fakeStore{
		group: store.Group{ID: "zigbee2mqtt:group:7", Name: device.Ptr("Upstairs"), FriendlyName: "Hall", Provider: store.GroupProviderZigbee2MQTT, ProviderGroupID: &providerID},
		members: []store.GroupMember{
			{MemberType: device.GroupMemberDevice, MemberID: "a", ProviderEndpoint: device.Ptr(int64(1))},
			{MemberType: device.GroupMemberDevice, MemberID: "b", ProviderEndpoint: device.Ptr(int64(1))},
		},
		resolved: []device.DeviceID{"a", "b"},
	}
	reader := device.NewMemoryStore()
	for _, id := range []device.DeviceID{"a", "b"} {
		reader.Register(device.Device{ID: id, Source: device.SourceZigbee2MQTT, Capabilities: []device.Capability{writable(device.CapOnOff)}})
	}
	bus := eventbus.NewChannelBus()
	groups := bus.Subscribe(eventbus.EventProviderGroupCommandRequested)
	devices := bus.Subscribe(eventbus.EventCommandRequested)
	defer bus.Unsubscribe(groups)
	defer bus.Unsubscribe(devices)
	dispatcher := New(bus, st, reader, nil)

	if err := dispatcher.CommandTarget(context.Background(), device.TargetCommand{
		TargetType: device.TargetGroup,
		TargetID:   st.group.ID,
		State:      device.Command{On: device.Ptr(true), Origin: device.OriginUser()},
	}); err != nil {
		t.Fatalf("command target: %v", err)
	}
	select {
	case evt := <-groups:
		req := evt.Payload.(device.ProviderGroupCommand)
		if req.FriendlyName != "Hall" || len(req.MemberIDs) != 2 || req.State.On == nil || !*req.State.On {
			t.Fatalf("group command = %+v", req)
		}
	case <-time.After(time.Second):
		t.Fatal("timed out waiting for multicast")
	}
	select {
	case evt := <-devices:
		t.Fatalf("eligible multicast also fanned out: %+v", evt)
	default:
	}
}

func TestDispatcherFallsBackAndNeverCommandsDisabledMember(t *testing.T) {
	providerID := "7"
	st := &fakeStore{
		group: store.Group{ID: "zigbee2mqtt:group:7", FriendlyName: "Hall", Provider: store.GroupProviderZigbee2MQTT, ProviderGroupID: &providerID},
		members: []store.GroupMember{
			{MemberType: device.GroupMemberDevice, MemberID: "enabled", ProviderEndpoint: device.Ptr(int64(1))},
			{MemberType: device.GroupMemberDevice, MemberID: "disabled", ProviderEndpoint: device.Ptr(int64(1))},
		},
		resolved: []device.DeviceID{"enabled", "disabled"},
	}
	reader := device.NewMemoryStore()
	reader.Register(device.Device{ID: "enabled", Source: device.SourceZigbee2MQTT, Capabilities: []device.Capability{writable(device.CapOnOff)}})
	reader.Register(device.Device{ID: "disabled", Source: device.SourceZigbee2MQTT, Disabled: true, Capabilities: []device.Capability{writable(device.CapOnOff)}})
	bus := eventbus.NewChannelBus()
	groups := bus.Subscribe(eventbus.EventProviderGroupCommandRequested)
	commands := bus.Subscribe(eventbus.EventCommandRequested)
	defer bus.Unsubscribe(groups)
	defer bus.Unsubscribe(commands)
	dispatcher := New(bus, st, reader, nil)

	if err := dispatcher.CommandTarget(context.Background(), device.TargetCommand{TargetType: device.TargetGroup, TargetID: st.group.ID, State: device.Command{On: device.Ptr(false)}}); err != nil {
		t.Fatalf("command target: %v", err)
	}
	select {
	case evt := <-groups:
		t.Fatalf("disabled group used multicast: %+v", evt)
	default:
	}
	select {
	case evt := <-commands:
		if evt.DeviceID != "enabled" {
			t.Fatalf("commanded device = %q", evt.DeviceID)
		}
	case <-time.After(time.Second):
		t.Fatal("timed out waiting for fallback command")
	}
	select {
	case evt := <-commands:
		t.Fatalf("extra fallback command: %+v", evt)
	default:
	}
}

func TestDispatcherFallsBackForUnknownMemberAndFiltersCapabilities(t *testing.T) {
	providerID := "7"
	st := &fakeStore{
		group: store.Group{ID: "zigbee2mqtt:group:7", FriendlyName: "Hall", Provider: store.GroupProviderZigbee2MQTT, ProviderGroupID: &providerID},
		members: []store.GroupMember{
			{MemberType: device.GroupMemberDevice, MemberID: "light", ProviderEndpoint: device.Ptr(int64(1))},
			{MemberType: device.GroupMemberDevice, MemberID: "unknown", ProviderEndpoint: device.Ptr(int64(1))},
		},
		resolved: []device.DeviceID{"light", "unknown"},
	}
	reader := device.NewMemoryStore()
	reader.Register(device.Device{ID: "light", Source: device.SourceZigbee2MQTT, Capabilities: []device.Capability{writable(device.CapOnOff)}})
	bus := eventbus.NewChannelBus()
	commands := bus.Subscribe(eventbus.EventCommandRequested)
	defer bus.Unsubscribe(commands)
	dispatcher := New(bus, st, reader, nil)

	if err := dispatcher.CommandTarget(context.Background(), device.TargetCommand{TargetType: device.TargetGroup, TargetID: st.group.ID, State: device.Command{On: device.Ptr(true), Brightness: device.Ptr(100)}}); err != nil {
		t.Fatalf("command target: %v", err)
	}
	var command device.Command
	select {
	case evt := <-commands:
		if evt.DeviceID != "light" {
			t.Fatalf("commanded device = %q", evt.DeviceID)
		}
		command = evt.Payload.(device.Command)
	case <-time.After(time.Second):
		t.Fatal("timed out waiting for fallback command")
	}
	if command.Brightness != nil || command.On == nil {
		t.Fatalf("known member command was not capability-filtered: %+v", command)
	}
	select {
	case evt := <-commands:
		t.Fatalf("unknown member received a fallback command: %+v", evt)
	default:
	}
}

func TestProviderMulticastEligibilityRejectsUnsafeGroups(t *testing.T) {
	providerID := "7"
	baseGroup := store.Group{
		ID:              "zigbee2mqtt:group:7",
		FriendlyName:    "Hall",
		Provider:        store.GroupProviderZigbee2MQTT,
		ProviderGroupID: &providerID,
	}
	baseMember := store.GroupMember{
		MemberType:       device.GroupMemberDevice,
		MemberID:         "light",
		ProviderEndpoint: device.Ptr(int64(1)),
	}
	baseDevice := device.Device{
		ID:           "light",
		Source:       device.SourceZigbee2MQTT,
		Capabilities: []device.Capability{writable(device.CapOnOff), writable(device.CapBrightness)},
	}

	tests := []struct {
		name    string
		mutate  func(*fakeStore, *device.MemoryStore)
		request device.TargetCommand
	}{
		{
			name: "Hive group",
			mutate: func(st *fakeStore, _ *device.MemoryStore) {
				st.group.Provider = store.GroupProviderHive
			},
		},
		{
			name: "removed group",
			mutate: func(st *fakeStore, _ *device.MemoryStore) {
				st.group.Removed = true
			},
		},
		{
			name: "missing endpoint",
			mutate: func(st *fakeStore, _ *device.MemoryStore) {
				st.members[0].ProviderEndpoint = nil
			},
		},
		{
			name: "nested member",
			mutate: func(st *fakeStore, _ *device.MemoryStore) {
				st.members[0].MemberType = device.GroupMemberGroup
			},
		},
		{
			name: "unknown device",
			mutate: func(_ *fakeStore, reader *device.MemoryStore) {
				reader.Remove("light")
			},
		},
		{
			name: "different provider",
			mutate: func(_ *fakeStore, reader *device.MemoryStore) {
				dev := baseDevice
				dev.Source = device.SourceTuya
				reader.Register(dev)
			},
		},
		{
			name: "disabled device",
			mutate: func(_ *fakeStore, reader *device.MemoryStore) {
				dev := baseDevice
				dev.Disabled = true
				reader.UpdateUserFields(dev)
			},
		},
		{
			name: "removed device",
			mutate: func(_ *fakeStore, reader *device.MemoryStore) {
				dev := baseDevice
				dev.Removed = true
				reader.Register(dev)
			},
		},
		{
			name: "incompatible capability",
			mutate: func(_ *fakeStore, reader *device.MemoryStore) {
				dev := baseDevice
				dev.Capabilities = []device.Capability{writable(device.CapOnOff)}
				reader.Register(dev)
			},
			request: device.TargetCommand{State: device.Command{Brightness: device.Ptr(100)}},
		},
		{
			name:    "unsupported Zigbee effect",
			request: device.TargetCommand{NativeEffect: "blink"},
		},
		{
			name: "mixed zero brightness behavior",
			mutate: func(st *fakeStore, reader *device.MemoryStore) {
				st.members = append(st.members, store.GroupMember{
					MemberType:       device.GroupMemberDevice,
					MemberID:         "brightness-only",
					ProviderEndpoint: device.Ptr(int64(1)),
				})
				reader.Register(device.Device{
					ID:           "brightness-only",
					Source:       device.SourceZigbee2MQTT,
					Capabilities: []device.Capability{writable(device.CapBrightness)},
				})
			},
			request: device.TargetCommand{State: device.Command{Brightness: device.Ptr(0)}},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			st := &fakeStore{group: baseGroup, members: []store.GroupMember{baseMember}, resolved: []device.DeviceID{"light"}}
			reader := device.NewMemoryStore()
			reader.Register(baseDevice)
			if tt.mutate != nil {
				tt.mutate(st, reader)
			}
			req := tt.request
			req.TargetType = device.TargetGroup
			req.TargetID = baseGroup.ID
			if req.NativeEffect == "" && req.State.On == nil && req.State.Brightness == nil {
				req.State.On = device.Ptr(true)
			}
			dispatcher := New(eventbus.NewChannelBus(), st, reader, nil)
			if command, ok := dispatcher.providerGroupCommand(context.Background(), req); ok {
				t.Fatalf("unsafe group accepted for multicast: %+v", command)
			}
		})
	}
}

func TestProviderMulticastSupportsSharedZigbeeEffect(t *testing.T) {
	providerID := "7"
	st := &fakeStore{
		group: store.Group{ID: "zigbee2mqtt:group:7", FriendlyName: "Hall", Provider: store.GroupProviderZigbee2MQTT, ProviderGroupID: &providerID},
		members: []store.GroupMember{
			{MemberType: device.GroupMemberDevice, MemberID: "a", ProviderEndpoint: device.Ptr(int64(1))},
			{MemberType: device.GroupMemberDevice, MemberID: "b", ProviderEndpoint: device.Ptr(int64(1))},
		},
	}
	reader := device.NewMemoryStore()
	for _, id := range []device.DeviceID{"a", "b"} {
		reader.Register(device.Device{ID: id, Source: device.SourceZigbee2MQTT, Capabilities: []device.Capability{{
			Name: device.CapEffect, Access: device.CapabilityAccessSet, Values: []string{"blink"},
		}}})
	}
	dispatcher := New(eventbus.NewChannelBus(), st, reader, nil)
	command, ok := dispatcher.providerGroupCommand(context.Background(), device.TargetCommand{
		TargetType:   device.TargetGroup,
		TargetID:     st.group.ID,
		NativeEffect: "blink",
	})
	if !ok || command.NativeEffect != "blink" || len(command.MemberIDs) != 2 {
		t.Fatalf("shared Zigbee effect command = %+v, ok=%v", command, ok)
	}
}

func TestNativeEffectSkipsLearnedUnsupportedDevice(t *testing.T) {
	bus := eventbus.NewChannelBus()
	st := &fakeStore{resolved: []device.DeviceID{"unsupported", "confirmed"}}
	reader := device.NewMemoryStore()
	for _, id := range st.resolved {
		reader.Register(device.Device{ID: id, Source: device.SourceZigbee2MQTT, Capabilities: []device.Capability{{
			Name: device.CapEffect, Access: device.CapabilityAccessSet, Values: []string{"underwater"},
		}}})
	}
	events := bus.Subscribe(eventbus.EventNativeEffectRequested)
	defer bus.Unsubscribe(events)
	dispatcher := New(bus, st, reader, fixedNativeEffectSupport{
		"unsupported": device.NativeEffectSupportUnsupported,
		"confirmed":   device.NativeEffectSupportConfirmed,
	})
	if err := dispatcher.CommandTarget(context.Background(), device.TargetCommand{
		TargetType: device.TargetRoom, TargetID: "room", NativeEffect: "underwater",
	}); err != nil {
		t.Fatal(err)
	}
	select {
	case event := <-events:
		if event.DeviceID != "confirmed" {
			t.Fatalf("effect requested for %q", event.DeviceID)
		}
	case <-time.After(time.Second):
		t.Fatal("expected native effect request")
	}
	select {
	case event := <-events:
		t.Fatalf("unexpected second request for %q", event.DeviceID)
	case <-time.After(20 * time.Millisecond):
	}
}

func TestDispatcherFallbackDeduplicatesResolvedDevices(t *testing.T) {
	st := &fakeStore{
		group:    store.Group{ID: "hive", Name: device.Ptr("Hive"), Provider: store.GroupProviderHive},
		resolved: []device.DeviceID{"light", "light"},
	}
	reader := device.NewMemoryStore()
	reader.Register(device.Device{ID: "light", Source: device.SourceZigbee2MQTT, Capabilities: []device.Capability{writable(device.CapOnOff)}})
	bus := eventbus.NewChannelBus()
	commands := bus.Subscribe(eventbus.EventCommandRequested)
	defer bus.Unsubscribe(commands)
	dispatcher := New(bus, st, reader, nil)

	if err := dispatcher.CommandTarget(context.Background(), device.TargetCommand{
		TargetType: device.TargetGroup,
		TargetID:   st.group.ID,
		State:      device.Command{On: device.Ptr(true)},
	}); err != nil {
		t.Fatalf("command target: %v", err)
	}
	select {
	case <-commands:
	case <-time.After(time.Second):
		t.Fatal("timed out waiting for fallback command")
	}
	select {
	case evt := <-commands:
		t.Fatalf("duplicate fallback command: %+v", evt)
	default:
	}
}

func TestDispatcherDoesNotCommandRemovedProviderGroup(t *testing.T) {
	providerID := "7"
	st := &fakeStore{
		group: store.Group{
			ID:              "zigbee2mqtt:group:7",
			FriendlyName:    "Hall",
			Provider:        store.GroupProviderZigbee2MQTT,
			ProviderGroupID: &providerID,
			Removed:         true,
		},
		members: []store.GroupMember{{
			MemberType:       device.GroupMemberDevice,
			MemberID:         "light",
			ProviderEndpoint: device.Ptr(int64(1)),
		}},
		resolved: []device.DeviceID{"light"},
	}
	reader := device.NewMemoryStore()
	reader.Register(device.Device{ID: "light", Source: device.SourceZigbee2MQTT, Capabilities: []device.Capability{writable(device.CapOnOff)}})
	bus := eventbus.NewChannelBus()
	groups := bus.Subscribe(eventbus.EventProviderGroupCommandRequested)
	commands := bus.Subscribe(eventbus.EventCommandRequested)
	defer bus.Unsubscribe(groups)
	defer bus.Unsubscribe(commands)
	dispatcher := New(bus, st, reader, nil)

	if err := dispatcher.CommandTarget(context.Background(), device.TargetCommand{
		TargetType: device.TargetGroup,
		TargetID:   st.group.ID,
		State:      device.Command{On: device.Ptr(true)},
	}); err != nil {
		t.Fatalf("command target: %v", err)
	}
	select {
	case evt := <-groups:
		t.Fatalf("removed group used multicast: %+v", evt)
	case evt := <-commands:
		t.Fatalf("removed group used fallback: %+v", evt)
	default:
	}
}
