package zigbee

import (
	"bytes"
	"encoding/json"
	"fmt"

	"github.com/saffronjam/saffron-hive/internal/device"
)

// mapAttributes parses the generic attributes of a zigbee2mqtt state payload:
// confirmed settings and diagnostic readings. Commands are write-only, so their
// keys never carry a value.
func (a *ZigbeeAdapter) mapAttributes(id device.DeviceID, raw json.RawMessage) ([]device.AttributeValue, error) {
	a.mu.RLock()
	features := a.attributeFeatures[id]
	a.mu.RUnlock()
	if len(features) == 0 {
		return nil, nil
	}
	var payload map[string]json.RawMessage
	if err := json.Unmarshal(raw, &payload); err != nil {
		return nil, err
	}
	values := make([]device.AttributeValue, 0, len(features))
	for name, attribute := range features {
		if attribute.category == device.CapabilityCategoryCommand {
			continue
		}
		rawValue, ok := payload[attribute.feature.Property]
		if !ok || bytes.Equal(bytes.TrimSpace(rawValue), []byte("null")) {
			continue
		}
		value, err := parseAttributeValue(name, attribute.feature, rawValue)
		if err != nil {
			return nil, fmt.Errorf("parse %s: %w", attribute.feature.Property, err)
		}
		values = append(values, value)
	}
	return device.SortAttributeValues(values), nil
}

func parseAttributeValue(name string, feature z2mFeature, raw json.RawMessage) (device.AttributeValue, error) {
	value := device.AttributeValue{Capability: name}
	switch feature.Type {
	case "binary":
		on, err := binaryValue(raw, feature)
		if err != nil {
			return value, err
		}
		value.BooleanValue = &on
	case "numeric":
		var number float64
		if err := json.Unmarshal(raw, &number); err != nil {
			return value, err
		}
		value.NumberValue = &number
	case "enum", "text":
		var text string
		if err := json.Unmarshal(raw, &text); err != nil {
			return value, err
		}
		value.StringValue = &text
	case "composite":
		mask, err := flagsMask(raw, feature)
		if err != nil {
			return value, err
		}
		value.NumberValue = &mask
	default:
		return value, fmt.Errorf("unsupported type %q", feature.Type)
	}
	return value, nil
}

// flagsMask folds a reported flags composite into a bitmask, bit i being the
// composite's i-th flag. A flag missing from the report reads as off.
func flagsMask(raw json.RawMessage, feature z2mFeature) (float64, error) {
	var flags map[string]json.RawMessage
	if err := json.Unmarshal(raw, &flags); err != nil {
		return 0, err
	}
	var mask uint64
	for i, child := range feature.Features {
		rawFlag, ok := flags[child.Property]
		if !ok {
			continue
		}
		on, err := binaryValue(rawFlag, child)
		if err != nil {
			return 0, fmt.Errorf("flag %s: %w", child.Property, err)
		}
		if on {
			mask |= 1 << i
		}
	}
	return float64(mask), nil
}

// flagsPayload expands a bitmask into the named flags of a composite.
func flagsPayload(mask float64, feature z2mFeature) (json.RawMessage, error) {
	bits := uint64(mask)
	flags := make(map[string]json.RawMessage, len(feature.Features))
	for i, child := range feature.Features {
		raw, err := binaryWireValue(bits&(1<<i) != 0, child)
		if err != nil {
			return nil, err
		}
		flags[child.Property] = raw
	}
	return json.Marshal(flags)
}

func binaryWireValue(on bool, feature z2mFeature) (json.RawMessage, error) {
	if on && len(feature.ValueOn) > 0 {
		return feature.ValueOn, nil
	}
	if !on && len(feature.ValueOff) > 0 {
		return feature.ValueOff, nil
	}
	return json.Marshal(on)
}

func binaryValue(raw json.RawMessage, feature z2mFeature) (bool, error) {
	if len(feature.ValueOn) > 0 && bytes.Equal(bytes.TrimSpace(raw), bytes.TrimSpace(feature.ValueOn)) {
		return true, nil
	}
	if len(feature.ValueOff) > 0 && bytes.Equal(bytes.TrimSpace(raw), bytes.TrimSpace(feature.ValueOff)) {
		return false, nil
	}
	var boolean bool
	if err := json.Unmarshal(raw, &boolean); err == nil {
		return boolean, nil
	}
	var text string
	if err := json.Unmarshal(raw, &text); err == nil {
		switch text {
		case "ON", "on", "true":
			return true, nil
		case "OFF", "off", "false":
			return false, nil
		}
	}
	return false, fmt.Errorf("value %s does not match binary exposure", raw)
}

