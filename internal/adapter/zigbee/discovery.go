package zigbee

import (
	"encoding/json"
	"log"
	"strings"

	"github.com/saffronjam/saffron-hive/internal/device"
)

func detectDeviceType(features []z2mFeature) device.DeviceType {
	flat := flattenFeatures(features)
	hasState := false
	hasBrightness := false
	for _, f := range flat {
		switch f.Property {
		case "state":
			hasState = true
		case "brightness":
			hasBrightness = true
		case "temperature", "humidity":
			return device.Sensor
		case "action":
			return device.Switch
		}
	}
	if hasState && hasBrightness {
		return device.Light
	}
	return device.Unknown
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
		log.Printf("zigbee: failed to parse bridge/devices: %v", err)
		return
	}

	for _, d := range devices {
		if strings.EqualFold(d.Type, "coordinator") {
			continue
		}

		devType := detectDeviceType(d.Features)
		id := device.DeviceID(d.IEEEAddress)

		dev := device.Device{
			ID:        id,
			Name:      d.FriendlyName,
			Source:    device.Source("zigbee"),
			Type:      devType,
			Available: true,
		}

		a.stateWriter.Register(dev)

		a.mu.Lock()
		a.ieeeToID[d.IEEEAddress] = id
		a.nameToID[d.FriendlyName] = id
		a.idToName[id] = d.FriendlyName
		a.deviceTypes[id] = devType
		a.mu.Unlock()
	}
}
