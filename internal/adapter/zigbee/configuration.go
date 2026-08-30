package zigbee

import (
	"bytes"
	"encoding/json"
	"fmt"

	"github.com/saffronjam/saffron-hive/internal/device"
)

func (a *ZigbeeAdapter) mapConfiguration(id device.DeviceID, raw json.RawMessage) ([]device.ConfigurationValue, error) {
	a.mu.RLock()
	features := a.configurationFeatures[id]
	a.mu.RUnlock()
	if len(features) == 0 {
		return nil, nil
	}
	var payload map[string]json.RawMessage
	if err := json.Unmarshal(raw, &payload); err != nil {
		return nil, err
	}
	values := make([]device.ConfigurationValue, 0, len(features))
	for name, feature := range features {
		rawValue, ok := payload[feature.Property]
		if !ok || bytes.Equal(bytes.TrimSpace(rawValue), []byte("null")) {
			continue
		}
		value, err := parseConfigurationValue(name, feature, rawValue)
		if err != nil {
			return nil, fmt.Errorf("parse %s: %w", feature.Property, err)
		}
		values = append(values, value)
	}
	return device.SortConfigurationValues(values), nil
}

func parseConfigurationValue(name string, feature z2mFeature, raw json.RawMessage) (device.ConfigurationValue, error) {
	value := device.ConfigurationValue{Capability: name}
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
	default:
		return value, fmt.Errorf("unsupported type %q", feature.Type)
	}
	return value, nil
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
	features := a.configurationFeatures[req.DeviceID]
	a.mu.RUnlock()
	if !nameOK {
		return fmt.Errorf("configuration name for device %q is unavailable", req.DeviceID)
	}
	payload := make(map[string]json.RawMessage, len(req.Values))
	for _, value := range req.Values {
		feature, ok := features[value.Capability]
		if !ok {
			return fmt.Errorf("configuration exposure %q is unavailable for device %q", value.Capability, req.DeviceID)
		}
		raw, err := configurationWireValue(value, feature)
		if err != nil {
			return fmt.Errorf("encode configuration %q: %w", value.Capability, err)
		}
		payload[feature.Property] = raw
	}
	data, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("marshal device configuration: %w", err)
	}
	if a.outputObserver() == nil {
		a.recordPendingConfigurationOrigin(req.DeviceID, req.Origin)
	}
	topic := "zigbee2mqtt/" + friendlyName + "/set"
	if err := a.mqtt.Publish(topic, 1, false, data); err != nil {
		return fmt.Errorf("publish device configuration to %s: %w", topic, err)
	}
	return nil
}

func configurationWireValue(value device.ConfigurationValue, feature z2mFeature) (json.RawMessage, error) {
	if value.BooleanValue != nil {
		if *value.BooleanValue && len(feature.ValueOn) > 0 {
			return feature.ValueOn, nil
		}
		if !*value.BooleanValue && len(feature.ValueOff) > 0 {
			return feature.ValueOff, nil
		}
	}
	return json.Marshal(valueForJSON(value))
}

func valueForJSON(value device.ConfigurationValue) any {
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