func (a *ZigbeeAdapter) handleConfigurationRequest(req device.ConfigurationRequest) error {
	dev, ok := a.stateReader.GetDevice(req.DeviceID)
	if !ok {
		return fmt.Errorf("configuration for unknown device %q", req.DeviceID)
	}
	if err := device.ValidateConfigurationValues(dev, req.Values); err != nil {
		return err
	}

	a.mu.RLock()
	friendlyName, nameOK := a.idToName[req.DeviceID]
	features := a.attributeFeatures[req.DeviceID]
	a.mu.RUnlock()
	if !nameOK {
		return fmt.Errorf("configuration name for device %q is unavailable", req.DeviceID)
	}
	payload := make(map[string]json.RawMessage, len(req.Values))
	for _, value := range req.Values {
		attribute, ok := features[value.Capability]
		if !ok || attribute.category != device.CapabilityCategoryConfiguration {
			return fmt.Errorf("configuration exposure %q is unavailable for device %q", value.Capability, req.DeviceID)
		}
		raw, err := configurationWireValue(value, attribute.feature)
		if err != nil {
			return fmt.Errorf("encode configuration %q: %w", value.Capability, err)
		}
		payload[attribute.feature.Property] = raw
	}
	if a.outputObserver() == nil {
		a.recordPendingConfigurationOrigin(req.DeviceID, req.Origin)
	}
	return a.publishSet(friendlyName, payload)
}

// handleDeviceCommand writes one command value. zigbee2mqtt reports nothing
// back for it, so there is no pending origin to record.
func (a *ZigbeeAdapter) handleDeviceCommand(req device.DeviceCommandRequest) error {
	dev, ok := a.stateReader.GetDevice(req.DeviceID)
	if !ok {
		return fmt.Errorf("command for unknown device %q", req.DeviceID)
	}
	if err := device.ValidateDeviceCommand(dev, req); err != nil {
		return err
	}

	a.mu.RLock()
	friendlyName, nameOK := a.idToName[req.DeviceID]
	attribute, featureOK := a.attributeFeatures[req.DeviceID][req.Capability]
	a.mu.RUnlock()
	if !nameOK {
		return fmt.Errorf("command name for device %q is unavailable", req.DeviceID)
	}
	if !featureOK || attribute.category != device.CapabilityCategoryCommand {
		return fmt.Errorf("command exposure %q is unavailable for device %q", req.Capability, req.DeviceID)
	}
	var raw json.RawMessage
	var err error
	if attribute.feature.Type == "binary" {
		var on bool
		if on, err = device.ParseCommandBoolean(req.Value); err == nil {
			raw, err = binaryWireValue(on, attribute.feature)
		}
	} else {
		raw, err = json.Marshal(req.Value)
	}
	if err != nil {
		return fmt.Errorf("encode command %q: %w", req.Capability, err)
	}
	return a.publishSet(friendlyName, map[string]json.RawMessage{attribute.feature.Property: raw})
}

func (a *ZigbeeAdapter) publishSet(friendlyName string, payload map[string]json.RawMessage) error {
	data, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("marshal device write: %w", err)
	}
	topic := "zigbee2mqtt/" + friendlyName + "/set"
	if err := a.mqtt.Publish(topic, 1, false, data); err != nil {
		return fmt.Errorf("publish device write to %s: %w", topic, err)
	}
	return nil
}

func configurationWireValue(value device.AttributeValue, feature z2mFeature) (json.RawMessage, error) {
	if feature.Type == "composite" {
		if value.NumberValue == nil {
			return nil, fmt.Errorf("flags setting requires a numeric bitmask")
		}
		return flagsPayload(*value.NumberValue, feature)
	}
	if value.BooleanValue != nil {
		return binaryWireValue(*value.BooleanValue, feature)
	}
	return json.Marshal(valueForJSON(value))
}

func valueForJSON(value device.AttributeValue) any {
	switch {
	case value.BooleanValue != nil:
		return *value.BooleanValue
	case value.NumberValue != nil:
		return *value.NumberValue
	case value.StringValue != nil:
		return *value.StringValue
	default:
		return nil
	}
}
