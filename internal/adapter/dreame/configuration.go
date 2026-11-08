package dreame

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"slices"

	"github.com/saffronjam/saffron-hive/internal/cleaning"
	"github.com/saffronjam/saffron-hive/internal/device"
	"github.com/saffronjam/saffron-hive/internal/eventbus"
)

type configurationSetting struct {
	name   string
	key    PropertyKey
	offset int
	values []string
}

var configurationSettings = []configurationSetting{
	{"suction", PropertyKey{4, 4}, 0, []string{"quiet", "standard", "strong", "turbo"}},
	{"water", PropertyKey{4, 5}, 1, []string{"low", "medium", "high"}},
}

func configurationCapabilities(model string) []device.Capability {
	if model != "dreame.vacuum.r2423" {
		return nil
	}
	capabilities := make([]device.Capability, 0, len(configurationSettings))
	for _, setting := range configurationSettings {
		capabilities = append(capabilities, device.Capability{Name: setting.name, Type: "enum", Category: device.CapabilityCategoryConfiguration, Access: device.CapabilityAccessState | device.CapabilityAccessSet, Values: slices.Clone(setting.values)})
	}
	return capabilities
}

func configurationAttributes(snapshot cleaning.Snapshot) []device.AttributeValue {
	values := []device.AttributeValue{}
	for i, reported := range []*int{snapshot.Suction, snapshot.Water} {
		setting := configurationSettings[i]
		if reported == nil {
			continue
		}
		index := *reported - setting.offset
		if index < 0 || index >= len(setting.values) {
			continue
		}
		values = append(values, device.AttributeValue{Capability: setting.name, StringValue: device.Ptr(setting.values[index])})
	}
	return values
}

// SetConfiguration writes the settings supported by this protocol implementation.
func (s *Session) SetConfiguration(ctx context.Context, info DeviceInfo, values []device.AttributeValue) error {
	if err := device.ValidateConfigurationValues(device.Device{Capabilities: configurationCapabilities(info.Model)}, values); err != nil {
		return err
	}
	type propertyWrite struct {
		DID   string `json:"did"`
		SIID  int    `json:"siid"`
		PIID  int    `json:"piid"`
		Value int    `json:"value"`
	}
	writes := make([]propertyWrite, 0, len(values))
	for _, value := range values {
		for _, setting := range configurationSettings {
			if value.Capability == setting.name {
				writes = append(writes, propertyWrite{info.ID, setting.key.SIID, setting.key.PIID, slices.Index(setting.values, *value.StringValue) + setting.offset})
			}
		}
	}
	params, _ := json.Marshal(writes)
	s.mu.Lock()
	defer s.mu.Unlock()
	raw, err := s.rpc(ctx, info, "set_properties", params)
	if err != nil {
		return err
	}
	var result []struct {
		SIID int  `json:"siid"`
		PIID int  `json:"piid"`
		Code *int `json:"code"`
	}
	if json.Unmarshal(raw, &result) != nil || len(result) != len(writes) {
		return errors.New("invalid Dreame settings response")
	}
	for _, write := range writes {
		found := false
		for _, report := range result {
			if report.SIID == write.SIID && report.PIID == write.PIID {
				if report.Code == nil || *report.Code != 0 {
					return fmt.Errorf("Dreame rejected setting %d.%d", write.SIID, write.PIID)
				}
				found = true
			}
		}
		if !found {
			return errors.New("Dreame did not acknowledge requested setting")
		}
	}
	return nil
}

// SetOutputObserver connects reported settings to output delivery confirmation.
func (a *Adapter) SetOutputObserver(observer interface {
	ObserveConfiguration(device.DeviceID, []device.AttributeValue) device.CommandOrigin
}) {
	a.mu.Lock()
	defer a.mu.Unlock()
	a.observer = observer
}

func (a *Adapter) publishConfiguration(id device.DeviceID, snapshot cleaning.Snapshot) {
	attributes := configurationAttributes(snapshot)
	if len(attributes) == 0 {
		return
	}
	a.mu.Lock()
	observer := a.observer
	a.mu.Unlock()
	origin := device.CommandOrigin{}
	if observer != nil {
		origin = observer.ObserveConfiguration(id, attributes)
	}
	if writer, ok := a.state.(device.AttributeWriter); ok {
		writer.UpdateDeviceAttributes(id, attributes)
	}
	a.bus.Publish(eventbus.Event{Type: eventbus.EventDeviceAttributesChanged, DeviceID: string(id), Timestamp: snapshot.UpdatedAt, Payload: device.AttributeChange{Values: attributes, Origin: origin}})
}

func (a *Adapter) DispatchConfiguration(ctx context.Context, req device.ConfigurationRequest) error {
	ctx, done, err := a.operationContext(ctx)
	if err != nil {
		return err
	}
	defer done()
	found, ok := a.state.GetDevice(req.DeviceID)
	if !ok || !found.Available {
		return errors.New("vacuum is unavailable")
	}
	if err := device.ValidateConfigurationValues(found, req.Values); err != nil {
		return err
	}
	a.mu.Lock()
	info, ok := a.devices[req.DeviceID]
	a.mu.Unlock()
	if !ok {
		return errors.New("vacuum is unavailable")
	}
	return a.session.SetConfiguration(ctx, info, req.Values)
}
