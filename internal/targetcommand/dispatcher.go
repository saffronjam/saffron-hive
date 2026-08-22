package targetcommand

import (
	"context"
	"fmt"
	"time"

	"github.com/saffronjam/saffron-hive/internal/device"
	"github.com/saffronjam/saffron-hive/internal/eventbus"
	"github.com/saffronjam/saffron-hive/internal/store"
)

type Store interface {
	device.TargetResolver
	GetGroup(context.Context, string) (store.Group, error)
	ListGroupMembers(context.Context, string) ([]store.GroupMember, error)
}

// Dispatcher selects provider multicast for eligible direct provider groups
// and otherwise fans out through the generic target resolver.
type Dispatcher struct {
	bus    eventbus.Publisher
	store  Store
	reader device.StateReader
}

func New(bus eventbus.Publisher, store Store, reader device.StateReader) *Dispatcher {
	return &Dispatcher{bus: bus, store: store, reader: reader}
}

func (d *Dispatcher) ResolveTargetDeviceIDs(ctx context.Context, targetType device.TargetType, targetID string) []device.DeviceID {
	return d.store.ResolveTargetDeviceIDs(ctx, targetType, targetID)
}

func (d *Dispatcher) CommandTarget(ctx context.Context, req device.TargetCommand) error {
	if req.TargetID == "" {
		return fmt.Errorf("target command: target id is empty")
	}
	if req.TargetType != device.TargetDevice && req.TargetType != device.TargetGroup && req.TargetType != device.TargetRoom {
		return fmt.Errorf("target command: unsupported target type %q", req.TargetType)
	}
	if req.TargetType == device.TargetGroup {
		if group, err := d.store.GetGroup(ctx, req.TargetID); err == nil && group.Removed {
			return nil
		}
		if groupCommand, ok := d.providerGroupCommand(ctx, req); ok {
			d.bus.Publish(eventbus.Event{
				Type:      eventbus.EventProviderGroupCommandRequested,
				Timestamp: time.Now(),
				Payload:   groupCommand,
			})
			return nil
		}
	}

	seen := make(map[device.DeviceID]struct{})
	for _, id := range d.store.ResolveTargetDeviceIDs(ctx, req.TargetType, req.TargetID) {
		if _, duplicate := seen[id]; duplicate {
			continue
		}
		seen[id] = struct{}{}
		dev, ok := d.reader.GetDevice(id)
		if !ok || dev.Disabled || dev.Removed {
			continue
		}
		if req.NativeEffect != "" {
			if !supportsNativeEffect(dev, req.NativeEffect) {
				continue
			}
			d.bus.Publish(eventbus.Event{
				Type:      eventbus.EventNativeEffectRequested,
				DeviceID:  string(id),
				Timestamp: time.Now(),
				Payload: device.NativeEffectRequest{
					DeviceID: id,
					Name:     req.NativeEffect,
					Origin:   req.State.Origin,
				},
			})
			continue
		}
		cmd := filterCommand(req.State, dev, ok)
		cmd.DeviceID = id
		if emptyCommand(cmd) {
			continue
		}
		d.bus.Publish(eventbus.Event{
			Type:      eventbus.EventCommandRequested,
			DeviceID:  string(id),
			Timestamp: time.Now(),
			Payload:   cmd,
		})
	}
	return nil
}

