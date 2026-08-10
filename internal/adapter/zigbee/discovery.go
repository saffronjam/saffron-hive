package zigbee

import (
	"encoding/json"
	"strings"
	"time"

	"github.com/saffronjam/saffron-hive/internal/device"
	"github.com/saffronjam/saffron-hive/internal/eventbus"
)

// detectDeviceType classifies a device from its zigbee2mqtt exposes list. A
// top-level "light" expose is a light; an action-reporting feature without
// on/off is a button; on/off (with or without power metering) is a plug;
// environmental readings without controls are a sensor.
func detectDeviceType(exposes []z2mFeature) device.DeviceType {
	for _, e := range exposes {
		if e.Type == "light" {
			return device.Light
		}
	}

	var hasOnOff, hasAction, hasEnv bool
	for _, f := range flattenFeatures(exposes) {
		switch f.Property {
		case "state":
			if f.Type == "binary" {
				hasOnOff = true
			}
		case "action":
			hasAction = true
		case "temperature", "humidity", "pressure", "illuminance", "occupancy":
			hasEnv = true
		}
	}

	switch {
	case hasAction && !hasOnOff:
		return device.Button
	case hasOnOff:
		return device.Plug
	case hasEnv:
		return device.Sensor
	}
	return device.Unknown
}

var knownCapabilities = map[string]string{
	"state":       device.CapOnOff,
	"brightness":  device.CapBrightness,
	"color_temp":  device.CapColorTemp,
	"color":       device.CapColor,
	"temperature": device.CapTemperature,
	"humidity":    device.CapHumidity,
	"pressure":    device.CapPressure,
	"illuminance": device.CapIlluminance,
	"occupancy":   device.CapOccupancy,
	"battery":     device.CapBattery,
	"action":      device.CapAction,
	"effect":      device.CapEffect,
	"power":       device.CapPower,
	"voltage":     device.CapVoltage,
	"current":     device.CapCurrent,
	"energy":      device.CapEnergy,
}

func extractCapabilities(exposes []z2mFeature) []device.Capability {
	seen := make(map[string]struct{})
	var caps []device.Capability
	for _, f := range flattenFeatures(exposes) {
		capName, ok := knownCapabilities[f.Property]
		if !ok {
			continue
		}
		if _, dup := seen[capName]; dup {
			continue
		}
		seen[capName] = struct{}{}
		caps = append(caps, device.Capability{
			Name:     capName,
			Type:     f.Type,
			Values:   f.Values,
			ValueMin: f.ValueMin,
			ValueMax: f.ValueMax,
			Unit:     f.Unit,
			Access:   f.Access,
		})
	}
	return caps
}

func flattenFeatures(features []z2mFeature) []z2mFeature {
	var result []z2mFeature
	for _, f := range features {
		result = append(result, f)
		if len(f.Features) > 0 {
			result = append(result, flattenFeatures(f.Features)...)
		}
	}
	return result
}

func (a *ZigbeeAdapter) handleBridgeDevices(payload []byte) {
	var devices []z2mBridgeDevice
	if err := json.Unmarshal(payload, &devices); err != nil {
		logger.Error("failed to parse bridge/devices", "error", err)
		return
	}

	incoming := make(map[device.DeviceID]struct{})

	for _, d := range devices {
		if strings.EqualFold(d.Type, "coordinator") {
			continue
		}

		devType := detectDeviceType(d.Definition.Exposes)
		id := device.DeviceID(d.IEEEAddress)
		incoming[id] = struct{}{}

		dev := device.Device{
			ID:           id,
			FriendlyName: d.FriendlyName,
			Source:       device.SourceZigbee2MQTT,
			Type:         devType,
			Capabilities: extractCapabilities(d.Definition.Exposes),
			Available:    true,
		}

		a.stateWriter.Register(dev)

		print := device.AdapterFingerprint(dev)
		a.mu.Lock()
		prev, wasKnown := a.knownDevices[id]
		a.ieeeToID[d.IEEEAddress] = id
		a.nameToID[d.FriendlyName] = id
		a.idToName[id] = d.FriendlyName
		a.knownDevices[id] = print
		a.mu.Unlock()

		// zigbee2mqtt republishes the whole device list on every join, leave and
		// rename, and publishes it again once an interview completes with the
		// definition filled in. Comparing fingerprints is what turns that into a
		// single event when something actually changed, instead of one per
		// device per republish.
		switch {
		case !wasKnown:
			a.bus.Publish(eventbus.Event{
				Type:      eventbus.EventDeviceAdded,
				DeviceID:  string(id),
				Timestamp: time.Now(),
				Payload:   dev,
			})
		case prev != print:
			a.bus.Publish(eventbus.Event{
				Type:      eventbus.EventDeviceSynced,
				DeviceID:  string(id),
				Timestamp: time.Now(),
				Payload:   dev,
			})
		}
	}

	a.mu.Lock()
	var removed []device.DeviceID
	for id := range a.knownDevices {
		if _, exists := incoming[id]; !exists {
			removed = append(removed, id)
		}
	}
	for _, id := range removed {
		delete(a.knownDevices, id)
	}
	a.mu.Unlock()

	for _, id := range removed {
		a.stateWriter.Remove(id)
		a.bus.Publish(eventbus.Event{
			Type:      eventbus.EventDeviceRemoved,
			DeviceID:  string(id),
			Timestamp: time.Now(),
		})
	}
}
