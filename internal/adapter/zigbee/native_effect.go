package zigbee

import (
	"encoding/json"

	"github.com/saffronjam/saffron-hive/internal/device"
)

// terminatorHueEffect is the Hue-specific name for stopping an in-progress
// native effect; if it appears in a device's effect-cap values list, the
// device is treated as Hue for terminator purposes. Generic devices use
// terminatorDefault.
const (
	terminatorDefault   = "stop_effect"
	terminatorHueEffect = "stop_hue_effect"
)

type z2mEffectPayload struct {
	Effect string `json:"effect"`
}

// TerminatorFor returns the native-effect terminator name for dev. If the
// device's effect capability values include "stop_hue_effect" the Hue
// terminator is returned; otherwise "stop_effect" is used.
func TerminatorFor(dev device.Device) string {
	for _, c := range dev.Capabilities {
		if c.Name != device.CapEffect {
			continue
		}
		for _, v := range c.Values {
			if v == terminatorHueEffect {
				return terminatorHueEffect
			}
		}
		return terminatorDefault
	}
	return terminatorDefault
}

// effectCapability returns the device's effect capability if it has one.
func effectCapability(dev device.Device) (device.Capability, bool) {
	for _, c := range dev.Capabilities {
		if c.Name == device.CapEffect {
			return c, true
		}
	}
	return device.Capability{}, false
}

// effectValueAllowed reports whether name appears in the effect capability's
// Values list. If the capability lists no values it is treated as not allowed:
// native effect names must be explicitly enumerated by the adapter for the
// request to be translated.
func effectValueAllowed(c device.Capability, name string) bool {
	for _, v := range c.Values {
		if v == name {
			return true
		}
	}
	return false
}

func (a *ZigbeeAdapter) handleNativeEffect(req device.NativeEffectRequest) {
	a.mu.RLock()
	friendlyName, ok := a.idToName[req.DeviceID]
	a.mu.RUnlock()

	if !ok {
		logger.Warn("native effect for unknown device", "device_id", req.DeviceID, "effect", req.Name)
		return
	}

	dev, ok := a.stateReader.GetDevice(req.DeviceID)
	if !ok {
		logger.Warn("native effect for device missing from state reader", "device_id", req.DeviceID, "effect", req.Name)
		return
	}

	effectCap, ok := effectCapability(dev)
	if !ok {
		logger.Warn("native effect requested for device without effect capability", "device_id", req.DeviceID, "effect", req.Name)
		return
	}

	if !effectValueAllowed(effectCap, req.Name) {
		logger.Warn("native effect not in device effect values", "device_id", req.DeviceID, "effect", req.Name)
		return
	}

	data, err := json.Marshal(z2mEffectPayload{Effect: req.Name})
	if err != nil {
		logger.Error("failed to marshal native effect payload", "error", err)
		return
	}

	topic := "zigbee2mqtt/" + friendlyName + "/set"
	if err := a.mqtt.Publish(topic, 0, false, data); err != nil {
		logger.Error("failed to publish native effect", "topic", topic, "error", err)
	}
}