func (d *Dispatcher) providerGroupCommand(ctx context.Context, req device.TargetCommand) (device.ProviderGroupCommand, bool) {
	group, err := d.store.GetGroup(ctx, req.TargetID)
	if err != nil || group.Provider != store.GroupProviderZigbee2MQTT || group.ProviderGroupID == nil || group.Removed {
		return device.ProviderGroupCommand{}, false
	}
	members, err := d.store.ListGroupMembers(ctx, group.ID)
	if err != nil || len(members) == 0 {
		return device.ProviderGroupCommand{}, false
	}
	ids := make([]device.DeviceID, 0, len(members))
	seen := make(map[device.DeviceID]struct{}, len(members))
	zeroBrightnessUsesOnOff := false
	zeroBrightnessBehaviorSet := false
	for _, member := range members {
		if member.MemberType != device.GroupMemberDevice || member.ProviderEndpoint == nil {
			return device.ProviderGroupCommand{}, false
		}
		id := device.DeviceID(member.MemberID)
		dev, ok := d.reader.GetDevice(id)
		if !ok || dev.Source != device.SourceZigbee2MQTT || dev.Disabled || dev.Removed {
			return device.ProviderGroupCommand{}, false
		}
		if req.NativeEffect != "" {
			if !supportsNativeEffect(dev, req.NativeEffect) {
				return device.ProviderGroupCommand{}, false
			}
		} else if !acceptsCommand(dev, req.State) {
			return device.ProviderGroupCommand{}, false
		}
		if req.State.Brightness != nil && *req.State.Brightness == 0 {
			usesOnOff := hasCapability(dev, device.CapOnOff)
			if zeroBrightnessBehaviorSet && usesOnOff != zeroBrightnessUsesOnOff {
				return device.ProviderGroupCommand{}, false
			}
			zeroBrightnessUsesOnOff = usesOnOff
			zeroBrightnessBehaviorSet = true
		}
		if _, exists := seen[id]; !exists {
			seen[id] = struct{}{}
			ids = append(ids, id)
		}
	}
	return device.ProviderGroupCommand{
		Provider:        group.Provider,
		ProviderGroupID: *group.ProviderGroupID,
		FriendlyName:    group.FriendlyName,
		MemberIDs:       ids,
		State:           req.State,
		NativeEffect:    req.NativeEffect,
	}, true
}

func acceptsCommand(dev device.Device, cmd device.Command) bool {
	required := []struct {
		set bool
		cap string
	}{
		{cmd.On != nil, device.CapOnOff},
		{cmd.Brightness != nil, device.CapBrightness},
		{cmd.ColorTemp != nil, device.CapColorTemp},
		{cmd.Color != nil, device.CapColor},
		{cmd.TargetTemperature != nil, device.CapTargetTemperature},
		{cmd.HvacMode != nil, device.CapHvacMode},
		{cmd.FanMode != nil, device.CapFanMode},
		{cmd.Swing != nil, device.CapSwing},
	}
	for _, item := range required {
		if item.set && !hasWritableCapability(dev, item.cap) {
			return false
		}
	}
	return !emptyCommand(cmd)
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
		for _, value := range capability.Values {
			if value == name {
				return true
			}
		}
	}
	return false
}

func filterCommand(cmd device.Command, dev device.Device, known bool) device.Command {
	if !known || len(dev.Capabilities) == 0 {
		return cmd
	}
	if cmd.On != nil && !hasWritableCapability(dev, device.CapOnOff) {
		cmd.On = nil
	}
	if cmd.Brightness != nil && !hasWritableCapability(dev, device.CapBrightness) {
		cmd.Brightness = nil
	}
	if cmd.ColorTemp != nil && !hasWritableCapability(dev, device.CapColorTemp) {
		cmd.ColorTemp = nil
	}
	if cmd.Color != nil && !hasWritableCapability(dev, device.CapColor) {
		cmd.Color = nil
	}
	if cmd.TargetTemperature != nil && !hasWritableCapability(dev, device.CapTargetTemperature) {
		cmd.TargetTemperature = nil
	}
	if cmd.HvacMode != nil && !hasWritableCapability(dev, device.CapHvacMode) {
		cmd.HvacMode = nil
	}
	if cmd.FanMode != nil && !hasWritableCapability(dev, device.CapFanMode) {
		cmd.FanMode = nil
	}
	if cmd.Swing != nil && !hasWritableCapability(dev, device.CapSwing) {
		cmd.Swing = nil
	}
	return cmd
}

func emptyCommand(cmd device.Command) bool {
	return cmd.On == nil && cmd.Brightness == nil && cmd.ColorTemp == nil && cmd.Color == nil &&
		cmd.TargetTemperature == nil && cmd.HvacMode == nil && cmd.FanMode == nil && cmd.Swing == nil
}
